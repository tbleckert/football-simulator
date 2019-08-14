import {Event} from './Event';
import Team from './Team';
import {GameEvent} from './GameEvent';
import {GameInfo} from './GameInfo';
import {FieldAreas} from "./Field";
import {Action} from "./Action";
import Commentator from "./Commentator";
import Player from "./Player";
import Reporter from "./Reporter";

export default class Engine {
    gameStarted: boolean = false;
    gameEnded: boolean = false;
    gameTime = 90;
    eventsPerMinute = 1;
    gameSpeed = 1;
    homeTeamAdvantage = 2;
    ballPossession: Team | null = null;
    startedWithBall: Team | null = null;
    ballPosition: FieldAreas = FieldAreas.Midfield;
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
        /*this.gameEvents.forEach(event => {
            console.log(this.commentator.comment(event));
        });*/
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
            if (this.ballPossession === this.homeTeam) {
                this.gameInfo.homeGoals += 1;
            } else {
                this.gameInfo.awayGoals += 1;
            }

            this.ballPosition = FieldAreas.Midfield;
            this.ballPossession = this.teamWithoutBall();
        }

        if (event.value.event === Event.Save || event.value.event === Event.Block) {
            const random = Math.floor(Math.random() * (4 - 1 + 1) + 1);

            if (random > 1) {
                this.ballPossession = this.teamWithoutBall();
                this.ballPosition = FieldAreas.Defence;
            }
        }

        if (event.value.event === Event.Advance) {
            if (this.ballPosition !== FieldAreas.Offense) {
                this.ballPosition += 1;
            }
        }

        if (event.value.event === Event.Retreat) {
            if (this.ballPosition !== FieldAreas.Defence) {
                this.ballPosition -= 1;
            }
        }

        if (event.value.event === Event.Defence) {
            this.ballPossession = this.teamWithoutBall();

            if (this.ballPosition === FieldAreas.Offense) {
                this.ballPosition = FieldAreas.Defence;
            } else if (this.ballPosition === FieldAreas.Defence) {
                this.ballPosition = FieldAreas.Offense;
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

    simulate(): GameEvent {
        if (this.gameInfo.matchMinute == 45) {
            this.ballPossession = this.teamWithoutBall();
            this.ballPosition = FieldAreas.Midfield;

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
        const event = this.simulateAction(
            action,
            attackingPrimaryPlayer,
        );

        return this.gameEvent(
            event,
            null,
            attackingPrimaryPlayer,
            attackingSecondaryPlayer,
            defendingPrimaryPlayer,
            defendingSecondaryPlayer,
        );
    }
}
