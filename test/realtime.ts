import assert from 'assert';
import { Position } from '../enums/Position';
import Player from '../Player';
import RealTimeEngine from '../RealTimeEngine';
import Team from '../Team';
import type { PlayerAttributes } from '../Player';
import type { MatchSnapshot } from '../RealTimeEngine';

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
    shotRoute: (player: RealTimeEngine['state']['players'][number], distanceToGoal: number) => string;
} {
    return engine as unknown as {
        passRoute: (owner: RealTimeEngine['state']['players'][number], target: RealTimeEngine['state']['players'][number]) => string;
        shotRoute: (player: RealTimeEngine['state']['players'][number], distanceToGoal: number) => string;
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
assert.ok(['open_play', 'full_time'].includes(finalSnapshot.phase), 'the requested simulation window should expose a live or full-time phase');
assert.ok(allEvents.includes('match_start'), 'the event stream should include match start');
assert.ok(allEvents.includes('kickoff'), 'the event stream should include kickoff');
assert.ok(allEvents.includes('pass'), 'the event stream should include passes');
assert.ok(openPlayEvents.length > 0, 'the event stream should include open-play events');
assert.ok(Math.max(...possessionPassCounts(engine.events)) >= 5, 'teams should be able to complete a 5-pass sequence');

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
    longShotRateEngine.simulate(90 * 60);

    return longShotRateEngine.events;
});
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
