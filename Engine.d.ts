import { Event } from './enums/Event';
import type Team from './Team';
import type { GameEvent } from './types/GameEvent';
import type { GameInfo } from './types/GameInfo';
import { FieldArea } from "./enums/FieldArea";
import { Action } from './enums/Action';
import type Player from "./Player";
import { GoalType } from "./enums/GoalType";
import { AssistType } from "./enums/AssistType";
import Field from "./Field";
export default class Engine {
    /**
     * Has the game started?
     */
    gameStarted: boolean;
    /**
     * Has the game ended?
     */
    gameEnded: boolean;
    /**
     * Number of minutes for a full game
     */
    gameTime: number;
    /**
     * Number of events per minutes. This decides how eventful the game should be,
     * how many actions can take place within a minute.
     */
    eventsPerMinute: number;
    /**
     * Extra rating points for home team attributes
     */
    homeTeamAdvantage: number;
    /**
     * All attributes are randomized on each simulation using
     * a positive or negative version of this value
     */
    randomEffect: number;
    /**
     * Chance (0 to 1) to get the ball back after goal attempt.
     */
    reboundChance: number;
    /**
     * Increase attack attributes on goal chance
     */
    extraAttackOnChance: number;
    /**
     * Current team with possession.
     */
    ballPossession: Team | null;
    /**
     * The team that started with the ball.
     */
    startedWithBall: Team | null;
    /**
     * FieldArea enum describing the current ball position.
     */
    ballPosition: FieldArea;
    /**
     * Game info object describing the current state of the game
     */
    gameInfo: GameInfo;
    /**
     * Array containing all simulations
     */
    gameEvents: GameEvent[];
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
    /**
     * The field
     */
    field: Field;
    constructor(homeTeam: Team, awayTeam: Team);
    start(): void;
    teamWithoutBall(): Team;
    simulate: () => void;
    rebound(): boolean;
    handleEvent(event: GameEvent): void;
    eventLoop(): Generator<GameEvent, void, unknown>;
    gameEvent(event: Event, data?: any, attackingPrimaryPlayer?: Player | null, attackingSecondaryPlayer?: Player | null, defendingPrimaryPlayer?: Player | null, defendingSecondaryPlayer?: Player | null, goalType?: GoalType | null, assistType?: AssistType | null): GameEvent;
    random(team: Team): number;
    simulateGoalAttempt(attackingTeam: Team, defendingTeam: Team, attacker: Player): Event;
    simulatePossession(attackingTeam: Team, defendingTeam: Team, action: Action): Event;
    simulateAction(action: Action, attacker: Player): Event;
    simulateAssistType(secondaryPlayer: Player): AssistType | null;
    simulateGoalType(primaryPlayer: Player, secondaryPlayer: Player): [GoalType, AssistType | null];
    halfTime(): GameEvent;
    gameEnd(): GameEvent;
    goal(attackingPrimaryPlayer: Player, attackingSecondaryPlayer: Player): [GoalType, AssistType | null];
    simulateEvent(): GameEvent;
}
