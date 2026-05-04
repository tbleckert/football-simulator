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
export type PlayerIntentType =
    'hold_shape'
    | 'press'
    | 'support'
    | 'receive'
    | 'dribble'
    | 'pass'
    | 'shoot'
    | 'recover';

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
    | 'pass'
    | 'receive'
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
}

export interface MatchSnapshotPlayer {
    id: string;
    teamSide: TeamSide;
    role: Position;
    roleName: string;
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
    private nextPhaseAfterSnapshot: MatchPhase | null = null;
    private clearRestartAfterSnapshot = false;

    constructor(homeTeam: Team, awayTeam: Team, options: Partial<RealTimeEngineOptions> = {}) {
        this.homeTeam = homeTeam;
        this.awayTeam = awayTeam;
        this.tickSeconds = options.tickSeconds || 0.25;
        this.matchLengthSeconds = options.matchLengthSeconds || 90 * 60;
        this.random = options.random || Math.random;

        const homeTactics = this.tacticsFromOptions(options.homeTactics);
        const awayTactics = this.tacticsFromOptions(options.awayTactics);
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
            restart: null,
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
                currentIntent: {
                    type: 'hold_shape',
                    target: { ...target },
                },
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

    private handleTimeBoundaries(): RealTimeMatchEvent[] {
        const halfTime = this.matchLengthSeconds / 2;

        if (this.state.period === 1 && this.state.time >= halfTime) {
            this.state.time = halfTime;
            this.state.period = 2;
            this.state.phase = 'half_time';
            this.resetForKickoff(this.startedSecondHalfSide());
            this.nextPhaseAfterSnapshot = 'open_play';

            return [
                this.createEvent('half_time'),
                this.createEvent('kickoff', this.state.ball.owner || undefined),
            ];
        }

        if (this.state.time >= this.matchLengthSeconds) {
            this.state.time = this.matchLengthSeconds;
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
        this.registerTouch(player);
        this.state.activeBallAction = null;

        if (player) {
            player.x = this.state.ball.x;
            player.y = this.state.ball.y;
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
            const event = this.createEvent('penalty', taker, goalkeeper || undefined, 'goal');
            this.resetForKickoff(this.oppositeSide(restart.teamSide));
            this.state.phase = 'penalty';
            this.nextPhaseAfterSnapshot = 'open_play';

            return event;
        }

        if (roll < goalChance + 0.08) {
            this.state.ball.owner = null;

            return this.createEvent('penalty', taker, goalkeeper || undefined, 'miss');
        }

        if (goalkeeper) {
            this.state.ball.owner = goalkeeper;
            this.registerTouch(goalkeeper);
        }

        return this.createEvent('penalty', taker, goalkeeper || undefined, this.random() < 0.3 ? 'save_rebound' : 'save');
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
        this.state.ball.owner = null;
        this.state.ball.x = restartPosition.x;
        this.state.ball.y = restartPosition.y;
        this.state.ball.velocity = this.velocityTowards(restartPosition, restartTarget, speed);
        this.registerTouch(taker);
        this.state.activeBallAction = {
            type: 'pass',
            from: taker,
            teamSide: taker.side,
            target: restartTarget,
            targetPlayer: targetPlayer || undefined,
            inaccurate: false,
            quality: 0.76,
        };
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
            target: aimedTarget,
            inaccurate: quality < this.random(),
            quality,
        };
        taker.actionCooldown = 1.4;
        this.nextPhaseAfterSnapshot = 'open_play';
        this.clearRestartAfterSnapshot = true;

        return this.createEvent(type, taker, undefined, outcome);
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
        this.state.ball.x = restart.position.x;
        this.state.ball.y = restart.position.y;
        this.state.ball.velocity = { x: 0, y: 0 };
        this.state.ball.owner = taker;
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
                player.currentIntent = {
                    type: 'hold_shape',
                    target: { ...restart.position },
                };

                return;
            }

            const distanceToRestart = this.distance(player, restart.position);

            if (distanceToRestart < 6) {
                const direction = player.side === restart.teamSide ? -1 : 1;
                player.x = this.clamp(player.x + direction * 4, 0, pitch.length);
            }

            player.currentIntent = {
                type: 'hold_shape',
                target: { ...player.target },
            };
        });
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
                player.currentIntent = {
                    type: 'hold_shape',
                    target: { ...target },
                };
                player.actionCooldown = 0;
            });
        });
    }

    private decidePlayerIntents(): void {
        const ballOwner = this.state.ball.owner;

        this.state.players.forEach((player) => {
            player.actionCooldown = Math.max(0, player.actionCooldown - this.tickSeconds);

            if (player === ballOwner) {
                player.currentIntent = this.intentForBallOwner(player);

                return;
            }

            if (!ballOwner) {
                player.currentIntent = this.intentForLooseBall(player);

                return;
            }

            if (ballOwner.side === player.side) {
                player.currentIntent = this.intentForTeammateInPossession(player, ballOwner);

                return;
            }

            player.currentIntent = this.intentForOutOfPossession(player, ballOwner);
        });
    }

    private intentForBallOwner(player: SimulatedPlayer): PlayerIntent {
        const goal = this.goalCenterAgainst(player.side);
        const distanceToGoal = this.distance(player, goal);

        if (player.actionCooldown === 0 && distanceToGoal < 24 && this.random() < this.shootingIntentChance(player, distanceToGoal)) {
            return {
                type: 'shoot',
                target: goal,
            };
        }

        if (player.actionCooldown > 0) {
            return this.dribbleIntent(player);
        }

        const passTarget = this.selectPassTarget(player);
        const tempo = this.tactics(player.side).tempo / 100;

        if (player.actionCooldown === 0 && passTarget && this.random() < 0.25 + tempo * 0.45) {
            return {
                type: 'pass',
                target: {
                    x: passTarget.x,
                    y: passTarget.y,
                },
                targetPlayerId: passTarget.id,
            };
        }

        return this.dribbleIntent(player);
    }

    private dribbleIntent(player: SimulatedPlayer): PlayerIntent {
        const direction = this.attackDirection(player.side);

        return {
            type: 'dribble',
            target: this.clampPoint({
                x: player.x + direction * 8,
                y: player.y + (pitch.width / 2 - player.y) * 0.2,
            }),
        };
    }

    private intentForLooseBall(player: SimulatedPlayer): PlayerIntent {
        const distanceToBall = this.distance(player, this.state.ball);
        const closest = this.closestPlayerTo(player.side, this.state.ball);

        if (closest === player || distanceToBall < 8) {
            return {
                type: 'recover',
                target: {
                    x: this.state.ball.x,
                    y: this.state.ball.y,
                },
            };
        }

        return {
            type: 'hold_shape',
            target: { ...player.target },
        };
    }

    private intentForTeammateInPossession(player: SimulatedPlayer, ballOwner: SimulatedPlayer): PlayerIntent {
        const distanceToBall = this.distance(player, ballOwner);

        if (distanceToBall < 28) {
            return {
                type: 'receive',
                target: this.supportTarget(player, ballOwner),
            };
        }

        return {
            type: 'support',
            target: { ...player.target },
        };
    }

    private intentForOutOfPossession(player: SimulatedPlayer, ballOwner: SimulatedPlayer): PlayerIntent {
        const tactics = this.tactics(player.side);
        const pressDistance = 8 + tactics.press * 0.18;

        if (this.distance(player, ballOwner) < pressDistance) {
            return {
                type: 'press',
                target: {
                    x: ballOwner.x,
                    y: ballOwner.y,
                },
            };
        }

        return {
            type: 'hold_shape',
            target: { ...player.target },
        };
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
        const miss = inaccurate ? this.randomPoint(5, 12) : { x: 0, y: 0 };
        const target = {
            x: targetPlayer.x + miss.x,
            y: targetPlayer.y + miss.y,
        };

        this.state.ball.owner = null;
        this.state.ball.x = owner.x;
        this.state.ball.y = owner.y;
        this.state.ball.velocity = this.velocityTowards(owner, target, 26);
        this.registerTouch(owner);
        this.state.activeBallAction = {
            type: 'pass',
            from: owner,
            teamSide: owner.side,
            target,
            targetPlayer,
            inaccurate,
            quality,
        };
        owner.actionCooldown = 0.7 + (1 - this.tactics(owner.side).tempo / 100) * 0.8;

        return this.createEvent('pass', owner, targetPlayer, inaccurate ? 'inaccurate' : 'accurate');
    }

    private startShot(owner: SimulatedPlayer): RealTimeMatchEvent {
        const goal = this.goalCenterAgainst(owner.side);
        const distanceToGoal = this.distance(owner, goal);
        const quality = this.shotQuality(owner, distanceToGoal);
        const target = {
            x: goal.x,
            y: goal.y + (this.random() - 0.5) * pitch.goalWidth * 1.8 * (1.1 - quality),
        };

        this.state.ball.owner = null;
        this.state.ball.x = owner.x;
        this.state.ball.y = owner.y;
        this.state.ball.velocity = this.velocityTowards(owner, target, 34);
        this.registerTouch(owner);
        this.state.activeBallAction = {
            type: 'shot',
            from: owner,
            teamSide: owner.side,
            target,
            inaccurate: quality < this.random(),
            quality,
        };
        owner.actionCooldown = 1.8;

        return this.createEvent('shot', owner, undefined, quality > 0.65 ? 'clean' : 'under_pressure');
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
            this.registerTouch(this.state.ball.owner);

            return;
        }

        this.state.ball.x += this.state.ball.velocity.x * this.tickSeconds;
        this.state.ball.y += this.state.ball.velocity.y * this.tickSeconds;
        this.state.ball.velocity.x *= 0.985;
        this.state.ball.velocity.y *= 0.985;
    }

    private detectEvents(): RealTimeMatchEvent[] {
        if (this.state.activeBallAction?.type === 'shot') {
            return this.detectShotOutcome(this.state.activeBallAction);
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

        if (this.state.activeBallAction.type === 'pass') {
            return this.detectPassOutcome(this.state.activeBallAction);
        }

        return [];
    }

    private detectTackleOrFoul(owner: SimulatedPlayer): RealTimeMatchEvent[] {
        const defender = this.nearestOpponent(owner.side, owner);

        if (!defender || this.distance(owner, defender) > 1.4) {
            return [];
        }

        const challengeEvent = this.createEvent('challenge', defender, owner, 'standing_tackle');
        const tackleChance = this.clamp(
            0.04 + defender.attributes.tackling / 20 * 0.08 - owner.attributes.dribbling / 20 * 0.06 - defender.injuryPerformancePenalty * 0.04,
            0.01,
            0.12,
        );
        const foulChance = this.clamp(
            0.01
            + defender.attributes.aggression / 20 * 0.025
            + this.state.referee.strictness / 100 * 0.02
            + defender.tackleTimingRisk * 0.015,
            0.01,
            0.08,
        );

        if (this.random() < foulChance) {
            this.state.ball.velocity = { x: 0, y: 0 };

            return [challengeEvent, ...this.resolveFoul(defender, owner)];
        }

        if (this.random() < tackleChance) {
            this.state.ball.owner = defender;
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
        const restartEvent = this.prepareFoulRestart(defender, fouledPlayer);

        return [...events, restartEvent];
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
        replacement.currentIntent = {
            type: 'hold_shape',
            target: { ...outgoing.target },
        };
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

        if (!player || this.distance(player, this.state.ball) > 1.6) {
            return [];
        }

        this.state.ball.owner = player;
        this.state.ball.velocity = { x: 0, y: 0 };
        this.registerTouch(player);

        return [this.createEvent('recovery', player)];
    }

    private detectPassOutcome(action: ActiveBallAction): RealTimeMatchEvent[] {
        const interceptor = this.playersAgainst(action.teamSide)
            .filter((player) => this.distance(player, this.state.ball) < 1.8)
            .sort((a, b) => this.distance(a, this.state.ball) - this.distance(b, this.state.ball))[0];

        if (interceptor && (action.inaccurate || this.random() < this.interceptionChance(interceptor, action))) {
            this.state.ball.owner = interceptor;
            this.state.ball.velocity = { x: 0, y: 0 };
            this.state.activeBallAction = null;
            this.registerTouch(interceptor);

            return [this.createEvent('interception', interceptor, action.from)];
        }

        if (action.targetPlayer && this.distance(action.targetPlayer, this.state.ball) < 1.7) {
            this.state.ball.owner = action.targetPlayer;
            this.state.ball.velocity = { x: 0, y: 0 };
            this.state.activeBallAction = null;
            this.registerTouch(action.targetPlayer);

            return [this.createEvent('receive', action.targetPlayer, action.from)];
        }

        if (this.distance(this.state.ball, action.target) < 2.2 || this.ballIsSlow()) {
            this.state.activeBallAction = null;
        }

        return [];
    }

    private detectShotOutcome(action: ActiveBallAction): RealTimeMatchEvent[] {
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
        const saveChance = this.clamp(0.55 - action.quality * 0.45 + (goalkeeper?.player.ratingAverage() || 50) / 100 * 0.25, 0.12, 0.7);

        if (inGoalFrame && this.random() > saveChance) {
            this.state.score[action.teamSide] += 1;
            this.state.ball.velocity = { x: 0, y: 0 };
            this.state.activeBallAction = null;

            const goalEvent = this.createEvent('goal', action.from, undefined, action.quality > 0.7 ? 'well_placed' : 'finished');
            this.resetForKickoff(this.oppositeSide(action.teamSide));
            this.state.phase = 'kickoff';
            this.nextPhaseAfterSnapshot = 'open_play';
            const kickoffEvent = this.createEvent('kickoff', this.state.ball.owner || undefined);

            return [goalEvent, kickoffEvent];
        }

        this.state.ball.velocity = { x: 0, y: 0 };
        this.state.activeBallAction = null;

        if (inGoalFrame && goalkeeper) {
            this.state.ball.owner = goalkeeper;
            this.registerTouch(goalkeeper);

            return [this.createEvent('save', goalkeeper, action.from)];
        }

        const missEvent = this.createEvent('miss', action.from);
        const restartEvent = this.prepareGoalLineRestart(action.teamSide);

        return [missEvent, restartEvent];
    }

    private snapshot(events: RealTimeMatchEvent[]): MatchSnapshot {
        return {
            time: this.state.time,
            period: this.state.period,
            phase: this.state.phase,
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
            players: this.state.players.map((player) => ({
                id: player.id,
                teamSide: player.side,
                role: player.role,
                roleName: Position[player.role],
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
    ): RealTimeMatchEvent {
        return {
            type,
            time: this.state.time,
            team: player?.team,
            teamSide: player?.side,
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
        const candidates = this.playersForSide(owner.side)
            .filter((player) => player !== owner)
            .map((player) => {
                const distance = this.distance(owner, player);
                const forwardValue = (player.x - owner.x) * direction;
                const opponentDistance = Math.min(...opponents.map((opponent) => this.distance(opponent, player)));
                const score = forwardValue * 0.5 + opponentDistance * 0.35 - distance * 0.25 + this.random() * 8;

                return { player, distance, score };
            })
            .filter((candidate) => candidate.distance > 5 && candidate.distance < 38)
            .sort((a, b) => b.score - a.score);

        return candidates[0]?.player || null;
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

    private shootingIntentChance(player: SimulatedPlayer, distanceToGoal: number): number {
        const finishing = player.attributes.finishing / 20;
        const composure = player.attributes.composure / 20;
        const distanceScore = this.clamp(1 - distanceToGoal / 24, 0, 1);

        return this.clamp(0.12 + finishing * 0.28 + composure * 0.16 + distanceScore * 0.3, 0.1, 0.72);
    }

    private passQuality(player: SimulatedPlayer, passDistance: number, pressure: number): number {
        const passing = player.attributes.passing / 20;
        const technique = player.attributes.technique / 20;
        const decisions = player.attributes.decisions / 20;
        const distancePenalty = passDistance / 120;

        return this.clamp(0.42 + passing * 0.24 + technique * 0.16 + decisions * 0.12 - pressure * 0.2 - distancePenalty - player.injuryPerformancePenalty * 0.18, 0.22, 0.93);
    }

    private shotQuality(player: SimulatedPlayer, distanceToGoal: number): number {
        const finishing = player.attributes.finishing / 20;
        const technique = player.attributes.technique / 20;
        const composure = player.attributes.composure / 20;
        const pressure = this.pressureAround(player);
        const distancePenalty = distanceToGoal / 60;

        return this.clamp(0.36 + finishing * 0.24 + technique * 0.16 + composure * 0.14 - pressure * 0.18 - distancePenalty - player.injuryPerformancePenalty * 0.2, 0.12, 0.88);
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
        const intentBoost = ['press', 'recover', 'dribble'].includes(player.currentIntent.type) ? 1.12 : 1;
        const injuryMultiplier = 1 - player.injuryPerformancePenalty;

        return (3.2 + pace * 2.4 + acceleration * 1.2) * stamina * intentBoost * injuryMultiplier;
    }

    private updateStamina(player: SimulatedPlayer): void {
        const extraDrain = ['press', 'recover', 'dribble'].includes(player.currentIntent.type) ? 0.01 : 0.004;

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

    private registerTouch(player: SimulatedPlayer | null): void {
        if (!player) {
            return;
        }

        this.state.ball.lastTouchSide = player.side;
        this.state.ball.lastTouchPlayerId = player.id;
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

    private distance(a: Vector2, b: Vector2): number {
        return Math.hypot(a.x - b.x, a.y - b.y);
    }

    private clampPoint(point: Vector2): Vector2 {
        return {
            x: this.clamp(point.x, 0, pitch.length),
            y: this.clamp(point.y, 0, pitch.width),
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
