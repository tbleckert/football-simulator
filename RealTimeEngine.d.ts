import { Position } from './enums/Position';
import type Player from './Player';
import type { PlayerAttributes } from './Player';
import type Team from './Team';
export interface Vector2 {
    x: number;
    y: number;
}
export type TeamSide = 'home' | 'away';
export type Mentality = 'defensive' | 'balanced' | 'attacking';
export type MatchPhase = 'kickoff' | 'open_play' | 'throw_in' | 'corner' | 'goal_kick' | 'free_kick' | 'penalty' | 'injury_stoppage' | 'substitution' | 'half_time' | 'full_time';
export type PlayerIntentType = 'hold_shape' | 'press' | 'support' | 'receive' | 'dribble' | 'pass' | 'shoot' | 'recover';
export type RealTimeEventType = 'match_start' | 'kickoff' | 'half_time' | 'full_time' | 'throw_in' | 'corner' | 'goal_kick' | 'free_kick' | 'penalty' | 'pass' | 'receive' | 'interception' | 'tackle' | 'shot' | 'save' | 'miss' | 'foul' | 'goal' | 'recovery';
export interface Tactics {
    formation: string;
    press: number;
    width: number;
    tempo: number;
    mentality: Mentality;
}
export interface PlayerIntent {
    type: PlayerIntentType;
    target: Vector2;
    targetPlayerId?: string;
}
export interface SimulatedPlayer {
    id: string;
    team: Team;
    side: TeamSide;
    player: Player;
    role: Position;
    x: number;
    y: number;
    target: Vector2;
    stamina: number;
    attributes: PlayerAttributes;
    currentIntent: PlayerIntent;
    actionCooldown: number;
}
export interface BallState {
    x: number;
    y: number;
    velocity: Vector2;
    owner: SimulatedPlayer | null;
    lastTouchSide: TeamSide | null;
    lastTouchPlayerId: string | null;
}
export interface RestartState {
    phase: Extract<MatchPhase, 'throw_in' | 'corner' | 'goal_kick' | 'free_kick' | 'penalty'>;
    teamSide: TeamSide;
    position: Vector2;
    reason: string;
}
export interface ActiveBallAction {
    type: 'pass' | 'shot';
    from: SimulatedPlayer;
    teamSide: TeamSide;
    target: Vector2;
    targetPlayer?: SimulatedPlayer;
    inaccurate: boolean;
    quality: number;
}
export interface MatchState {
    time: number;
    period: 1 | 2 | 'ended';
    phase: MatchPhase;
    ball: BallState;
    players: SimulatedPlayer[];
    tactics: {
        home: Tactics;
        away: Tactics;
    };
    score: {
        home: number;
        away: number;
    };
    activeBallAction: ActiveBallAction | null;
    restart: RestartState | null;
}
export interface RealTimeMatchEvent {
    type: RealTimeEventType;
    time: number;
    team?: Team;
    teamSide?: TeamSide;
    player?: Player;
    playerId?: string;
    secondaryPlayer?: Player;
    secondaryPlayerId?: string;
    position: Vector2;
    score: {
        home: number;
        away: number;
    };
    outcome?: string;
}
export interface MatchSnapshotPlayer {
    id: string;
    teamSide: TeamSide;
    role: Position;
    roleName: string;
    x: number;
    y: number;
    stamina: number;
    currentIntent: PlayerIntent;
    target: Vector2;
}
export interface MatchSnapshot {
    time: number;
    period: 1 | 2 | 'ended';
    phase: MatchPhase;
    score: {
        home: number;
        away: number;
    };
    ball: {
        x: number;
        y: number;
        velocity: Vector2;
        ownerId: string | null;
    };
    players: MatchSnapshotPlayer[];
    events: RealTimeMatchEvent[];
}
export interface MatchSlice {
    state: MatchState;
    events: RealTimeMatchEvent[];
    snapshot: MatchSnapshot;
}
export interface RealTimeEngineOptions {
    tickSeconds: number;
    matchLengthSeconds: number;
    homeTactics: Partial<Tactics>;
    awayTactics: Partial<Tactics>;
    random: () => number;
}
export default class RealTimeEngine {
    tickSeconds: number;
    matchLengthSeconds: number;
    homeTeam: Team;
    awayTeam: Team;
    state: MatchState;
    events: RealTimeMatchEvent[];
    snapshots: MatchSnapshot[];
    gameStarted: boolean;
    private random;
    private startedWithBallSide;
    private nextPhaseAfterSnapshot;
    private clearRestartAfterSnapshot;
    constructor(homeTeam: Team, awayTeam: Team, options?: Partial<RealTimeEngineOptions>);
    start(): MatchSnapshot;
    simulate(untilSeconds?: number): MatchSnapshot[];
    tick(): MatchSlice;
    private commitSnapshot;
    private tacticsFromOptions;
    private createPlayers;
    private handleTimeBoundaries;
    private startedSecondHalfSide;
    private resetForKickoff;
    private resolvePhaseAction;
    private executeThrowIn;
    private executeCorner;
    private executeGoalKick;
    private playRestartPass;
    private detectBallOut;
    private prepareGoalLineRestart;
    private prepareRestart;
    private placePlayersForRestart;
    private updateTacticalTargetPositions;
    private resetPlayersToFormation;
    private decidePlayerIntents;
    private intentForBallOwner;
    private dribbleIntent;
    private intentForLooseBall;
    private intentForTeammateInPossession;
    private intentForOutOfPossession;
    private resolveBallAction;
    private startPass;
    private startShot;
    private movePlayersAndBall;
    private detectEvents;
    private detectTackleOrFoul;
    private detectLooseBallRecovery;
    private detectPassOutcome;
    private detectShotOutcome;
    private snapshot;
    private createEvent;
    private formationTargetsForRoles;
    private formationSlotScore;
    private roleFormationPreference;
    private roleLineIndex;
    private roleLane;
    private formationSlots;
    private parseFormation;
    private selectPassTarget;
    private selectRestartTaker;
    private selectThrowInTarget;
    private selectBoxTarget;
    private selectShortGoalKickTarget;
    private selectLongGoalKickTarget;
    private safeRestartTarget;
    private cornerTargetPoint;
    private supportTarget;
    private shootingIntentChance;
    private passQuality;
    private shotQuality;
    private pressureAround;
    private interceptionChance;
    private playerSpeed;
    private updateStamina;
    private velocityTowards;
    private moveTowards;
    private playerById;
    private playersForSide;
    private playersAgainst;
    private closestPlayerTo;
    private closestPlayer;
    private nearestOpponent;
    private goalkeeperFor;
    private tactics;
    private activePeriod;
    private attackDirection;
    private attackDirectionForPeriod;
    private oppositeSide;
    private goalCenterAgainst;
    private attackingSideForGoalLine;
    private goalKickPosition;
    private registerTouch;
    private mirrorForSide;
    private mentalityShift;
    private randomPoint;
    private ballIsSlow;
    private distance;
    private clampPoint;
    private clamp;
    private round;
    private roundTime;
}
