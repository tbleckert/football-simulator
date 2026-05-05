import assert from 'assert';
import Player, { type PlayerAttributes } from '../Player';
import RealTimeEngine from '../RealTimeEngine';
import type { ActiveBallAction } from '../RealTimeEngine';
import Team from '../Team';
import { Position } from '../enums/Position';

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

const positions = [
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
];

const engine = new RealTimeEngine(createTeam(true, 'Calibration Home'), createTeam(false, 'Calibration Away'), {
    random: seededRandom(20260505),
});
const internals = engineInternals(engine);
const elitePasser = player(engine, 'home', Position.RCM);
const poorPasser = player(engine, 'home', Position.LCM);
const eliteFinisher = player(engine, 'home', Position.RF);
const poorFinisher = player(engine, 'home', Position.LF);
const eliteDefender = player(engine, 'away', Position.LCB);
const poorDefender = player(engine, 'away', Position.RCB);
const fastWinger = player(engine, 'home', Position.RM);
const slowWinger = player(engine, 'home', Position.LM);

Object.assign(elitePasser.attributes, {
    passing: 20,
    technique: 20,
    decisions: 20,
});
Object.assign(poorPasser.attributes, {
    passing: 5,
    technique: 5,
    decisions: 5,
});
Object.assign(eliteFinisher.attributes, {
    finishing: 20,
    longShots: 18,
    technique: 20,
    composure: 20,
});
Object.assign(poorFinisher.attributes, {
    finishing: 5,
    longShots: 5,
    technique: 5,
    composure: 5,
});
Object.assign(eliteDefender.attributes, {
    anticipation: 20,
    positioning: 20,
    tackling: 20,
});
Object.assign(poorDefender.attributes, {
    anticipation: 5,
    positioning: 5,
    tackling: 5,
});
Object.assign(fastWinger.attributes, {
    pace: 20,
    acceleration: 20,
});
Object.assign(slowWinger.attributes, {
    pace: 5,
    acceleration: 5,
});

const passQualityGap = internals.passQuality(elitePasser, 22, 0.15) - internals.passQuality(poorPasser, 22, 0.15);
const shotQualityGap = internals.shotQuality(eliteFinisher, 15, 'central_combination') - internals.shotQuality(poorFinisher, 15, 'central_combination');
const interceptionAction: ActiveBallAction = {
    type: 'pass',
    from: elitePasser,
    teamSide: 'home',
    target: {
        x: poorPasser.x,
        y: poorPasser.y,
    },
    targetPlayer: poorPasser,
    inaccurate: false,
    quality: 0.72,
};
const interceptionGap = internals.interceptionChance(eliteDefender, interceptionAction) - internals.interceptionChance(poorDefender, interceptionAction);
const fastSpeed = internals.playerSpeed(fastWinger);
const slowSpeed = internals.playerSpeed(slowWinger);

fastWinger.stamina = 42;
const tiredSpeed = internals.playerSpeed(fastWinger);

assert.ok(passQualityGap > 0.15, 'elite passing attributes should create a materially better pass quality');
assert.ok(shotQualityGap > 0.15, 'elite finishing attributes should create a materially better shot quality');
assert.ok(interceptionGap > 0.15, 'elite defensive reading should create a materially better interception chance');
assert.ok(fastSpeed > slowSpeed + 2, 'pace and acceleration should create visibly faster players');
assert.ok(tiredSpeed < fastSpeed * 0.75, 'fatigue should reduce physical execution');

console.log({
    passQualityGap: round(passQualityGap),
    shotQualityGap: round(shotQualityGap),
    interceptionGap: round(interceptionGap),
    fastSpeed: round(fastSpeed),
    tiredSpeed: round(tiredSpeed),
});

function engineInternals(engine: RealTimeEngine): {
    interceptionChance: (player: RealTimeEngine['state']['players'][number], action: ActiveBallAction) => number;
    passQuality: (player: RealTimeEngine['state']['players'][number], passDistance: number, pressure: number) => number;
    playerSpeed: (player: RealTimeEngine['state']['players'][number]) => number;
    shotQuality: (player: RealTimeEngine['state']['players'][number], distanceToGoal: number, route: string) => number;
} {
    return engine as unknown as {
        interceptionChance: (player: RealTimeEngine['state']['players'][number], action: ActiveBallAction) => number;
        passQuality: (player: RealTimeEngine['state']['players'][number], passDistance: number, pressure: number) => number;
        playerSpeed: (player: RealTimeEngine['state']['players'][number]) => number;
        shotQuality: (player: RealTimeEngine['state']['players'][number], distanceToGoal: number, route: string) => number;
    };
}

function player(engine: RealTimeEngine, side: 'home' | 'away', role: Position): RealTimeEngine['state']['players'][number] {
    const found = engine.state.players.find((candidate) => candidate.side === side && candidate.role === role);

    assert.ok(found, `missing ${side} ${Position[role]} calibration player`);

    if (!found) {
        throw new Error(`Missing ${side} ${Position[role]} calibration player`);
    }

    return found;
}

function createTeam(home: boolean, name: string): Team {
    return new Team(home, name, positions.map((position, index) => new Player(
        {
            name: `${name} ${Position[position]}`,
            number: index + 1,
        },
        {
            height: 180,
            weight: 75,
        },
        { ...baseAttributes },
        position,
    )));
}

function seededRandom(seed: number): () => number {
    let value = seed;

    return () => {
        value = (value * 16807) % 2147483647;

        return (value - 1) / 2147483646;
    };
}

function round(value: number): number {
    return Math.round(value * 1000) / 1000;
}
