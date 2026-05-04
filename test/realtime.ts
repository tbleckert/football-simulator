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
assert.equal(firstSnapshot.phase, 'kickoff', 'the opening snapshot should expose the kickoff phase');
assert.equal(finalSnapshot.phase, 'full_time', 'the final snapshot should expose the full-time phase');
assert.ok(allEvents.includes('match_start'), 'the event stream should include match start');
assert.ok(allEvents.includes('kickoff'), 'the event stream should include kickoff');
assert.ok(allEvents.includes('pass'), 'the event stream should include passes');
assert.ok(openPlayEvents.length > 0, 'the event stream should include open-play events');

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
    longShotMidfielder.x = 76;
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

const halfTimeEngine = new RealTimeEngine(homeTeam, awayTeam, {
    matchLengthSeconds: 120,
    random: seededRandom(99),
    awayTactics: {
        formation: '4-3-3',
    },
});
const halfTimeSnapshots = halfTimeEngine.simulate(60);
const halfTimeSnapshot = halfTimeSnapshots[halfTimeSnapshots.length - 1] as MatchSnapshot;
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
assert.equal(shootingEngine.state.score.home, 1, 'forced home goal should update the score');
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

console.log({
    snapshots: snapshots.length,
    events: engine.events.length,
    openPlayEvents: openPlayEvents.slice(0, 10),
    score: finalSnapshot.score,
});
