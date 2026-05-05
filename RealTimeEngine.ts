import {
    attackPositions,
    defencePositions,
    midfieldPositions,
    Position,
} from './enums/Position';
import Player from './Player';
import type { PlayerAttributes } from './Player';
import type Team from './Team';

export interface Vector2 {
    x: number;
    y: number;
}

export type TeamSide = 'home' | 'away';
export type Mentality = 'defensive' | 'balanced' | 'attacking';
export type MatchPhase =
    'kickoff'
    | 'open_play'
    | 'throw_in'
    | 'corner'
    | 'goal_kick'
    | 'free_kick'
    | 'penalty'
    | 'injury_stoppage'
    | 'substitution'
    | 'half_time'
    | 'full_time';
export type FieldZone =
    'defensive_third'
    | 'middle_third'
    | 'attacking_third'
    | 'final_third'
    | 'wide_left'
    | 'wide_right'
    | 'half_space_left'
    | 'half_space_right'
    | 'central_lane'
    | 'box'
    | 'byline';
export type AttackPattern =
    'none'
    | 'patient_buildup'
    | 'midfield_progression'
    | 'final_third_probe'
    | 'wide_overload'
    | 'switch_of_play'
    | 'overlap'
    | 'underlap'
    | 'through_ball'
    | 'cross'
    | 'cutback'
    | 'late_run'
    | 'rebound'
    | 'second_ball'
    | 'set_piece'
    | 'central_combination'
    | 'defensive_transition';
export type BallRecoverySource = 'rebound' | 'second_ball';
export type PlayerIntentType =
    'hold_shape'
    | 'press'
    | 'cover_passing_lane'
    | 'track_runner'
    | 'overlap'
    | 'underlap'
    | 'attack_box'
    | 'drop_between_lines'
    | 'drift_wide'
    | 'make_forward_run'
    | 'recover_shape'
    | 'support_carrier'
    | 'support'
    | 'receive'
    | 'receive_pass'
    | 'dribble'
    | 'pass'
    | 'shoot'
    | 'recover'
    | 'attack_second_ball';

export type RealTimeEventType =
    'match_start'
    | 'kickoff'
    | 'half_time'
    | 'full_time'
    | 'throw_in'
    | 'corner'
    | 'goal_kick'
    | 'free_kick'
    | 'penalty'
    | 'dribble'
    | 'challenge'
    | 'yellow_card'
    | 'red_card'
    | 'injury'
    | 'substitution'
    | 'advantage'
    | 'aerial_duel'
    | 'blocked_shot'
    | 'goalkeeper_claim'
    | 'goalkeeper_punch'
    | 'pass'
    | 'receive'
    | 'second_ball'
    | 'interception'
    | 'tackle'
    | 'shot'
    | 'save'
    | 'miss'
    | 'foul'
    | 'goal'
    | 'recovery';

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

type ActivePeriod = 1 | 2;

interface FormationSlot {
    point: Vector2;
    lineIndex: number;
    lane: number;
    goalkeeper: boolean;
}

export interface RealTimeEngineOptions {
    tickSeconds: number;
    matchLengthSeconds: number;
    homeTactics: Partial<Tactics>;
    awayTactics: Partial<Tactics>;
    referee: Partial<RefereeProfile>;
    random: () => number;
}

const defaultTactics: Tactics = {
    formation: '4-4-2',
    press: 50,
    width: 55,
    tempo: 50,
    mentality: 'balanced',
};

const defaultReferee: RefereeProfile = {
    strictness: 52,
    advantagePatience: 45,
    penaltyThreshold: 55,
    bookingThreshold: 55,
};

const pitch = {
    length: 105,
    width: 68,
    goalWidth: 7.32,
};

export default class RealTimeEngine {
    tickSeconds: number;
    matchLengthSeconds: number;
    homeTeam: Team;
    awayTeam: Team;
    state: MatchState;
    events: RealTimeMatchEvent[] = [];
    snapshots: MatchSnapshot[] = [];
    gameStarted = false;
    private random: () => number;
    private startedWithBallSide: TeamSide | null = null;
    private baseTactics: { home: Tactics, away: Tactics };
    private nextPhaseAfterSnapshot: MatchPhase | null = null;
    private clearRestartAfterSnapshot = false;
    private nextPossessionId = 1;

    constructor(homeTeam: Team, awayTeam: Team, options: Partial<RealTimeEngineOptions> = {}) {
        this.homeTeam = homeTeam;
        this.awayTeam = awayTeam;
        this.tickSeconds = options.tickSeconds || 0.25;
        this.matchLengthSeconds = options.matchLengthSeconds || 90 * 60;
        this.random = options.random || Math.random;

        const homeTactics = this.tacticsFromOptions(options.homeTactics);
        const awayTactics = this.tacticsFromOptions(options.awayTactics);
        this.baseTactics = {
            home: { ...homeTactics },
            away: { ...awayTactics },
        };
        const homePlayers = this.createPlayers(homeTeam, 'home', homeTactics, homeTeam.players.slice(0, 11));
        const awayPlayers = this.createPlayers(awayTeam, 'away', awayTactics, awayTeam.players.slice(0, 11));
        const players = [
            ...homePlayers,
            ...awayPlayers,
        ];

        this.state = {
            time: 0,
            period: 1,
            phase: 'kickoff',
            ball: {
                x: pitch.length / 2,
                y: pitch.width / 2,
                velocity: { x: 0, y: 0 },
                owner: null,
                lastTouchSide: null,
                lastTouchPlayerId: null,
            },
            players,
            tactics: {
                home: homeTactics,
                away: awayTactics,
            },
            referee: this.refereeFromOptions(options.referee),
            score: {
                home: 0,
                away: 0,
            },
            activeBallAction: null,
            secondBall: null,
            restart: null,
            possession: this.emptyPossessionContext(),
            addedTime: {
                firstHalf: 0,
                secondHalf: 0,
            },
            bench: {
                home: this.createBenchPlayers(homeTeam, 'home', homeTactics),
                away: this.createBenchPlayers(awayTeam, 'away', awayTactics),
            },
            substitutionsUsed: {
                home: 0,
                away: 0,
            },
        };
    }

    start(): MatchSnapshot {
        if (this.gameStarted) {
            return this.snapshot([]);
        }

        this.gameStarted = true;
        this.updateTacticalTargetPositions();
        this.state.players.forEach((player) => {
            player.x = player.target.x;
            player.y = player.target.y;
        });

        const kickoffSide = this.random() > 0.5 ? 'home' : 'away';

        this.startedWithBallSide = kickoffSide;
        this.resetForKickoff(kickoffSide);

        const events = [
            this.createEvent('match_start'),
            this.createEvent('kickoff', this.state.ball.owner || undefined),
        ];

        this.nextPhaseAfterSnapshot = 'open_play';
        const snapshot = this.commitSnapshot(events).snapshot;

        return snapshot;
    }

    simulate(untilSeconds: number = this.matchLengthSeconds): MatchSnapshot[] {
        if (!this.gameStarted) {
            this.start();
        }

        const endTime = Math.min(untilSeconds, this.matchLengthSeconds);

        while (this.state.period !== 'ended' && this.state.time < endTime) {
            this.tick();
        }

        return this.snapshots;
    }

    tick(): MatchSlice {
        if (!this.gameStarted) {
            this.start();
        }

        if (this.state.period === 'ended') {
            const snapshot = this.snapshot([]);

            return { state: this.state, events: [], snapshot };
        }

        this.state.time = this.roundTime(this.state.time + this.tickSeconds);

        const timeEvents = this.handleTimeBoundaries();

        if (timeEvents.length) {
            return this.commitSnapshot(timeEvents);
        }

        if (this.state.phase !== 'open_play') {
            return this.commitSnapshot(this.resolvePhaseAction());
        }

        this.updateTacticalState();
        this.updateTacticalTargetPositions();
        this.decidePlayerIntents();

        const events = [
            ...this.resolveBallAction(),
        ];

        this.movePlayersAndBall();
        events.push(...this.detectEvents());
        if (this.state.phase === 'open_play') {
            events.push(...this.detectSubstitutionEvents());
        }

        return this.commitSnapshot(events);
    }

    private commitSnapshot(events: RealTimeMatchEvent[]): MatchSlice {
        this.events.push(...events);
        this.registerAddedTime(events);

        const snapshot = this.snapshot(events);
        this.snapshots.push(snapshot);

        if (this.nextPhaseAfterSnapshot) {
            this.state.phase = this.nextPhaseAfterSnapshot;
            this.nextPhaseAfterSnapshot = null;
        }

        if (this.clearRestartAfterSnapshot) {
            this.state.restart = null;
            this.clearRestartAfterSnapshot = false;
        }

        return { state: this.state, events, snapshot };
    }

    private registerAddedTime(events: RealTimeMatchEvent[]): void {
        const addedSeconds = events.reduce((total, event) => {
            if (event.type === 'goal') {
                return total + 25;
            }

            if (event.type === 'injury') {
                return total + 35;
            }

            if (event.type === 'substitution') {
                return total + 20;
            }

            if (['yellow_card', 'red_card', 'penalty'].includes(event.type)) {
                return total + 10;
            }

            return total;
        }, 0);

        if (!addedSeconds || this.state.period === 'ended') {
            return;
        }

        if (this.state.period === 1) {
            this.state.addedTime.firstHalf += addedSeconds;

            return;
        }

        this.state.addedTime.secondHalf += addedSeconds;
    }

    private tacticsFromOptions(options?: Partial<Tactics>): Tactics {
        return {
            ...defaultTactics,
            ...options,
            press: this.clamp(options?.press ?? defaultTactics.press, 0, 100),
            width: this.clamp(options?.width ?? defaultTactics.width, 0, 100),
            tempo: this.clamp(options?.tempo ?? defaultTactics.tempo, 0, 100),
        };
    }

    private refereeFromOptions(options?: Partial<RefereeProfile>): RefereeProfile {
        return {
            ...defaultReferee,
            ...options,
            strictness: this.clamp(options?.strictness ?? defaultReferee.strictness, 0, 100),
            advantagePatience: this.clamp(options?.advantagePatience ?? defaultReferee.advantagePatience, 0, 100),
            penaltyThreshold: this.clamp(options?.penaltyThreshold ?? defaultReferee.penaltyThreshold, 0, 100),
            bookingThreshold: this.clamp(options?.bookingThreshold ?? defaultReferee.bookingThreshold, 0, 100),
        };
    }

    private emptyPossessionContext(): PossessionContext {
        return {
            id: 0,
            teamSide: null,
            startTime: 0,
            startPhase: 'kickoff',
            passCount: 0,
            lastPassRoute: null,
            lastSuccessfulPassRoute: null,
            lastProgressionZone: null,
            finalThirdEntries: 0,
            wideEntries: 0,
            boxEntries: 0,
            secondBallRecoveries: 0,
            setPieceOrigin: null,
            activeAttackPattern: 'none',
            currentFieldZones: [],
            lastRecoveryType: null,
        };
    }

    private startPossession(
        side: TeamSide,
        startPhase: MatchPhase,
        setPieceOrigin: RestartState['phase'] | null = null,
    ): void {
        const currentFieldZones = this.fieldZonesFor(side, this.state.ball);

        this.state.possession = {
            id: this.nextPossessionId,
            teamSide: side,
            startTime: this.state.time,
            startPhase,
            passCount: 0,
            lastPassRoute: null,
            lastSuccessfulPassRoute: null,
            lastProgressionZone: this.progressionZone(currentFieldZones),
            finalThirdEntries: currentFieldZones.includes('final_third') ? 1 : 0,
            wideEntries: this.hasWideZone(currentFieldZones) ? 1 : 0,
            boxEntries: currentFieldZones.includes('box') ? 1 : 0,
            secondBallRecoveries: 0,
            setPieceOrigin,
            activeAttackPattern: setPieceOrigin ? 'set_piece' : this.attackPatternFromZones(currentFieldZones),
            currentFieldZones,
            lastRecoveryType: null,
        };
        this.nextPossessionId += 1;
    }

    private possessionSnapshot(): PossessionContext {
        return {
            ...this.state.possession,
            currentFieldZones: [...this.state.possession.currentFieldZones],
        };
    }

    private recordPossessionPosition(side: TeamSide, point: Vector2): void {
        if (this.state.possession.teamSide !== side) {
            return;
        }

        const zones = this.fieldZonesFor(side, point);
        const previousZones = this.state.possession.currentFieldZones;

        if (!previousZones.includes('final_third') && zones.includes('final_third')) {
            this.state.possession.finalThirdEntries += 1;
        }

        if (!this.hasWideZone(previousZones) && this.hasWideZone(zones)) {
            this.state.possession.wideEntries += 1;
        }

        if (!previousZones.includes('box') && zones.includes('box')) {
            this.state.possession.boxEntries += 1;
        }

        this.state.possession.currentFieldZones = zones;
        this.state.possession.lastProgressionZone = this.progressionZone(zones);

        if (!this.routeLedAttackPattern(this.state.possession.activeAttackPattern)) {
            this.state.possession.activeAttackPattern = this.attackPatternFromZones(zones);
        }
    }

    private recordPassAttempt(route: string, target: Vector2): void {
        const possession = this.state.possession;

        if (!possession.teamSide) {
            return;
        }

        possession.passCount += 1;
        possession.lastPassRoute = route;
        possession.activeAttackPattern = this.attackPatternFromPassRoute(route);
        this.recordPossessionPosition(possession.teamSide, target);
    }

    private recordSuccessfulPass(route: string, receiver: SimulatedPlayer): void {
        if (this.state.possession.teamSide !== receiver.side) {
            return;
        }

        this.state.possession.lastSuccessfulPassRoute = route;
        this.state.possession.activeAttackPattern = this.attackPatternFromPassRoute(route);
        this.recordPossessionPosition(receiver.side, receiver);
    }

    private recordSecondBallRecovery(source: BallRecoverySource): void {
        this.state.possession.secondBallRecoveries += 1;
        this.state.possession.lastRecoveryType = source;
        this.state.possession.activeAttackPattern = source;
    }

    private createPlayers(
        team: Team,
        side: TeamSide,
        tactics: Tactics,
        sourcePlayers: Player[],
        idPrefix: string = 'starter',
    ): SimulatedPlayer[] {
        const targets = this.formationTargetsForRoles(
            sourcePlayers.map((player) => player.position),
            side,
            tactics,
            1,
        );

        return sourcePlayers.map((player, index) => {
            const target = targets[index];

            return {
                id: `${side}-${idPrefix}-${index}-${player.info.number}`,
                team,
                side,
                player,
                role: player.position,
                x: target.x,
                y: target.y,
                target: { ...target },
                stamina: 100,
                attributes: player.attributes,
                currentIntent: this.intent('hold_shape', { ...target }),
                actionCooldown: 0,
                foulsCommitted: 0,
                foulsSuffered: 0,
                yellowCards: 0,
                redCard: false,
                aggressionRisk: player.attributes.aggression / 20,
                tackleTimingRisk: this.clamp(1 - player.attributes.tackling / 20, 0, 1),
                injurySeverity: 'none',
                injuryPerformancePenalty: 0,
                onPitch: idPrefix === 'starter',
            };
        });
    }

    private createBenchPlayers(team: Team, side: TeamSide, tactics: Tactics): SimulatedPlayer[] {
        const benchPlayers = team.players.slice(11, 16);
        const players = benchPlayers.length ? benchPlayers : this.generateBenchPlayers(team);

        return this.createPlayers(team, side, tactics, players, 'bench');
    }

    private generateBenchPlayers(team: Team): Player[] {
        const template = team.players[0];
        const attributes = template ? template.attributes : this.fallbackAttributes();
        const roles = [Position.GK, Position.CB, Position.CM, Position.RM, Position.ST];

        return roles.map((role, index) => new Player(
            {
                name: `${team.name} Bench ${Position[role]}`,
                number: 90 + index,
            },
            {
                height: 180,
                weight: 76,
            },
            { ...attributes },
            role,
        ));
    }

    private fallbackAttributes(): PlayerAttributes {
        return {
            aggression: 12,
            anticipation: 12,
            bravery: 12,
            composure: 12,
            concentration: 12,
            decisions: 12,
            determination: 12,
            flair: 12,
            leadership: 12,
            offTheBall: 12,
            positioning: 12,
            teamwork: 12,
            vision: 12,
            workRate: 12,
            acceleration: 12,
            agility: 12,
            balance: 12,
            jumpingReach: 12,
            naturalFitness: 12,
            pace: 12,
            stamina: 12,
            strength: 12,
            corners: 12,
            crossing: 12,
            dribbling: 12,
            finishing: 12,
            firstTouch: 12,
            freeKickTaking: 12,
            heading: 12,
            longShots: 12,
            longThrows: 12,
            marking: 12,
            passing: 12,
            penaltyTaking: 12,
            tackling: 12,
            technique: 12,
            aerialReach: 12,
            commandOfArea: 12,
            communication: 12,
            eccentricity: 12,
            handling: 12,
            oneOnOnes: 12,
            reflexes: 12,
            rushingOut: 12,
            tendencyToPunch: 12,
            throwing: 12,
        };
    }

    private intent(
        type: PlayerIntentType,
        target: Vector2,
        options: Partial<Pick<PlayerIntent, 'targetPlayerId' | 'duration' | 'urgency' | 'tacticalRisk'>> = {},
    ): PlayerIntent {
        return {
            type,
            target,
            targetPlayerId: options.targetPlayerId,
            duration: options.duration ?? 2,
            urgency: options.urgency ?? 0.5,
            tacticalRisk: options.tacticalRisk ?? 0.25,
        };
    }

    private handleTimeBoundaries(): RealTimeMatchEvent[] {
        const halfTime = this.matchLengthSeconds / 2;
        const halfTimeWithAdded = halfTime + this.state.addedTime.firstHalf;
        const fullTimeWithAdded = this.matchLengthSeconds + this.state.addedTime.secondHalf;

        if (this.state.period === 1 && this.state.time >= halfTimeWithAdded) {
            this.state.time = halfTimeWithAdded;
            this.state.period = 2;
            this.state.phase = 'half_time';
            this.resetForKickoff(this.startedSecondHalfSide());
            this.nextPhaseAfterSnapshot = 'open_play';

            return [
                this.createEvent('half_time'),
                this.createEvent('kickoff', this.state.ball.owner || undefined),
            ];
        }

        if (this.state.time >= fullTimeWithAdded) {
            this.state.time = fullTimeWithAdded;
            this.state.period = 'ended';
            this.state.phase = 'full_time';
            this.state.ball.owner = null;
            this.state.ball.velocity = { x: 0, y: 0 };
            this.state.activeBallAction = null;
            this.state.restart = null;

            return [this.createEvent('full_time')];
        }

        return [];
    }

    private startedSecondHalfSide(): TeamSide {
        if (!this.startedWithBallSide) {
            return 'away';
        }

        return this.oppositeSide(this.startedWithBallSide);
    }

    private resetForKickoff(side: TeamSide): void {
        this.resetPlayersToFormation();

        const player = this.closestPlayerTo(side, { x: pitch.length / 2, y: pitch.width / 2 });

        this.state.ball.x = pitch.length / 2;
        this.state.ball.y = pitch.width / 2;
        this.state.ball.velocity = { x: 0, y: 0 };
        this.state.ball.owner = player;
        this.state.activeBallAction = null;
        this.state.secondBall = null;

        if (player) {
            this.startPossession(side, 'kickoff');
            this.registerTouch(player);
        }

        if (player) {
            player.x = this.state.ball.x;
            player.y = this.state.ball.y;
            player.actionCooldown = 0.6;
        }
    }

    private resolvePhaseAction(): RealTimeMatchEvent[] {
        if (!this.state.restart) {
            this.nextPhaseAfterSnapshot = 'open_play';

            return [];
        }

        if (this.state.restart.phase === 'throw_in') {
            return [this.executeThrowIn()];
        }

        if (this.state.restart.phase === 'corner') {
            return [this.executeCorner()];
        }

        if (this.state.restart.phase === 'goal_kick') {
            return [this.executeGoalKick()];
        }

        if (this.state.restart.phase === 'free_kick') {
            return [this.executeFreeKick()];
        }

        if (this.state.restart.phase === 'penalty') {
            return [this.executePenalty()];
        }

        this.nextPhaseAfterSnapshot = 'open_play';
        this.clearRestartAfterSnapshot = true;

        return [];
    }

    private executeThrowIn(): RealTimeMatchEvent {
        const restart = this.state.restart as RestartState;
        const taker = this.state.ball.owner || this.selectRestartTaker(restart);
        const target = this.selectThrowInTarget(restart.teamSide, taker);
        const targetPoint = target ? { x: target.x, y: target.y } : this.safeRestartTarget(restart.teamSide, restart.position, 12);
        const outcome = this.random() < 0.75 ? 'short_safe_throw' : 'throw_down_line';

        return this.playRestartPass('throw_in', taker, target, targetPoint, 18, outcome);
    }

    private executeCorner(): RealTimeMatchEvent {
        const restart = this.state.restart as RestartState;
        const taker = this.state.ball.owner || this.selectRestartTaker(restart);
        const options = ['near_post', 'far_post', 'penalty_spot', 'short_corner'];
        const outcome = options[Math.floor(this.random() * options.length)] || 'penalty_spot';
        const target = outcome === 'short_corner'
            ? this.selectThrowInTarget(restart.teamSide, taker)
            : this.selectBoxTarget(restart.teamSide, taker);
        const targetPoint = target ? { x: target.x, y: target.y } : this.cornerTargetPoint(restart.teamSide, outcome);
        const speed = outcome === 'short_corner' ? 16 : 28;

        return this.playRestartPass('corner', taker, target, targetPoint, speed, outcome);
    }

    private executeGoalKick(): RealTimeMatchEvent {
        const restart = this.state.restart as RestartState;
        const taker = this.state.ball.owner || this.selectRestartTaker(restart);
        const shortKick = this.random() < 0.55;
        const target = shortKick
            ? this.selectShortGoalKickTarget(restart.teamSide, taker)
            : this.selectLongGoalKickTarget(restart.teamSide, taker);
        const targetPoint = target ? { x: target.x, y: target.y } : this.safeRestartTarget(restart.teamSide, restart.position, shortKick ? 18 : 45);

        return this.playRestartPass('goal_kick', taker, target, targetPoint, shortKick ? 24 : 34, shortKick ? 'short_build_up' : 'long_kick');
    }

    private executeFreeKick(): RealTimeMatchEvent {
        const restart = this.state.restart as RestartState;
        const taker = this.state.ball.owner || this.selectRestartTaker(restart);
        const goal = this.goalCenterAgainst(restart.teamSide);
        const directShot = this.distance(restart.position, goal) < 28 && this.random() < 0.45;

        if (directShot) {
            return this.playRestartShot('free_kick', taker, goal, 30, 'direct_free_kick');
        }

        const target = this.selectBoxTarget(restart.teamSide, taker) || this.selectThrowInTarget(restart.teamSide, taker);
        const targetPoint = target ? { x: target.x, y: target.y } : this.safeRestartTarget(restart.teamSide, restart.position, 22);

        return this.playRestartPass('free_kick', taker, target, targetPoint, 24, 'indirect_free_kick');
    }

    private executePenalty(): RealTimeMatchEvent {
        const restart = this.state.restart as RestartState;
        const taker = this.state.ball.owner || this.selectRestartTaker(restart);
        const goalkeeper = this.goalkeeperFor(this.oppositeSide(restart.teamSide));
        const takerQuality = (taker.attributes.penaltyTaking + taker.attributes.composure + taker.attributes.finishing) / 60;
        const saveQuality = goalkeeper
            ? (goalkeeper.attributes.reflexes + goalkeeper.attributes.oneOnOnes + goalkeeper.attributes.handling) / 60
            : 0.45;
        const goalChance = this.clamp(0.72 + takerQuality * 0.18 - saveQuality * 0.14, 0.58, 0.9);
        const roll = this.random();

        this.state.ball.velocity = { x: 0, y: 0 };
        this.state.activeBallAction = null;
        this.registerTouch(taker);
        this.nextPhaseAfterSnapshot = 'open_play';
        this.clearRestartAfterSnapshot = true;

        if (roll < goalChance) {
            this.state.score[restart.teamSide] += 1;
            const event = this.createEvent('penalty', taker, goalkeeper || undefined, 'goal', {
                chanceQuality: goalChance,
            });
            event.replayWindow = this.replayWindowForGoal();
            this.resetForKickoff(this.oppositeSide(restart.teamSide));
            this.state.phase = 'penalty';
            this.nextPhaseAfterSnapshot = 'open_play';

            return event;
        }

        if (roll < goalChance + 0.08) {
            this.state.ball.owner = null;

            return this.createEvent('penalty', taker, goalkeeper || undefined, 'miss', {
                chanceQuality: goalChance,
            });
        }

        if (goalkeeper) {
            this.state.ball.owner = goalkeeper;
            this.registerTouch(goalkeeper);
        }

        return this.createEvent('penalty', taker, goalkeeper || undefined, this.random() < 0.3 ? 'save_rebound' : 'save', {
            chanceQuality: goalChance,
        });
    }

    private playRestartPass(
        type: Extract<RealTimeEventType, 'throw_in' | 'corner' | 'goal_kick' | 'free_kick'>,
        taker: SimulatedPlayer,
        targetPlayer: SimulatedPlayer | null,
        target: Vector2,
        speed: number,
        outcome: string,
    ): RealTimeMatchEvent {
        const restartPosition = this.state.restart?.position || { x: this.state.ball.x, y: this.state.ball.y };
        const restartTarget = this.clampPoint(target);

        taker.x = restartPosition.x;
        taker.y = restartPosition.y;
        this.state.possession.activeAttackPattern = 'set_piece';
        this.state.ball.owner = null;
        this.state.ball.x = restartPosition.x;
        this.state.ball.y = restartPosition.y;
        this.state.ball.velocity = this.velocityTowards(restartPosition, restartTarget, speed);
        this.registerTouch(taker);
        this.state.activeBallAction = {
            type: 'pass',
            from: taker,
            teamSide: taker.side,
            origin: { ...restartPosition },
            target: restartTarget,
            targetPlayer: targetPlayer || undefined,
            inaccurate: false,
            quality: 0.76,
            estimatedArrivalTime: this.state.time + this.distance(restartPosition, restartTarget) / speed,
            passSpeed: speed,
            receiveDifficulty: type === 'goal_kick' && outcome === 'long_kick' ? 0.72 : 0.34,
            targetKind: outcome === 'long_kick' ? 'contest' : 'feet',
            route: outcome,
            restartType: type,
        };
        this.state.secondBall = null;
        this.recordPassAttempt(outcome, restartTarget);
        taker.actionCooldown = 1.2;
        this.nextPhaseAfterSnapshot = 'open_play';
        this.clearRestartAfterSnapshot = true;

        return this.createEvent(type, taker, targetPlayer || undefined, outcome);
    }

    private playRestartShot(
        type: Extract<RealTimeEventType, 'free_kick'>,
        taker: SimulatedPlayer,
        target: Vector2,
        speed: number,
        outcome: string,
    ): RealTimeMatchEvent {
        const restartPosition = this.state.restart?.position || { x: this.state.ball.x, y: this.state.ball.y };
        const quality = this.clamp((taker.attributes.freeKickTaking + taker.attributes.technique + taker.attributes.longShots) / 60, 0.25, 0.9);
        const aimedTarget = {
            x: target.x,
            y: target.y + (this.random() - 0.5) * pitch.goalWidth * (1.2 - quality),
        };

        taker.x = restartPosition.x;
        taker.y = restartPosition.y;
        this.state.ball.owner = null;
        this.state.ball.x = restartPosition.x;
        this.state.ball.y = restartPosition.y;
        this.state.ball.velocity = this.velocityTowards(restartPosition, aimedTarget, speed);
        this.registerTouch(taker);
        this.state.activeBallAction = {
            type: 'shot',
            from: taker,
            teamSide: taker.side,
            origin: { ...restartPosition },
            target: aimedTarget,
            inaccurate: quality < this.random(),
            quality,
            chanceQuality: quality,
            route: outcome,
            restartType: type,
        };
        this.state.secondBall = null;
        taker.actionCooldown = 1.4;
        this.nextPhaseAfterSnapshot = 'open_play';
        this.clearRestartAfterSnapshot = true;

        return this.createEvent(type, taker, undefined, outcome, {
            chanceQuality: quality,
        });
    }

    private detectBallOut(): RealTimeMatchEvent | null {
        if (this.state.phase !== 'open_play') {
            return null;
        }

        if (this.state.ball.y < 0 || this.state.ball.y > pitch.width) {
            const lastTouchSide = this.state.ball.lastTouchSide || this.state.activeBallAction?.teamSide || 'home';
            const restartSide = this.oppositeSide(lastTouchSide);
            const y = this.state.ball.y < 0 ? 0 : pitch.width;

            return this.prepareRestart('throw_in', restartSide, {
                x: this.clamp(this.state.ball.x, 0, pitch.length),
                y,
            }, 'touchline');
        }

        if (this.state.ball.x < 0 || this.state.ball.x > pitch.length) {
            return this.prepareGoalLineRestart(this.state.ball.lastTouchSide || this.state.activeBallAction?.teamSide || 'home');
        }

        return null;
    }

    private prepareGoalLineRestart(lastTouchSide: TeamSide): RealTimeMatchEvent {
        const goalLineX = this.state.ball.x < 0 ? 0 : pitch.length;
        const attackingSide = this.attackingSideForGoalLine(goalLineX);
        const defendingSide = this.oppositeSide(attackingSide);

        if (lastTouchSide === attackingSide) {
            return this.prepareRestart('goal_kick', defendingSide, this.goalKickPosition(defendingSide), 'goal_line');
        }

        return this.prepareRestart('corner', attackingSide, {
            x: goalLineX,
            y: this.state.ball.y < pitch.width / 2 ? 0 : pitch.width,
        }, 'goal_line');
    }

    private prepareRestart(
        phase: RestartState['phase'],
        teamSide: TeamSide,
        position: Vector2,
        reason: string,
    ): RealTimeMatchEvent {
        const restart: RestartState = {
            phase,
            teamSide,
            position: this.clampPoint(position),
            reason,
        };
        const taker = this.selectRestartTaker(restart);

        this.state.phase = phase;
        this.state.restart = restart;
        this.state.activeBallAction = null;
        this.state.secondBall = null;
        this.state.ball.x = restart.position.x;
        this.state.ball.y = restart.position.y;
        this.state.ball.velocity = { x: 0, y: 0 };
        this.state.ball.owner = taker;
        this.startPossession(teamSide, phase, phase);
        this.registerTouch(taker);
        this.placePlayersForRestart(restart, taker);

        return this.createEvent(phase, taker, undefined, reason);
    }

    private placePlayersForRestart(restart: RestartState, taker: SimulatedPlayer): void {
        this.updateTacticalTargetPositions();

        this.state.players.forEach((player) => {
            if (player === taker) {
                player.x = restart.position.x;
                player.y = restart.position.y;
                player.currentIntent = this.intent('hold_shape', { ...restart.position }, {
                    duration: 1.5,
                    urgency: 0.4,
                    tacticalRisk: 0.05,
                });

                return;
            }

            const distanceToRestart = this.distance(player, restart.position);

            if (distanceToRestart < 6) {
                const direction = player.side === restart.teamSide ? -1 : 1;
                player.x = this.clamp(player.x + direction * 4, 0, pitch.length);
            }

            player.currentIntent = this.intent('hold_shape', { ...player.target }, {
                duration: 2,
                urgency: 0.35,
                tacticalRisk: 0.08,
            });
        });
    }

    private updateTacticalState(): void {
        for (const side of ['home', 'away'] as TeamSide[]) {
            const base = this.baseTactics[side];
            const opponent = this.oppositeSide(side);
            const minute = this.state.time / 60;
            const scoreDiff = this.state.score[side] - this.state.score[opponent];
            const players = this.playersForSide(side);
            const averageStamina = players.length
                ? players.reduce((sum, player) => sum + player.stamina, 0) / players.length
                : 100;
            const redCards = players.filter((player) => player.redCard).length + (11 - players.length);
            const injuryLoad = players.filter((player) => player.injurySeverity !== 'none').length;
            const cardLoad = players.reduce((sum, player) => sum + player.yellowCards, 0);
            let press = base.press;
            let tempo = base.tempo;
            let mentality = base.mentality;

            if (redCards > 0) {
                press -= 14;
                tempo -= 8;
                mentality = 'defensive';
            } else if (scoreDiff < 0 && minute >= 60) {
                press += 10;
                tempo += 12;
                mentality = 'attacking';
            } else if (scoreDiff > 0 && minute >= 75) {
                press -= 8;
                tempo -= 10;
                mentality = 'defensive';
            }

            if (averageStamina < 58) {
                press -= 8;
                tempo -= 5;
            }

            if (cardLoad > 1 || injuryLoad > 0) {
                press -= 4;
            }

            this.state.tactics[side] = {
                ...base,
                press: this.clamp(press, 0, 100),
                tempo: this.clamp(tempo, 0, 100),
                mentality,
            };
        }
    }

    private updateTacticalTargetPositions(): void {
        (['home', 'away'] as TeamSide[]).forEach((side) => {
            const tactics = this.tactics(side);
            const players = this.playersForSide(side);
            const baseTargets = this.formationTargetsForRoles(
                players.map((player) => player.role),
                side,
                tactics,
                this.activePeriod(),
            );
            const hasBall = this.state.ball.owner?.side === side;
            const ball = this.state.ball;
            const direction = this.attackDirection(side);
            const possessionShift = hasBall ? 6 : -4;
            const ballShift = (ball.x - pitch.length / 2) * 0.12 * direction;

            players.forEach((player, index) => {
                const slot = baseTargets[index];
                const towardBall = this.distance(player, ball) < 24 ? 0.18 : 0.08;
                const target = {
                    x: slot.x + direction * (possessionShift + ballShift),
                    y: slot.y + (ball.y - slot.y) * towardBall,
                };

                player.target = this.clampPoint(target);
            });
        });
    }

    private resetPlayersToFormation(): void {
        (['home', 'away'] as TeamSide[]).forEach((side) => {
            const players = this.playersForSide(side);
            const targets = this.formationTargetsForRoles(
                players.map((player) => player.role),
                side,
                this.tactics(side),
                this.activePeriod(),
            );

            players.forEach((player, index) => {
                const target = targets[index];

                player.x = target.x;
                player.y = target.y;
                player.target = { ...target };
                player.currentIntent = this.intent('hold_shape', { ...target });
                player.actionCooldown = 0;
            });
        });
    }

    private decidePlayerIntents(): void {
        const ballOwner = this.state.ball.owner;
        const activePass = this.state.activeBallAction?.type === 'pass' ? this.state.activeBallAction : null;

        this.state.players.forEach((player) => {
            player.actionCooldown = Math.max(0, player.actionCooldown - this.tickSeconds);

            if (activePass?.targetPlayer === player) {
                player.currentIntent = this.intentForPassReceiver(player, activePass);

                return;
            }

            if (player === ballOwner) {
                player.currentIntent = this.intentForBallOwner(player);

                return;
            }

            if (!ballOwner) {
                player.currentIntent = this.state.secondBall
                    ? this.intentForSecondBall(player)
                    : this.intentForLooseBall(player);

                return;
            }

            if (ballOwner.side === player.side) {
                player.currentIntent = this.intentForTeammateInPossession(player, ballOwner);

                return;
            }

            player.currentIntent = this.intentForOutOfPossession(player, ballOwner);
        });
    }

    private intentForPassReceiver(player: SimulatedPlayer, action: ActiveBallAction): PlayerIntent {
        return this.intent('receive_pass', this.clampPoint(action.target), {
            targetPlayerId: action.from.id,
            duration: Math.max(this.tickSeconds, (action.estimatedArrivalTime || this.state.time + 1) - this.state.time),
            urgency: action.targetKind === 'contest' ? 0.9 : 0.78,
            tacticalRisk: action.receiveDifficulty || 0.3,
        });
    }

    private intentForBallOwner(player: SimulatedPlayer): PlayerIntent {
        const goal = this.goalCenterAgainst(player.side);
        const distanceToGoal = this.distance(player, goal);

        const shootingRange = midfieldPositions.includes(player.role) ? 25 : 21;

        if (player.actionCooldown === 0 && distanceToGoal < shootingRange && this.random() < this.shootingIntentChance(player, distanceToGoal)) {
            return this.intent('shoot', goal, {
                duration: 1,
                urgency: 0.9,
                tacticalRisk: distanceToGoal > 24 ? 0.65 : 0.45,
            });
        }

        if (player.actionCooldown > 0) {
            return this.dribbleIntent(player);
        }

        const passTarget = this.selectPassTarget(player);
        const tempo = this.tactics(player.side).tempo / 100;

        if (player.actionCooldown === 0 && passTarget && this.random() < 0.12 + tempo * 0.22) {
            return this.intent('pass', {
                    x: passTarget.x,
                    y: passTarget.y,
                },
                {
                targetPlayerId: passTarget.id,
                    duration: 1,
                    urgency: 0.7,
                    tacticalRisk: this.distance(player, passTarget) > 25 ? 0.45 : 0.25,
                });
        }

        return this.dribbleIntent(player);
    }

    private dribbleIntent(player: SimulatedPlayer): PlayerIntent {
        const direction = this.attackDirection(player.side);
        const insideTarget = this.isWideCarrier(player) && this.hasOverlappingSupport(player);

        return this.intent('dribble', this.clampPoint({
                x: player.x + direction * 8,
                y: player.y + (pitch.width / 2 - player.y) * (insideTarget ? 0.55 : 0.2),
            }), {
            duration: 2,
            urgency: 0.62,
            tacticalRisk: 0.38,
        });
    }

    private intentForLooseBall(player: SimulatedPlayer): PlayerIntent {
        const distanceToBall = this.distance(player, this.state.ball);
        const closest = this.closestPlayerTo(player.side, this.state.ball);

        if (closest === player || distanceToBall < 8) {
            return this.intent('recover', {
                    x: this.state.ball.x,
                    y: this.state.ball.y,
                },
                {
                    duration: 1.5,
                    urgency: 0.85,
                    tacticalRisk: 0.25,
                });
        }

        return this.intent('recover_shape', { ...player.target }, {
            duration: 2,
            urgency: 0.5,
            tacticalRisk: 0.12,
        });
    }

    private intentForSecondBall(player: SimulatedPlayer): PlayerIntent {
        const secondBall = this.state.secondBall as SecondBallState;
        const distanceToBall = this.distance(player, secondBall);
        const closestTeamPlayer = this.closestPlayerTo(player.side, secondBall);
        const closestPlayer = this.closestPlayer(secondBall);
        const anticipation = player.attributes.anticipation / 20;
        const aggression = player.attributes.aggression / 20;
        const canContest = distanceToBall < 14 + (anticipation + aggression) * 3;

        if (closestTeamPlayer === player || (closestPlayer === player && canContest) || distanceToBall < 7) {
            return this.intent('attack_second_ball', {
                    x: secondBall.x,
                    y: secondBall.y,
                },
                {
                    duration: Math.max(this.tickSeconds, secondBall.expiresAt - this.state.time),
                    urgency: 0.82 + anticipation * 0.12,
                    tacticalRisk: 0.34,
                });
        }

        return this.intent('recover_shape', { ...player.target }, {
            duration: 1.5,
            urgency: 0.52,
            tacticalRisk: 0.14,
        });
    }

    private intentForTeammateInPossession(player: SimulatedPlayer, ballOwner: SimulatedPlayer): PlayerIntent {
        const distanceToBall = this.distance(player, ballOwner);
        const direction = this.attackDirection(player.side);
        const advancedBall = direction > 0 ? ballOwner.x > pitch.length * 0.56 : ballOwner.x < pitch.length * 0.44;

        if (this.isWideDefender(player) && distanceToBall < 34 && player.x * direction <= ballOwner.x * direction) {
            return this.intent('overlap', this.overlapTarget(player, ballOwner), {
                duration: 4,
                urgency: 0.76,
                tacticalRisk: 0.62,
            });
        }

        if (midfieldPositions.includes(player.role) && this.isWideCarrier(ballOwner) && advancedBall && distanceToBall < 30) {
            return this.intent('underlap', this.underlapTarget(player, ballOwner), {
                duration: 3.5,
                urgency: 0.72,
                tacticalRisk: 0.52,
            });
        }

        if (midfieldPositions.includes(player.role) && advancedBall) {
            return this.intent('attack_box', this.boxEntryTarget(player.side, player), {
                duration: 3,
                urgency: 0.72,
                tacticalRisk: 0.58,
            });
        }

        if (attackPositions.includes(player.role) && distanceToBall > 12) {
            return this.intent('make_forward_run', this.forwardRunTarget(player), {
                duration: 3,
                urgency: 0.78,
                tacticalRisk: 0.5,
            });
        }

        if (this.isWideAttacker(player)) {
            return this.intent('drift_wide', this.driftWideTarget(player), {
                duration: 3,
                urgency: 0.56,
                tacticalRisk: 0.34,
            });
        }

        if (distanceToBall < 28) {
            return this.intent('support_carrier', this.supportTarget(player, ballOwner), {
                duration: 2,
                urgency: 0.65,
                tacticalRisk: 0.26,
            });
        }

        return this.intent('drop_between_lines', this.betweenLinesTarget(player), {
            duration: 2.5,
            urgency: 0.45,
            tacticalRisk: 0.2,
        });
    }

    private intentForOutOfPossession(player: SimulatedPlayer, ballOwner: SimulatedPlayer): PlayerIntent {
        const tactics = this.tactics(player.side);
        const pressDistance = 8 + tactics.press * 0.18;

        if (this.distance(player, ballOwner) < pressDistance) {
            return this.intent('press', {
                    x: ballOwner.x,
                    y: ballOwner.y,
                }, {
                    duration: 1.5,
                    urgency: 0.82,
                    tacticalRisk: 0.4,
                });
        }

        if (defencePositions.includes(player.role) && this.distance(player, ballOwner) < 22) {
            return this.intent('track_runner', this.trackRunnerTarget(player, ballOwner), {
                duration: 2,
                urgency: 0.68,
                tacticalRisk: 0.22,
            });
        }

        if (midfieldPositions.includes(player.role)) {
            return this.intent('cover_passing_lane', this.coverLaneTarget(player, ballOwner), {
                duration: 2.5,
                urgency: 0.52,
                tacticalRisk: 0.18,
            });
        }

        return this.intent('hold_shape', { ...player.target }, {
            duration: 2,
            urgency: 0.35,
            tacticalRisk: 0.1,
        });
    }

    private resolveBallAction(): RealTimeMatchEvent[] {
        const owner = this.state.ball.owner;

        if (!owner || owner.actionCooldown > 0 || this.state.activeBallAction) {
            return [];
        }

        if (owner.currentIntent.type === 'pass' && owner.currentIntent.targetPlayerId) {
            const targetPlayer = this.playerById(owner.currentIntent.targetPlayerId);

            if (!targetPlayer) {
                return [];
            }

            return [this.startPass(owner, targetPlayer)];
        }

        if (owner.currentIntent.type === 'shoot') {
            return [this.startShot(owner)];
        }

        if (owner.currentIntent.type === 'dribble' && this.random() < 0.08) {
            owner.actionCooldown = 0.6;

            return [this.createEvent('dribble', owner, undefined, 'dribble_into_space')];
        }

        return [];
    }

    private startPass(owner: SimulatedPlayer, targetPlayer: SimulatedPlayer): RealTimeMatchEvent {
        const pressure = this.pressureAround(owner);
        const passDistance = this.distance(owner, targetPlayer);
        const quality = this.passQuality(owner, passDistance, pressure);
        const inaccurate = this.random() > quality;
        const route = this.passRoute(owner, targetPlayer);
        const speed = this.passSpeed(route, passDistance);
        const targetKind = this.passTargetKind(route, passDistance);
        const intendedTarget = this.passTargetPoint(owner, targetPlayer, route, speed);
        const miss = inaccurate ? this.randomPoint(2.5, this.passMissDistance(passDistance, route)) : { x: 0, y: 0 };
        const rawTarget = {
            x: intendedTarget.x + miss.x,
            y: intendedTarget.y + miss.y,
        };
        const target = inaccurate ? rawTarget : this.clampPassTarget(rawTarget);

        this.state.ball.owner = null;
        this.state.ball.x = owner.x;
        this.state.ball.y = owner.y;
        this.state.ball.velocity = this.velocityTowards(owner, target, speed);
        this.registerTouch(owner);
        this.state.activeBallAction = {
            type: 'pass',
            from: owner,
            teamSide: owner.side,
            origin: { x: owner.x, y: owner.y },
            target,
            targetPlayer,
            inaccurate,
            quality,
            estimatedArrivalTime: this.state.time + this.distance(owner, target) / speed,
            passSpeed: speed,
            receiveDifficulty: this.receiveDifficulty(owner, targetPlayer, passDistance, pressure, route, targetKind),
            targetKind,
            route,
        };
        this.state.secondBall = null;
        this.recordPassAttempt(route, target);
        targetPlayer.currentIntent = this.intentForPassReceiver(targetPlayer, this.state.activeBallAction);
        owner.actionCooldown = 0.7 + (1 - this.tactics(owner.side).tempo / 100) * 0.8;

        return this.createEvent('pass', owner, targetPlayer, inaccurate ? `${route}_inaccurate` : route);
    }

    private startShot(owner: SimulatedPlayer): RealTimeMatchEvent {
        const goal = this.goalCenterAgainst(owner.side);
        const distanceToGoal = this.distance(owner, goal);
        const route = this.shotRoute(owner, distanceToGoal);
        const quality = this.shotQuality(owner, distanceToGoal, route);
        const target = {
            x: goal.x,
            y: goal.y + (this.random() - 0.5) * pitch.goalWidth * 3.2 * (1.08 - quality),
        };

        this.state.possession.activeAttackPattern = this.attackPatternFromShotRoute(route);
        this.state.ball.owner = null;
        this.state.ball.x = owner.x;
        this.state.ball.y = owner.y;
        this.state.ball.velocity = this.velocityTowards(owner, target, 34);
        this.registerTouch(owner);
        this.state.activeBallAction = {
            type: 'shot',
            from: owner,
            teamSide: owner.side,
            origin: { x: owner.x, y: owner.y },
            target,
            inaccurate: quality < this.random(),
            quality,
            chanceQuality: quality,
            route,
        };
        this.state.secondBall = null;
        owner.actionCooldown = 1.8;

        return this.createEvent('shot', owner, undefined, route, {
            chanceQuality: quality,
        });
    }

    private movePlayersAndBall(): void {
        this.state.players.forEach((player) => {
            const intentTarget = player.currentIntent.target;
            const speed = this.playerSpeed(player);

            this.moveTowards(player, intentTarget, speed * this.tickSeconds);
            this.updateStamina(player);
        });

        if (this.state.ball.owner) {
            this.state.ball.x = this.state.ball.owner.x;
            this.state.ball.y = this.state.ball.owner.y;
            this.state.ball.velocity = { x: 0, y: 0 };
            this.state.secondBall = null;
            this.registerTouch(this.state.ball.owner);

            return;
        }

        this.state.ball.x += this.state.ball.velocity.x * this.tickSeconds;
        this.state.ball.y += this.state.ball.velocity.y * this.tickSeconds;

        const friction = this.state.secondBall ? 0.9 : 0.985;
        this.state.ball.velocity.x *= friction;
        this.state.ball.velocity.y *= friction;

        if (this.state.secondBall) {
            this.state.secondBall.x = this.state.ball.x;
            this.state.secondBall.y = this.state.ball.y;

            if (this.state.time >= this.state.secondBall.expiresAt) {
                this.state.secondBall = null;
            }
        }
    }

    private detectEvents(): RealTimeMatchEvent[] {
        if (this.state.activeBallAction?.type === 'shot') {
            return this.detectShotOutcome(this.state.activeBallAction);
        }

        if (this.state.activeBallAction?.type === 'pass') {
            const passEvents = this.detectPassOutcome(this.state.activeBallAction);

            if (passEvents.length) {
                return passEvents;
            }
        }

        const ballOutEvent = this.detectBallOut();

        if (ballOutEvent) {
            return [ballOutEvent];
        }

        if (this.state.ball.owner) {
            return this.detectTackleOrFoul(this.state.ball.owner);
        }

        if (!this.state.activeBallAction) {
            return this.detectLooseBallRecovery();
        }

        return [];
    }

    private detectTackleOrFoul(owner: SimulatedPlayer): RealTimeMatchEvent[] {
        const defender = this.nearestOpponent(owner.side, owner);
        const penaltyAreaChallenge = defender ? this.isPenaltyFoul(defender.side, owner) : false;
        const challengeRadius = penaltyAreaChallenge ? 1.2 : 1.4;

        if (!defender || this.distance(owner, defender) > challengeRadius) {
            return [];
        }

        if (defender.actionCooldown > 0) {
            return [];
        }

        const challengeEvent = this.createEvent('challenge', defender, owner, 'standing_tackle');
        const tackleChance = this.clamp(
            0.04 + defender.attributes.tackling / 20 * 0.08 - owner.attributes.dribbling / 20 * 0.06 - defender.injuryPerformancePenalty * 0.04,
            0.01,
            0.12,
        );
        const baseFoulChance = this.clamp(
            0.002
            + defender.attributes.aggression / 20 * 0.008
            + this.state.referee.strictness / 100 * 0.006
            + defender.tackleTimingRisk * 0.005,
            0.001,
            0.012,
        );
        const foulChance = penaltyAreaChallenge
            ? baseFoulChance * 0.18
            : baseFoulChance;
        defender.actionCooldown = 0.55;

        if (this.random() < foulChance) {
            this.state.ball.velocity = { x: 0, y: 0 };

            return [challengeEvent, ...this.resolveFoul(defender, owner)];
        }

        if (this.random() < tackleChance) {
            this.state.ball.owner = defender;
            this.state.secondBall = null;
            defender.actionCooldown = 0.7;
            this.registerTouch(defender);

            return [challengeEvent, this.createEvent('tackle', defender, owner)];
        }

        return [challengeEvent];
    }

    private resolveFoul(defender: SimulatedPlayer, fouledPlayer: SimulatedPlayer): RealTimeMatchEvent[] {
        defender.foulsCommitted += 1;
        fouledPlayer.foulsSuffered += 1;
        this.state.ball.owner = null;
        this.state.activeBallAction = null;

        const events = [
            this.createEvent('foul', defender, fouledPlayer, 'late_challenge'),
            ...this.bookingEvents(defender, fouledPlayer),
            ...this.injuryEvents(fouledPlayer, 'heavy_challenge'),
        ];

        if (this.shouldPlayAdvantage(defender, fouledPlayer)) {
            this.state.ball.owner = fouledPlayer;
            this.state.ball.velocity = { x: 0, y: 0 };
            this.state.secondBall = null;
            this.registerTouch(fouledPlayer);

            return [
                ...events,
                this.createEvent('advantage', fouledPlayer, defender, 'advantage_played'),
            ];
        }

        const restartEvent = this.prepareFoulRestart(defender, fouledPlayer);

        return [...events, restartEvent];
    }

    private shouldPlayAdvantage(defender: SimulatedPlayer, fouledPlayer: SimulatedPlayer): boolean {
        if (fouledPlayer.injurySeverity === 'forced' || defender.redCard) {
            return false;
        }

        const direction = this.attackDirection(fouledPlayer.side);
        const attackingProgress = (fouledPlayer.x - pitch.length / 2) * direction;
        const nearbySupport = this.playersForSide(fouledPlayer.side)
            .some((player) => player !== fouledPlayer && this.distance(player, fouledPlayer) < 12);

        return attackingProgress > 24
            && nearbySupport
            && this.state.referee.advantagePatience >= 40
            && !this.isPenaltyFoul(defender.side, fouledPlayer);
    }

    private bookingEvents(defender: SimulatedPlayer, fouledPlayer: SimulatedPlayer): RealTimeMatchEvent[] {
        const repeatedFoulRisk = defender.foulsCommitted >= 3 ? 0.18 : defender.foulsCommitted >= 2 ? 0.08 : 0;
        const tacticalFoulRisk = this.attackDirection(fouledPlayer.side) * (fouledPlayer.x - defender.x) > 0 ? 0.08 : 0;
        const bookingChance = this.clamp(
            0.04
            + this.state.referee.strictness / 100 * 0.12
            + defender.aggressionRisk * 0.1
            + defender.tackleTimingRisk * 0.08
            + repeatedFoulRisk
            + tacticalFoulRisk
            - this.state.referee.bookingThreshold / 100 * 0.08,
            0.02,
            0.72,
        );

        if (this.random() >= bookingChance) {
            return [];
        }

        defender.yellowCards += 1;
        const yellowCard = this.createEvent('yellow_card', defender, fouledPlayer, defender.yellowCards > 1 ? 'second_yellow' : 'reckless_tackle');

        if (defender.yellowCards < 2) {
            return [yellowCard];
        }

        this.applyRedCard(defender);

        return [
            yellowCard,
            this.createEvent('red_card', defender, fouledPlayer, 'second_yellow'),
        ];
    }

    private injuryEvents(player: SimulatedPlayer, cause: string): RealTimeMatchEvent[] {
        const fatigueRisk = (100 - player.stamina) / 100 * 0.05;
        const challengeRisk = cause === 'heavy_challenge' ? 0.035 : 0.01;
        const injuryChance = this.clamp(0.006 + fatigueRisk + challengeRisk - player.attributes.naturalFitness / 20 * 0.02, 0.003, 0.18);

        if (this.random() >= injuryChance) {
            return [];
        }

        const severityRoll = this.random();
        const severity = severityRoll < 0.22 ? 'forced' : severityRoll < 0.58 ? 'minor' : 'knock';

        player.injurySeverity = severity;
        player.injuryPerformancePenalty = severity === 'forced' ? 0.45 : severity === 'minor' ? 0.18 : 0.08;

        const events = [
            this.createEvent('injury', player, undefined, severity),
        ];

        if (severity === 'forced') {
            const substitution = this.performSubstitution(player, 'forced_injury', false);

            if (substitution) {
                events.push(substitution);
            }
        }

        return events;
    }

    private prepareFoulRestart(defender: SimulatedPlayer, fouledPlayer: SimulatedPlayer): RealTimeMatchEvent {
        const position = this.clampPoint({
            x: this.state.ball.x,
            y: this.state.ball.y,
        });

        if (this.isPenaltyFoul(defender.side, position)) {
            return this.prepareRestart('penalty', fouledPlayer.side, this.penaltySpotFor(fouledPlayer.side), 'penalty_foul');
        }

        return this.prepareRestart('free_kick', fouledPlayer.side, position, 'foul');
    }

    private applyRedCard(player: SimulatedPlayer): void {
        player.redCard = true;
        player.onPitch = false;
        this.state.players = this.state.players.filter((candidate) => candidate !== player);
        this.state.tactics[player.side] = {
            ...this.state.tactics[player.side],
            press: this.clamp(this.state.tactics[player.side].press - 12, 0, 100),
            tempo: this.clamp(this.state.tactics[player.side].tempo - 8, 0, 100),
            mentality: 'defensive',
        };

        if (this.state.ball.owner === player) {
            this.state.ball.owner = null;
        }
    }

    private detectSubstitutionEvents(): RealTimeMatchEvent[] {
        for (const side of ['home', 'away'] as TeamSide[]) {
            if (this.state.substitutionsUsed[side] >= 5 || !this.state.bench[side].length) {
                continue;
            }

            const candidate = this.substitutionCandidate(side);

            if (!candidate) {
                continue;
            }

            const substitution = this.performSubstitution(candidate.player, candidate.reason, true);

            return substitution ? [substitution] : [];
        }

        return [];
    }

    private substitutionCandidate(side: TeamSide): { player: SimulatedPlayer, reason: string } | null {
        const minute = this.state.time / 60;
        const players = this.playersForSide(side);
        const forcedInjury = players.find((player) => player.injurySeverity === 'forced');

        if (forcedInjury) {
            return {
                player: forcedInjury,
                reason: 'forced_injury',
            };
        }

        const exhausted = players
            .filter((player) => minute >= 60 && player.stamina < 42)
            .sort((a, b) => a.stamina - b.stamina)[0];

        if (exhausted) {
            return {
                player: exhausted,
                reason: 'exhausted',
            };
        }

        const bookedDefender = players
            .filter((player) => minute >= 55 && player.yellowCards > 0 && defencePositions.includes(player.role))
            .sort((a, b) => this.pressureAround(b) - this.pressureAround(a))[0];

        if (bookedDefender && this.pressureAround(bookedDefender) > 0.25) {
            return {
                player: bookedDefender,
                reason: 'booked_defender_under_pressure',
            };
        }

        const score = this.state.score[side] - this.state.score[this.oppositeSide(side)];
        const quietForward = players
            .filter((player) => minute >= 70 && score < 0 && attackPositions.includes(player.role))
            .sort((a, b) => a.stamina - b.stamina)[0];

        if (quietForward) {
            return {
                player: quietForward,
                reason: 'chasing_goal',
            };
        }

        return null;
    }

    private performSubstitution(
        outgoing: SimulatedPlayer,
        reason: string,
        setPhase: boolean,
    ): RealTimeMatchEvent | null {
        const bench = this.state.bench[outgoing.side];
        const replacement = this.selectSubstituteFor(outgoing);

        if (!replacement || this.state.substitutionsUsed[outgoing.side] >= 5) {
            return null;
        }

        this.state.bench[outgoing.side] = bench.filter((player) => player !== replacement);
        this.state.substitutionsUsed[outgoing.side] += 1;
        outgoing.onPitch = false;
        replacement.onPitch = true;
        replacement.role = outgoing.role;
        replacement.x = outgoing.x;
        replacement.y = outgoing.y;
        replacement.target = { ...outgoing.target };
        replacement.currentIntent = this.intent('hold_shape', { ...outgoing.target }, {
            duration: 2,
            urgency: 0.5,
            tacticalRisk: 0.1,
        });
        replacement.actionCooldown = 1;

        const outgoingIndex = this.state.players.indexOf(outgoing);

        if (outgoingIndex >= 0) {
            this.state.players.splice(outgoingIndex, 1, replacement);
        } else {
            this.state.players.push(replacement);
        }

        if (this.state.ball.owner === outgoing) {
            this.state.ball.owner = replacement;
            this.registerTouch(replacement);
        }

        if (setPhase) {
            this.state.phase = 'substitution';
            this.nextPhaseAfterSnapshot = 'open_play';
        }

        return this.createEvent('substitution', replacement, outgoing, reason);
    }

    private selectSubstituteFor(outgoing: SimulatedPlayer): SimulatedPlayer | null {
        const bench = this.state.bench[outgoing.side];
        const roleScore = (player: SimulatedPlayer): number => {
            if (player.role === outgoing.role) {
                return 0;
            }

            if (outgoing.role === Position.GK) {
                return player.role === Position.GK ? 1 : 50;
            }

            if (defencePositions.includes(outgoing.role)) {
                return defencePositions.includes(player.role) ? 2 : 20;
            }

            if (midfieldPositions.includes(outgoing.role)) {
                return midfieldPositions.includes(player.role) ? 2 : 16;
            }

            if (attackPositions.includes(outgoing.role)) {
                return attackPositions.includes(player.role) ? 2 : 18;
            }

            return 10;
        };

        return bench
            .slice()
            .sort((a, b) => {
                const aScore = roleScore(a) - a.stamina / 100;
                const bScore = roleScore(b) - b.stamina / 100;

                return aScore - bScore;
            })[0] || null;
    }

    private isPenaltyFoul(defendingSide: TeamSide, position: Vector2): boolean {
        const ownGoal = this.goalCenterAgainst(this.oppositeSide(defendingSide));
        const depth = 14 + (100 - this.state.referee.penaltyThreshold) / 100 * 4;
        const inPenaltyDepth = ownGoal.x === 0
            ? position.x <= depth
            : position.x >= pitch.length - depth;
        const inPenaltyWidth = Math.abs(position.y - pitch.width / 2) <= 20.16;

        return inPenaltyDepth && inPenaltyWidth;
    }

    private ballIsInPenaltyArea(defendingSide: TeamSide, position: Vector2): boolean {
        const ownGoal = this.goalCenterAgainst(this.oppositeSide(defendingSide));
        const inPenaltyDepth = ownGoal.x === 0
            ? position.x <= 18
            : position.x >= pitch.length - 18;
        const inPenaltyWidth = Math.abs(position.y - pitch.width / 2) <= 22;

        return inPenaltyDepth && inPenaltyWidth;
    }

    private penaltySpotFor(side: TeamSide): Vector2 {
        const goal = this.goalCenterAgainst(side);
        const direction = this.attackDirection(side);

        return {
            x: goal.x - direction * 11,
            y: pitch.width / 2,
        };
    }

    private detectLooseBallRecovery(): RealTimeMatchEvent[] {
        const player = this.closestPlayer({ x: this.state.ball.x, y: this.state.ball.y });
        const recoveryRadius = this.state.secondBall ? 2.2 : 1.6;

        if (!player || this.distance(player, this.state.ball) > recoveryRadius) {
            return [];
        }

        const secondBall = this.state.secondBall;

        this.state.ball.owner = player;
        this.state.ball.velocity = { x: 0, y: 0 };
        this.state.secondBall = null;
        player.actionCooldown = secondBall ? 0.42 : 0.35;
        this.registerTouch(player);

        if (secondBall) {
            this.recordSecondBallRecovery(secondBall.source);
        }

        return [this.createEvent('recovery', player)];
    }

    private detectPassOutcome(action: ActiveBallAction): RealTimeMatchEvent[] {
        const goalkeeperEvent = this.detectGoalkeeperSetPieceAction(action);

        if (goalkeeperEvent) {
            return [goalkeeperEvent];
        }

        const sweepEvent = this.detectGoalkeeperSweep(action);

        if (sweepEvent) {
            return [sweepEvent];
        }

        const aerialDuelEvent = this.detectAerialDuel(action);

        if (aerialDuelEvent) {
            return [aerialDuelEvent];
        }

        if (this.ballOutsidePitch() && this.random() < this.keepOverhitPassInPlayChance(action)) {
            return [this.createSecondBall(action, 'overhit_pass_second_ball')];
        }

        const interceptor = this.playersAgainst(action.teamSide)
            .filter((player) => this.distance(player, this.state.ball) < 1.8)
            .sort((a, b) => this.distance(a, this.state.ball) - this.distance(b, this.state.ball))[0];

        if (interceptor && (action.inaccurate || this.random() < this.interceptionChance(interceptor, action))) {
            if (['cross', 'cutback'].includes(action.route || '') && this.fieldZonesFor(action.teamSide, this.state.ball).includes('final_third')) {
                this.registerTouch(interceptor);

                if (this.random() < 0.34) {
                    return [this.prepareRestart('corner', action.teamSide, {
                        x: this.goalCenterAgainst(action.teamSide).x,
                        y: this.state.ball.y < pitch.width / 2 ? 0 : pitch.width,
                    }, 'goal_line')];
                }

                return [this.createSecondBall(action, 'blocked_cross_second_ball')];
            }

            this.state.ball.owner = interceptor;
            this.state.ball.velocity = { x: 0, y: 0 };
            this.state.activeBallAction = null;
            this.state.secondBall = null;
            interceptor.actionCooldown = 0.75;
            this.registerTouch(interceptor);

            return [this.createEvent('interception', interceptor, action.from)];
        }

        if (action.targetPlayer && this.distance(action.targetPlayer, this.state.ball) < this.receiveZone(action)) {
            return this.resolveFirstTouch(action);
        }

        if (this.distance(this.state.ball, action.target) < this.passTargetZone(action) || this.ballIsSlow()) {
            return [this.createSecondBall(action, action.inaccurate ? 'misplaced_pass' : 'heavy_pass')];
        }

        return [];
    }

    private resolveFirstTouch(action: ActiveBallAction): RealTimeMatchEvent[] {
        const receiver = action.targetPlayer as SimulatedPlayer;
        const pressure = this.pressureAround(receiver);
        const firstTouchChance = this.firstTouchChance(receiver, action, pressure);
        const roll = this.random();

        if (roll < firstTouchChance) {
            this.state.ball.owner = receiver;
            this.state.ball.x = receiver.x;
            this.state.ball.y = receiver.y;
            this.state.ball.velocity = { x: 0, y: 0 };
            this.state.activeBallAction = null;
            this.state.secondBall = null;
            receiver.actionCooldown = roll < firstTouchChance * 0.82 ? 0.18 : 0.45;
            this.registerTouch(receiver);
            this.recordSuccessfulPass(action.route || 'open_play', receiver);

            return [this.createEvent('receive', receiver, action.from, roll < firstTouchChance * 0.82 ? 'clean_receive' : 'heavy_touch_retained')];
        }

        const opponent = this.nearestOpponent(action.teamSide, receiver);
        const interceptionWindow = opponent && this.distance(opponent, receiver) < 3.2;
        const interceptionChance = opponent
            ? this.clamp(0.12 + this.interceptionChance(opponent, action) * 0.45 + pressure * 0.24, 0.12, 0.68)
            : 0;

        if (opponent && interceptionWindow && this.random() < interceptionChance) {
            this.state.ball.owner = opponent;
            this.state.ball.x = opponent.x;
            this.state.ball.y = opponent.y;
            this.state.ball.velocity = { x: 0, y: 0 };
            this.state.activeBallAction = null;
            this.state.secondBall = null;
            opponent.actionCooldown = 0.75;
            this.registerTouch(opponent);

            return [this.createEvent('interception', opponent, action.from, 'poor_first_touch')];
        }

        return [this.createSecondBall(action, 'loose_first_touch')];
    }

    private firstTouchChance(receiver: SimulatedPlayer, action: ActiveBallAction, pressure: number): number {
        const firstTouch = receiver.attributes.firstTouch / 20;
        const composure = receiver.attributes.composure / 20;
        const technique = receiver.attributes.technique / 20;
        const passSpeed = (action.passSpeed || 24) / 34;
        const receiveDifficulty = action.receiveDifficulty || 0.35;
        const targetKindPenalty = action.targetKind === 'contest' ? 0.18 : action.targetKind === 'space' ? 0.08 : 0;
        const distanceMoved = this.distance(receiver, action.target);

        return this.clamp(
            0.62
            + action.quality * 0.26
            + firstTouch * 0.18
            + composure * 0.12
            + technique * 0.08
            - pressure * 0.14
            - receiveDifficulty * 0.12
            - passSpeed * 0.04
            - targetKindPenalty
            - distanceMoved / 100,
            0.4,
            0.96,
        );
    }

    private createSecondBall(action: ActiveBallAction, outcome: string): RealTimeMatchEvent {
        const point = this.secondBallPoint(action);

        if (this.shouldSecondBallRunOut(action, point)) {
            this.state.activeBallAction = null;
            this.state.secondBall = null;
            this.state.ball.owner = null;
            this.state.ball.x = point.x;
            this.state.ball.y = point.y < pitch.width / 2 ? -0.1 : pitch.width + 0.1;
            this.state.ball.velocity = { x: 0, y: 0 };

            return this.prepareRestart('throw_in', this.oppositeSide(action.teamSide), {
                x: this.clamp(point.x, 0, pitch.length),
                y: point.y < pitch.width / 2 ? 0 : pitch.width,
            }, 'touchline');
        }

        const speed = action.targetKind === 'contest' ? 2.2 : 1.2;
        const center = { x: point.x, y: pitch.width / 2 };

        this.state.ball.owner = null;
        this.state.ball.x = point.x;
        this.state.ball.y = point.y;
        this.state.ball.velocity = this.velocityTowards(point, center, 0.2 + this.random() * speed);
        this.state.activeBallAction = null;
        this.state.secondBall = {
            x: point.x,
            y: point.y,
            expiresAt: this.state.time + (action.targetKind === 'contest' ? 5 : 4),
            teamSide: action.teamSide,
            sourcePlayerId: action.from.id,
            source: 'second_ball',
        };

        return this.createEvent('second_ball', action.targetPlayer || action.from, action.from, outcome);
    }

    private shouldSecondBallRunOut(action: ActiveBallAction, point: Vector2): boolean {
        if (!action.inaccurate) {
            return false;
        }

        if (point.y < 22 || point.y > pitch.width - 22) {
            return this.random() < 0.24;
        }

        return this.random() < 0.045;
    }

    private secondBallPoint(action: ActiveBallAction): Vector2 {
        const origin = action.origin || action.from;
        const target = this.clampPassTarget(action.target);
        const nearLine = target.x < 5 || target.x > pitch.length - 5 || target.y < 5 || target.y > pitch.width - 5;

        if (nearLine && action.inaccurate && this.distance(origin, target) > 24) {
            return this.clampPassTarget(target);
        }

        return this.clampPassTarget({
            x: target.x,
            y: target.y,
        });
    }

    private receiveZone(action: ActiveBallAction): number {
        const difficulty = action.receiveDifficulty || 0.35;
        const base = action.targetKind === 'feet' ? 2.1 : action.targetKind === 'space' ? 2.6 : 3;

        return this.clamp(base - difficulty * 0.45 + action.quality * 0.35, 1.7, 3.2);
    }

    private passTargetZone(action: ActiveBallAction): number {
        if (action.targetKind === 'contest') {
            return 3.4;
        }

        return action.inaccurate ? 2.8 : 2.2;
    }

    private keepOverhitPassInPlayChance(action: ActiveBallAction): number {
        if (action.targetKind === 'contest') {
            return 0.65;
        }

        if (action.inaccurate) {
            return 0.74;
        }

        return 0.9;
    }

    private detectGoalkeeperSetPieceAction(action: ActiveBallAction): RealTimeMatchEvent | null {
        if (!['corner', 'cross', 'cutback'].includes(action.restartType || action.route || '')) {
            return null;
        }

        const goalkeeper = this.goalkeeperFor(this.oppositeSide(action.teamSide));

        if (!goalkeeper || this.distance(goalkeeper, this.state.ball) > 13 || !this.ballIsInPenaltyArea(goalkeeper.side, this.state.ball)) {
            return null;
        }

        const claimChance = this.clamp(
            0.18
            + goalkeeper.attributes.aerialReach / 20 * 0.18
            + goalkeeper.attributes.commandOfArea / 20 * 0.16
            + goalkeeper.attributes.handling / 20 * 0.12
            - action.quality * 0.08,
            0.16,
            0.68,
        );
        const roll = this.random();

        this.state.activeBallAction = null;

        if (roll < claimChance) {
            this.state.ball.owner = goalkeeper;
            this.state.ball.x = goalkeeper.x;
            this.state.ball.y = goalkeeper.y;
            this.state.ball.velocity = { x: 0, y: 0 };
            this.state.secondBall = null;
            goalkeeper.actionCooldown = 1;
            this.registerTouch(goalkeeper);

            return this.createEvent('goalkeeper_claim', goalkeeper, action.from, action.restartType || action.route);
        }

        if (roll < claimChance + goalkeeper.attributes.tendencyToPunch / 20 * 0.22) {
            this.state.ball.owner = null;
            this.state.ball.velocity = {
                x: -this.attackDirection(action.teamSide) * (10 + this.random() * 8),
                y: (this.random() - 0.5) * 12,
            };
            this.state.secondBall = null;
            this.registerTouch(goalkeeper);

            return this.createEvent('goalkeeper_punch', goalkeeper, action.from, action.restartType || action.route);
        }

        this.state.activeBallAction = action;

        return null;
    }

    private detectGoalkeeperSweep(action: ActiveBallAction): RealTimeMatchEvent | null {
        if (action.route !== 'through_ball') {
            return null;
        }

        const goalkeeper = this.goalkeeperFor(this.oppositeSide(action.teamSide));

        if (!goalkeeper || this.distance(goalkeeper, this.state.ball) > 11) {
            return null;
        }

        const targetGoal = this.goalCenterAgainst(action.teamSide);

        if (this.distance(this.state.ball, targetGoal) > 24) {
            return null;
        }

        const sweepChance = this.clamp(
            0.18
            + goalkeeper.attributes.rushingOut / 20 * 0.24
            + goalkeeper.attributes.oneOnOnes / 20 * 0.12
            - action.quality * 0.12,
            0.12,
            0.58,
        );

        if (this.random() >= sweepChance) {
            return null;
        }

        this.state.ball.owner = goalkeeper;
        this.state.ball.x = goalkeeper.x;
        this.state.ball.y = goalkeeper.y;
        this.state.ball.velocity = { x: 0, y: 0 };
        this.state.activeBallAction = null;
        this.state.secondBall = null;
        goalkeeper.actionCooldown = 0.9;
        this.registerTouch(goalkeeper);

        return this.createEvent('goalkeeper_claim', goalkeeper, action.from, 'sweeper_keeper');
    }

    private detectAerialDuel(action: ActiveBallAction): RealTimeMatchEvent | null {
        if (action.restartType !== 'goal_kick' || action.route !== 'long_kick' || !action.targetPlayer) {
            return null;
        }

        if (this.distance(action.targetPlayer, this.state.ball) > 2.4) {
            return null;
        }

        const opponent = this.nearestOpponent(action.teamSide, action.targetPlayer);

        if (!opponent || this.distance(opponent, action.targetPlayer) > 5) {
            return null;
        }

        const targetScore = action.targetPlayer.attributes.heading + action.targetPlayer.attributes.jumpingReach + action.targetPlayer.attributes.strength;
        const opponentScore = opponent.attributes.heading + opponent.attributes.jumpingReach + opponent.attributes.strength;
        const winChance = this.clamp(0.5 + (targetScore - opponentScore) / 120, 0.25, 0.75);
        const roll = this.random();

        this.state.activeBallAction = null;
        this.state.ball.velocity = { x: 0, y: 0 };

        if (roll < winChance) {
            this.state.ball.owner = action.targetPlayer;
            this.state.secondBall = null;
            action.targetPlayer.actionCooldown = 0.8;
            this.registerTouch(action.targetPlayer);

            return this.createEvent('aerial_duel', action.targetPlayer, opponent, 'attacker_wins');
        }

        if (roll > 0.92) {
            this.state.ball.owner = null;
            this.state.ball.velocity = this.randomPoint(3, 8);
            this.state.secondBall = {
                x: this.state.ball.x,
                y: this.state.ball.y,
                expiresAt: this.state.time + 5,
                teamSide: action.teamSide,
                sourcePlayerId: action.from.id,
                source: 'second_ball',
            };

            return this.createEvent('aerial_duel', action.targetPlayer, opponent, 'loose_second_ball');
        }

        this.state.ball.owner = opponent;
        this.state.secondBall = null;
        opponent.actionCooldown = 0.8;
        this.registerTouch(opponent);

        return this.createEvent('aerial_duel', opponent, action.targetPlayer, 'defender_wins');
    }

    private detectShotOutcome(action: ActiveBallAction): RealTimeMatchEvent[] {
        const blockEvent = this.detectShotBlock(action);

        if (blockEvent) {
            return [blockEvent];
        }

        const attackingDirection = this.attackDirection(action.teamSide);
        const crossedGoalLine = attackingDirection > 0
            ? this.state.ball.x >= pitch.length
            : this.state.ball.x <= 0;

        if (!crossedGoalLine) {
            return [];
        }

        const goalY = pitch.width / 2;
        const inGoalFrame = Math.abs(this.state.ball.y - goalY) <= pitch.goalWidth / 2;
        const goalkeeper = this.goalkeeperFor(this.oppositeSide(action.teamSide));
        const goalkeeperQuality = goalkeeper ? goalkeeper.player.ratingAverage() / 20 : 0.55;
        const saveChance = this.clamp(0.48 + goalkeeperQuality * 0.34 - action.quality * 0.28, 0.34, 0.82);

        if (inGoalFrame && this.random() > saveChance) {
            this.state.score[action.teamSide] += 1;
            this.state.ball.velocity = { x: 0, y: 0 };
            this.state.activeBallAction = null;

            const goalEvent = this.createEvent('goal', action.from, undefined, `${action.route || 'open_play'}_goal`, {
                chanceQuality: action.chanceQuality || action.quality,
            });
            goalEvent.replayWindow = this.replayWindowForGoal();
            this.resetForKickoff(this.oppositeSide(action.teamSide));
            this.state.phase = 'kickoff';
            this.nextPhaseAfterSnapshot = 'open_play';
            const kickoffEvent = this.createEvent('kickoff', this.state.ball.owner || undefined);

            return [goalEvent, kickoffEvent];
        }

        this.state.ball.velocity = { x: 0, y: 0 };
        this.state.activeBallAction = null;

        if (inGoalFrame && goalkeeper) {
            const spill = this.random() < 0.18;
            const closeDown = this.distance(action.from, goalkeeper) < 16;

            if (spill) {
                this.state.ball.owner = null;
                this.state.ball.x = this.clamp(goalkeeper.x + this.attackDirection(action.teamSide) * -2, 0, pitch.length);
                this.state.ball.y = this.clamp(goalkeeper.y + (this.random() - 0.5) * 7, 0, pitch.width);
                this.state.ball.velocity = { x: 0, y: 0 };
                this.state.secondBall = {
                    x: this.state.ball.x,
                    y: this.state.ball.y,
                    expiresAt: this.state.time + 4,
                    teamSide: action.teamSide,
                    sourcePlayerId: action.from.id,
                    source: 'rebound',
                };
                this.registerTouch(goalkeeper);

                return [this.createEvent('save', goalkeeper, action.from, 'goalkeeper_spill', {
                    chanceQuality: action.chanceQuality || action.quality,
                })];
            }

            this.state.ball.owner = goalkeeper;
            this.state.ball.x = goalkeeper.x;
            this.state.ball.y = goalkeeper.y;
            this.state.secondBall = null;
            goalkeeper.actionCooldown = 1;
            this.registerTouch(goalkeeper);

            return [this.createEvent('save', goalkeeper, action.from, closeDown ? 'close_down_one_v_one' : 'positioned_save', {
                chanceQuality: action.chanceQuality || action.quality,
            })];
        }

        if (!inGoalFrame && this.random() < 0.16) {
            const missEvent = this.createEvent('miss', action.from, undefined, `${action.route || 'open_play'}_deflected_behind`, {
                chanceQuality: action.chanceQuality || action.quality,
            });
            const restartEvent = this.prepareRestart('corner', action.teamSide, {
                x: this.goalCenterAgainst(action.teamSide).x,
                y: this.state.ball.y < pitch.width / 2 ? 0 : pitch.width,
            }, 'goal_line');

            return [missEvent, restartEvent];
        }

        const missEvent = this.createEvent('miss', action.from, undefined, `${action.route || 'open_play'}_miss`, {
            chanceQuality: action.chanceQuality || action.quality,
        });
        const restartEvent = this.prepareGoalLineRestart(action.teamSide);

        return [missEvent, restartEvent];
    }

    private detectShotBlock(action: ActiveBallAction): RealTimeMatchEvent | null {
        const blocker = this.playersAgainst(action.teamSide)
            .filter((player) => player.role !== Position.GK && this.distance(player, this.state.ball) < 1.6)
            .sort((a, b) => this.distance(a, this.state.ball) - this.distance(b, this.state.ball))[0];

        if (!blocker) {
            return null;
        }

        const blockChance = this.clamp(0.18 + blocker.attributes.bravery / 20 * 0.16 + blocker.attributes.positioning / 20 * 0.16 - action.quality * 0.18, 0.12, 0.55);

        if (this.random() >= blockChance) {
            return null;
        }

        this.state.ball.owner = null;
        this.state.ball.velocity = this.randomPoint(5, 12);
        this.state.activeBallAction = null;
        this.registerTouch(blocker);

        return this.createEvent('blocked_shot', blocker, action.from, action.route || 'shot_block', {
            chanceQuality: action.chanceQuality || action.quality,
        });
    }

    private snapshot(events: RealTimeMatchEvent[]): MatchSnapshot {
        return {
            time: this.state.time,
            period: this.state.period,
            phase: this.state.phase,
            addedTime: { ...this.state.addedTime },
            score: { ...this.state.score },
            ball: {
                x: this.round(this.state.ball.x),
                y: this.round(this.state.ball.y),
                velocity: {
                    x: this.round(this.state.ball.velocity.x),
                    y: this.round(this.state.ball.velocity.y),
                },
                ownerId: this.state.ball.owner?.id || null,
            },
            activePassTarget: this.state.activeBallAction?.type === 'pass'
                ? {
                    x: this.round(this.state.activeBallAction.target.x),
                    y: this.round(this.state.activeBallAction.target.y),
                }
                : null,
            activeShot: this.state.activeBallAction?.type === 'shot'
                ? {
                    route: this.state.activeBallAction.route || 'open_play',
                    chanceQuality: this.round(this.state.activeBallAction.chanceQuality || this.state.activeBallAction.quality),
                    target: {
                        x: this.round(this.state.activeBallAction.target.x),
                        y: this.round(this.state.activeBallAction.target.y),
                    },
                }
                : null,
            secondBall: this.state.secondBall
                ? {
                    x: this.round(this.state.secondBall.x),
                    y: this.round(this.state.secondBall.y),
                    expiresAt: this.roundTime(this.state.secondBall.expiresAt),
                    source: this.state.secondBall.source,
                }
                : null,
            possession: this.possessionSnapshot(),
            fieldZones: [...this.state.possession.currentFieldZones],
            activeAttackPattern: this.state.possession.activeAttackPattern,
            players: this.state.players.map((player) => ({
                id: player.id,
                teamSide: player.side,
                role: player.role,
                roleName: Position[player.role],
                playerName: player.player.info.name,
                playerNumber: player.player.info.number,
                x: this.round(player.x),
                y: this.round(player.y),
                stamina: this.round(player.stamina),
                foulsCommitted: player.foulsCommitted,
                foulsSuffered: player.foulsSuffered,
                yellowCards: player.yellowCards,
                redCard: player.redCard,
                injurySeverity: player.injurySeverity,
                currentIntent: {
                    ...player.currentIntent,
                    target: {
                        x: this.round(player.currentIntent.target.x),
                        y: this.round(player.currentIntent.target.y),
                    },
                },
                target: {
                    x: this.round(player.target.x),
                    y: this.round(player.target.y),
                },
            })),
            events,
        };
    }

    private createEvent(
        type: RealTimeEventType,
        player?: SimulatedPlayer,
        secondaryPlayer?: SimulatedPlayer,
        outcome?: string,
        details: Partial<Pick<RealTimeMatchEvent, 'chanceQuality'>> = {},
    ): RealTimeMatchEvent {
        const teamSide = player?.side || this.state.possession.teamSide || undefined;
        const fieldZones = teamSide ? this.fieldZonesFor(teamSide, this.state.ball) : [];
        const activeShot = this.state.activeBallAction?.type === 'shot' ? this.state.activeBallAction : null;

        return {
            type,
            time: this.state.time,
            team: player?.team,
            teamSide,
            player: player?.player,
            playerId: player?.id,
            secondaryPlayer: secondaryPlayer?.player,
            secondaryPlayerId: secondaryPlayer?.id,
            position: {
                x: this.round(this.state.ball.x),
                y: this.round(this.state.ball.y),
            },
            score: { ...this.state.score },
            outcome,
            fieldZones,
            possession: this.possessionSnapshot(),
            activeAttackPattern: this.state.possession.activeAttackPattern,
            chanceQuality: details.chanceQuality ?? activeShot?.chanceQuality,
        };
    }

    private replayWindowForGoal(): { startTime: number, endTime: number } {
        return {
            startTime: this.roundTime(Math.max(0, this.state.time - 12)),
            endTime: this.roundTime(Math.min(this.matchLengthSeconds, this.state.time + 4)),
        };
    }

    private formationTargetsForRoles(
        roles: Position[],
        side: TeamSide,
        tactics: Tactics,
        period: ActivePeriod,
    ): Vector2[] {
        const slots = this.formationSlots(side, tactics, period);
        const outfieldLineCount = Math.max(...slots.filter((slot) => !slot.goalkeeper).map((slot) => slot.lineIndex)) + 1;
        const assignedSlotIndexes = new Set<number>();

        return roles.map((role) => {
            const preference = this.roleFormationPreference(role, outfieldLineCount);
            const availableSlots = slots
                .map((slot, index) => ({ slot, index }))
                .filter(({ index }) => !assignedSlotIndexes.has(index));
            const candidates = availableSlots.length
                ? availableSlots
                : slots.map((slot, index) => ({ slot, index }));
            const selected = candidates
                .sort((a, b) => {
                    const aScore = this.formationSlotScore(a.slot, preference);
                    const bScore = this.formationSlotScore(b.slot, preference);

                    return aScore - bScore;
                })[0];

            assignedSlotIndexes.add(selected.index);

            return { ...selected.slot.point };
        });
    }

    private formationSlotScore(
        slot: FormationSlot,
        preference: { lineIndex: number, lane: number, goalkeeper: boolean },
    ): number {
        const goalkeeperPenalty = slot.goalkeeper === preference.goalkeeper ? 0 : 20;
        const lineScore = Math.abs(slot.lineIndex - preference.lineIndex) * 4;
        const laneScore = Math.abs(slot.lane - preference.lane);

        return goalkeeperPenalty + lineScore + laneScore;
    }

    private roleFormationPreference(
        role: Position,
        outfieldLineCount: number,
    ): { lineIndex: number, lane: number, goalkeeper: boolean } {
        if (role === Position.GK) {
            return {
                lineIndex: -1,
                lane: 0.5,
                goalkeeper: true,
            };
        }

        return {
            lineIndex: this.roleLineIndex(role, outfieldLineCount),
            lane: this.roleLane(role),
            goalkeeper: false,
        };
    }

    private roleLineIndex(role: Position, outfieldLineCount: number): number {
        if (defencePositions.includes(role)) {
            return 0;
        }

        if (attackPositions.includes(role)) {
            return outfieldLineCount - 1;
        }

        if (midfieldPositions.includes(role)) {
            if ([Position.LDM, Position.DM, Position.RDM].includes(role)) {
                return Math.min(1, outfieldLineCount - 1);
            }

            return Math.min(Math.max(1, Math.round((outfieldLineCount - 1) / 2)), outfieldLineCount - 1);
        }

        return Math.max(0, outfieldLineCount - 1);
    }

    private roleLane(role: Position): number {
        switch (role) {
            case Position.LB:
            case Position.LWB:
            case Position.LM:
            case Position.LW:
            case Position.LF:
                return 0;
            case Position.LCB:
            case Position.LDM:
            case Position.LCM:
            case Position.LCOM:
                return 0.33;
            case Position.RCB:
            case Position.RDM:
            case Position.RCM:
            case Position.RCOM:
                return 0.67;
            case Position.RB:
            case Position.RWB:
            case Position.RM:
            case Position.RW:
            case Position.RF:
                return 1;
            default:
                return 0.5;
        }
    }

    private formationSlots(side: TeamSide, tactics: Tactics, period: ActivePeriod): FormationSlot[] {
        const shape = this.parseFormation(tactics.formation);
        const slots: FormationSlot[] = [
            {
                point: this.mirrorForSide(side, { x: 7, y: pitch.width / 2 }, period),
                lineIndex: -1,
                lane: 0.5,
                goalkeeper: true,
            },
        ];
        const mentalityShift = this.mentalityShift(tactics.mentality);
        const lineStart = 22 + mentalityShift;
        const lineEnd = 82 + mentalityShift;

        shape.forEach((playerCount, lineIndex) => {
            const x = shape.length === 1
                ? (lineStart + lineEnd) / 2
                : lineStart + (lineEnd - lineStart) * (lineIndex / (shape.length - 1));
            const lineWidth = 26 + tactics.width / 100 * 34;
            const minY = pitch.width / 2 - lineWidth / 2;
            const gap = playerCount === 1 ? 0 : lineWidth / (playerCount - 1);

            for (let index = 0; index < playerCount; index += 1) {
                const lane = playerCount === 1 ? 0.5 : index / (playerCount - 1);

                slots.push({
                    point: this.mirrorForSide(side, {
                        x,
                        y: playerCount === 1 ? pitch.width / 2 : minY + gap * index,
                    }, period),
                    lineIndex,
                    lane,
                    goalkeeper: false,
                });
            }
        });

        return slots;
    }

    private parseFormation(formation: string): number[] {
        const shape = formation
            .split('-')
            .map((line) => parseInt(line, 10))
            .filter((line) => Number.isFinite(line) && line > 0);

        if (shape.reduce((sum, line) => sum + line, 0) !== 10) {
            return [4, 4, 2];
        }

        return shape;
    }

    private selectPassTarget(owner: SimulatedPlayer): SimulatedPlayer | null {
        const direction = this.attackDirection(owner.side);
        const opponents = this.playersAgainst(owner.side);
        const pressure = this.pressureAround(owner);
        const tempo = this.tactics(owner.side).tempo / 100;
        const progress = (owner.x - pitch.length / 2) * direction;
        const candidates = this.playersForSide(owner.side)
            .filter((player) => player !== owner)
            .map((player) => {
                const distance = this.distance(owner, player);
                const forwardValue = (player.x - owner.x) * direction;
                const opponentDistance = Math.min(...opponents.map((opponent) => this.distance(opponent, player)));
                const supportLane = Math.abs(player.y - owner.y);
                const safeSupport = forwardValue > -10 && forwardValue < 12 && distance < 24;
                const resetOption = forwardValue < -2 && distance < 26;
                const route = this.passRoute(owner, player);
                const ambitiousPenalty = Math.max(0, forwardValue - 18) * (pressure > 0.25 || progress < 18 ? 0.65 : 0.18);
                const forwardWeight = pressure > 0.45 ? -0.12 : 0.08 + tempo * 0.12;
                const score = forwardValue * forwardWeight
                    + opponentDistance * 0.48
                    - distance * 0.2
                    - supportLane * 0.04
                    - ambitiousPenalty
                    + this.passRouteSelectionBonus(route, owner, player)
                    + (safeSupport ? 7 : 0)
                    + (resetOption && pressure > 0.22 ? 6 : 0)
                    + this.random() * 4;

                return { player, distance, score, route };
            })
            .filter((candidate) => candidate.distance > 5 && candidate.distance < 34)
            .sort((a, b) => b.score - a.score);

        return candidates[0]?.player || null;
    }

    private passRouteSelectionBonus(route: string, owner: SimulatedPlayer, target: SimulatedPlayer): number {
        const zones = this.fieldZonesFor(owner.side, owner);
        const byline = zones.includes('byline');
        const finalThird = zones.includes('final_third');
        const pressure = this.pressureAround(owner);

        if (route === 'cutback') {
            return byline ? 18 : 10;
        }

        if (route === 'cross') {
            return finalThird ? 10 : 5;
        }

        if (route === 'through_ball') {
            return 12 + this.runnerSeparation(target) * 2;
        }

        if (route === 'switch_of_play') {
            return pressure < 0.3 ? 9 : 4;
        }

        if (route === 'overlap_pass' || route === 'underlap_pass') {
            return 11;
        }

        if (route === 'line_breaking_pass') {
            return 7;
        }

        if (route === 'wall_pass') {
            return 4;
        }

        return 0;
    }

    private passTargetPoint(
        owner: SimulatedPlayer,
        target: SimulatedPlayer,
        route: string,
        passSpeed: number,
    ): Vector2 {
        const distance = this.distance(owner, target);
        const arrivalSeconds = distance / passSpeed;
        const targetIntent = target.currentIntent.target || target.target;
        const leadDistance = this.playerSpeed(target) * arrivalSeconds * (route === 'through_ball' ? 0.85 : 0.62);
        const point = ['through_ball', 'cross', 'cutback', 'overlap_pass', 'underlap_pass'].includes(route)
            ? this.pointTowards(target, targetIntent, leadDistance)
            : this.pointTowards(target, targetIntent, Math.min(leadDistance, 3));

        return this.clampPassTarget(point);
    }

    private passTargetKind(route: string, distance: number): 'feet' | 'space' | 'contest' {
        if (route === 'through_ball' || route === 'cutback' || route === 'overlap_pass' || route === 'underlap_pass') {
            return 'space';
        }

        if (route === 'cross' || distance > 32) {
            return 'contest';
        }

        return 'feet';
    }

    private passSpeed(route: string, distance: number): number {
        if (route === 'cross') {
            return 16;
        }

        if (route === 'through_ball' || route === 'cutback') {
            return 16;
        }

        if (route === 'switch_of_play') {
            return 18;
        }

        return distance > 24 ? 14 : 10;
    }

    private passMissDistance(distance: number, route: string): number {
        const routeRisk = ['through_ball', 'cross', 'cutback', 'switch_of_play'].includes(route) ? 3 : 0;

        return this.clamp(3.5 + distance * 0.12 + routeRisk, 4.5, 11);
    }

    private receiveDifficulty(
        owner: SimulatedPlayer,
        target: SimulatedPlayer,
        distance: number,
        pressure: number,
        route: string,
        targetKind: 'feet' | 'space' | 'contest',
    ): number {
        const targetPressure = this.pressureAround(target);
        const routeRisk = targetKind === 'contest' ? 0.26 : targetKind === 'space' ? 0.14 : 0.04;
        const bodyAngleCost = Math.abs(target.y - owner.y) / pitch.width * 0.16;

        return this.clamp(
            distance / 70
            + pressure * 0.22
            + targetPressure * 0.24
            + routeRisk
            + bodyAngleCost
            - owner.attributes.passing / 20 * 0.08,
            0.08,
            0.88,
        );
    }

    private passRoute(owner: SimulatedPlayer, target: SimulatedPlayer): string {
        const direction = this.attackDirection(owner.side);
        const forwardValue = (target.x - owner.x) * direction;
        const lateralDistance = Math.abs(target.y - owner.y);
        const ownerProgress = (owner.x - pitch.length / 2) * direction;
        const ownerZones = this.fieldZonesFor(owner.side, owner);
        const targetZones = this.fieldZonesFor(owner.side, target);
        const ownerWide = this.hasWideZone(ownerZones);
        const targetCentral = targetZones.includes('central_lane') || targetZones.includes('half_space_left') || targetZones.includes('half_space_right');
        const pressure = this.pressureAround(owner);

        if (lateralDistance > 30 && Math.abs(forwardValue) < 12 && pressure < 0.45) {
            return 'switch_of_play';
        }

        if (ownerZones.includes('byline') && targetCentral && forwardValue < 8) {
            return 'cutback';
        }

        if (forwardValue < -4) {
            return 'backward_reset';
        }

        if (target.currentIntent.type === 'overlap' && ownerWide && forwardValue >= -2) {
            return 'overlap_pass';
        }

        if (target.currentIntent.type === 'underlap' && ownerWide && forwardValue >= -2) {
            return 'underlap_pass';
        }

        if (ownerWide && targetZones.includes('box') && ownerProgress > 24) {
            return 'cross';
        }

        if (forwardValue > 16 && this.canPlayThroughBall(owner, target)) {
            return 'through_ball';
        }

        if (forwardValue > 12 && targetCentral && ownerProgress > -8) {
            return 'line_breaking_pass';
        }

        if (forwardValue > 0 && forwardValue <= 12 && this.distance(owner, target) < 16 && pressure < 0.35) {
            return 'wall_pass';
        }

        if (Math.abs(forwardValue) <= 6) {
            return 'lateral_support';
        }

        return 'progressive_pass';
    }

    private canPlayThroughBall(owner: SimulatedPlayer, target: SimulatedPlayer): boolean {
        if (target.currentIntent.type !== 'make_forward_run') {
            return false;
        }

        if (!attackPositions.includes(target.role)) {
            return false;
        }

        const direction = this.attackDirection(owner.side);
        const goal = this.goalCenterAgainst(owner.side);
        const ownerProgress = (owner.x - pitch.length / 2) * direction;

        return ownerProgress > 8
            && this.pressureAround(owner) < 0.42
            && this.runnerSeparation(target) > 1.2
            && this.distance(target.currentIntent.target, goal) > 8
            && this.passingLanePressure(owner, target) < 0.48;
    }

    private runnerSeparation(player: SimulatedPlayer): number {
        const defender = this.nearestOpponent(player.side, player);

        if (!defender) {
            return 4;
        }

        const direction = this.attackDirection(player.side);
        const goalSideSeparation = (player.x - defender.x) * direction;

        return goalSideSeparation + this.distance(player, defender) * 0.35;
    }

    private passingLanePressure(from: SimulatedPlayer, to: Vector2): number {
        const nearestLaneDefender = this.playersAgainst(from.side)
            .map((player) => this.distanceToSegment(player, from, to))
            .sort((a, b) => a - b)[0] ?? 20;

        return this.clamp(1 - nearestLaneDefender / 7, 0, 1);
    }

    private shotRoute(player: SimulatedPlayer, distanceToGoal: number): string {
        const context = this.state.possession;
        const previousPassRoute = context.lastSuccessfulPassRoute || context.lastPassRoute;

        if (context.lastRecoveryType === 'rebound') {
            return 'rebound';
        }

        if (context.lastRecoveryType === 'second_ball') {
            return 'second_ball';
        }

        if (context.setPieceOrigin && (context.passCount <= 2 || defencePositions.includes(player.role))) {
            return 'set_piece';
        }

        if (previousPassRoute === 'through_ball') {
            return 'through_ball';
        }

        if (previousPassRoute === 'cutback') {
            return 'cutback';
        }

        if (previousPassRoute === 'cross') {
            return 'cross';
        }

        if (player.currentIntent.type === 'attack_box' || (midfieldPositions.includes(player.role) && distanceToGoal < 20)) {
            return 'late_midfield_run';
        }

        if (distanceToGoal > 24) {
            return 'long_shot';
        }

        if (['line_breaking_pass', 'wall_pass', 'overlap_pass', 'underlap_pass', 'short_corner', 'indirect_free_kick'].includes(previousPassRoute || '')) {
            return 'central_combination';
        }

        if (this.isWideAttacker(player) && Math.abs(player.y - pitch.width / 2) > 12) {
            return 'dribble_cut_inside';
        }

        return 'central_combination';
    }

    private selectRestartTaker(restart: RestartState): SimulatedPlayer {
        const players = this.playersForSide(restart.teamSide);

        if (restart.phase === 'goal_kick') {
            return this.goalkeeperFor(restart.teamSide) || players[0];
        }

        if (restart.phase === 'corner') {
            return players
                .filter((player) => player.role !== Position.GK)
                .slice()
                .sort((a, b) => {
                    const aScore = a.attributes.corners + a.attributes.crossing - this.distance(a, restart.position) * 0.15;
                    const bScore = b.attributes.corners + b.attributes.crossing - this.distance(b, restart.position) * 0.15;

                    return bScore - aScore;
                })[0] || players[0];
        }

        if (restart.phase === 'free_kick') {
            return players
                .filter((player) => player.role !== Position.GK)
                .slice()
                .sort((a, b) => {
                    const aScore = a.attributes.freeKickTaking + a.attributes.technique - this.distance(a, restart.position) * 0.1;
                    const bScore = b.attributes.freeKickTaking + b.attributes.technique - this.distance(b, restart.position) * 0.1;

                    return bScore - aScore;
                })[0] || players[0];
        }

        if (restart.phase === 'penalty') {
            return players
                .filter((player) => player.role !== Position.GK)
                .slice()
                .sort((a, b) => {
                    const aScore = a.attributes.penaltyTaking + a.attributes.finishing + a.attributes.composure;
                    const bScore = b.attributes.penaltyTaking + b.attributes.finishing + b.attributes.composure;

                    return bScore - aScore;
                })[0] || players[0];
        }

        return players
            .filter((player) => player.role !== Position.GK)
            .slice()
            .sort((a, b) => this.distance(a, restart.position) - this.distance(b, restart.position))[0] || players[0];
    }

    private selectThrowInTarget(side: TeamSide, taker: SimulatedPlayer): SimulatedPlayer | null {
        return this.playersForSide(side)
            .filter((player) => player !== taker && player.role !== Position.GK)
            .slice()
            .sort((a, b) => {
                const aScore = this.distance(a, taker) + Math.abs(a.y - taker.y) * 0.4;
                const bScore = this.distance(b, taker) + Math.abs(b.y - taker.y) * 0.4;

                return aScore - bScore;
            })[0] || null;
    }

    private selectBoxTarget(side: TeamSide, taker: SimulatedPlayer): SimulatedPlayer | null {
        const goal = this.goalCenterAgainst(side);

        return this.playersForSide(side)
            .filter((player) => player !== taker && player.role !== Position.GK)
            .slice()
            .sort((a, b) => {
                const aScore = a.attributes.heading + a.attributes.jumpingReach - this.distance(a, goal) * 0.2;
                const bScore = b.attributes.heading + b.attributes.jumpingReach - this.distance(b, goal) * 0.2;

                return bScore - aScore;
            })[0] || null;
    }

    private selectShortGoalKickTarget(side: TeamSide, taker: SimulatedPlayer): SimulatedPlayer | null {
        return this.playersForSide(side)
            .filter((player) => player !== taker && defencePositions.includes(player.role))
            .slice()
            .sort((a, b) => this.distance(a, taker) - this.distance(b, taker))[0] || null;
    }

    private selectLongGoalKickTarget(side: TeamSide, taker: SimulatedPlayer): SimulatedPlayer | null {
        const direction = this.attackDirection(side);

        return this.playersForSide(side)
            .filter((player) => player !== taker && player.role !== Position.GK)
            .slice()
            .sort((a, b) => (b.x - a.x) * direction)[0] || null;
    }

    private safeRestartTarget(side: TeamSide, position: Vector2, distance: number): Vector2 {
        const direction = this.attackDirection(side);

        return this.clampPoint({
            x: position.x + direction * distance,
            y: pitch.width / 2 + (position.y - pitch.width / 2) * 0.4,
        });
    }

    private cornerTargetPoint(side: TeamSide, outcome: string): Vector2 {
        const goal = this.goalCenterAgainst(side);
        const direction = this.attackDirection(side);
        const x = goal.x - direction * (outcome === 'short_corner' ? 16 : 8);
        const yOffset = outcome === 'near_post' ? -pitch.goalWidth / 2 : outcome === 'far_post' ? pitch.goalWidth / 2 : 0;

        return {
            x,
            y: pitch.width / 2 + yOffset,
        };
    }

    private supportTarget(player: SimulatedPlayer, ballOwner: SimulatedPlayer): Vector2 {
        const direction = this.attackDirection(player.side);
        const laneOffset = player.y < ballOwner.y ? -5 : 5;

        return this.clampPoint({
            x: player.target.x + direction * 5,
            y: player.target.y + laneOffset,
        });
    }

    private overlapTarget(player: SimulatedPlayer, ballOwner: SimulatedPlayer): Vector2 {
        const direction = this.attackDirection(player.side);
        const outsideLane = player.y < pitch.width / 2 ? 5 : pitch.width - 5;

        return this.clampPoint({
            x: Math.max(player.target.x * direction, ballOwner.x * direction + 12) * direction,
            y: outsideLane,
        });
    }

    private underlapTarget(player: SimulatedPlayer, ballOwner: SimulatedPlayer): Vector2 {
        const direction = this.attackDirection(player.side);

        return this.clampPoint({
            x: Math.max(player.x * direction, ballOwner.x * direction + 8) * direction,
            y: ballOwner.y + (pitch.width / 2 - ballOwner.y) * 0.55,
        });
    }

    private boxEntryTarget(side: TeamSide, player: SimulatedPlayer): Vector2 {
        const goal = this.goalCenterAgainst(side);
        const direction = this.attackDirection(side);

        return this.clampPoint({
            x: goal.x - direction * 15,
            y: pitch.width / 2 + (player.y < pitch.width / 2 ? -8 : 8),
        });
    }

    private forwardRunTarget(player: SimulatedPlayer): Vector2 {
        const direction = this.attackDirection(player.side);

        return this.clampPoint({
            x: player.x + direction * 16,
            y: player.y + (pitch.width / 2 - player.y) * 0.25,
        });
    }

    private driftWideTarget(player: SimulatedPlayer): Vector2 {
        const wideY = player.y < pitch.width / 2 ? 8 : pitch.width - 8;

        return this.clampPoint({
            x: player.target.x,
            y: wideY,
        });
    }

    private betweenLinesTarget(player: SimulatedPlayer): Vector2 {
        const direction = this.attackDirection(player.side);

        return this.clampPoint({
            x: player.target.x - direction * 5,
            y: player.target.y,
        });
    }

    private trackRunnerTarget(player: SimulatedPlayer, ballOwner: SimulatedPlayer): Vector2 {
        const direction = this.attackDirection(ballOwner.side);

        return this.clampPoint({
            x: ballOwner.x + direction * 4,
            y: ballOwner.y,
        });
    }

    private coverLaneTarget(player: SimulatedPlayer, ballOwner: SimulatedPlayer): Vector2 {
        return this.clampPoint({
            x: (player.target.x + ballOwner.x) / 2,
            y: (player.target.y + ballOwner.y) / 2,
        });
    }

    private isWideDefender(player: SimulatedPlayer): boolean {
        return [Position.LB, Position.RB, Position.LWB, Position.RWB].includes(player.role);
    }

    private isWideAttacker(player: SimulatedPlayer): boolean {
        return [Position.LM, Position.RM, Position.LW, Position.RW, Position.LF, Position.RF].includes(player.role);
    }

    private isWideCarrier(player: SimulatedPlayer): boolean {
        return this.hasWideZone(this.fieldZonesFor(player.side, player));
    }

    private hasOverlappingSupport(player: SimulatedPlayer): boolean {
        const direction = this.attackDirection(player.side);

        return this.playersForSide(player.side).some((teammate) => {
            if (!this.isWideDefender(teammate)) {
                return false;
            }

            const isAhead = teammate.x * direction > player.x * direction - 2;

            return isAhead && this.distance(teammate, player) < 18;
        });
    }

    private shootingIntentChance(player: SimulatedPlayer, distanceToGoal: number): number {
        const finishing = player.attributes.finishing / 20;
        const longShots = player.attributes.longShots / 20;
        const composure = player.attributes.composure / 20;
        const pressure = this.pressureAround(player);
        const goal = this.goalCenterAgainst(player.side);
        const anglePenalty = this.clamp(Math.abs(player.y - goal.y) / (pitch.width / 2), 0, 1);
        const supportOptions = this.playersForSide(player.side)
            .filter((candidate) => candidate !== player && this.distance(candidate, player) < 18)
            .length;
        const distanceChance = distanceToGoal < 12
            ? 0.022
            : distanceToGoal < 18
                ? 0.011
                : distanceToGoal < 24
                    ? 0.004
                    : 0.001;
        const longShotBoost = distanceToGoal > 24 ? longShots * 0.002 : 0;
        const mentalityBoost = this.tactics(player.side).mentality === 'attacking' ? 0.002 : this.tactics(player.side).mentality === 'defensive' ? -0.003 : 0;
        const supportPatience = supportOptions >= 2 && distanceToGoal > 12 ? 0.009 : 0;

        return this.clamp(
            distanceChance
            + finishing * 0.006
            + composure * 0.004
            + longShotBoost
            + mentalityBoost
            - pressure * 0.016
            - anglePenalty * 0.018
            - supportPatience,
            0.003,
            distanceToGoal > 24 ? 0.006 : 0.045,
        );
    }

    private passQuality(player: SimulatedPlayer, passDistance: number, pressure: number): number {
        const passing = player.attributes.passing / 20;
        const technique = player.attributes.technique / 20;
        const decisions = player.attributes.decisions / 20;
        const distancePenalty = passDistance / 155;

        return this.clamp(0.64 + passing * 0.16 + technique * 0.11 + decisions * 0.1 - pressure * 0.12 - distancePenalty - player.injuryPerformancePenalty * 0.16, 0.46, 0.96);
    }

    private shotQuality(player: SimulatedPlayer, distanceToGoal: number, route: string): number {
        const finishing = player.attributes.finishing / 20;
        const longShots = player.attributes.longShots / 20;
        const technique = player.attributes.technique / 20;
        const composure = player.attributes.composure / 20;
        const pressure = this.pressureAround(player);
        const goal = this.goalCenterAgainst(player.side);
        const goalkeeper = this.goalkeeperFor(this.oppositeSide(player.side));
        const anglePenalty = this.clamp(Math.abs(player.y - goal.y) / (pitch.width / 2), 0, 1) * 0.18;
        const distancePenalty = distanceToGoal / 62;
        const rangeSkill = distanceToGoal > 24 ? longShots * 0.12 : finishing * 0.08;
        const goalkeeperPosition = goalkeeper
            ? this.clamp(this.distance(goalkeeper, goal) / 18, 0, 1) * 0.04
            : 0.02;
        const routeBoost = this.shotRouteQualityBoost(route);

        return this.clamp(
            0.32
            + finishing * 0.17
            + rangeSkill
            + technique * 0.14
            + composure * 0.13
            + routeBoost
            + goalkeeperPosition
            - pressure * 0.18
            - distancePenalty
            - anglePenalty
            - player.injuryPerformancePenalty * 0.2,
            0.08,
            0.92,
        );
    }

    private shotRouteQualityBoost(route: string): number {
        switch (route) {
            case 'cutback':
                return 0.16;
            case 'rebound':
                return 0.13;
            case 'through_ball':
                return 0.1;
            case 'cross':
                return 0.06;
            case 'late_midfield_run':
                return 0.06;
            case 'second_ball':
                return 0.04;
            case 'set_piece':
                return 0.03;
            case 'long_shot':
                return -0.08;
            case 'dribble_cut_inside':
                return -0.02;
            default:
                return 0;
        }
    }

    private pressureAround(player: SimulatedPlayer): number {
        const nearest = this.nearestOpponent(player.side, player);

        if (!nearest) {
            return 0;
        }

        return this.clamp(1 - this.distance(player, nearest) / 9, 0, 1);
    }

    private interceptionChance(player: SimulatedPlayer, action: ActiveBallAction): number {
        const anticipation = player.attributes.anticipation / 20;
        const positioning = player.attributes.positioning / 20;
        const passWeakness = 1 - action.quality;

        return this.clamp(0.08 + anticipation * 0.18 + positioning * 0.14 + passWeakness * 0.35, 0.08, 0.72);
    }

    private playerSpeed(player: SimulatedPlayer): number {
        const pace = player.attributes.pace / 20;
        const acceleration = player.attributes.acceleration / 20;
        const stamina = this.clamp(player.stamina / 100, 0.55, 1);
        const intenseIntents: PlayerIntentType[] = ['press', 'recover', 'attack_second_ball', 'receive_pass', 'dribble', 'overlap', 'attack_box', 'make_forward_run', 'track_runner'];
        const intentBoost = intenseIntents.includes(player.currentIntent.type) ? 1.12 : 1;
        const injuryMultiplier = 1 - player.injuryPerformancePenalty;

        return (3.2 + pace * 2.4 + acceleration * 1.2) * stamina * intentBoost * injuryMultiplier;
    }

    private updateStamina(player: SimulatedPlayer): void {
        const intenseIntents: PlayerIntentType[] = ['press', 'recover', 'attack_second_ball', 'receive_pass', 'dribble', 'overlap', 'attack_box', 'make_forward_run', 'track_runner'];
        const extraDrain = intenseIntents.includes(player.currentIntent.type) ? 0.01 : 0.004;

        player.stamina = this.clamp(player.stamina - (0.005 + extraDrain) * this.tickSeconds, 35, 100);
    }

    private velocityTowards(from: Vector2, to: Vector2, speed: number): Vector2 {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const distance = Math.hypot(dx, dy) || 1;

        return {
            x: dx / distance * speed,
            y: dy / distance * speed,
        };
    }

    private moveTowards(player: SimulatedPlayer, target: Vector2, maxDistance: number): void {
        const dx = target.x - player.x;
        const dy = target.y - player.y;
        const distance = Math.hypot(dx, dy);

        if (distance <= maxDistance || distance === 0) {
            player.x = target.x;
            player.y = target.y;

            return;
        }

        player.x += dx / distance * maxDistance;
        player.y += dy / distance * maxDistance;
    }

    private pointTowards(from: Vector2, to: Vector2, maxDistance: number): Vector2 {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const distance = Math.hypot(dx, dy);

        if (distance <= maxDistance || distance === 0) {
            return { x: to.x, y: to.y };
        }

        return {
            x: from.x + dx / distance * maxDistance,
            y: from.y + dy / distance * maxDistance,
        };
    }

    private playerById(id: string): SimulatedPlayer | undefined {
        return this.state.players.find((player) => player.id === id);
    }

    private playersForSide(side: TeamSide): SimulatedPlayer[] {
        return this.state.players.filter((player) => player.side === side);
    }

    private playersAgainst(side: TeamSide): SimulatedPlayer[] {
        return this.state.players.filter((player) => player.side !== side);
    }

    private closestPlayerTo(side: TeamSide, point: Vector2): SimulatedPlayer | null {
        return this.playersForSide(side)
            .slice()
            .sort((a, b) => this.distance(a, point) - this.distance(b, point))[0] || null;
    }

    private closestPlayer(point: Vector2): SimulatedPlayer | null {
        return this.state.players
            .slice()
            .sort((a, b) => this.distance(a, point) - this.distance(b, point))[0] || null;
    }

    private nearestOpponent(side: TeamSide, point: Vector2): SimulatedPlayer | null {
        return this.playersAgainst(side)
            .slice()
            .sort((a, b) => this.distance(a, point) - this.distance(b, point))[0] || null;
    }

    private goalkeeperFor(side: TeamSide): SimulatedPlayer | null {
        return this.playersForSide(side).find((player) => player.role === Position.GK) || this.playersForSide(side)[0] || null;
    }

    private tactics(side: TeamSide): Tactics {
        return this.state.tactics[side];
    }

    private activePeriod(): ActivePeriod {
        return this.state?.period === 1 ? 1 : 2;
    }

    private attackDirection(side: TeamSide): 1 | -1 {
        return this.attackDirectionForPeriod(side, this.activePeriod());
    }

    private attackDirectionForPeriod(side: TeamSide, period: ActivePeriod): 1 | -1 {
        const firstHalfDirection = side === 'home' ? 1 : -1;

        if (period === 1) {
            return firstHalfDirection;
        }

        return firstHalfDirection === 1 ? -1 : 1;
    }

    private oppositeSide(side: TeamSide): TeamSide {
        return side === 'home' ? 'away' : 'home';
    }

    private goalCenterAgainst(side: TeamSide): Vector2 {
        const direction = this.attackDirection(side);

        return {
            x: direction > 0 ? pitch.length : 0,
            y: pitch.width / 2,
        };
    }

    private attackingSideForGoalLine(goalLineX: number): TeamSide {
        return (['home', 'away'] as TeamSide[])
            .find((side) => this.goalCenterAgainst(side).x === goalLineX) || 'home';
    }

    private goalKickPosition(side: TeamSide): Vector2 {
        const direction = this.attackDirection(side);

        return {
            x: direction > 0 ? 6 : pitch.length - 6,
            y: pitch.width / 2,
        };
    }

    private fieldZonesFor(side: TeamSide, point: Vector2): FieldZone[] {
        const attackingX = this.attackDirection(side) > 0 ? point.x : pitch.length - point.x;
        const attackingY = this.attackDirection(side) > 0 ? point.y : pitch.width - point.y;
        const zones: FieldZone[] = [];

        if (attackingX < pitch.length / 3) {
            zones.push('defensive_third');
        } else if (attackingX < pitch.length * 2 / 3) {
            zones.push('middle_third');
        } else {
            zones.push('attacking_third', 'final_third');
        }

        if (attackingY < pitch.width * 0.2) {
            zones.push('wide_left');
        } else if (attackingY < pitch.width * 0.4) {
            zones.push('half_space_left');
        } else if (attackingY <= pitch.width * 0.6) {
            zones.push('central_lane');
        } else if (attackingY <= pitch.width * 0.8) {
            zones.push('half_space_right');
        } else {
            zones.push('wide_right');
        }

        if (attackingX >= pitch.length - 18 && Math.abs(attackingY - pitch.width / 2) <= 22) {
            zones.push('box');
        }

        if (attackingX >= pitch.length - 7) {
            zones.push('byline');
        }

        return zones;
    }

    private progressionZone(zones: FieldZone[]): FieldZone | null {
        if (zones.includes('final_third')) {
            return 'final_third';
        }

        if (zones.includes('attacking_third')) {
            return 'attacking_third';
        }

        if (zones.includes('middle_third')) {
            return 'middle_third';
        }

        if (zones.includes('defensive_third')) {
            return 'defensive_third';
        }

        return null;
    }

    private hasWideZone(zones: FieldZone[]): boolean {
        return zones.includes('wide_left') || zones.includes('wide_right');
    }

    private routeLedAttackPattern(pattern: AttackPattern): boolean {
        return [
            'switch_of_play',
            'overlap',
            'underlap',
            'through_ball',
            'cross',
            'cutback',
            'late_run',
            'rebound',
            'second_ball',
            'set_piece',
            'central_combination',
            'defensive_transition',
        ].includes(pattern);
    }

    private attackPatternFromZones(zones: FieldZone[]): AttackPattern {
        if (zones.includes('box') || zones.includes('final_third')) {
            return this.hasWideZone(zones) || zones.includes('byline') ? 'wide_overload' : 'final_third_probe';
        }

        if (zones.includes('middle_third')) {
            return 'midfield_progression';
        }

        if (zones.includes('defensive_third')) {
            return 'patient_buildup';
        }

        return 'none';
    }

    private attackPatternFromPassRoute(route: string): AttackPattern {
        if (route === 'switch_of_play') {
            return 'switch_of_play';
        }

        if (route === 'overlap_pass') {
            return 'overlap';
        }

        if (route === 'underlap_pass') {
            return 'underlap';
        }

        if (route === 'through_ball') {
            return 'through_ball';
        }

        if (route === 'cross') {
            return 'cross';
        }

        if (route === 'cutback') {
            return 'cutback';
        }

        if (['line_breaking_pass', 'wall_pass', 'progressive_pass'].includes(route)) {
            return 'central_combination';
        }

        return this.attackPatternFromZones(this.state.possession.currentFieldZones);
    }

    private attackPatternFromShotRoute(route: string): AttackPattern {
        if (['through_ball', 'cross', 'cutback', 'rebound', 'second_ball'].includes(route)) {
            return route as AttackPattern;
        }

        if (route === 'late_midfield_run') {
            return 'late_run';
        }

        if (route === 'set_piece') {
            return 'set_piece';
        }

        return 'central_combination';
    }

    private registerTouch(player: SimulatedPlayer | null): void {
        if (!player) {
            return;
        }

        if (this.state.possession.teamSide !== player.side) {
            this.startPossession(player.side, this.state.phase);
        }

        this.state.ball.lastTouchSide = player.side;
        this.state.ball.lastTouchPlayerId = player.id;
        this.recordPossessionPosition(player.side, this.state.ball);
    }

    private mirrorForSide(side: TeamSide, point: Vector2, period: ActivePeriod): Vector2 {
        if (this.attackDirectionForPeriod(side, period) > 0) {
            return point;
        }

        return {
            x: pitch.length - point.x,
            y: pitch.width - point.y,
        };
    }

    private mentalityShift(mentality: Mentality): number {
        if (mentality === 'attacking') {
            return 6;
        }

        if (mentality === 'defensive') {
            return -6;
        }

        return 0;
    }

    private randomPoint(min: number, max: number): Vector2 {
        const distance = min + this.random() * (max - min);
        const angle = this.random() * Math.PI * 2;

        return {
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
        };
    }

    private ballIsSlow(): boolean {
        return Math.hypot(this.state.ball.velocity.x, this.state.ball.velocity.y) < 2.5;
    }

    private ballOutsidePitch(): boolean {
        return this.state.ball.x < 0
            || this.state.ball.x > pitch.length
            || this.state.ball.y < 0
            || this.state.ball.y > pitch.width;
    }

    private distance(a: Vector2, b: Vector2): number {
        return Math.hypot(a.x - b.x, a.y - b.y);
    }

    private distanceToSegment(point: Vector2, start: Vector2, end: Vector2): number {
        const segmentLengthSquared = (end.x - start.x) ** 2 + (end.y - start.y) ** 2;

        if (segmentLengthSquared === 0) {
            return this.distance(point, start);
        }

        const progress = this.clamp(
            ((point.x - start.x) * (end.x - start.x) + (point.y - start.y) * (end.y - start.y)) / segmentLengthSquared,
            0,
            1,
        );

        return this.distance(point, {
            x: start.x + (end.x - start.x) * progress,
            y: start.y + (end.y - start.y) * progress,
        });
    }

    private clampPoint(point: Vector2): Vector2 {
        return {
            x: this.clamp(point.x, 0, pitch.length),
            y: this.clamp(point.y, 0, pitch.width),
        };
    }

    private clampPassTarget(point: Vector2): Vector2 {
        return {
            x: this.clamp(point.x, 2, pitch.length - 2),
            y: this.clamp(point.y, 2, pitch.width - 2),
        };
    }

    private clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }

    private round(value: number): number {
        return Math.round(value * 100) / 100;
    }

    private roundTime(value: number): number {
        return Math.round(value * 1000) / 1000;
    }
}
