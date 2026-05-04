import { Position } from './enums/Position';
import Player from './Player';
import type { PlayerAttributes } from './Player';
import type Team from './Team';
export interface Vector2 {
    x: number;
    y: number;
}
export type TeamSide = 'home' | 'away';
export type Mentality = 'defensive' | 'balanced' | 'attacking';
export type MatchPhase = 'kickoff' | 'open_play' | 'throw_in' | 'corner' | 'goal_kick' | 'free_kick' | 'penalty' | 'injury_stoppage' | 'substitution' | 'half_time' | 'full_time';
export type PlayerIntentType = 'hold_shape' | 'press' | 'cover_passing_lane' | 'track_runner' | 'overlap' | 'underlap' | 'attack_box' | 'drop_between_lines' | 'drift_wide' | 'make_forward_run' | 'recover_shape' | 'support_carrier' | 'support' | 'receive' | 'dribble' | 'pass' | 'shoot' | 'recover';
export type RealTimeEventType = 'match_start' | 'kickoff' | 'half_time' | 'full_time' | 'throw_in' | 'corner' | 'goal_kick' | 'free_kick' | 'penalty' | 'dribble' | 'challenge' | 'yellow_card' | 'red_card' | 'injury' | 'substitution' | 'aerial_duel' | 'blocked_shot' | 'goalkeeper_claim' | 'goalkeeper_punch' | 'pass' | 'receive' | 'interception' | 'tackle' | 'shot' | 'save' | 'miss' | 'foul' | 'goal' | 'recovery';
export interface Tactics {
    formation: string;
    press: number;
    width: number;
    tempo: number;
    mentality: Mentality;
}
export interface RefereeProfile {
    strictness: number;
    advantagePatience: number;
    penaltyThreshold: number;
    bookingThreshold: number;
}
export interface PlayerIntent {
    type: PlayerIntentType;
    target: Vector2;
    targetPlayerId?: string;
    duration: number;
    urgency: number;
    tacticalRisk: number;
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
    foulsCommitted: number;
    foulsSuffered: number;
    yellowCards: number;
    redCard: boolean;
    aggressionRisk: number;
    tackleTimingRisk: number;
    injurySeverity: 'none' | 'knock' | 'minor' | 'forced';
    injuryPerformancePenalty: number;
    onPitch: boolean;
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
    route?: string;
    restartType?: RestartState['phase'];
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
    referee: RefereeProfile;
    score: {
        home: number;
        away: number;
    };
    activeBallAction: ActiveBallAction | null;
    restart: RestartState | null;
    bench: {
        home: SimulatedPlayer[];
        away: SimulatedPlayer[];
    };
    substitutionsUsed: {
        home: number;
        away: number;
    };
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
    replayWindow?: {
        startTime: number;
        endTime: number;
    };
}
export interface MatchSnapshotPlayer {
    id: string;
    teamSide: TeamSide;
    role: Position;
    roleName: string;
    playerName: string;
    playerNumber: number;
    x: number;
    y: number;
    stamina: number;
    foulsCommitted: number;
    foulsSuffered: number;
    yellowCards: number;
    redCard: boolean;
    injurySeverity: 'none' | 'knock' | 'minor' | 'forced';
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
    referee: Partial<RefereeProfile>;
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
    private baseTactics;
    private nextPhaseAfterSnapshot;
    private clearRestartAfterSnapshot;
    constructor(homeTeam: Team, awayTeam: Team, options?: Partial<RealTimeEngineOptions>);
    start(): MatchSnapshot;
    simulate(untilSeconds?: number): MatchSnapshot[];
    tick(): MatchSlice;
    private commitSnapshot;
    private tacticsFromOptions;
    private refereeFromOptions;
    private createPlayers;
    private createBenchPlayers;
    private generateBenchPlayers;
    private fallbackAttributes;
    private intent;
    private handleTimeBoundaries;
    private startedSecondHalfSide;
    private resetForKickoff;
    private resolvePhaseAction;
    private executeThrowIn;
    private executeCorner;
    private executeGoalKick;
    private executeFreeKick;
    private executePenalty;
    private playRestartPass;
    private playRestartShot;
    private detectBallOut;
    private prepareGoalLineRestart;
    private prepareRestart;
    private placePlayersForRestart;
    private updateTacticalState;
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
    private resolveFoul;
    private bookingEvents;
    private injuryEvents;
    private prepareFoulRestart;
    private applyRedCard;
    private detectSubstitutionEvents;
    private substitutionCandidate;
    private performSubstitution;
    private selectSubstituteFor;
    private isPenaltyFoul;
    private ballIsInPenaltyArea;
    private penaltySpotFor;
    private detectLooseBallRecovery;
    private detectPassOutcome;
    private detectGoalkeeperSetPieceAction;
    private detectAerialDuel;
    private detectShotOutcome;
    private detectShotBlock;
    private snapshot;
    private createEvent;
    private replayWindowForGoal;
    private formationTargetsForRoles;
    private formationSlotScore;
    private roleFormationPreference;
    private roleLineIndex;
    private roleLane;
    private formationSlots;
    private parseFormation;
    private selectPassTarget;
    private passRoute;
    private shotRoute;
    private selectRestartTaker;
    private selectThrowInTarget;
    private selectBoxTarget;
    private selectShortGoalKickTarget;
    private selectLongGoalKickTarget;
    private safeRestartTarget;
    private cornerTargetPoint;
    private supportTarget;
    private overlapTarget;
    private boxEntryTarget;
    private forwardRunTarget;
    private driftWideTarget;
    private betweenLinesTarget;
    private trackRunnerTarget;
    private coverLaneTarget;
    private isWideDefender;
    private isWideAttacker;
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
