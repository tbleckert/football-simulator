import assert from 'assert';
import { attackPositions, Position } from '../enums/Position';
import Player from '../Player';
import RealTimeEngine from '../RealTimeEngine';
import RealTimeReporter from '../RealTimeReporter';
import Team from '../Team';
import type { PlayerAttributes } from '../Player';
import type { ActiveBallAction, MatchSnapshot, RealTimeMatchEvent } from '../RealTimeEngine';

function seededRandom(seed: number): () => number {
    let value = seed;

    return () => {
        value = (value * 16807) % 2147483647;

        return (value - 1) / 2147483646;
    };
}

function queuedRandom(values: number[]): () => number {
    let index = 0;

    return () => {
        const value = values[index];

        index += 1;

        return value ?? 0.5;
    };
}

const baseAttributes: PlayerAttributes = {
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

function attributesForPosition(position: Position): PlayerAttributes {
    const attributes = { ...baseAttributes };

    if ([Position.LF, Position.CF, Position.RF, Position.ST, Position.LW, Position.RW].includes(position)) {
        attributes.finishing = 18;
        attributes.composure = 17;
        attributes.offTheBall = 16;
    }

    if ([Position.LCM, Position.CM, Position.RCM, Position.LM, Position.RM].includes(position)) {
        attributes.passing = 17;
        attributes.vision = 16;
        attributes.decisions = 16;
    }

    if ([Position.LB, Position.LCB, Position.CB, Position.RCB, Position.RB].includes(position)) {
        attributes.tackling = 17;
        attributes.marking = 16;
        attributes.positioning = 16;
    }

    if (position === Position.GK) {
        attributes.handling = 17;
        attributes.reflexes = 17;
        attributes.oneOnOnes = 17;
        attributes.positioning = 16;
    }

    return attributes;
}

function createTeam(home: boolean, name: string, positions: Position[]): Team {
    const players = positions.map((position, index) => new Player(
        {
            name: `${name} ${Position[position]}`,
            number: index + 1,
        },
        {
            height: 180,
            weight: 75,
        },
        attributesForPosition(position),
        position,
    ));

    return new Team(home, name, players);
}

function finitePoint(point: { x: number, y: number }): boolean {
    return Number.isFinite(point.x) && Number.isFinite(point.y);
}

function velocityTowards(from: { x: number, y: number }, to: { x: number, y: number }, speed: number): { x: number, y: number } {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.hypot(dx, dy) || 1;

    return {
        x: dx / distance * speed,
        y: dy / distance * speed,
    };
}

function engineInternals(engine: RealTimeEngine): {
    passRoute: (owner: RealTimeEngine['state']['players'][number], target: RealTimeEngine['state']['players'][number]) => string;
    selectPassTarget: (owner: RealTimeEngine['state']['players'][number]) => RealTimeEngine['state']['players'][number] | null;
    shotRoute: (player: RealTimeEngine['state']['players'][number], distanceToGoal: number) => string;
    startPass: (owner: RealTimeEngine['state']['players'][number], target: RealTimeEngine['state']['players'][number]) => unknown;
    offsideCandidateIds: (
        side: 'home' | 'away',
        ballPosition: { x: number, y: number },
        restartType?: 'throw_in' | 'corner' | 'goal_kick' | 'free_kick' | 'penalty',
        sourcePlayerId?: string,
    ) => string[];
    playRestartPass: (
        type: 'throw_in' | 'corner' | 'goal_kick' | 'free_kick',
        taker: RealTimeEngine['state']['players'][number],
        targetPlayer: RealTimeEngine['state']['players'][number] | null,
        target: { x: number, y: number },
        speed: number,
        outcome: string,
    ) => unknown;
    resolveFirstTouch: (action: ActiveBallAction) => RealTimeMatchEvent[];
    detectPassOutcome: (action: ActiveBallAction) => RealTimeMatchEvent[];
    detectAerialDuel: (action: ActiveBallAction) => RealTimeMatchEvent | null;
} {
    return engine as unknown as {
        passRoute: (owner: RealTimeEngine['state']['players'][number], target: RealTimeEngine['state']['players'][number]) => string;
        selectPassTarget: (owner: RealTimeEngine['state']['players'][number]) => RealTimeEngine['state']['players'][number] | null;
        shotRoute: (player: RealTimeEngine['state']['players'][number], distanceToGoal: number) => string;
        startPass: (owner: RealTimeEngine['state']['players'][number], target: RealTimeEngine['state']['players'][number]) => unknown;
        offsideCandidateIds: (
            side: 'home' | 'away',
            ballPosition: { x: number, y: number },
            restartType?: 'throw_in' | 'corner' | 'goal_kick' | 'free_kick' | 'penalty',
            sourcePlayerId?: string,
        ) => string[];
        playRestartPass: (
            type: 'throw_in' | 'corner' | 'goal_kick' | 'free_kick',
            taker: RealTimeEngine['state']['players'][number],
            targetPlayer: RealTimeEngine['state']['players'][number] | null,
            target: { x: number, y: number },
            speed: number,
            outcome: string,
        ) => unknown;
        resolveFirstTouch: (action: ActiveBallAction) => RealTimeMatchEvent[];
        detectPassOutcome: (action: ActiveBallAction) => RealTimeMatchEvent[];
        detectAerialDuel: (action: ActiveBallAction) => RealTimeMatchEvent | null;
    };
}

function possessionPassCounts(events: { type: string, teamSide?: string }[]): number[] {
    const possessionEvents = new Set([
        'kickoff',
        'throw_in',
        'corner',
        'goal_kick',
        'free_kick',
        'penalty',
        'pass',
        'receive',
        'interception',
        'tackle',
        'recovery',
        'save',
        'goalkeeper_claim',
    ]);
    const counts: number[] = [];
    let activeSide = '';
    let activePasses = 0;

    events.forEach((event) => {
        if (!event.teamSide || !possessionEvents.has(event.type)) {
            return;
        }

        if (event.teamSide !== activeSide) {
            if (activeSide) {
                counts.push(activePasses);
            }

            activeSide = event.teamSide;
            activePasses = 0;
        }

        if (event.type === 'pass') {
            activePasses += 1;
        }
    });

    if (activeSide) {
        counts.push(activePasses);
    }

    return counts;
}

function prepareLongPassScenario(engine: RealTimeEngine): {
    owner: RealTimeEngine['state']['players'][number];
    farTarget: RealTimeEngine['state']['players'][number];
} {
    const owner = engine.state.players.find((player) => player.side === 'home' && player.role === Position.RCM);
    const farTarget = engine.state.players.find((player) => player.side === 'home' && player.role === Position.RF);

    assert.ok(owner && farTarget, 'the long-pass scenario needs a midfielder and a forward');

    if (!owner || !farTarget) {
        throw new Error('Missing long-pass scenario players');
    }

    owner.x = 45;
    owner.y = 34;
    farTarget.x = 82;
    farTarget.y = 34;

    engine.state.players
        .filter((player) => player.side === 'home' && player !== owner && player !== farTarget)
        .forEach((player) => {
            player.x = 44;
            player.y = 34;
            player.target = {
                x: 44,
                y: 34,
            };
        });

    engine.state.players
        .filter((player) => player.side === 'away')
        .forEach((player, index) => {
            player.x = index === 0 ? 96 : index === 1 ? 92 : 30;
            player.y = index % 2 === 0 ? 4 : 64;
        });

    return { owner, farTarget };
}

const homeTeam = createTeam(true, 'Home', [
    Position.GK,
    Position.LB,
    Position.LCB,
    Position.RCB,
    Position.RB,
    Position.LM,
    Position.LCM,
    Position.RCM,
    Position.RM,
    Position.LF,
    Position.RF,
]);

const awayTeam = createTeam(false, 'Away', [
    Position.GK,
    Position.LB,
    Position.LCB,
    Position.RCB,
    Position.RB,
    Position.LCM,
    Position.CM,
    Position.RCM,
    Position.LW,
    Position.CF,
    Position.RW,
]);

const engine = new RealTimeEngine(homeTeam, awayTeam, {
    matchLengthSeconds: 120,
    random: seededRandom(42),
    homeTactics: {
        formation: '4-4-2',
        press: 62,
        width: 58,
        tempo: 66,
        mentality: 'attacking',
    },
    awayTactics: {
        formation: '4-3-3',
        press: 48,
        width: 52,
        tempo: 42,
        mentality: 'balanced',
    },
});

const snapshots = engine.simulate(120);
const firstSnapshot = snapshots[0] as MatchSnapshot;
const finalSnapshot = snapshots[snapshots.length - 1] as MatchSnapshot;
const allEvents = engine.events.map((event) => event.type);
const openPlayEvents = allEvents.filter((event) => !['match_start', 'kickoff', 'half_time', 'full_time'].includes(event));

assert.ok(snapshots.length > 1, 'the real-time engine should produce per-tick snapshots');
assert.equal(firstSnapshot.players.length, 22, 'snapshots should include all 22 players');
assert.equal(finalSnapshot.time, 120, 'the simulation should advance to the requested second');
assert.ok(finitePoint(finalSnapshot.ball), 'ball coordinates should stay finite');
assert.ok(finalSnapshot.ball.x >= 0 && finalSnapshot.ball.x <= 105, 'ball x should stay on the pitch after the smoke run');
assert.ok(finalSnapshot.ball.y >= 0 && finalSnapshot.ball.y <= 68, 'ball y should stay on the pitch after the smoke run');
assert.ok(finalSnapshot.players.every((player) => finitePoint(player)), 'player coordinates should stay finite');
assert.ok(finalSnapshot.players.every((player) => finitePoint(player.target)), 'player tactical targets should stay finite');
assert.ok(finalSnapshot.players.every((player) => player.currentIntent.type.length > 0), 'every player should expose a current intent');
assert.ok(firstSnapshot.possession.id > 0, 'snapshots should expose the active possession id');
assert.ok(firstSnapshot.fieldZones.length > 0, 'snapshots should expose current field zones');
assert.ok(firstSnapshot.activeAttackPattern.length > 0, 'snapshots should expose the active attack pattern');
assert.ok(engine.events.some((event) => event.possession.id > 0 && event.fieldZones.length > 0), 'events should expose possession context and field zones');
assert.equal(firstSnapshot.phase, 'kickoff', 'the opening snapshot should expose the kickoff phase');
assert.equal(finalSnapshot.period, 'ended', 'a full-match simulation should end the match');
assert.equal(finalSnapshot.phase, 'full_time', 'a full-match simulation should expose the full-time phase');
assert.equal(allEvents.filter((event) => event === 'full_time').length, 1, 'the event stream should include full time exactly once');
assert.ok(allEvents.includes('match_start'), 'the event stream should include match start');
assert.ok(allEvents.includes('kickoff'), 'the event stream should include kickoff');
assert.ok(allEvents.includes('pass'), 'the event stream should include passes');
assert.ok(openPlayEvents.length > 0, 'the event stream should include open-play events');
assert.ok(Math.max(...possessionPassCounts(engine.events)) >= 5, 'teams should be able to complete a 5-pass sequence');

const realTimeReport = new RealTimeReporter(engine).getReport();

assert.ok(realTimeReport.headline.includes('Home'), 'real-time reports should expose a scoreline headline');
assert.ok(realTimeReport.summary.length > 80, 'real-time reports should summarize why the match played out that way');
assert.ok(realTimeReport.sections.some((section) => section.title === 'Tactical pattern'), 'real-time reports should explain the tactical pattern');
assert.ok(realTimeReport.sections.some((section) => section.title === 'Chance creation'), 'real-time reports should explain chance creation');
assert.ok(realTimeReport.sections.some((section) => section.title === 'Pressing'), 'real-time reports should explain pressing impact');
assert.ok(realTimeReport.sections.some((section) => section.title === 'Player impact'), 'real-time reports should explain player impact');

const throwInEngine = new RealTimeEngine(homeTeam, awayTeam, {
    matchLengthSeconds: 10,
    random: seededRandom(10),
});
throwInEngine.start();
throwInEngine.state.ball.owner = null;
throwInEngine.state.ball.x = 42;
throwInEngine.state.ball.y = -1;
throwInEngine.state.ball.velocity = { x: 0, y: 0 };
throwInEngine.state.ball.lastTouchSide = 'home';
const throwInSlice = throwInEngine.tick();
throwInEngine.tick();

assert.ok(throwInSlice.events.some((event) => event.type === 'throw_in' && event.teamSide === 'away'), 'touchline exits should award a throw-in to the other team');
assert.equal(throwInSlice.snapshot.phase, 'throw_in', 'throw-in award snapshots should expose the throw-in phase');
assert.equal(throwInEngine.state.phase, 'open_play', 'throw-ins should return the match to open play after the restart action');

const cornerEngine = new RealTimeEngine(homeTeam, awayTeam, {
    matchLengthSeconds: 10,
    random: seededRandom(11),
});
cornerEngine.start();
cornerEngine.state.ball.owner = null;
cornerEngine.state.ball.x = 106;
cornerEngine.state.ball.y = 4;
cornerEngine.state.ball.velocity = { x: 0, y: 0 };
cornerEngine.state.ball.lastTouchSide = 'away';
const cornerSlice = cornerEngine.tick();
cornerEngine.tick();

assert.ok(cornerSlice.events.some((event) => event.type === 'corner' && event.teamSide === 'home'), 'defensive touches over the goal line should award a corner');
assert.equal(cornerSlice.snapshot.phase, 'corner', 'corner award snapshots should expose the corner phase');
assert.equal(cornerEngine.state.phase, 'open_play', 'corners should return the match to open play after the restart action');

const goalKickEngine = new RealTimeEngine(homeTeam, awayTeam, {
    matchLengthSeconds: 10,
    random: seededRandom(12),
});
goalKickEngine.start();
goalKickEngine.state.ball.owner = null;
goalKickEngine.state.ball.x = 106;
goalKickEngine.state.ball.y = 40;
goalKickEngine.state.ball.velocity = { x: 0, y: 0 };
goalKickEngine.state.ball.lastTouchSide = 'home';
const goalKickSlice = goalKickEngine.tick();
goalKickEngine.tick();

assert.ok(goalKickSlice.events.some((event) => event.type === 'goal_kick' && event.teamSide === 'away'), 'attacking touches over the goal line should award a goal kick');
assert.equal(goalKickSlice.snapshot.phase, 'goal_kick', 'goal-kick award snapshots should expose the goal-kick phase');
assert.equal(goalKickEngine.state.phase, 'open_play', 'goal kicks should return the match to open play after the restart action');

const movementEngine = new RealTimeEngine(homeTeam, awayTeam, {
    matchLengthSeconds: 10,
    random: seededRandom(14),
});
movementEngine.start();

const wideCarrier = movementEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RF);
const overlappingFullback = movementEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RB);

assert.ok(wideCarrier && overlappingFullback, 'the movement scenario needs a wide carrier and fullback');

if (wideCarrier && overlappingFullback) {
    wideCarrier.x = 70;
    wideCarrier.y = 12;
    wideCarrier.actionCooldown = 5;
    overlappingFullback.x = 64;
    overlappingFullback.y = 14;
    movementEngine.state.ball.owner = wideCarrier;
    movementEngine.state.ball.x = wideCarrier.x;
    movementEngine.state.ball.y = wideCarrier.y;
    const movementSlice = movementEngine.tick();
    const fullbackSnapshot = movementSlice.snapshot.players.find((player) => player.id === overlappingFullback.id);

    assert.equal(fullbackSnapshot?.currentIntent.type, 'overlap', 'fullbacks should make short-lived overlapping runs when the wide carrier is advanced');
    assert.ok(typeof fullbackSnapshot?.currentIntent.duration === 'number', 'intents should expose duration');
    assert.ok(typeof fullbackSnapshot?.currentIntent.urgency === 'number', 'intents should expose urgency');
    assert.ok(typeof fullbackSnapshot?.currentIntent.tacticalRisk === 'number', 'intents should expose tactical risk');
}

const underlapEngine = new RealTimeEngine(homeTeam, awayTeam, {
    matchLengthSeconds: 10,
    random: seededRandom(140),
});
underlapEngine.start();

const isolatedWideCarrier = underlapEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RF);
const underlappingMidfielder = underlapEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RCM);

assert.ok(isolatedWideCarrier && underlappingMidfielder, 'the underlap scenario needs a wide carrier and midfielder');

if (isolatedWideCarrier && underlappingMidfielder) {
    isolatedWideCarrier.x = 72;
    isolatedWideCarrier.y = 10;
    isolatedWideCarrier.actionCooldown = 5;
    underlappingMidfielder.x = 66;
    underlappingMidfielder.y = 24;
    underlapEngine.state.ball.owner = isolatedWideCarrier;
    underlapEngine.state.ball.x = isolatedWideCarrier.x;
    underlapEngine.state.ball.y = isolatedWideCarrier.y;

    const underlapSlice = underlapEngine.tick();
    const midfielderSnapshot = underlapSlice.snapshot.players.find((player) => player.id === underlappingMidfielder.id);

    assert.equal(midfielderSnapshot?.currentIntent.type, 'underlap', 'midfielders should underlap when an advanced wide carrier is isolated');
}

const tacticsEngine = new RealTimeEngine(homeTeam, awayTeam, {
    matchLengthSeconds: 90 * 60,
    random: seededRandom(15),
    homeTactics: {
        tempo: 50,
        press: 50,
        mentality: 'balanced',
    },
});
tacticsEngine.start();
tacticsEngine.state.period = 2;
tacticsEngine.state.time = 70 * 60;
tacticsEngine.state.score.away = 1;
tacticsEngine.tick();

assert.equal(tacticsEngine.state.tactics.home.mentality, 'attacking', 'losing teams should chase the match after the hour mark');
assert.ok(tacticsEngine.state.tactics.home.tempo > 50, 'losing teams should play faster after the hour mark');

const highLineEngine = new RealTimeEngine(homeTeam, awayTeam, {
    homeTactics: {
        style: 'high_press',
    },
});
const lowBlockLineEngine = new RealTimeEngine(homeTeam, awayTeam, {
    homeTactics: {
        style: 'low_block',
    },
});
const highLineCenterBack = highLineEngine.state.players.find((player) => player.side === 'home' && player.role === Position.LCB);
const lowBlockCenterBack = lowBlockLineEngine.state.players.find((player) => player.side === 'home' && player.role === Position.LCB);
const highLineFullback = highLineEngine.state.players.find((player) => player.side === 'home' && player.role === Position.LB);
const lowBlockFullback = lowBlockLineEngine.state.players.find((player) => player.side === 'home' && player.role === Position.LB);

assert.ok(highLineCenterBack && lowBlockCenterBack && highLineFullback && lowBlockFullback, 'the tactical-shape checks need defenders');

if (highLineCenterBack && lowBlockCenterBack && highLineFullback && lowBlockFullback) {
    assert.ok(highLineCenterBack.target.x > lowBlockCenterBack.target.x + 12, 'high-press defensive lines should start much higher than low blocks');
    assert.ok(Math.abs(lowBlockFullback.target.y - 34) < Math.abs(highLineFullback.target.y - 34), 'low blocks should defend in a more compact shape');
}

const highPressIntentEngine = new RealTimeEngine(homeTeam, awayTeam, {
    matchLengthSeconds: 10,
    random: seededRandom(151),
    homeTactics: {
        style: 'high_press',
    },
});
highPressIntentEngine.start();

const pressingForward = highPressIntentEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RF);
const pressedDefender = highPressIntentEngine.state.players.find((player) => player.side === 'away' && player.role === Position.LCB);

assert.ok(pressingForward && pressedDefender, 'the high-press scenario needs a forward and defender');

if (pressingForward && pressedDefender) {
    pressingForward.x = 70;
    pressingForward.y = 34;
    pressedDefender.x = 82;
    pressedDefender.y = 34;
    pressedDefender.actionCooldown = 5;
    highPressIntentEngine.state.ball.owner = pressedDefender;
    highPressIntentEngine.state.ball.x = pressedDefender.x;
    highPressIntentEngine.state.ball.y = pressedDefender.y;
    const pressSlice = highPressIntentEngine.tick();
    const forwardSnapshot = pressSlice.snapshot.players.find((player) => player.id === pressingForward.id);

    assert.equal(forwardSnapshot?.currentIntent.type, 'press', 'high-press teams should jump on opponent build-up possessions');
}

const lowBlockIntentEngine = new RealTimeEngine(homeTeam, awayTeam, {
    matchLengthSeconds: 10,
    random: seededRandom(152),
    homeTactics: {
        style: 'low_block',
    },
});
lowBlockIntentEngine.start();

const lowBlockForward = lowBlockIntentEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RF);
const lowBlockPressedDefender = lowBlockIntentEngine.state.players.find((player) => player.side === 'away' && player.role === Position.LCB);

assert.ok(lowBlockForward && lowBlockPressedDefender, 'the low-block scenario needs a forward and defender');

if (lowBlockForward && lowBlockPressedDefender) {
    lowBlockForward.x = 70;
    lowBlockForward.y = 34;
    lowBlockPressedDefender.x = 82;
    lowBlockPressedDefender.y = 34;
    lowBlockPressedDefender.actionCooldown = 5;
    lowBlockIntentEngine.state.ball.owner = lowBlockPressedDefender;
    lowBlockIntentEngine.state.ball.x = lowBlockPressedDefender.x;
    lowBlockIntentEngine.state.ball.y = lowBlockPressedDefender.y;
    const lowBlockSlice = lowBlockIntentEngine.tick();
    const forwardSnapshot = lowBlockSlice.snapshot.players.find((player) => player.id === lowBlockForward.id);

    assert.notEqual(forwardSnapshot?.currentIntent.type, 'press', 'low blocks should hold shape instead of jumping from the same distance');
}

const directPassEngine = new RealTimeEngine(homeTeam, awayTeam, {
    matchLengthSeconds: 10,
    random: seededRandom(153),
    homeTactics: {
        style: 'direct',
    },
});
directPassEngine.start();
const directScenario = prepareLongPassScenario(directPassEngine);
const directTarget = engineInternals(directPassEngine).selectPassTarget(directScenario.owner);

assert.equal(directTarget, directScenario.farTarget, 'direct teams should consider longer forward passes');

const possessionPassEngine = new RealTimeEngine(homeTeam, awayTeam, {
    matchLengthSeconds: 10,
    random: seededRandom(154),
    homeTactics: {
        style: 'possession',
    },
});
possessionPassEngine.start();
const possessionScenario = prepareLongPassScenario(possessionPassEngine);
const possessionTarget = engineInternals(possessionPassEngine).selectPassTarget(possessionScenario.owner);

assert.notEqual(possessionTarget, possessionScenario.farTarget, 'possession teams should prefer shorter circulation over the same long forward pass');

const offsideSelectionEngine = new RealTimeEngine(homeTeam, awayTeam, {
    matchLengthSeconds: 10,
    random: () => 0.5,
    homeTactics: {
        style: 'direct',
    },
});
offsideSelectionEngine.start();
const offsideSelectionScenario = prepareLongPassScenario(offsideSelectionEngine);
const safeSelectionTarget = offsideSelectionEngine.state.players.find((player) => (
    player.side === 'home'
    && player !== offsideSelectionScenario.owner
    && player !== offsideSelectionScenario.farTarget
    && player.role !== Position.GK
));

assert.ok(safeSelectionTarget, 'offside-aware selection needs an onside passing option');

if (safeSelectionTarget) {
    offsideSelectionScenario.farTarget.x = 90;
    safeSelectionTarget.x = 55;
    safeSelectionTarget.y = 34;
    offsideSelectionEngine.state.players
        .filter((player) => player.side === 'away')
        .forEach((player, index) => {
            player.x = index === 0 ? 100 : index === 1 ? 80 : 65;
            player.y = index % 2 === 0 ? 4 : 64;
        });

    const selectedTarget = engineInternals(offsideSelectionEngine).selectPassTarget(offsideSelectionScenario.owner);

    assert.equal(selectedTarget, safeSelectionTarget, 'passers should normally reject an already-offside target when an onside option exists');
}

const managerActionEngine = new RealTimeEngine(homeTeam, awayTeam, {
    matchLengthSeconds: 90 * 60,
    random: seededRandom(155),
    homeTactics: {
        style: 'high_press',
    },
});
managerActionEngine.start();

const managerCenterBack = managerActionEngine.state.players.find((player) => player.side === 'home' && player.role === Position.LCB);
const roleChangePlayer = managerActionEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RM);

assert.ok(managerCenterBack && roleChangePlayer, 'manager action checks need a defender and wide midfielder');

if (managerCenterBack && roleChangePlayer) {
    const previousTargetX = managerCenterBack.target.x;
    const tacticalChange = managerActionEngine.applyTacticalChange('home', {
        formation: '4-3-3',
        style: 'low_block',
        mentality: 'defensive',
        press: 24,
    }, 'protect_lead');
    const roleChange = managerActionEngine.applyRoleChange(roleChangePlayer.id, Position.RB, 'protect_right_side');
    const managerReport = new RealTimeReporter(managerActionEngine).getReport();

    assert.equal(tacticalChange.type, 'tactical_change', 'manager tactical changes should emit an explanatory event');
    assert.equal(managerActionEngine.state.tactics.home.formation, '4-3-3', 'manager tactical changes should update formation');
    assert.equal(managerActionEngine.state.tactics.home.style, 'low_block', 'manager tactical changes should update team style');
    assert.ok(managerCenterBack.target.x < previousTargetX, 'manager tactical changes should immediately alter team shape');
    assert.equal(roleChange?.type, 'role_change', 'manager role changes should emit an explanatory event');
    assert.equal(roleChangePlayer.role, Position.RB, 'manager role changes should update the player role');
    assert.ok(managerReport.sections.some((section) => section.title === 'Manager impact' && section.text.includes('tactical change')), 'reports should explain manager tactical changes');
}

const longShotEngine = new RealTimeEngine(homeTeam, awayTeam, {
    matchLengthSeconds: 10,
    random: queuedRandom([0.99, 0, 0.5, 0.5]),
});
longShotEngine.start();

const longShotMidfielder = longShotEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RCM);

assert.ok(longShotMidfielder, 'the long-shot scenario needs a midfielder');

if (longShotMidfielder) {
    longShotMidfielder.x = 80.5;
    longShotMidfielder.y = 34;
    longShotMidfielder.actionCooldown = 0;
    longShotEngine.state.ball.owner = longShotMidfielder;
    longShotEngine.state.ball.x = longShotMidfielder.x;
    longShotEngine.state.ball.y = longShotMidfielder.y;
    longShotEngine.tick();
}

assert.ok(longShotEngine.events.some((event) => event.type === 'shot' && event.outcome === 'long_shot'), 'midfielders should be able to create long-shot scoring routes');

const goalkeeperEngine = new RealTimeEngine(homeTeam, awayTeam, {
    matchLengthSeconds: 10,
    random: queuedRandom([0.99, 0]),
});
goalkeeperEngine.start();

const cornerTaker = goalkeeperEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RM);
const cornerTarget = goalkeeperEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RF);
const goalkeeper = goalkeeperEngine.state.players.find((player) => player.side === 'away' && player.role === Position.GK);

assert.ok(cornerTaker && cornerTarget && goalkeeper, 'the goalkeeper claim scenario needs a taker, target, and goalkeeper');

if (cornerTaker && cornerTarget && goalkeeper) {
    goalkeeper.x = 98;
    goalkeeper.y = 34;
    goalkeeperEngine.state.ball.owner = null;
    goalkeeperEngine.state.ball.x = 98;
    goalkeeperEngine.state.ball.y = 34;
    goalkeeperEngine.state.ball.velocity = { x: 0, y: 0 };
    goalkeeperEngine.state.activeBallAction = {
        type: 'pass',
        from: cornerTaker,
        teamSide: 'home',
        target: {
            x: cornerTarget.x,
            y: cornerTarget.y,
        },
        targetPlayer: cornerTarget,
        inaccurate: false,
        quality: 0.5,
        route: 'penalty_spot',
        restartType: 'corner',
    };
    goalkeeperEngine.tick();
}

assert.ok(goalkeeperEngine.events.some((event) => event.type === 'goalkeeper_claim'), 'goalkeepers should be able to claim crosses and corners');

const dribbleEngine = new RealTimeEngine(homeTeam, awayTeam, {
    matchLengthSeconds: 10,
    random: queuedRandom([0.99, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.99, 0]),
});
dribbleEngine.start();

const dribbler = dribbleEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RCM);

assert.ok(dribbler, 'the dribble scenario needs a midfielder');

if (dribbler) {
    dribbler.x = 50;
    dribbler.y = 34;
    dribbler.actionCooldown = 0;
    dribbleEngine.state.ball.owner = dribbler;
    dribbleEngine.state.ball.x = dribbler.x;
    dribbleEngine.state.ball.y = dribbler.y;
    dribbleEngine.tick();
}

assert.ok(dribbleEngine.events.some((event) => event.type === 'dribble'), 'ball carriers should be able to dribble into space');

const halfTimeEngine = new RealTimeEngine(homeTeam, awayTeam, {
    matchLengthSeconds: 120,
    random: seededRandom(99),
    awayTactics: {
        formation: '4-3-3',
    },
});
halfTimeEngine.start();
halfTimeEngine.state.time = 59.75;
halfTimeEngine.state.addedTime.firstHalf = 0;
const halfTimeSnapshot = halfTimeEngine.tick().snapshot;
const secondHalfHomeGoalkeeper = halfTimeSnapshot.players.find((player) => player.teamSide === 'home' && player.role === Position.GK);
const secondHalfAwayGoalkeeper = halfTimeSnapshot.players.find((player) => player.teamSide === 'away' && player.role === Position.GK);
const secondHalfHomeForward = halfTimeSnapshot.players.find((player) => player.teamSide === 'home' && player.role === Position.RF);
const secondHalfAwayForward = halfTimeSnapshot.players.find((player) => player.teamSide === 'away' && player.role === Position.RW);

assert.equal(halfTimeSnapshot.period, 2, 'the engine should enter the second period at half-time');
assert.ok(secondHalfHomeGoalkeeper && secondHalfHomeGoalkeeper.x > 85, 'home goalkeeper should switch ends for the second half');
assert.ok(secondHalfAwayGoalkeeper && secondHalfAwayGoalkeeper.x < 20, 'away goalkeeper should switch ends for the second half');
assert.ok(secondHalfHomeForward && secondHalfHomeForward.x < 35, 'home forwards should attack the opposite goal in the second half');
assert.ok(secondHalfAwayForward && secondHalfAwayForward.x > 70, 'away forwards should attack the opposite goal in the second half');

const partialClockEngine = new RealTimeEngine(homeTeam, awayTeam, {
    matchLengthSeconds: 120,
    random: seededRandom(199),
});
const firstPartialSnapshots = partialClockEngine.simulate(10);

assert.equal(firstPartialSnapshots[firstPartialSnapshots.length - 1]?.time, 10, 'partial simulation should stop at the requested absolute time');
assert.equal(partialClockEngine.state.period, 1, 'partial simulation should leave the match active');
assert.equal(partialClockEngine.events.some((event) => event.type === 'full_time'), false, 'partial simulation should not emit full time');

const firstPartialSnapshotCount = partialClockEngine.snapshots.length;
partialClockEngine.simulate(10);
assert.equal(partialClockEngine.snapshots.length, firstPartialSnapshotCount, 'repeating the same partial target should not advance the match');

partialClockEngine.simulate(20);
assert.equal(partialClockEngine.state.time, 20, 'a later partial target should continue the same match');

partialClockEngine.simulate();
assert.equal(partialClockEngine.state.period, 'ended', 'a full simulation should finish after earlier partial runs');
assert.equal(partialClockEngine.state.phase, 'full_time', 'a full simulation should expose the terminal phase');
assert.equal(partialClockEngine.events.filter((event) => event.type === 'full_time').length, 1, 'a completed match should emit full time exactly once');

const completedSnapshotCount = partialClockEngine.snapshots.length;
partialClockEngine.simulate();
assert.equal(partialClockEngine.snapshots.length, completedSnapshotCount, 'simulating an ended match should be a no-op');

const firstHalfAddedTimeEngine = new RealTimeEngine(homeTeam, awayTeam, {
    tickSeconds: 0.25,
    matchLengthSeconds: 120,
    random: seededRandom(200),
});
firstHalfAddedTimeEngine.start();
firstHalfAddedTimeEngine.state.time = 69.75;
firstHalfAddedTimeEngine.state.addedTime.firstHalf = 10;
const addedHalfTimeSnapshot = firstHalfAddedTimeEngine.tick().snapshot;

assert.equal(addedHalfTimeSnapshot.time, 70, 'first-half stoppage time should extend the half-time boundary');
assert.equal(addedHalfTimeSnapshot.phase, 'half_time', 'the extended first half should still end at half time');

firstHalfAddedTimeEngine.state.time = 129.75;
const addedFullTimeSnapshot = firstHalfAddedTimeEngine.tick().snapshot;

assert.equal(addedFullTimeSnapshot.time, 130, 'first-half stoppage time should not shorten the second half');
assert.equal(addedFullTimeSnapshot.phase, 'full_time', 'the match should finish after both full halves are played');

const secondHalfAddedTimeEngine = new RealTimeEngine(homeTeam, awayTeam, {
    tickSeconds: 0.25,
    matchLengthSeconds: 120,
    random: seededRandom(201),
});
secondHalfAddedTimeEngine.start();
secondHalfAddedTimeEngine.state.period = 2;
secondHalfAddedTimeEngine.state.phase = 'open_play';
secondHalfAddedTimeEngine.state.time = 129.75;
secondHalfAddedTimeEngine.state.addedTime.secondHalf = 10;
secondHalfAddedTimeEngine.simulate(120);

assert.equal(secondHalfAddedTimeEngine.state.time, 130, 'an explicit regulation-length simulation should include second-half stoppage time');
assert.equal(secondHalfAddedTimeEngine.state.period, 'ended', 'second-half stoppage time should end with a completed match');
assert.equal(secondHalfAddedTimeEngine.events.filter((event) => event.type === 'full_time').length, 1, 'second-half stoppage time should emit one full-time event');

const shuffledHomeTeam = createTeam(true, 'Shuffled Home', [
    Position.RF,
    Position.RCM,
    Position.GK,
    Position.LB,
    Position.RB,
    Position.LM,
    Position.LCB,
    Position.RCB,
    Position.RM,
    Position.LCM,
    Position.LF,
]);
const shuffledEngine = new RealTimeEngine(shuffledHomeTeam, awayTeam);
const shuffledGoalkeeper = shuffledEngine.state.players.find((player) => player.side === 'home' && player.role === Position.GK);
const shuffledForward = shuffledEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RF);
const shuffledDefender = shuffledEngine.state.players.find((player) => player.side === 'home' && player.role === Position.LB);

assert.ok(shuffledGoalkeeper && shuffledGoalkeeper.x < 20, 'role-aware placement should keep a shuffled goalkeeper near goal');
assert.ok(shuffledForward && shuffledDefender && shuffledForward.x > shuffledDefender.x + 30, 'role-aware placement should keep shuffled forwards ahead of defenders');

const shootingEngine = new RealTimeEngine(createTeam(true, 'Shot Home', [
    Position.GK,
    Position.LB,
    Position.LCB,
    Position.RCB,
    Position.RB,
    Position.LM,
    Position.LCM,
    Position.RCM,
    Position.RM,
    Position.LF,
    Position.RF,
]), createTeam(false, 'Shot Away', [
    Position.GK,
    Position.LB,
    Position.LCB,
    Position.RCB,
    Position.RB,
    Position.LCM,
    Position.CM,
    Position.RCM,
    Position.LW,
    Position.CF,
    Position.RW,
]), {
    matchLengthSeconds: 10,
    random: queuedRandom([0.99, 0, 0.5, 0, 0.99]),
});
shootingEngine.start();

const shooter = shootingEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RF);

assert.ok(shooter, 'the forced shooting scenario needs a home forward');

if (shooter) {
    shooter.x = 96;
    shooter.y = 34;
    shooter.actionCooldown = 0;
    shootingEngine.state.ball.owner = shooter;
    shootingEngine.state.ball.x = shooter.x;
    shootingEngine.state.ball.y = shooter.y;
    shootingEngine.tick();
    shootingEngine.tick();
}

assert.ok(shootingEngine.events.some((event) => event.type === 'shot'), 'forced attacking state should produce a shot event');
assert.ok(shootingEngine.events.some((event) => event.type === 'goal'), 'forced on-target shot should produce a goal event');
assert.ok(shootingEngine.events.some((event) => event.type === 'goal' && event.replayWindow && event.replayWindow.startTime <= event.time && event.replayWindow.endTime >= event.time), 'goal events should expose a replay window around the scoring event');
assert.equal(shootingEngine.state.score.home, 1, 'forced home goal should update the score');
assert.ok(shootingEngine.state.addedTime.firstHalf > 0, 'goals should add stoppage time');
assert.equal(shootingEngine.state.ball.owner?.side, 'away', 'conceding team should restart after a goal');
assert.equal(shootingEngine.state.ball.x, 105 / 2, 'goal restart should put the ball on the center spot');
assert.ok(shooter && shooter.x < 90, 'goal restart should reset the scorer back into team shape');

const foulEngine = new RealTimeEngine(createTeam(true, 'Foul Home', [
    Position.GK,
    Position.LB,
    Position.LCB,
    Position.RCB,
    Position.RB,
    Position.LM,
    Position.LCM,
    Position.RCM,
    Position.RM,
    Position.LF,
    Position.RF,
]), createTeam(false, 'Foul Away', [
    Position.GK,
    Position.LB,
    Position.LCB,
    Position.RCB,
    Position.RB,
    Position.LCM,
    Position.CM,
    Position.RCM,
    Position.LW,
    Position.CF,
    Position.RW,
]), {
    tickSeconds: 0.01,
    matchLengthSeconds: 10,
    random: queuedRandom([0.99, 0]),
});
foulEngine.start();

const fouledPlayer = foulEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RF);
const foulingPlayer = foulEngine.state.players.find((player) => player.side === 'away' && player.role === Position.LCB);

assert.ok(fouledPlayer && foulingPlayer, 'the forced foul scenario needs a carrier and defender');

if (fouledPlayer && foulingPlayer) {
    fouledPlayer.x = 52;
    fouledPlayer.y = 34;
    fouledPlayer.actionCooldown = 5;
    foulingPlayer.x = 52.2;
    foulingPlayer.y = 34;
    foulEngine.state.ball.owner = fouledPlayer;
    foulEngine.state.ball.x = fouledPlayer.x;
    foulEngine.state.ball.y = fouledPlayer.y;
    foulEngine.tick();
}

assert.ok(foulEngine.events.some((event) => event.type === 'foul'), 'close defensive pressure should be able to produce a foul event');
assert.ok(foulEngine.events.some((event) => event.type === 'free_kick'), 'fouls outside the box should create a free-kick restart');

const penaltyEngine = new RealTimeEngine(createTeam(true, 'Penalty Home', [
    Position.GK,
    Position.LB,
    Position.LCB,
    Position.RCB,
    Position.RB,
    Position.LM,
    Position.LCM,
    Position.RCM,
    Position.RM,
    Position.LF,
    Position.RF,
]), createTeam(false, 'Penalty Away', [
    Position.GK,
    Position.LB,
    Position.LCB,
    Position.RCB,
    Position.RB,
    Position.LCM,
    Position.CM,
    Position.RCM,
    Position.LW,
    Position.CF,
    Position.RW,
]), {
    tickSeconds: 0.01,
    matchLengthSeconds: 10,
    random: queuedRandom([0.99, 0, 0.99, 0.99, 0]),
});
penaltyEngine.start();

const penaltyCarrier = penaltyEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RF);
const penaltyDefender = penaltyEngine.state.players.find((player) => player.side === 'away' && player.role === Position.LCB);

assert.ok(penaltyCarrier && penaltyDefender, 'the penalty scenario needs a carrier and defender');

if (penaltyCarrier && penaltyDefender) {
    penaltyCarrier.x = 96;
    penaltyCarrier.y = 34;
    penaltyCarrier.actionCooldown = 5;
    penaltyDefender.x = 96.2;
    penaltyDefender.y = 34;
    penaltyEngine.state.ball.owner = penaltyCarrier;
    penaltyEngine.state.ball.x = penaltyCarrier.x;
    penaltyEngine.state.ball.y = penaltyCarrier.y;
    penaltyEngine.tick();
    penaltyEngine.tick();
}

assert.ok(penaltyEngine.events.some((event) => event.type === 'penalty' && event.outcome === 'penalty_foul'), 'box fouls should award penalties');
assert.ok(penaltyEngine.events.some((event) => event.type === 'penalty' && event.outcome === 'goal'), 'penalties should execute with goal/save/miss outcomes');
assert.ok(penaltyEngine.events.some((event) => event.type === 'goal' && event.outcome === 'penalty_goal'), 'scored penalties should emit a regular goal event');

const advantageEngine = new RealTimeEngine(createTeam(true, 'Advantage Home', [
    Position.GK,
    Position.LB,
    Position.LCB,
    Position.RCB,
    Position.RB,
    Position.LM,
    Position.LCM,
    Position.RCM,
    Position.RM,
    Position.LF,
    Position.RF,
]), createTeam(false, 'Advantage Away', [
    Position.GK,
    Position.LB,
    Position.LCB,
    Position.RCB,
    Position.RB,
    Position.LCM,
    Position.CM,
    Position.RCM,
    Position.LW,
    Position.CF,
    Position.RW,
]), {
    tickSeconds: 0.01,
    matchLengthSeconds: 10,
    random: queuedRandom([0.99, 0, 0.99, 0.99]),
});
advantageEngine.start();

const advantageCarrier = advantageEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RF);
const advantageSupport = advantageEngine.state.players.find((player) => player.side === 'home' && player.role === Position.LF);
const advantageDefender = advantageEngine.state.players.find((player) => player.side === 'away' && player.role === Position.LCB);

assert.ok(advantageCarrier && advantageSupport && advantageDefender, 'the advantage scenario needs a carrier, support runner, and defender');

if (advantageCarrier && advantageSupport && advantageDefender) {
    advantageCarrier.x = 82;
    advantageCarrier.y = 34;
    advantageCarrier.actionCooldown = 5;
    advantageSupport.x = 84;
    advantageSupport.y = 39;
    advantageDefender.x = 82.2;
    advantageDefender.y = 34;
    advantageEngine.state.ball.owner = advantageCarrier;
    advantageEngine.state.ball.x = advantageCarrier.x;
    advantageEngine.state.ball.y = advantageCarrier.y;
    advantageEngine.tick();
}

assert.ok(advantageEngine.events.some((event) => event.type === 'advantage'), 'referees should be able to play advantage instead of stopping every foul');
assert.equal(advantageEngine.events.some((event) => event.type === 'free_kick'), false, 'advantage should avoid an immediate free-kick restart');

const cardEngine = new RealTimeEngine(createTeam(true, 'Card Home', [
    Position.GK,
    Position.LB,
    Position.LCB,
    Position.RCB,
    Position.RB,
    Position.LM,
    Position.LCM,
    Position.RCM,
    Position.RM,
    Position.LF,
    Position.RF,
]), createTeam(false, 'Card Away', [
    Position.GK,
    Position.LB,
    Position.LCB,
    Position.RCB,
    Position.RB,
    Position.LCM,
    Position.CM,
    Position.RCM,
    Position.LW,
    Position.CF,
    Position.RW,
]), {
    tickSeconds: 0.01,
    matchLengthSeconds: 10,
    random: queuedRandom([0.99, 0, 0, 0.99]),
});
cardEngine.start();

const cardedCarrier = cardEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RF);
const cardedDefender = cardEngine.state.players.find((player) => player.side === 'away' && player.role === Position.LCB);

assert.ok(cardedCarrier && cardedDefender, 'the forced card scenario needs a carrier and defender');

if (cardedCarrier && cardedDefender) {
    cardedCarrier.x = 52;
    cardedCarrier.y = 34;
    cardedCarrier.actionCooldown = 5;
    cardedDefender.x = 52.2;
    cardedDefender.y = 34;
    cardedDefender.yellowCards = 1;
    cardedDefender.foulsCommitted = 2;
    cardEngine.state.ball.owner = cardedCarrier;
    cardEngine.state.ball.x = cardedCarrier.x;
    cardEngine.state.ball.y = cardedCarrier.y;
    cardEngine.tick();
}

assert.ok(cardEngine.events.some((event) => event.type === 'yellow_card'), 'reckless fouls should be bookable');
assert.ok(cardEngine.events.some((event) => event.type === 'red_card'), 'a second yellow should become a red card');
assert.equal(cardEngine.state.players.some((player) => player === cardedDefender), false, 'red-carded players should leave the pitch');

const injuryEngine = new RealTimeEngine(createTeam(true, 'Injury Home', [
    Position.GK,
    Position.LB,
    Position.LCB,
    Position.RCB,
    Position.RB,
    Position.LM,
    Position.LCM,
    Position.RCM,
    Position.RM,
    Position.LF,
    Position.RF,
]), createTeam(false, 'Injury Away', [
    Position.GK,
    Position.LB,
    Position.LCB,
    Position.RCB,
    Position.RB,
    Position.LCM,
    Position.CM,
    Position.RCM,
    Position.LW,
    Position.CF,
    Position.RW,
]), {
    tickSeconds: 0.01,
    matchLengthSeconds: 10,
    random: queuedRandom([0.99, 0, 0.99, 0, 0]),
});
injuryEngine.start();

const injuredCarrier = injuryEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RF);
const injuryDefender = injuryEngine.state.players.find((player) => player.side === 'away' && player.role === Position.LCB);

assert.ok(injuredCarrier && injuryDefender, 'the forced injury scenario needs a carrier and defender');

if (injuredCarrier && injuryDefender) {
    injuredCarrier.x = 52;
    injuredCarrier.y = 34;
    injuredCarrier.actionCooldown = 5;
    injuryDefender.x = 52.2;
    injuryDefender.y = 34;
    injuryEngine.state.ball.owner = injuredCarrier;
    injuryEngine.state.ball.x = injuredCarrier.x;
    injuryEngine.state.ball.y = injuredCarrier.y;
    injuryEngine.tick();
}

assert.ok(injuryEngine.events.some((event) => event.type === 'injury' && event.outcome === 'forced'), 'heavy challenges should be able to force an injury');
assert.ok(injuryEngine.events.some((event) => event.type === 'substitution' && event.outcome === 'forced_injury'), 'forced injuries should trigger a substitution when a bench player is available');
assert.equal(injuryEngine.state.players.length, 22, 'injury substitutions should preserve the number of players on the pitch');
assert.equal(injuryEngine.state.substitutionOpportunitiesUsed.home + injuryEngine.state.substitutionOpportunitiesUsed.away, 1, 'a forced-injury replacement should use one substitution opportunity');

const substitutionEngine = new RealTimeEngine(homeTeam, awayTeam, {
    matchLengthSeconds: 90 * 60,
    random: seededRandom(13),
});
substitutionEngine.start();
substitutionEngine.state.period = 2;
substitutionEngine.state.time = 65 * 60;

const exhaustedPlayer = substitutionEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RM);

assert.ok(exhaustedPlayer, 'the planned substitution scenario needs an exhausted player');

if (exhaustedPlayer) {
    exhaustedPlayer.stamina = 20;
    const substitutionSlice = substitutionEngine.tick();

    assert.ok(substitutionSlice.events.some((event) => event.type === 'substitution' && event.outcome === 'exhausted'), 'exhausted players should match substitution criteria');
    assert.equal(substitutionSlice.snapshot.phase, 'substitution', 'planned substitutions should expose the substitution phase');
    assert.equal(substitutionEngine.state.phase, 'open_play', 'substitution stoppages should return to open play');
}

const fullSquadPositions = [
    Position.GK,
    Position.LB,
    Position.LCB,
    Position.RCB,
    Position.RB,
    Position.LM,
    Position.LCM,
    Position.RCM,
    Position.RM,
    Position.LF,
    Position.RF,
    Position.GK,
    Position.LB,
    Position.CB,
    Position.RB,
    Position.LM,
    Position.CM,
    Position.RM,
    Position.LW,
    Position.ST,
    Position.RW,
    Position.CF,
];
const fullSquadEngine = new RealTimeEngine(
    createTeam(true, 'Full Squad Home', fullSquadPositions),
    createTeam(false, 'Full Squad Away', fullSquadPositions),
    { random: () => 0.99 },
);

assert.equal(fullSquadEngine.state.bench.home.length, 11, 'all supplied named substitutes should be available up to the competition limit');

const oversizedSquadEngine = new RealTimeEngine(
    createTeam(true, 'Oversized Squad Home', [...fullSquadPositions, Position.GK, Position.CB, Position.CM, Position.RM, Position.ST]),
    createTeam(false, 'Oversized Squad Away', fullSquadPositions),
);

assert.equal(oversizedSquadEngine.state.bench.home.length, 15, 'the named bench should be capped at fifteen players');

fullSquadEngine.start();
fullSquadEngine.state.period = 2;
fullSquadEngine.state.phase = 'open_play';
fullSquadEngine.state.time = 65 * 60;

const tiredMidfielders = fullSquadEngine.state.players
    .filter((player) => [Position.LCM, Position.RCM].includes(player.role));

tiredMidfielders.forEach((player) => {
    player.stamina = 20;
});

const batchSubstitutionSlice = fullSquadEngine.tick();
const batchSubstitutions = batchSubstitutionSlice.events.filter((event) => event.type === 'substitution');

assert.equal(batchSubstitutions.filter((event) => event.teamSide === 'home').length, 2, 'multiple eligible home replacements should share one substitution opportunity');
assert.equal(batchSubstitutions.filter((event) => event.teamSide === 'away').length, 2, 'both teams should be able to make changes at the same stoppage');
assert.equal(fullSquadEngine.state.substitutionOpportunitiesUsed.home, 1, 'a home batch should count as one substitution opportunity');
assert.equal(fullSquadEngine.state.substitutionOpportunitiesUsed.away, 1, 'an away batch should count as one substitution opportunity');

const opportunityEngine = new RealTimeEngine(
    createTeam(true, 'Opportunity Home', fullSquadPositions),
    createTeam(false, 'Opportunity Away', fullSquadPositions),
    { random: () => 0.99 },
);
opportunityEngine.start();
opportunityEngine.state.period = 2;
opportunityEngine.state.phase = 'open_play';

const opportunityStarters = opportunityEngine.state.players
    .filter((player) => player.side === 'home' && player.role !== Position.GK)
    .slice(0, 6);
const opportunityGroups = [
    opportunityStarters.slice(0, 2),
    opportunityStarters.slice(2, 4),
    opportunityStarters.slice(4, 5),
    opportunityStarters.slice(5, 6),
];

opportunityGroups.forEach((players, index) => {
    players.forEach((player) => {
        player.stamina = 20;
    });
    opportunityEngine.state.time = (60 + index * 5) * 60;
    opportunityEngine.state.phase = 'open_play';
    opportunityEngine.tick();
});

const opportunitySubstitutions = opportunityEngine.events.filter((event) => event.type === 'substitution' && event.teamSide === 'home');
const opportunityTimes = new Set(opportunitySubstitutions.map((event) => event.time));

assert.equal(opportunitySubstitutions.length, 5, 'a team should be able to use five replacements across its available opportunities');
assert.equal(opportunityTimes.size, 3, 'five replacements should use no more than three substitution opportunities');
assert.equal(opportunityEngine.state.substitutionOpportunitiesUsed.home, 3, 'a team should be limited to three substitution opportunities');

const positionChoiceEngine = new RealTimeEngine(
    createTeam(true, 'Position Choice Home', [
        ...homeTeam.players.map((player) => player.position),
        Position.GK,
        Position.CM,
    ]),
    awayTeam,
    { random: () => 0.99 },
);
positionChoiceEngine.start();
positionChoiceEngine.state.period = 2;
positionChoiceEngine.state.phase = 'open_play';
positionChoiceEngine.state.time = 65 * 60;

const tiredForward = positionChoiceEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RF);

assert.ok(tiredForward, 'the position-choice scenario needs a tiring forward');

if (tiredForward) {
    tiredForward.stamina = 20;
    const positionChoiceSlice = positionChoiceEngine.tick();
    const positionChoiceSubstitution = positionChoiceSlice.events.find((event) => event.type === 'substitution');

    assert.equal(positionChoiceSubstitution?.player?.position, Position.CM, 'an outfield replacement should be preferred over a reserve goalkeeper');
}

const chasingGoalEngine = new RealTimeEngine(homeTeam, awayTeam, { random: () => 0.99 });
chasingGoalEngine.start();
chasingGoalEngine.state.period = 2;
chasingGoalEngine.state.phase = 'open_play';
chasingGoalEngine.state.time = 70 * 60;
chasingGoalEngine.state.score.home = 0;
chasingGoalEngine.state.score.away = 1;

const chasingGoalForwards = chasingGoalEngine.state.players
    .filter((player) => player.side === 'home' && attackPositions.includes(player.role));

chasingGoalForwards.forEach((player, index) => {
    player.stamina = index === 0 ? 60 : 100;
});

const firstChasingGoalSlice = chasingGoalEngine.tick();
const secondChasingGoalSlice = chasingGoalEngine.tick();

assert.equal(firstChasingGoalSlice.events.filter((event) => event.type === 'substitution').length, 1, 'a tiring forward should be replaced when chasing a goal');
assert.equal(secondChasingGoalSlice.events.some((event) => event.type === 'substitution'), false, 'a fresh replacement should not trigger an immediate substitution cascade');

const tackleEngine = new RealTimeEngine(createTeam(true, 'Tackle Home', [
    Position.GK,
    Position.LB,
    Position.LCB,
    Position.RCB,
    Position.RB,
    Position.LM,
    Position.LCM,
    Position.RCM,
    Position.RM,
    Position.LF,
    Position.RF,
]), createTeam(false, 'Tackle Away', [
    Position.GK,
    Position.LB,
    Position.LCB,
    Position.RCB,
    Position.RB,
    Position.LCM,
    Position.CM,
    Position.RCM,
    Position.LW,
    Position.CF,
    Position.RW,
]), {
    tickSeconds: 0.01,
    matchLengthSeconds: 10,
    random: queuedRandom([0.99, 0.99, 0]),
});
tackleEngine.start();

const tackledPlayer = tackleEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RF);
const tackler = tackleEngine.state.players.find((player) => player.side === 'away' && player.role === Position.LCB);

assert.ok(tackledPlayer && tackler, 'the forced tackle scenario needs a carrier and defender');

if (tackledPlayer && tackler) {
    tackledPlayer.x = 52;
    tackledPlayer.y = 34;
    tackledPlayer.actionCooldown = 5;
    tackler.x = 52.2;
    tackler.y = 34;
    tackleEngine.state.ball.owner = tackledPlayer;
    tackleEngine.state.ball.x = tackledPlayer.x;
    tackleEngine.state.ball.y = tackledPlayer.y;
    tackleEngine.tick();
}

assert.ok(tackleEngine.events.some((event) => event.type === 'tackle'), 'close defensive pressure should be able to produce a tackle event');

const interceptionEngine = new RealTimeEngine(createTeam(true, 'Pass Home', [
    Position.GK,
    Position.LB,
    Position.LCB,
    Position.RCB,
    Position.RB,
    Position.LM,
    Position.LCM,
    Position.RCM,
    Position.RM,
    Position.LF,
    Position.RF,
]), createTeam(false, 'Pass Away', [
    Position.GK,
    Position.LB,
    Position.LCB,
    Position.RCB,
    Position.RB,
    Position.LCM,
    Position.CM,
    Position.RCM,
    Position.LW,
    Position.CF,
    Position.RW,
]), {
    matchLengthSeconds: 10,
    random: queuedRandom([0.99]),
});
interceptionEngine.start();

const passer = interceptionEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RF);
const receiver = interceptionEngine.state.players.find((player) => player.side === 'home' && player.role === Position.LF);
const interceptor = interceptionEngine.state.players.find((player) => player.side === 'away' && player.role === Position.LCB);

assert.ok(passer && receiver && interceptor, 'the forced interception scenario needs a passer, receiver, and defender');

if (passer && receiver && interceptor) {
    passer.x = 50;
    passer.y = 34;
    receiver.x = 64;
    receiver.y = 34;
    interceptor.x = 56;
    interceptor.y = 34;
    interceptionEngine.state.ball.owner = null;
    interceptionEngine.state.ball.x = interceptor.x;
    interceptionEngine.state.ball.y = interceptor.y;
    interceptionEngine.state.ball.velocity = { x: 0, y: 0 };
    interceptionEngine.state.activeBallAction = {
        type: 'pass',
        from: passer,
        teamSide: 'home',
        target: {
            x: receiver.x,
            y: receiver.y,
        },
        targetPlayer: receiver,
        inaccurate: true,
        quality: 0.2,
    };
    interceptionEngine.tick();
}

assert.ok(interceptionEngine.events.some((event) => event.type === 'interception'), 'loose inaccurate passes should be interceptable');

const receiveIntentEngine = new RealTimeEngine(homeTeam, awayTeam, {
    tickSeconds: 0.25,
    matchLengthSeconds: 10,
    random: queuedRandom([0.99]),
});
receiveIntentEngine.start();

const receiveIntentPasser = receiveIntentEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RCM);
const movingReceiver = receiveIntentEngine.state.players.find((player) => player.side === 'home' && player.role === Position.LCM);

assert.ok(receiveIntentPasser && movingReceiver, 'the receive-intent scenario needs a passer and receiver');

if (receiveIntentPasser && movingReceiver) {
    receiveIntentPasser.x = 45;
    receiveIntentPasser.y = 34;
    movingReceiver.x = 48;
    movingReceiver.y = 34;
    receiveIntentEngine.state.ball.owner = null;
    receiveIntentEngine.state.ball.x = receiveIntentPasser.x;
    receiveIntentEngine.state.ball.y = receiveIntentPasser.y;
    receiveIntentEngine.state.ball.velocity = velocityTowards(receiveIntentPasser, { x: 56, y: 34 }, 8);
    receiveIntentEngine.state.activeBallAction = {
        type: 'pass',
        from: receiveIntentPasser,
        teamSide: 'home',
        origin: {
            x: receiveIntentPasser.x,
            y: receiveIntentPasser.y,
        },
        target: {
            x: 56,
            y: 34,
        },
        targetPlayer: movingReceiver,
        inaccurate: false,
        quality: 0.9,
        estimatedArrivalTime: receiveIntentEngine.state.time + 1.4,
        passSpeed: 8,
        receiveDifficulty: 0.12,
        targetKind: 'feet',
        route: 'lateral_support',
    };

    const receiveIntentSlice = receiveIntentEngine.tick();
    const receiverSnapshot = receiveIntentSlice.snapshot.players.find((player) => player.id === movingReceiver.id);

    assert.equal(receiverSnapshot?.currentIntent.type, 'receive_pass', 'the intended receiver should commit to the pass target');
    assert.ok(receiverSnapshot && receiverSnapshot.x > 48, 'the intended receiver should move toward the pass target while the ball travels');
}

const cleanPassEngine = new RealTimeEngine(homeTeam, awayTeam, {
    tickSeconds: 0.25,
    matchLengthSeconds: 10,
    random: queuedRandom([0.99, 0]),
});
cleanPassEngine.start();

const cleanPasser = cleanPassEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RCM);
const cleanReceiver = cleanPassEngine.state.players.find((player) => player.side === 'home' && player.role === Position.LCM);

assert.ok(cleanPasser && cleanReceiver, 'the clean-pass scenario needs a passer and receiver');

if (cleanPasser && cleanReceiver) {
    cleanPasser.x = 45;
    cleanPasser.y = 34;
    cleanReceiver.x = 50;
    cleanReceiver.y = 34;
    cleanPassEngine.state.ball.owner = null;
    cleanPassEngine.state.ball.x = cleanPasser.x;
    cleanPassEngine.state.ball.y = cleanPasser.y;
    cleanPassEngine.state.ball.velocity = velocityTowards(cleanPasser, cleanReceiver, 20);
    cleanPassEngine.state.activeBallAction = {
        type: 'pass',
        from: cleanPasser,
        teamSide: 'home',
        origin: {
            x: cleanPasser.x,
            y: cleanPasser.y,
        },
        target: {
            x: cleanReceiver.x,
            y: cleanReceiver.y,
        },
        targetPlayer: cleanReceiver,
        inaccurate: false,
        quality: 0.95,
        estimatedArrivalTime: cleanPassEngine.state.time + 0.25,
        passSpeed: 20,
        receiveDifficulty: 0.08,
        targetKind: 'feet',
        route: 'lateral_support',
    };
    cleanPassEngine.tick();
}

assert.ok(cleanPassEngine.events.some((event) => event.type === 'receive' && event.playerId === cleanReceiver?.id), 'an unpressured short pass should be received cleanly');

const throughReceiveEngine = new RealTimeEngine(homeTeam, awayTeam, {
    tickSeconds: 0.25,
    matchLengthSeconds: 10,
    random: queuedRandom([0.99, 0]),
});
throughReceiveEngine.start();

const throughPasser = throughReceiveEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RCM);
const throughReceiver = throughReceiveEngine.state.players.find((player) => player.side === 'home' && player.role === Position.LF);

assert.ok(throughPasser && throughReceiver, 'the through-ball receive scenario needs a passer and runner');

if (throughPasser && throughReceiver) {
    throughPasser.x = 62;
    throughPasser.y = 34;
    throughReceiver.x = 74;
    throughReceiver.y = 34;
    throughReceiveEngine.state.ball.owner = null;
    throughReceiveEngine.state.ball.x = throughReceiver.x;
    throughReceiveEngine.state.ball.y = throughReceiver.y;
    throughReceiveEngine.state.ball.velocity = { x: 0, y: 0 };
    throughReceiveEngine.state.activeBallAction = {
        type: 'pass',
        from: throughPasser,
        teamSide: 'home',
        origin: {
            x: throughPasser.x,
            y: throughPasser.y,
        },
        target: {
            x: throughReceiver.x,
            y: throughReceiver.y,
        },
        targetPlayer: throughReceiver,
        inaccurate: false,
        quality: 0.92,
        estimatedArrivalTime: throughReceiveEngine.state.time,
        passSpeed: 16,
        receiveDifficulty: 0.18,
        targetKind: 'space',
        route: 'through_ball',
    };
    throughReceiveEngine.tick();
}

assert.ok(throughReceiveEngine.events.some((event) => event.type === 'receive' && event.playerId === throughReceiver?.id), 'a well-weighted through ball should be receivable in stride');

const offsideEngine = new RealTimeEngine(homeTeam, awayTeam, {
    tickSeconds: 0.25,
    matchLengthSeconds: 10,
    random: () => 0,
});
offsideEngine.start();

const offsidePasser = offsideEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RCM);
const offsideReceiver = offsideEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RF);
const offsideDefenders = offsideEngine.state.players.filter((player) => player.side === 'away');

assert.ok(offsidePasser && offsideReceiver && offsideDefenders.length >= 2, 'the offside scenario needs a passer, receiver, and defensive line');

if (offsidePasser && offsideReceiver) {
    offsidePasser.x = 60;
    offsidePasser.y = 34;
    offsideReceiver.x = 90;
    offsideReceiver.y = 34;
    offsideDefenders.forEach((player, index) => {
        player.x = index === 0 ? 100 : index === 1 ? 80 : 65;
        player.y = index % 2 === 0 ? 4 : 64;
    });
    offsideEngine.state.ball.owner = offsidePasser;
    offsideEngine.state.ball.x = offsidePasser.x;
    offsideEngine.state.ball.y = offsidePasser.y;
    engineInternals(offsideEngine).startPass(offsidePasser, offsideReceiver);

    offsideDefenders.forEach((player) => {
        player.x = 100;
    });
    offsideEngine.state.ball.x = offsideReceiver.x;
    offsideEngine.state.ball.y = offsideReceiver.y;
    offsideEngine.state.ball.velocity = { x: 0, y: 0 };
    offsideEngine.tick();
}

assert.ok(offsideEngine.events.some((event) => (event.type as string) === 'offside' && event.playerId === offsideReceiver?.id), 'a flagged receiver should be penalised when becoming involved');
assert.equal(offsideEngine.events.some((event) => event.type === 'receive' && event.playerId === offsideReceiver?.id), false, 'an offside receiver should not complete the pass');
assert.equal(offsideEngine.state.phase, 'free_kick', 'offside should stop play for an indirect free kick');
assert.equal(offsideEngine.state.restart?.teamSide, 'away', 'offside should award the restart to the defending team');
assert.equal(offsideEngine.state.restart?.reason, 'offside', 'the restart should retain its offside reason');
assert.ok(offsideEngine.events.some((event) => event.type === 'free_kick' && event.outcome === 'offside'), 'offside should emit the defending free-kick award');
assert.equal(new RealTimeReporter(offsideEngine).getReport().teams.home.offsides, 1, 'match reports should count the attacking team offside');

function interferenceAction(
    engine: RealTimeEngine,
    route: string,
): { action: ActiveBallAction, target: RealTimeEngine['state']['players'][number] } {
    const passer = engine.state.players.find((player) => player.side === 'home' && player.role === Position.RCM);
    const target = engine.state.players.find((player) => player.side === 'home' && player.role === Position.RF);

    assert.ok(passer && target, 'offside interference checks need a passer and target');

    if (!passer || !target) {
        throw new Error('Missing offside interference players');
    }

    return {
        target,
        action: {
            type: 'pass',
            from: passer,
            teamSide: 'home',
            origin: { x: passer.x, y: passer.y },
            target: { x: target.x, y: target.y },
            targetPlayer: target,
            inaccurate: false,
            quality: 0.9,
            passSpeed: 18,
            receiveDifficulty: 0.1,
            targetKind: 'space',
            route,
            offsideCandidateIds: [target.id],
        },
    };
}

const sweeperInterferenceEngine = new RealTimeEngine(homeTeam, awayTeam, {
    matchLengthSeconds: 10,
    random: () => 0,
});
sweeperInterferenceEngine.start();
const sweeperScenario = interferenceAction(sweeperInterferenceEngine, 'through_ball');
const sweepingGoalkeeper = sweeperInterferenceEngine.state.players.find((player) => player.side === 'away' && player.role === Position.GK);

assert.ok(sweepingGoalkeeper, 'the sweeper interference check needs a goalkeeper');

if (sweepingGoalkeeper) {
    sweeperScenario.target.x = 96;
    sweeperScenario.target.y = 34;
    sweepingGoalkeeper.x = 97;
    sweepingGoalkeeper.y = 34;
    sweeperInterferenceEngine.state.ball.owner = null;
    sweeperInterferenceEngine.state.ball.x = 96.5;
    sweeperInterferenceEngine.state.ball.y = 34;
    const events = engineInternals(sweeperInterferenceEngine).detectPassOutcome(sweeperScenario.action);

    assert.ok(events.some((event) => event.type === 'offside' && event.outcome === 'interfering_with_opponent'), 'an offside target challenging a sweeping goalkeeper should be penalised');
    assert.equal(events.some((event) => event.type === 'goalkeeper_claim'), false, 'the goalkeeper claim should not replace an earlier offside offence');
}

const interceptorInterferenceEngine = new RealTimeEngine(homeTeam, awayTeam, {
    matchLengthSeconds: 10,
    random: () => 0,
});
interceptorInterferenceEngine.start();
const interceptorScenario = interferenceAction(interceptorInterferenceEngine, 'lateral_support');
const challengingInterceptor = interceptorInterferenceEngine.state.players.find((player) => player.side === 'away' && player.role === Position.LCB);

assert.ok(challengingInterceptor, 'the interceptor interference check needs a defender');

if (challengingInterceptor) {
    interceptorScenario.target.x = 70;
    interceptorScenario.target.y = 34;
    challengingInterceptor.x = 70.5;
    challengingInterceptor.y = 34;
    interceptorInterferenceEngine.state.ball.owner = null;
    interceptorInterferenceEngine.state.ball.x = 70;
    interceptorInterferenceEngine.state.ball.y = 34;
    const events = engineInternals(interceptorInterferenceEngine).detectPassOutcome(interceptorScenario.action);

    assert.ok(events.some((event) => event.type === 'offside' && event.outcome === 'interfering_with_opponent'), 'an offside target challenging an interceptor should be penalised');
    assert.equal(events.some((event) => event.type === 'interception'), false, 'an interception should not replace an earlier offside offence');
}

const passiveOffsideEngine = new RealTimeEngine(homeTeam, awayTeam, {
    matchLengthSeconds: 10,
    random: () => 0,
});
passiveOffsideEngine.start();
const passiveScenario = interferenceAction(passiveOffsideEngine, 'cross');
const claimingGoalkeeper = passiveOffsideEngine.state.players.find((player) => player.side === 'away' && player.role === Position.GK);

assert.ok(claimingGoalkeeper, 'the passive offside check needs a goalkeeper');

if (claimingGoalkeeper) {
    passiveScenario.target.x = 80;
    passiveScenario.target.y = 34;
    claimingGoalkeeper.x = 100;
    claimingGoalkeeper.y = 34;
    passiveOffsideEngine.state.ball.owner = null;
    passiveOffsideEngine.state.ball.x = claimingGoalkeeper.x;
    passiveOffsideEngine.state.ball.y = claimingGoalkeeper.y;
    const events = engineInternals(passiveOffsideEngine).detectPassOutcome(passiveScenario.action);

    assert.ok(events.some((event) => event.type === 'goalkeeper_claim'), 'a goalkeeper should still claim when the flagged target remains passive and distant');
    assert.equal(events.some((event) => event.type === 'offside'), false, 'offside position alone should not cancel a distant goalkeeper claim');
}

const offsideGeometryEngine = new RealTimeEngine(homeTeam, awayTeam, {
    matchLengthSeconds: 10,
    random: seededRandom(156),
});
offsideGeometryEngine.start();

const geometryHomeReceiver = offsideGeometryEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RF);
const geometryAwayReceiver = offsideGeometryEngine.state.players.find((player) => player.side === 'away' && player.role === Position.RW);
const geometryHomePlayers = offsideGeometryEngine.state.players.filter((player) => player.side === 'home');
const geometryAwayPlayers = offsideGeometryEngine.state.players.filter((player) => player.side === 'away');
const geometryInternals = engineInternals(offsideGeometryEngine);

assert.ok(geometryHomeReceiver && geometryAwayReceiver, 'offside geometry checks need attackers in both directions');

if (geometryHomeReceiver && geometryAwayReceiver) {
    geometryAwayPlayers.forEach((player, index) => {
        player.x = index === 0 ? 100 : index === 1 ? 80 : 65;
    });
    geometryHomeReceiver.x = 90;
    assert.ok(geometryInternals.offsideCandidateIds('home', { x: 60, y: 34 }).includes(geometryHomeReceiver.id), 'an attacker beyond the ball and second-last opponent should be flagged');

    geometryHomeReceiver.x = 80;
    assert.equal(geometryInternals.offsideCandidateIds('home', { x: 60, y: 34 }).includes(geometryHomeReceiver.id), false, 'an attacker level with the second-last opponent should be onside');

    geometryHomeReceiver.x = 90;
    assert.equal(geometryInternals.offsideCandidateIds('home', { x: 95, y: 34 }).includes(geometryHomeReceiver.id), false, 'an attacker behind the ball should be onside');

    geometryAwayPlayers.forEach((player, index) => {
        player.x = index === 0 ? 40 : index === 1 ? 30 : 20;
    });
    geometryHomeReceiver.x = 50;
    assert.equal(geometryInternals.offsideCandidateIds('home', { x: 40, y: 34 }).includes(geometryHomeReceiver.id), false, 'an attacker in their own half should be onside');

    offsideGeometryEngine.state.period = 2;
    geometryAwayPlayers.forEach((player, index) => {
        player.x = index === 0 ? 5 : index === 1 ? 25 : 35;
    });
    geometryHomeReceiver.x = 15;
    assert.ok(geometryInternals.offsideCandidateIds('home', { x: 40, y: 34 }).includes(geometryHomeReceiver.id), 'offside should mirror when teams change ends');

    offsideGeometryEngine.state.period = 1;
    geometryHomePlayers.forEach((player, index) => {
        player.x = index === 0 ? 5 : index === 1 ? 25 : 35;
    });
    geometryAwayReceiver.x = 15;
    assert.ok(geometryInternals.offsideCandidateIds('away', { x: 40, y: 34 }).includes(geometryAwayReceiver.id), 'away attacks should use the opposite first-half direction');
}

const lateRunEngine = new RealTimeEngine(homeTeam, awayTeam, {
    tickSeconds: 0.25,
    matchLengthSeconds: 10,
    random: () => 0,
});
lateRunEngine.start();

const lateRunPasser = lateRunEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RCM);
const lateRunner = lateRunEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RF);
const lateRunDefenders = lateRunEngine.state.players.filter((player) => player.side === 'away');

assert.ok(lateRunPasser && lateRunner, 'the late-run scenario needs a passer and receiver');

if (lateRunPasser && lateRunner) {
    lateRunPasser.x = 60;
    lateRunPasser.y = 34;
    lateRunner.x = 75;
    lateRunner.y = 34;
    lateRunDefenders.forEach((player, index) => {
        player.x = index === 0 ? 100 : index === 1 ? 80 : 65;
        player.y = index % 2 === 0 ? 4 : 64;
    });
    lateRunEngine.state.ball.owner = lateRunPasser;
    lateRunEngine.state.ball.x = lateRunPasser.x;
    lateRunEngine.state.ball.y = lateRunPasser.y;
    engineInternals(lateRunEngine).startPass(lateRunPasser, lateRunner);

    lateRunner.x = 90;
    lateRunDefenders.forEach((player) => {
        player.x = 65;
    });
    lateRunEngine.state.ball.x = lateRunner.x;
    lateRunEngine.state.ball.y = lateRunner.y;
    lateRunEngine.state.ball.velocity = { x: 0, y: 0 };
    lateRunEngine.tick();
}

assert.ok(lateRunEngine.events.some((event) => event.type === 'receive' && event.playerId === lateRunner?.id), 'a player who was onside at the pass should remain eligible after running beyond the defence');
assert.equal(lateRunEngine.events.some((event) => event.type === 'offside'), false, 'offside should be judged when the teammate plays the ball');

function looseFirstTouchScenario(
    originalOffsideCandidate: boolean,
    runnerXAtTouch: number,
    ballXAtTouch: number = 70,
    secondLastDefenderX: number = 80,
): {
    engine: RealTimeEngine;
    receiver: RealTimeEngine['state']['players'][number];
    runner: RealTimeEngine['state']['players'][number];
} {
    const engine = new RealTimeEngine(homeTeam, awayTeam, {
        matchLengthSeconds: 10,
        random: () => 0.99,
    });
    engine.start();

    const passer = engine.state.players.find((player) => player.side === 'home' && player.role === Position.RCM);
    const receiver = engine.state.players.find((player) => player.side === 'home' && player.role === Position.LCM);
    const runner = engine.state.players.find((player) => player.side === 'home' && player.role === Position.RF);
    const defenders = engine.state.players.filter((player) => player.side === 'away');

    assert.ok(passer && receiver && runner, 'the loose-touch scenario needs a passer, receiver, and runner');

    if (!passer || !receiver || !runner) {
        throw new Error('Missing loose-touch scenario players');
    }

    passer.x = 60;
    passer.y = 34;
    receiver.x = 70;
    receiver.y = 34;
    runner.x = runnerXAtTouch;
    runner.y = 34;
    defenders.forEach((player, index) => {
        player.x = index === 0 ? 100 : index === 1 ? secondLastDefenderX : 50;
        player.y = index % 2 === 0 ? 4 : 64;
    });
    engine.state.ball.owner = null;
    engine.state.ball.x = ballXAtTouch;
    engine.state.ball.y = receiver.y;
    engine.state.ball.velocity = { x: 0, y: 0 };

    const action: ActiveBallAction = {
        type: 'pass',
        from: passer,
        teamSide: 'home',
        origin: { x: passer.x, y: passer.y },
        target: { x: receiver.x, y: receiver.y },
        targetPlayer: receiver,
        inaccurate: false,
        quality: 0.8,
        passSpeed: 12,
        receiveDifficulty: 0.4,
        targetKind: 'feet',
        route: 'lateral_support',
        offsideCandidateIds: originalOffsideCandidate ? [runner.id] : [],
    };

    const events = engineInternals(engine).resolveFirstTouch(action);

    assert.ok(events.some((event) => event.type === 'second_ball' && event.outcome === 'loose_first_touch'), 'the forced poor touch should create a second ball');

    return { engine, receiver, runner };
}

const runnerBackOnside = looseFirstTouchScenario(true, 75);

assert.equal(runnerBackOnside.engine.state.secondBall?.sourcePlayerId, runnerBackOnside.receiver.id, 'a loose touch should become the new offside source');
assert.equal(runnerBackOnside.engine.state.secondBall?.offsideCandidateIds?.includes(runnerBackOnside.runner.id), false, 'the new touch should clear an original candidate who is now onside');

const runnerNewlyOffside = looseFirstTouchScenario(false, 69, 68, 65);

assert.ok(runnerNewlyOffside.engine.state.secondBall?.offsideCandidateIds?.includes(runnerNewlyOffside.runner.id), 'the new touch should flag a runner who has moved offside');

runnerNewlyOffside.engine.state.players
    .filter((player) => player !== runnerNewlyOffside.runner)
    .forEach((player, index) => {
        player.x = 30;
        player.y = index % 2 === 0 ? 4 : 64;
    });
runnerNewlyOffside.runner.x = runnerNewlyOffside.engine.state.ball.x;
runnerNewlyOffside.runner.y = runnerNewlyOffside.engine.state.ball.y;
runnerNewlyOffside.engine.state.ball.velocity = { x: 0, y: 0 };
runnerNewlyOffside.engine.tick();

assert.ok(runnerNewlyOffside.engine.events.some((event) => event.type === 'offside' && event.playerId === runnerNewlyOffside.runner.id), 'a newly flagged runner should be penalised when recovering the loose touch');

function restartOffsideCandidates(type: 'throw_in' | 'corner' | 'goal_kick' | 'free_kick'): string[] {
    const restartEngine = new RealTimeEngine(homeTeam, awayTeam, {
        matchLengthSeconds: 10,
        random: seededRandom(157),
    });
    restartEngine.start();

    const taker = restartEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RCM);
    const target = restartEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RF);
    const defenders = restartEngine.state.players.filter((player) => player.side === 'away');

    assert.ok(taker && target, `${type} offside checks need a taker and target`);

    if (!taker || !target) {
        return [];
    }

    target.x = 90;
    target.y = 34;
    defenders.forEach((player, index) => {
        player.x = index === 0 ? 100 : index === 1 ? 80 : 65;
    });
    restartEngine.state.restart = {
        phase: type,
        teamSide: 'home',
        position: { x: 60, y: 34 },
        reason: 'test_restart',
    };
    restartEngine.state.ball.owner = taker;
    engineInternals(restartEngine).playRestartPass(type, taker, target, target, 20, 'test_restart');

    return restartEngine.state.activeBallAction?.offsideCandidateIds || [];
}

assert.deepEqual(restartOffsideCandidates('throw_in'), [], 'a direct throw-in receipt should be exempt from offside');
assert.deepEqual(restartOffsideCandidates('corner'), [], 'a direct corner receipt should be exempt from offside');
assert.deepEqual(restartOffsideCandidates('goal_kick'), [], 'a direct goal-kick receipt should be exempt from offside');
assert.ok(restartOffsideCandidates('free_kick').length > 0, 'a free-kick receipt should still be subject to offside');

const goalKickHeaderEngine = new RealTimeEngine(homeTeam, awayTeam, {
    matchLengthSeconds: 10,
    random: () => 0.99,
});
goalKickHeaderEngine.start();

const goalKickHeaderTaker = goalKickHeaderEngine.state.players.find((player) => player.side === 'home' && player.role === Position.GK);
const goalKickHeader = goalKickHeaderEngine.state.players.find((player) => player.side === 'home' && player.role === Position.LF);
const goalKickRunner = goalKickHeaderEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RF);
const goalKickDefenders = goalKickHeaderEngine.state.players.filter((player) => player.side === 'away');

assert.ok(goalKickHeaderTaker && goalKickHeader && goalKickRunner && goalKickDefenders.length >= 2, 'the goal-kick header scenario needs a taker, header, runner, and defenders');

if (goalKickHeaderTaker && goalKickHeader && goalKickRunner) {
    goalKickHeader.x = 80;
    goalKickHeader.y = 34;
    goalKickRunner.x = 79;
    goalKickRunner.y = 34;
    goalKickDefenders.forEach((player, index) => {
        player.x = index === 0 ? 100 : index === 1 ? 75 : 60;
        player.y = index === 1 ? 34 : index % 2 === 0 ? 4 : 64;
    });
    goalKickHeaderEngine.state.ball.owner = null;
    goalKickHeaderEngine.state.ball.x = 78;
    goalKickHeaderEngine.state.ball.y = goalKickHeader.y;
    goalKickHeaderEngine.state.ball.velocity = { x: 0, y: 0 };

    const action: ActiveBallAction = {
        type: 'pass',
        from: goalKickHeaderTaker,
        teamSide: 'home',
        origin: { x: 5, y: 34 },
        target: { x: goalKickHeader.x, y: goalKickHeader.y },
        targetPlayer: goalKickHeader,
        inaccurate: false,
        quality: 0.8,
        passSpeed: 34,
        receiveDifficulty: 0.7,
        targetKind: 'contest',
        route: 'long_kick',
        restartType: 'goal_kick',
        offsideCandidateIds: [],
    };

    const duelEvent = engineInternals(goalKickHeaderEngine).detectAerialDuel(action);

    assert.equal(duelEvent?.type, 'aerial_duel', 'the direct goal kick should reach the attacking header without offside');
    assert.equal(goalKickHeaderEngine.state.secondBall?.sourcePlayerId, goalKickHeader.id, 'the attacking header should become the next offside source');
    assert.ok(goalKickHeaderEngine.state.secondBall?.offsideCandidateIds?.includes(goalKickRunner.id), 'the goal-kick exemption should end when an attacker heads the ball');

    goalKickHeaderEngine.state.players
        .filter((player) => player !== goalKickRunner)
        .forEach((player, index) => {
            player.x = 30;
            player.y = index % 2 === 0 ? 4 : 64;
        });
    goalKickRunner.x = goalKickHeaderEngine.state.ball.x;
    goalKickRunner.y = goalKickHeaderEngine.state.ball.y;
    goalKickHeaderEngine.state.ball.velocity = { x: 0, y: 0 };
    goalKickHeaderEngine.tick();
}

assert.ok(goalKickHeaderEngine.events.some((event) => event.type === 'offside' && event.playerId === goalKickRunner?.id), 'an offside runner recovering the loose header should concede the indirect free kick');

const indirectFreeKickEngine = new RealTimeEngine(homeTeam, awayTeam, {
    tickSeconds: 0.25,
    matchLengthSeconds: 10,
    random: () => 0,
});
indirectFreeKickEngine.start();

const indirectFreeKickTaker = indirectFreeKickEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RCM);

assert.ok(indirectFreeKickTaker, 'the indirect-free-kick scenario needs a taker');

if (indirectFreeKickTaker) {
    indirectFreeKickEngine.state.phase = 'free_kick';
    indirectFreeKickEngine.state.restart = {
        phase: 'free_kick',
        teamSide: 'home',
        position: { x: 85, y: 34 },
        reason: 'offside',
        freeKickKind: 'indirect',
    };
    indirectFreeKickEngine.state.ball.owner = indirectFreeKickTaker;
    indirectFreeKickEngine.tick();
}

assert.ok(indirectFreeKickEngine.events.some((event) => event.type === 'free_kick' && event.outcome === 'indirect_free_kick'), 'an offside restart should be played indirectly even within direct-shot range');
assert.equal(indirectFreeKickEngine.state.activeBallAction?.type, 'pass', 'an offside restart should not become a direct shot');

const offsideSecondBallEngine = new RealTimeEngine(homeTeam, awayTeam, {
    tickSeconds: 0.25,
    matchLengthSeconds: 10,
    random: () => 0,
});
offsideSecondBallEngine.start();

const offsideSecondBallSource = offsideSecondBallEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RCM);
const offsideSecondBallPlayer = offsideSecondBallEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RF);

assert.ok(offsideSecondBallSource && offsideSecondBallPlayer, 'the offside rebound scenario needs a source and recovering attacker');

if (offsideSecondBallSource && offsideSecondBallPlayer) {
    offsideSecondBallEngine.state.players
        .filter((player) => player !== offsideSecondBallPlayer)
        .forEach((player, index) => {
            player.x = 30;
            player.y = index % 2 === 0 ? 4 : 64;
        });
    offsideSecondBallPlayer.x = 90;
    offsideSecondBallPlayer.y = 34;
    offsideSecondBallEngine.state.ball.owner = null;
    offsideSecondBallEngine.state.ball.x = offsideSecondBallPlayer.x;
    offsideSecondBallEngine.state.ball.y = offsideSecondBallPlayer.y;
    offsideSecondBallEngine.state.ball.velocity = { x: 0, y: 0 };
    offsideSecondBallEngine.state.secondBall = {
        x: offsideSecondBallPlayer.x,
        y: offsideSecondBallPlayer.y,
        expiresAt: offsideSecondBallEngine.state.time + 4,
        teamSide: 'home',
        sourcePlayerId: offsideSecondBallSource.id,
        source: 'rebound',
        offsideCandidateIds: [offsideSecondBallPlayer.id],
    };
    offsideSecondBallEngine.tick();
}

assert.ok(offsideSecondBallEngine.events.some((event) => event.type === 'offside' && event.playerId === offsideSecondBallPlayer?.id), 'an offside-positioned attacker should be penalised when recovering a rebound');
assert.equal(offsideSecondBallEngine.events.some((event) => event.type === 'recovery' && event.playerId === offsideSecondBallPlayer?.id), false, 'an offside rebound should not award possession');

const expiredOffsideLineageEngine = new RealTimeEngine(homeTeam, awayTeam, {
    tickSeconds: 0.25,
    matchLengthSeconds: 10,
    random: () => 0,
});
expiredOffsideLineageEngine.start();

const expiredLineageSource = expiredOffsideLineageEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RCM);
const expiredLineagePlayer = expiredOffsideLineageEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RF);

assert.ok(expiredLineageSource && expiredLineagePlayer, 'the expired-lineage scenario needs a source and recovering attacker');

if (expiredLineageSource && expiredLineagePlayer) {
    expiredOffsideLineageEngine.state.players
        .filter((player) => player !== expiredLineagePlayer)
        .forEach((player, index) => {
            player.x = 30;
            player.y = index % 2 === 0 ? 4 : 64;
        });
    expiredLineagePlayer.x = 90;
    expiredLineagePlayer.y = 34;
    expiredOffsideLineageEngine.state.ball.owner = null;
    expiredOffsideLineageEngine.state.ball.x = expiredLineagePlayer.x;
    expiredOffsideLineageEngine.state.ball.y = expiredLineagePlayer.y;
    expiredOffsideLineageEngine.state.ball.velocity = { x: 0, y: 0 };
    expiredOffsideLineageEngine.state.secondBall = {
        x: expiredLineagePlayer.x,
        y: expiredLineagePlayer.y,
        expiresAt: expiredOffsideLineageEngine.state.time + expiredOffsideLineageEngine.tickSeconds,
        teamSide: 'home',
        sourcePlayerId: expiredLineageSource.id,
        source: 'rebound',
        offsideCandidateIds: [expiredLineagePlayer.id],
    };
    expiredOffsideLineageEngine.tick();
}

assert.ok(expiredOffsideLineageEngine.events.some((event) => event.type === 'offside' && event.playerId === expiredLineagePlayer?.id), 'offside lineage should survive the tactical second-ball window');
assert.equal(expiredOffsideLineageEngine.events.some((event) => event.type === 'recovery' && event.playerId === expiredLineagePlayer?.id), false, 'an expired tactical window should not make an offside recovery legal');

function expiredLooseBallChallenge(candidateDistance: number): {
    engine: RealTimeEngine;
    candidate: RealTimeEngine['state']['players'][number];
    defender: RealTimeEngine['state']['players'][number];
} {
    const engine = new RealTimeEngine(homeTeam, awayTeam, {
        tickSeconds: 0.01,
        matchLengthSeconds: 10,
        random: () => 0,
    });
    engine.start();

    const source = engine.state.players.find((player) => player.side === 'home' && player.role === Position.RCM);
    const candidate = engine.state.players.find((player) => player.side === 'home' && player.role === Position.RF);
    const defender = engine.state.players.find((player) => player.side === 'away' && player.role === Position.LCB);

    assert.ok(source && candidate && defender, 'the loose-ball interference scenario needs a source, candidate, and defender');

    if (!source || !candidate || !defender) {
        throw new Error('Missing loose-ball interference players');
    }

    engine.state.players
        .filter((player) => player !== candidate && player !== defender)
        .forEach((player, index) => {
            player.x = 30;
            player.y = index % 2 === 0 ? 4 : 64;
        });
    candidate.x = 90 + candidateDistance;
    candidate.y = 34;
    defender.x = 90.4;
    defender.y = 34;
    engine.state.ball.owner = null;
    engine.state.ball.x = 90;
    engine.state.ball.y = 34;
    engine.state.ball.velocity = { x: 0, y: 0 };
    engine.state.secondBall = {
        x: 90,
        y: 34,
        expiresAt: engine.state.time + engine.tickSeconds,
        teamSide: 'home',
        sourcePlayerId: source.id,
        source: 'rebound',
        offsideCandidateIds: [candidate.id],
    };
    engine.tick();

    return { engine, candidate, defender };
}

const closeLooseBallChallenge = expiredLooseBallChallenge(0.9);

assert.ok(closeLooseBallChallenge.engine.events.some((event) => (
    event.type === 'offside'
    && event.playerId === closeLooseBallChallenge.candidate.id
    && event.outcome === 'interfering_with_opponent'
)), 'a nearby offside candidate challenging a closer defender should be penalised');
assert.equal(closeLooseBallChallenge.engine.events.some((event) => event.type === 'recovery' && event.playerId === closeLooseBallChallenge.defender.id), false, 'a defender recovery should not precede an active offside offence');

const passiveLooseBallCandidate = expiredLooseBallChallenge(5);

assert.equal(passiveLooseBallCandidate.engine.events.some((event) => event.type === 'offside'), false, 'a distant offside candidate should remain passive');
assert.ok(passiveLooseBallCandidate.engine.events.some((event) => event.type === 'recovery' && event.playerId === passiveLooseBallCandidate.defender.id), 'a defender should recover when the offside candidate does not interfere');

const uninvolvedOffsideEngine = new RealTimeEngine(homeTeam, awayTeam, {
    tickSeconds: 0.25,
    matchLengthSeconds: 10,
    random: () => 0.99,
});
uninvolvedOffsideEngine.start();

const uninvolvedShooter = uninvolvedOffsideEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RCM);
const uninvolvedAttacker = uninvolvedOffsideEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RF);

assert.ok(uninvolvedShooter && uninvolvedAttacker, 'the uninvolved offside scenario needs a shooter and attacker');

if (uninvolvedShooter && uninvolvedAttacker) {
    uninvolvedOffsideEngine.state.players
        .filter((player) => player.side === 'away')
        .forEach((player, index) => {
            player.x = 70;
            player.y = index % 2 === 0 ? 4 : 64;
        });
    uninvolvedAttacker.x = 100;
    uninvolvedAttacker.y = 50;
    uninvolvedOffsideEngine.state.ball.owner = null;
    uninvolvedOffsideEngine.state.ball.x = 106;
    uninvolvedOffsideEngine.state.ball.y = 34;
    uninvolvedOffsideEngine.state.ball.velocity = { x: 0, y: 0 };
    uninvolvedOffsideEngine.state.activeBallAction = {
        type: 'shot',
        from: uninvolvedShooter,
        teamSide: 'home',
        origin: { x: 90, y: 34 },
        target: { x: 105, y: 34 },
        inaccurate: false,
        quality: 0.9,
        chanceQuality: 0.9,
        route: 'placed_finish',
        offsideCandidateIds: [uninvolvedAttacker.id],
    };
    uninvolvedOffsideEngine.tick();
}

assert.ok(uninvolvedOffsideEngine.events.some((event) => event.type === 'goal'), 'an offside-positioned teammate who does not become involved should not cancel a goal');
assert.equal(uninvolvedOffsideEngine.events.some((event) => event.type === 'offside'), false, 'offside position alone should not be an offence');

const secondBallEngine = new RealTimeEngine(homeTeam, awayTeam, {
    tickSeconds: 0.25,
    matchLengthSeconds: 10,
    random: queuedRandom([0.99, 0.99]),
});
secondBallEngine.start();

const secondBallPasser = secondBallEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RCM);
const secondBallReceiver = secondBallEngine.state.players.find((player) => player.side === 'home' && player.role === Position.LCM);

assert.ok(secondBallPasser && secondBallReceiver, 'the second-ball scenario needs a passer and receiver');

if (secondBallPasser && secondBallReceiver) {
    secondBallPasser.x = 45;
    secondBallPasser.y = 34;
    secondBallReceiver.x = 70;
    secondBallReceiver.y = 34;
    secondBallEngine.state.ball.owner = null;
    secondBallEngine.state.ball.x = 60;
    secondBallEngine.state.ball.y = 34;
    secondBallEngine.state.ball.velocity = { x: 0, y: 0 };
    secondBallEngine.state.activeBallAction = {
        type: 'pass',
        from: secondBallPasser,
        teamSide: 'home',
        origin: {
            x: secondBallPasser.x,
            y: secondBallPasser.y,
        },
        target: {
            x: 60,
            y: 34,
        },
        targetPlayer: secondBallReceiver,
        inaccurate: true,
        quality: 0.45,
        estimatedArrivalTime: secondBallEngine.state.time,
        passSpeed: 12,
        receiveDifficulty: 0.5,
        targetKind: 'feet',
        route: 'lateral_support',
    };
    secondBallEngine.tick();
}

assert.ok(secondBallEngine.events.some((event) => event.type === 'second_ball'), 'a slightly misplaced pass should become a second ball');
assert.ok(secondBallEngine.state.secondBall, 'second-ball state should stay visible for nearby players to attack');

const reboundRecoveryEngine = new RealTimeEngine(homeTeam, awayTeam, {
    tickSeconds: 0.25,
    matchLengthSeconds: 10,
    random: seededRandom(142),
});
reboundRecoveryEngine.start();

const reboundShooter = reboundRecoveryEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RF);

assert.ok(reboundShooter, 'the rebound scenario needs an attacking player');

if (reboundShooter) {
    reboundShooter.x = 94;
    reboundShooter.y = 34;
    reboundRecoveryEngine.state.ball.owner = null;
    reboundRecoveryEngine.state.ball.x = reboundShooter.x;
    reboundRecoveryEngine.state.ball.y = reboundShooter.y;
    reboundRecoveryEngine.state.ball.velocity = { x: 0, y: 0 };
    reboundRecoveryEngine.state.secondBall = {
        x: reboundShooter.x,
        y: reboundShooter.y,
        expiresAt: reboundRecoveryEngine.state.time + 4,
        teamSide: 'home',
        sourcePlayerId: reboundShooter.id,
        source: 'rebound',
    };
    reboundRecoveryEngine.tick();

    assert.equal(reboundRecoveryEngine.state.possession.lastRecoveryType, 'rebound', 'rebound recoveries should mark the possession context');
    assert.equal(engineInternals(reboundRecoveryEngine).shotRoute(reboundShooter, 10), 'rebound', 'rebound recoveries should create second-phase shot context');
}

const blockedCrossEngine = new RealTimeEngine(homeTeam, awayTeam, {
    tickSeconds: 0.25,
    matchLengthSeconds: 10,
    random: queuedRandom([0.99, 0.8]),
});
blockedCrossEngine.start();

const blockedCrossPasser = blockedCrossEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RM);
const blockedCrossReceiver = blockedCrossEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RF);
const crossBlocker = blockedCrossEngine.state.players.find((player) => player.side === 'away' && player.role === Position.LCB);

assert.ok(blockedCrossPasser && blockedCrossReceiver && crossBlocker, 'the blocked-cross scenario needs a crosser, receiver, and blocker');

if (blockedCrossPasser && blockedCrossReceiver && crossBlocker) {
    blockedCrossPasser.x = 84;
    blockedCrossPasser.y = 8;
    blockedCrossReceiver.x = 94;
    blockedCrossReceiver.y = 34;
    crossBlocker.x = 94;
    crossBlocker.y = 34;
    blockedCrossEngine.state.ball.owner = null;
    blockedCrossEngine.state.ball.x = crossBlocker.x;
    blockedCrossEngine.state.ball.y = crossBlocker.y;
    blockedCrossEngine.state.ball.velocity = { x: 0, y: 0 };
    blockedCrossEngine.state.activeBallAction = {
        type: 'pass',
        from: blockedCrossPasser,
        teamSide: 'home',
        origin: {
            x: blockedCrossPasser.x,
            y: blockedCrossPasser.y,
        },
        target: {
            x: blockedCrossReceiver.x,
            y: blockedCrossReceiver.y,
        },
        targetPlayer: blockedCrossReceiver,
        inaccurate: true,
        quality: 0.62,
        estimatedArrivalTime: blockedCrossEngine.state.time,
        passSpeed: 16,
        receiveDifficulty: 0.42,
        targetKind: 'contest',
        route: 'cross',
    };
    blockedCrossEngine.tick();
}

assert.ok(blockedCrossEngine.events.some((event) => event.type === 'second_ball' && event.outcome === 'blocked_cross_second_ball'), 'blocked crosses should be able to create recoverable second balls');

const recycleEngine = new RealTimeEngine(homeTeam, awayTeam, {
    matchLengthSeconds: 10,
    random: queuedRandom([0.99, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0, 0]),
});
recycleEngine.start();

const recyclingCenterBack = recycleEngine.state.players.find((player) => player.side === 'home' && player.role === Position.LCB);

assert.ok(recyclingCenterBack, 'the recycle scenario needs a center back');

if (recyclingCenterBack) {
    recyclingCenterBack.x = 32;
    recyclingCenterBack.y = 28;
    recyclingCenterBack.actionCooldown = 0;
    recycleEngine.state.ball.owner = recyclingCenterBack;
    recycleEngine.state.ball.x = recyclingCenterBack.x;
    recycleEngine.state.ball.y = recyclingCenterBack.y;
    recycleEngine.tick();
}

assert.ok(recycleEngine.events.some((event) => event.type === 'pass' && ['lateral_support', 'backward_reset'].includes(event.outcome || '')), 'a low-pressure center back should be able to recycle possession');

const routeEngine = new RealTimeEngine(homeTeam, awayTeam, {
    matchLengthSeconds: 10,
    random: seededRandom(141),
});
routeEngine.start();

const routeCarrier = routeEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RF);
const routeReceiver = routeEngine.state.players.find((player) => player.side === 'home' && player.role === Position.LF);
const routeMidfielder = routeEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RCM);
const routeForward = routeEngine.state.players.find((player) => player.side === 'home' && player.role === Position.LF);

assert.ok(routeCarrier && routeReceiver && routeMidfielder && routeForward, 'route classification scenarios need attackers and midfielders');

if (routeCarrier && routeReceiver && routeMidfielder && routeForward) {
    const internals = engineInternals(routeEngine);

    routeCarrier.x = 101;
    routeCarrier.y = 8;
    routeReceiver.x = 94;
    routeReceiver.y = 34;
    assert.equal(internals.passRoute(routeCarrier, routeReceiver), 'cutback', 'a byline wide player should look for a central cutback');

    routeCarrier.x = 82;
    routeCarrier.y = 8;
    routeReceiver.x = 94;
    routeReceiver.y = 34;
    assert.equal(internals.passRoute(routeCarrier, routeReceiver), 'cross', 'a deeper wide player should be able to choose a cross');

    routeCarrier.x = 64;
    routeCarrier.y = 34;
    routeForward.x = 84;
    routeForward.y = 34;
    routeForward.currentIntent = {
        type: 'hold_shape',
        target: {
            x: routeForward.x,
            y: routeForward.y,
        },
        duration: 1,
        urgency: 0.5,
        tacticalRisk: 0.2,
    };
    assert.notEqual(internals.passRoute(routeCarrier, routeForward), 'through_ball', 'through balls should not be selected without a forward run');

    routeForward.currentIntent = {
        type: 'make_forward_run',
        target: {
            x: 94,
            y: 34,
        },
        duration: 3,
        urgency: 0.8,
        tacticalRisk: 0.5,
    };
    routeEngine.state.players
        .filter((player) => player.side === 'away')
        .forEach((player) => {
            player.x = 42;
            player.y = player.y < 34 ? 4 : 64;
        });
    assert.equal(internals.passRoute(routeCarrier, routeForward), 'through_ball', 'through balls should require a runner with separation');

    routeEngine.state.possession.lastSuccessfulPassRoute = 'cutback';
    assert.equal(internals.shotRoute(routeMidfielder, 12), 'cutback', 'shot routes should use the previous successful pass context');

    routeEngine.state.possession.lastSuccessfulPassRoute = null;
    routeEngine.state.possession.lastRecoveryType = 'rebound';
    assert.equal(internals.shotRoute(routeMidfielder, 10), 'rebound', 'rebound recoveries should classify second-phase shots');
}

const longGoalKickEngine = new RealTimeEngine(homeTeam, awayTeam, {
    tickSeconds: 0.25,
    matchLengthSeconds: 10,
    random: queuedRandom([0.99, 0.95]),
});
longGoalKickEngine.start();

const goalKickTaker = longGoalKickEngine.state.players.find((player) => player.side === 'home' && player.role === Position.GK);
const goalKickTarget = longGoalKickEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RF);
const goalKickOpponent = longGoalKickEngine.state.players.find((player) => player.side === 'away' && player.role === Position.LCB);

assert.ok(goalKickTaker && goalKickTarget && goalKickOpponent, 'the long goal-kick scenario needs a taker, target, and opponent');

if (goalKickTaker && goalKickTarget && goalKickOpponent) {
    goalKickTarget.x = 60;
    goalKickTarget.y = 34;
    goalKickOpponent.x = 61;
    goalKickOpponent.y = 34;
    longGoalKickEngine.state.ball.owner = null;
    longGoalKickEngine.state.ball.x = goalKickTarget.x;
    longGoalKickEngine.state.ball.y = goalKickTarget.y;
    longGoalKickEngine.state.ball.velocity = { x: 0, y: 0 };
    longGoalKickEngine.state.activeBallAction = {
        type: 'pass',
        from: goalKickTaker,
        teamSide: 'home',
        origin: {
            x: 6,
            y: 34,
        },
        target: {
            x: goalKickTarget.x,
            y: goalKickTarget.y,
        },
        targetPlayer: goalKickTarget,
        inaccurate: false,
        quality: 0.72,
        estimatedArrivalTime: longGoalKickEngine.state.time,
        passSpeed: 24,
        receiveDifficulty: 0.72,
        targetKind: 'contest',
        route: 'long_kick',
        restartType: 'goal_kick',
    };
    longGoalKickEngine.tick();
}

assert.ok(longGoalKickEngine.events.some((event) => event.type === 'aerial_duel' && event.outcome === 'loose_second_ball'), 'a long goal kick should be able to create an aerial second ball');
assert.ok(longGoalKickEngine.state.secondBall, 'long goal-kick second balls should remain recoverable');

const poorAngleEngine = new RealTimeEngine(homeTeam, awayTeam, {
    matchLengthSeconds: 10,
    random: queuedRandom([0.99, 0.99, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0, 0]),
});
poorAngleEngine.start();

const poorAngleAttacker = poorAngleEngine.state.players.find((player) => player.side === 'home' && player.role === Position.RF);

assert.ok(poorAngleAttacker, 'the poor-angle scenario needs an attacker');

if (poorAngleAttacker) {
    poorAngleAttacker.x = 92;
    poorAngleAttacker.y = 16;
    poorAngleAttacker.actionCooldown = 0;
    poorAngleEngine.state.ball.owner = poorAngleAttacker;
    poorAngleEngine.state.ball.x = poorAngleAttacker.x;
    poorAngleEngine.state.ball.y = poorAngleAttacker.y;
    poorAngleEngine.tick();
}

assert.ok(poorAngleEngine.events.some((event) => event.type === 'pass'), 'a poor-angle attacker should be able to choose a pass');
assert.equal(poorAngleEngine.events.some((event) => event.type === 'shot'), false, 'a poor-angle attacker should not force a shot');

const longShotRateSeeds = [20260504, 20260505, 20260506];
const rateMatches = longShotRateSeeds.map((seed) => {
    const longShotRateEngine = new RealTimeEngine(homeTeam, awayTeam, {
        matchLengthSeconds: 90 * 60,
        random: seededRandom(seed),
    });
    longShotRateEngine.simulate();

    return longShotRateEngine.events;
});
const naturalOffsideCounts = rateMatches.map((events) => events.filter((event) => event.type === 'offside').length);

assert.ok(
    naturalOffsideCounts.every((count) => count <= 12),
    `offside enforcement should not produce implausible whistle counts: ${naturalOffsideCounts.join(', ')}`,
);
assert.ok(naturalOffsideCounts.some((count) => count > 0), 'seeded full matches should still produce natural offside decisions');

const longShotRates = rateMatches.map((events) => {
    const shots = events.filter((event) => event.type === 'shot');
    const longShots = shots.filter((event) => event.outcome === 'long_shot');

    return shots.length ? longShots.length / shots.length : 0;
});
const aggregateLongShotRate = rateMatches.reduce((totals, events) => {
    const shots = events.filter((event) => event.type === 'shot');
    const longShots = shots.filter((event) => event.outcome === 'long_shot');

    return {
        shots: totals.shots + shots.length,
        longShots: totals.longShots + longShots.length,
    };
}, { shots: 0, longShots: 0 });
const penaltyAwards = rateMatches.map((events) => {
    return events.filter((event) => event.type === 'penalty' && event.outcome === 'penalty_foul').length;
});

assert.ok(aggregateLongShotRate.longShots / aggregateLongShotRate.shots <= 0.12, 'long shots should stay occasional across several seeds');
assert.ok(longShotRates.every((rate) => rate <= 0.2), 'single-seed long-shot spikes should stay bounded');
assert.ok(penaltyAwards.every((awards) => awards <= 1), 'penalties should stay rare across several seeds');

console.log({
    snapshots: snapshots.length,
    events: engine.events.length,
    openPlayEvents: openPlayEvents.slice(0, 10),
    score: finalSnapshot.score,
});
