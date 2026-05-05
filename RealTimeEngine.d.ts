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
export type TacticalStyle = 'balanced' | 'possession' | 'direct' | 'counter' | 'low_block' | 'high_press';
export type AttackingFocus = 'balanced' | 'wide' | 'central';
export type MatchPhase = 'kickoff' | 'open_play' | 'throw_in' | 'corner' | 'goal_kick' | 'free_kick' | 'penalty' | 'injury_stoppage' | 'substitution' | 'half_time' | 'full_time';
export type FieldZone = 'defensive_third' | 'middle_third' | 'attacking_third' | 'final_third' | 'wide_left' | 'wide_right' | 'half_space_left' | 'half_space_right' | 'central_lane' | 'box' | 'byline';
export type AttackPattern = 'none' | 'patient_buildup' | 'midfield_progression' | 'final_third_probe' | 'wide_overload' | 'switch_of_play' | 'overlap' | 'underlap' | 'through_ball' | 'cross' | 'cutback' | 'late_run' | 'rebound' | 'second_ball' | 'set_piece' | 'central_combination' | 'defensive_transition';
export type BallRecoverySource = 'rebound' | 'second_ball';
export type PlayerIntentType = 'hold_shape' | 'press' | 'cover_passing_lane' | 'track_runner' | 'overlap' | 'underlap' | 'attack_box' | 'drop_between_lines' | 'drift_wide' | 'make_forward_run' | 'recover_shape' | 'support_carrier' | 'support' | 'receive' | 'receive_pass' | 'dribble' | 'pass' | 'shoot' | 'recover' | 'attack_second_ball';
export type RealTimeEventType = 'match_start' | 'kickoff' | 'half_time' | 'full_time' | 'throw_in' | 'corner' | 'goal_kick' | 'free_kick' | 'penalty' | 'dribble' | 'challenge' | 'yellow_card' | 'red_card' | 'injury' | 'substitution' | 'advantage' | 'aerial_duel' | 'blocked_shot' | 'goalkeeper_claim' | 'goalkeeper_punch' | 'pass' | 'receive' | 'second_ball' | 'interception' | 'tackle' | 'shot' | 'save' | 'miss' | 'foul' | 'goal' | 'recovery';
export interface Tactics {
    formation: string;
    style: TacticalStyle;
    press: number;
    width: number;
    tempo: number;
    mentality: Mentality;
    defensiveLine: number;
    compactness: number;
    focus: AttackingFocus;
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
export interface SecondBallState {
    x: number;
    y: number;
    expiresAt: number;
    teamSide: TeamSide;
    sourcePlayerId: string;
    source: BallRecoverySource;
}
export interface ActiveBallAction {
    type: 'pass' | 'shot';
    from: SimulatedPlayer;
    teamSide: TeamSide;
    origin?: Vector2;
    target: Vector2;
    targetPlayer?: SimulatedPlayer;
    inaccurate: boolean;
    quality: number;
    estimatedArrivalTime?: number;
    passSpeed?: number;
    receiveDifficulty?: number;
    targetKind?: 'feet' | 'space' | 'contest';
    route?: string;
    restartType?: RestartState['phase'];
    chanceQuality?: number;
}
export interface PossessionContext {
    id: number;
    teamSide: TeamSide | null;
    startTime: number;
    startPhase: MatchPhase;
    passCount: number;
    lastPassRoute: string | null;
    lastSuccessfulPassRoute: string | null;
    lastProgressionZone: FieldZone | null;
    finalThirdEntries: number;
    wideEntries: number;
    boxEntries: number;
    secondBallRecoveries: number;
    setPieceOrigin: RestartState['phase'] | null;
    activeAttackPattern: AttackPattern;
    currentFieldZones: FieldZone[];
    lastRecoveryType: BallRecoverySource | null;
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
    secondBall: SecondBallState | null;
    restart: RestartState | null;
    possession: PossessionContext;
    addedTime: {
        firstHalf: number;
        secondHalf: number;
    };
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
    fieldZones: FieldZone[];
    possession: PossessionContext;
    activeAttackPattern: AttackPattern;
    chanceQuality?: number;
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
    addedTime: {
        firstHalf: number;
        secondHalf: number;
    };
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
    activePassTarget: Vector2 | null;
    activeShot: {
        route: string;
        chanceQuality: number;
        target: Vector2;
    } | null;
    secondBall: {
        x: number;
        y: number;
        expiresAt: number;
        source: BallRecoverySource;
    } | null;
    possession: PossessionContext;
    fieldZones: FieldZone[];
    activeAttackPattern: AttackPattern;
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
    private nextPossessionId;
    constructor(homeTeam: Team, awayTeam: Team, options?: Partial<RealTimeEngineOptions>);
    start(): MatchSnapshot;
    simulate(untilSeconds?: number): MatchSnapshot[];
    tick(): MatchSlice;
    private commitSnapshot;
    private registerAddedTime;
    private tacticsFromOptions;
    private refereeFromOptions;
    private emptyPossessionContext;
    private startPossession;
    private possessionSnapshot;
    private recordPossessionPosition;
    private recordPassAttempt;
    private recordSuccessfulPass;
    private recordSecondBallRecovery;
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
    private intentForPassReceiver;
    private intentForBallOwner;
    private dribbleIntent;
    private intentForLooseBall;
    private intentForSecondBall;
    private intentForTeammateInPossession;
    private intentForOutOfPossession;
    private pressDistance;
    private stylePressDistanceModifier;
    private pressTrapBonus;
    private pressUrgency;
    private pressRisk;
    private resolveBallAction;
    private startPass;
    private startShot;
    private movePlayersAndBall;
    private detectEvents;
    private detectTackleOrFoul;
    private resolveFoul;
    private shouldPlayAdvantage;
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
    private resolveFirstTouch;
    private firstTouchChance;
    private createSecondBall;
    private shouldSecondBallRunOut;
    private secondBallPoint;
    private receiveZone;
    private passTargetZone;
    private keepOverhitPassInPlayChance;
    private detectGoalkeeperSetPieceAction;
    private detectGoalkeeperSweep;
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
    private passRouteSelectionBonus;
    private tacticalDirectness;
    private maxOpenPlayPassDistance;
    private styleRouteSelectionBonus;
    private passTargetPoint;
    private passTargetKind;
    private passSpeed;
    private passMissDistance;
    private receiveDifficulty;
    private passRoute;
    private canPlayThroughBall;
    private runnerSeparation;
    private passingLanePressure;
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
    private underlapTarget;
    private boxEntryTarget;
    private forwardRunTarget;
    private driftWideTarget;
    private betweenLinesTarget;
    private trackRunnerTarget;
    private coverLaneTarget;
    private isWideDefender;
    private isWideAttacker;
    private isWideCarrier;
    private hasOverlappingSupport;
    private shootingIntentChance;
    private stylePassFrequencyBonus;
    private passQuality;
    private shotQuality;
    private shotRouteQualityBoost;
    private defensiveShotQualityModifier;
    private pressureAround;
    private defensiveSystemPressure;
    private interceptionChance;
    private playerSpeed;
    private updateStamina;
    private velocityTowards;
    private moveTowards;
    private pointTowards;
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
    private fieldZonesFor;
    private progressionZone;
    private hasWideZone;
    private routeLedAttackPattern;
    private attackPatternFromZones;
    private attackPatternFromPassRoute;
    private attackPatternFromShotRoute;
    private registerTouch;
    private mirrorForSide;
    private mentalityShift;
    private randomPoint;
    private ballIsSlow;
    private ballOutsidePitch;
    private distance;
    private distanceToSegment;
    private clampPoint;
    private clampPassTarget;
    private clamp;
    private round;
    private roundTime;
}
