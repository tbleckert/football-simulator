import {Event} from './enums/Event';
import Team from './Team';
import {GameEvent} from './types/GameEvent';
import {GameInfo} from './types/GameInfo';
import {FieldArea} from "./enums/FieldArea";
import {Action} from './enums/Action';
import Player, {PlayerRating} from "./Player";
import {GoalType} from "./enums/GoalType";
import {AssistType} from "./enums/AssistType";

export default class Engine {
    /**
     * Has the game started?
     */
    gameStarted: boolean = false;

    /**
     * Has the game ended?
     */
    gameEnded: boolean = false;

    /**
     * Number of minutes for a full game
     */
    gameTime = 90;

    /**
     * Number of events per minutes. This decides how eventful the game should be,
     * how many actions can take place within a minute.
     */
    eventsPerMinute = 1;

    /**
     * Extra rating points for home team attributes
     */
    homeTeamAdvantage = 2;

    /**
     * All attributes are randomized on each simulation using
     * a positive or negative version of this value
     */
    randomEffect = 25;

    /**
     * Chance (0 to 1) to get the ball back after goal attempt.
     */
    reboundChance = 0.1;

    /**
     * Increase attack attributes on goal chance
     */
    extraAttackOnChance = 0.05;

    /**
     * Current team with possession.
     */
    ballPossession: Team | null = null;

    /**
     * The team that started with the ball.
     */
    startedWithBall: Team | null = null;

    /**
     * FieldArea enum describing the current ball position.
     */
    ballPosition: FieldArea = FieldArea.Midfield;

    /**
     * Game info object describing the current state of the game
     */
    gameInfo: GameInfo;

    /**
     * Array containing all simulations
     */
    gameEvents: GameEvent[] = [];

    /**
     * The game loop
     */
    gameLoop: IterableIterator<GameEvent>;

    /**
     * The home team
     */
    homeTeam: Team;

    /**
     * The away team
     */
    awayTeam: Team;

    constructor(homeTeam: Team, awayTeam: Team) {
        this.homeTeam = homeTeam;
        this.awayTeam = awayTeam;
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
        this.startedWithBall = this.ballPossession;

        this.gameEvents.push(this.gameEvent(Event.GameStart, this.ballPossession));
        this.gameEvents.push(this.gameEvent(Event.Kickoff, this.ballPossession));

        this.gameStarted = true;
    }

    teamWithoutBall(): Team {
        return (this.ballPossession === this.homeTeam) ? this.awayTeam : this.homeTeam;
    }

    simulate = () => {
        if (!this.gameStarted) {
            this.start();
        }

        const event = this.gameLoop.next();

        if (event.done) {
            return;
        }

        this.gameEvents.push(event.value);
        this.handleEvent(event.value);

        this.simulate();
    };

    rebound(): boolean {
        return Math.floor(Math.random()) > this.reboundChance;
    }

    reverseSide(current: FieldArea): FieldArea {
        const map = {
            [FieldArea.Offense]: FieldArea.Defence,
            [FieldArea.Midfield]: FieldArea.Midfield,
            [FieldArea.Defence]: FieldArea.Offense,
        };

        return map[current];
    }

    handleEvent(event: GameEvent) {
        switch (event.event) {
            case Event.Goal:
                this.ballPosition = FieldArea.Midfield;
                this.ballPossession = this.teamWithoutBall();

                break;
            case Event.Save:
            case Event.Block:
                if (!this.rebound()) {
                    this.ballPossession = this.teamWithoutBall();
                    this.ballPosition = FieldArea.Defence;
                }

                break;
            case Event.Advance:
                this.ballPosition = Math.min(this.ballPosition + 1, FieldArea.Offense);

                break;
            case Event.Retreat:
                this.ballPosition = Math.max(this.ballPosition - 1, FieldArea.Defence);

                break;
            case Event.Defence:
                this.ballPossession = this.teamWithoutBall();
                this.ballPosition = this.reverseSide(this.ballPosition);

                break;
        }
    }

    * eventLoop() {
        for (this.gameInfo.matchMinute; this.gameInfo.matchMinute <= this.gameTime; this.gameInfo.matchMinute += 1 / this.eventsPerMinute) {
            yield this.simulateEvent();
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
        const min = -this.randomEffect;
        const max = this.randomEffect;
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
        const attack = attackingTeam.attackRating() + this.random(attackingTeam);

        if (action === Action.Advance) {
            return (attack > defence) ? Event.Advance : Event.Defence;
        }

        if (action === Action.GoalAttempt) {
            if (attack + (attack * this.extraAttackOnChance) > defence) {
                const goalkeeper = defendingTeam.goalkeeperRating() + this.random(defendingTeam);
                const attackerRating = attacker.attackRating() + this.random(attackingTeam);

                return (attackerRating > goalkeeper) ? Event.Goal : Event.Save;
            }

            return Event.Block;
        }

        const possession = attackingTeam.possessionRating() + this.random(attackingTeam);

        if (defence > possession) {
            return Event.Defence;
        }

        return (action === Action.Retreat) ? Event.Retreat : Event.Possession;
    }

    simulateAssistType(secondaryPlayer: Player): AssistType | null {
        const random = Math.random();
        const secondaryPlayerAttributes = secondaryPlayer.attributes;
        const secondaryPlayerRating = secondaryPlayer.rating();
        const shooting = (secondaryPlayerRating as PlayerRating).shooting;
        const passing = (secondaryPlayerRating as PlayerRating).passing;

        if (shooting > passing && random > 0.5) {
            return (random > 0.5) ? AssistType.Deflection : AssistType.Rebound;
        }

        if (secondaryPlayerAttributes.passing > secondaryPlayerAttributes.crossing && random > 0.5) {
            return AssistType.Pass;
        }

        return AssistType.Cross;
    }

    simulateGoalType(primaryPlayer: Player, secondaryPlayer: Player): [GoalType, AssistType | null] {
        const assist = Math.random() > 0.5;

        if (!assist) {
            return [GoalType.Shot, null];
        }

        const primaryPlayerAttributes = primaryPlayer.attributes;
        const random = Math.random();
        const assistType = this.simulateAssistType(secondaryPlayer);

        return [
            (primaryPlayerAttributes.heading > primaryPlayerAttributes.finishing && random > 0.5) ? GoalType.Header : [GoalType.Volley, GoalType.Shot][Math.floor(Math.random() * 2)],
            assistType,
        ];
    }

    halfTime(): GameEvent {
        this.ballPossession = this.startedWithBall === this.homeTeam ? this.awayTeam : this.homeTeam;
        this.ballPosition = FieldArea.Midfield;

        return this.gameEvent(Event.HalfTime);
    }

    gameEnd(): GameEvent {
        this.gameEnded = true;

        return this.gameEvent(Event.GameEnd);
    }

    goal(attackingPrimaryPlayer: Player, attackingSecondaryPlayer: Player): [GoalType, AssistType | null] {
        if (this.ballPossession === this.homeTeam) {
            this.gameInfo.homeGoals += 1;
        } else {
            this.gameInfo.awayGoals += 1;
        }

        return this.simulateGoalType(attackingPrimaryPlayer, attackingSecondaryPlayer);
    }

    simulateEvent(): GameEvent {
        if (this.gameInfo.matchMinute == this.gameTime / 2) return this.halfTime();
        if (this.gameInfo.matchMinute >= this.gameTime) return this.gameEnd();
        if (!this.ballPossession) return this.gameEvent(Event.EventLess);

        const attackingPrimaryPlayer = this.ballPossession.attacker(this.ballPosition);
        const attackingSecondaryPlayer = this.ballPossession.attacker(this.ballPosition, [attackingPrimaryPlayer]);
        const defendingTeam = this.teamWithoutBall();
        const defendingPrimaryPlayer = defendingTeam.defender(this.ballPosition);
        const action = this.ballPossession.simulateMove(this.ballPosition, this.gameInfo);
        let goalType = null;
        let assist = null;
        const event = this.simulateAction(action, attackingPrimaryPlayer);

        if (event === Event.Goal) {
            [goalType, assist] = this.goal(attackingPrimaryPlayer, attackingSecondaryPlayer);
        }

        return this.gameEvent(
            event,
            null,
            attackingPrimaryPlayer,
            attackingSecondaryPlayer,
            defendingPrimaryPlayer,
            defendingTeam.defender(this.ballPosition, [defendingPrimaryPlayer]),
            goalType,
            assist,
        );
    }
}
