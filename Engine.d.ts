import { Event } from './enums/Event';
import Team from './Team';
import { GameEvent } from './types/GameEvent';
import { GameInfo } from './types/GameInfo';
import { FieldArea } from "./enums/FieldArea";
import { Action } from './enums/Action';
import Player from "./Player";
import { GoalType } from "./enums/GoalType";
import { AssistType } from "./enums/AssistType";
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
    constructor(homeTeam: Team, awayTeam: Team);
    start(): void;
    teamWithoutBall(): Team;
    simulate: () => void;
    rebound(): boolean;
    handleEvent(event: GameEvent): void;
    eventLoop(): IterableIterator<GameEvent>;
    gameEvent(event: Event, data?: any, attackingPrimaryPlayer?: Player | null, attackingSecondaryPlayer?: Player | null, defendingPrimaryPlayer?: Player | null, defendingSecondaryPlayer?: Player | null, goalType?: GoalType | null, assistType?: AssistType | null): GameEvent;
    random(team: Team): number;
    simulateAction(action: Action, attacker: Player): Event;
    simulateGoalType(primaryPlayer: Player, secondaryPlayer: Player): [GoalType, AssistType | null];
    halfTime(): GameEvent;
    gameEnd(): GameEvent;
    simulateEvent(): GameEvent;
}
