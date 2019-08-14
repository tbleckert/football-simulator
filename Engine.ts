import { Event } from './enums/Event';
import Team from './Team';
import {GameEvent} from './types/GameEvent';
import {GameInfo} from './types/GameInfo';
import { FieldArea } from "./enums/FieldArea";
import { Action } from "./enums/Action";
import Commentator from "./Commentator";
import Player, {PlayerRating} from "./Player";
import Reporter from "./Reporter";
import { GoalType } from "./enums/GoalType";
import { AssistType } from "./enums/AssistType";

export default class Engine {
    gameStarted: boolean = false;
    gameEnded: boolean = false;
    gameTime = 90;
    eventsPerMinute = 1;
    gameSpeed = 1;
    homeTeamAdvantage = 2;
    ballPossession: Team | null = null;
    startedWithBall: Team | null = null;
    ballPosition: FieldArea = FieldArea.Midfield;
    gameInfo: GameInfo;
    gameEvents: GameEvent[] = [];
    gameLoop: IterableIterator<GameEvent>;
    homeTeam: Team;
    awayTeam: Team;
    commentator: Commentator;

    constructor(homeTeam: Team, awayTeam: Team) {
        this.homeTeam = homeTeam;
        this.awayTeam = awayTeam;
        this.commentator = new Commentator();
        this.gameLoop = this.eventLoop();
        this.gameInfo = {
            matchMinute: 0,
            homeGoals: 0,
            awayGoals: 0,
        };
    }

    start() {
        const coinflip = Math.floor(Math.random() * 2) == 0;

        this.ballPossession = (coinflip) ? this.homeTeam : this.awayTeam;
        this.startedWithBall = (!coinflip) ? this.homeTeam : this.awayTeam;

        this.gameEvents.push(this.gameEvent(Event.GameStart, this.ballPossession));
        this.gameEvents.push(this.gameEvent(Event.Kickoff, this.ballPossession));

        this.gameStarted = true;

        this.loop();
    }

    teamWithoutBall(): Team {
        return (this.ballPossession === this.homeTeam) ? this.awayTeam : this.homeTeam;
    }

    report() {
        const reporter = new Reporter(this.gameEvents);
        console.log(reporter.getReport());

        this.gameEvents.forEach(event => {
            console.log(this.commentator.comment(event));
        });
    }

    loop = () => {
        const event = this.gameLoop.next();

        if (event.done) {
            this.report();

            return;
        }

        if (event.value.event === Event.Goal) {
            if (this.ballPossession === this.homeTeam) {
                this.gameInfo.homeGoals += 1;
            } else {
                this.gameInfo.awayGoals += 1;
            }
        }

        this.gameEvents.push(event.value);

        if (event.value.event === Event.Goal) {
            this.ballPosition = FieldArea.Midfield;
            this.ballPossession = this.teamWithoutBall();
        }

        if (event.value.event === Event.Save || event.value.event === Event.Block) {
            const random = Math.floor(Math.random() * (4 - 1 + 1) + 1);

            if (random > 1) {
                this.ballPossession = this.teamWithoutBall();
                this.ballPosition = FieldArea.Defence;
            }
        }

        if (event.value.event === Event.Advance) {
            if (this.ballPosition !== FieldArea.Offense) {
                this.ballPosition += 1;
            }
        }

        if (event.value.event === Event.Retreat) {
            if (this.ballPosition !== FieldArea.Defence) {
                this.ballPosition -= 1;
            }
        }

        if (event.value.event === Event.Defence) {
            this.ballPossession = this.teamWithoutBall();

            if (this.ballPosition === FieldArea.Offense) {
                this.ballPosition = FieldArea.Defence;
            } else if (this.ballPosition === FieldArea.Defence) {
                this.ballPosition = FieldArea.Offense;
            }
        }

        this.loop();
    };

    * eventLoop() {
        for (this.gameInfo.matchMinute; this.gameInfo.matchMinute <= this.gameTime; this.gameInfo.matchMinute += 1 / this.eventsPerMinute) {
            yield this.simulate();
        }
    }

    gameEvent(
        event: Event,
        data: any = null,
        attackingPrimaryPlayer: Player | null = null,
        attackingSecondaryPlayer: Player | null = null,
        defendingPrimaryPlayer: Player | null = null,
        defendingSecondaryPlayer: Player | null = null,
        goalType: GoalType | null = null,
        assistType: AssistType | null = null,
    ): GameEvent {
        return {
            event,
            data,
            attackingPrimaryPlayer,
            attackingSecondaryPlayer,
            defendingPrimaryPlayer,
            defendingSecondaryPlayer,
            gameInfo: Object.assign({}, this.gameInfo),
            homeTeam: this.homeTeam,
            awayTeam: this.awayTeam,
            attackingTeam: this.ballPossession || this.homeTeam,
            defendingTeam: this.teamWithoutBall(),
            fieldPosition: this.ballPosition,
            goalType,
            assistType,
        };
    }

    random(team: Team): number {
        const min = -15;
        const max = 15;
        let random = Math.floor(Math.random() * (max - min + 1) + min);

        if (team === this.homeTeam) {
            random += this.homeTeamAdvantage;
        }

        return random;
    }

    simulateAction(action: Action, attacker: Player): Event {
        if (!this.ballPossession) {
            return Event.EventLess;
        }

        const attackingTeam = this.ballPossession;
        const defendingTeam = this.teamWithoutBall();
        const defence = defendingTeam.defenceRating() + this.random(defendingTeam);

        if (action === Action.Advance) {
            const attack = attackingTeam.attackRating() + this.random(attackingTeam);

            if (attack > defence) {
                return Event.Advance;
            }

            return Event.Defence;
        }

        if (action === Action.GoalAttempt) {
            const attack = attacker.attackRating() + this.homeTeamAdvantage;

            if (attack + 5 > defence) {
                const goalkeeper = defendingTeam.goalkeeperRating() + this.random(defendingTeam);

                if (attack > goalkeeper) {
                    return Event.Goal;
                }

                return Event.Save;
            }

            return Event.Block;
        }

        const possession = attackingTeam.possessionRating() + this.random(attackingTeam);

        if (defence > possession) {
            return Event.Defence;
        }

        if (action === Action.Retreat) {
            return Event.Retreat;
        }

        return Event.Possession;
    }

    simulateGoalType(primaryPlayer: Player, secondaryPlayer: Player): [GoalType, AssistType | null] {
        const primaryPlayerAttributes = primaryPlayer.attributes;
        const secondaryPlayerAttributes = secondaryPlayer.attributes;
        const secondaryPlayerRating = secondaryPlayer.rating();
        const assist = Math.random() > 0.5;

        if (!assist) {
            return [GoalType.Shot, null];
        }

        const random = Math.random();
        let assistType = null;

        if ((secondaryPlayerRating as PlayerRating).shooting > (secondaryPlayerRating as PlayerRating).passing && random > 0.5) {
            assistType = (random > 0.5) ? AssistType.Deflection : AssistType.Rebound;
        } else {
            if (secondaryPlayerAttributes.passing > secondaryPlayerAttributes.crossing && random > 0.5) {
                assistType = AssistType.Pass;
            } else {
                assistType = AssistType.Cross;
            }
        }

        let goalType = null;

        if (assistType === AssistType.Pass) {
            goalType = GoalType.Shot;
        } else {
            goalType = (primaryPlayerAttributes.heading > primaryPlayerAttributes.finishing && random > 0.5) ? GoalType.Header : GoalType.Volley;
        }

        return [goalType, assistType];
    }

    simulate(): GameEvent {
        if (this.gameInfo.matchMinute == 45) {
            this.ballPossession = this.teamWithoutBall();
            this.ballPosition = FieldArea.Midfield;

            return this.gameEvent(Event.HalfTime);
        }

        if (this.gameInfo.matchMinute >= this.gameTime) {
            this.gameEnded = true;

            return this.gameEvent(Event.GameEnd);
        }

        if (!this.ballPossession) {
            return this.gameEvent(Event.EventLess);
        }

        const attackingPrimaryPlayer = this.ballPossession.attacker(this.ballPosition);
        const attackingSecondaryPlayer = this.ballPossession.attacker(this.ballPosition, [attackingPrimaryPlayer]);
        const defendingTeam = this.teamWithoutBall();
        const defendingPrimaryPlayer = defendingTeam.defender(this.ballPosition);
        const defendingSecondaryPlayer = defendingTeam.defender(this.ballPosition, [defendingPrimaryPlayer]);
        const action = this.ballPossession.simulateMove(this.ballPosition, this.gameInfo);
        let goalType = null;
        let assist = null;
        const event = this.simulateAction(
            action,
            attackingPrimaryPlayer,
        );

        if (event === Event.Goal) {
            [goalType, assist] = this.simulateGoalType(attackingPrimaryPlayer, attackingSecondaryPlayer);
        }

        return this.gameEvent(
            event,
            null,
            attackingPrimaryPlayer,
            attackingSecondaryPlayer,
            defendingPrimaryPlayer,
            defendingSecondaryPlayer,
            goalType,
            assist,
        );
    }
}
