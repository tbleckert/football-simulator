import assert from 'assert';
import Player, { type PlayerAttributes } from '../Player';
import SeasonSimulator, { type SeasonTeamInput } from '../SeasonSimulator';
import type { TacticalStyle } from '../RealTimeEngine';
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

const teams: SeasonTeamInput[] = [
    createTeam('Press FC', 'high_press'),
    createTeam('Block Town', 'low_block'),
    createTeam('Pass United', 'possession'),
    createTeam('Direct City', 'direct'),
];

const simulator = new SeasonSimulator(teams, {
    rounds: 1,
    matchLengthSeconds: 90 * 60,
    random: seededRandom(20260505),
});
const report = simulator.simulate();

assert.equal(report.matches.length, 6, 'a four-team one-round season should produce six fixtures');
assert.equal(report.table.length, 4, 'season reports should include every team in the table');
assert.ok(report.table.every((standing) => standing.played === 3), 'each team should play every other team once');
assert.ok(report.table.every((standing) => standing.won + standing.drawn + standing.lost === standing.played), 'table outcomes should balance per team');
assert.ok(report.metrics.goalsPerMatch >= 0 && report.metrics.goalsPerMatch <= 6, 'season goals per match should stay in a plausible smoke range');
assert.ok(report.metrics.shotsPerMatch >= 6 && report.metrics.shotsPerMatch <= 45, 'season shots per match should stay in a plausible smoke range');
assert.ok(report.metrics.yellowCardsPerMatch >= 0 && report.metrics.yellowCardsPerMatch <= 8, 'season card volume should stay bounded');
assert.ok(report.metrics.redCardsPerMatch >= 0 && report.metrics.redCardsPerMatch <= 2, 'season red-card volume should stay bounded');
assert.ok(report.topPassers.length > 0, 'season reports should expose top passers');
assert.ok(report.styleStats.some((style) => style.style === 'high_press'), 'season reports should aggregate tactical styles');
assert.ok(report.styleStats.some((style) => style.style === 'low_block'), 'season reports should aggregate defensive styles');

const highPressStats = report.styleStats.find((style) => style.style === 'high_press');
const lowBlockStats = report.styleStats.find((style) => style.style === 'low_block');

assert.ok(highPressStats && lowBlockStats, 'style comparison needs high press and low block stats');

if (highPressStats && lowBlockStats) {
    assert.ok(highPressStats.averageFinalThirdRecoveries > lowBlockStats.averageFinalThirdRecoveries, 'high press should create more final-third recoveries than low block over a mini season');
}

console.log({
    matches: report.matches.length,
    table: report.table.map((standing) => `${standing.teamName} ${standing.points}`),
    metrics: report.metrics,
});

function createTeam(name: string, style: TacticalStyle): SeasonTeamInput {
    return {
        name,
        tactics: {
            style,
        },
        players: positions.map((position, index) => new Player(
            {
                name: `${name} ${Position[position]}`,
                number: index + 1,
            },
            {
                height: 178 + (index % 5) * 3,
                weight: 72 + (index % 4) * 4,
            },
            attributesForPosition(position),
            position,
        )),
    };
}

function attributesForPosition(position: Position): PlayerAttributes {
    const attributes = { ...baseAttributes };

    if ([Position.LF, Position.CF, Position.RF, Position.ST, Position.LW, Position.RW].includes(position)) {
        attributes.finishing = 18;
        attributes.composure = 17;
        attributes.offTheBall = 16;
        attributes.pace = 15;
    }

    if ([Position.LCM, Position.CM, Position.RCM, Position.LM, Position.RM].includes(position)) {
        attributes.passing = 17;
        attributes.vision = 16;
        attributes.decisions = 16;
        attributes.stamina = 16;
    }

    if ([Position.LB, Position.LCB, Position.CB, Position.RCB, Position.RB].includes(position)) {
        attributes.tackling = 17;
        attributes.marking = 16;
        attributes.positioning = 16;
        attributes.strength = 15;
    }

    if (position === Position.GK) {
        attributes.handling = 17;
        attributes.reflexes = 17;
        attributes.oneOnOnes = 17;
        attributes.positioning = 16;
    }

    return attributes;
}

function seededRandom(seed: number): () => number {
    let value = seed;

    return () => {
        value = (value * 16807) % 2147483647;

        return (value - 1) / 2147483646;
    };
}
