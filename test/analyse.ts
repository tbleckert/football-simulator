import Player, { type PlayerAttributes } from '../Player';
import RealTimeEngine, {
    type MatchSnapshot,
    type RealTimeMatchEvent,
    type Tactics,
    type TeamSide,
} from '../RealTimeEngine';
import Team from '../Team';
import { Position } from '../enums/Position';

interface RestartStats {
    awards: number;
    executions: number;
}

interface Possession {
    side: TeamSide;
    passes: number;
}

interface MatchAnalysis {
    seed: number;
    score: {
        home: number;
        away: number;
    };
    passes: number;
    receptions: number;
    passCompletion: number;
    shots: number;
    goals: number;
    averagePossessionPasses: number;
    longestPossession: number;
    possessionsWithThreePasses: number;
    looseBallShare: number;
    ballOwnedShare: number;
    passesEndingInRestartShare: number;
    restarts: Record<string, RestartStats>;
    shotRoutes: Record<string, number>;
    shotRouteConversions: Record<string, { shots: number, goals: number, conversion: number }>;
    passRoutes: Record<string, number>;
    passRoutesByZone: Record<string, Record<string, number>>;
    shotTakersByPositionGroup: Record<string, number>;
    averageChanceQuality: number;
    chanceQualityByRoute: Record<string, number>;
    finalThirdEntries: number;
    wideEntries: number;
    boxEntries: number;
    crosses: RouteCompletion;
    cutbacks: RouteCompletion;
    throughBalls: RouteCompletion;
    switches: RouteCompletion;
    fouls: number;
    penaltiesAwarded: number;
    penaltiesScored: number;
    yellowCards: number;
    redCards: number;
    goalsByRoute: Record<string, number>;
    topPassers: Record<string, number>;
    topShooters: Record<string, number>;
}

interface RouteCompletion {
    attempted: number;
    completed: number;
}

interface TacticalProfile {
    style: string;
    finalThirdRecoveries: number;
    passCompletion: number;
    averagePossessionPasses: number;
    secondBalls: number;
    shotsFor: number;
    shotsConceded: number;
    averageStamina: number;
}

const defaultSeeds = [20260504, 20260505, 20260506, 20260507, 20260508];
const restartTypes = ['throw_in', 'corner', 'goal_kick', 'free_kick', 'penalty'];
const restartAwardOutcomes = new Set(['touchline', 'goal_line', 'foul', 'penalty_foul']);

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

const homePositions = [
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

const awayPositions = [
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
];

function analyseMatch(seed: number): MatchAnalysis {
    const homeTeam = createTeam(true, 'Home', homePositions);
    const awayTeam = createTeam(false, 'Away', awayPositions);
    const engine = new RealTimeEngine(homeTeam, awayTeam, {
        random: seededRandom(seed),
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
    const snapshots = engine.simulate(90 * 60);
    const events = engine.events;
    const finalSnapshot = snapshots[snapshots.length - 1] as MatchSnapshot;
    const passes = events.filter((event) => event.type === 'pass');
    const receptions = events.filter((event) => event.type === 'receive');
    const shots = events.filter((event) => event.type === 'shot');
    const goalsByRoute = countBy(events.filter((event) => event.type === 'goal'), goalRoute);
    const possessions = possessionsFromEvents(events);
    const looseSnapshots = snapshots.filter((snapshot) => !snapshot.ball.ownerId);
    const passRestartCount = countPassesEndingInRestarts(events);
    const goals = finalSnapshot.score.home + finalSnapshot.score.away;

    return {
        seed,
        score: finalSnapshot.score,
        passes: passes.length,
        receptions: receptions.length,
        passCompletion: ratio(receptions.length, passes.length),
        shots: shots.length,
        goals,
        averagePossessionPasses: average(possessions.map((possession) => possession.passes)),
        longestPossession: Math.max(0, ...possessions.map((possession) => possession.passes)),
        possessionsWithThreePasses: ratio(possessions.filter((possession) => possession.passes >= 3).length, possessions.length),
        looseBallShare: ratio(looseSnapshots.length, snapshots.length),
        ballOwnedShare: ratio(snapshots.length - looseSnapshots.length, snapshots.length),
        passesEndingInRestartShare: ratio(passRestartCount, passes.length),
        restarts: restartStats(events),
        shotRoutes: countBy(shots, (event) => event.outcome || 'open_play'),
        shotRouteConversions: shotRouteConversions(shots, goalsByRoute),
        passRoutes: countBy(passes, (event) => event.outcome || 'open_play'),
        passRoutesByZone: passRoutesByZone(passes),
        shotTakersByPositionGroup: countBy(shots, (event) => positionGroup(event.player?.position)),
        averageChanceQuality: average(shots.map((event) => event.chanceQuality || 0).filter((quality) => quality > 0)),
        chanceQualityByRoute: chanceQualityByRoute(shots),
        finalThirdEntries: possessionEntryTotal(events, 'finalThirdEntries'),
        wideEntries: possessionEntryTotal(events, 'wideEntries'),
        boxEntries: possessionEntryTotal(events, 'boxEntries'),
        crosses: routeCompletion(events, 'cross'),
        cutbacks: routeCompletion(events, 'cutback'),
        throughBalls: routeCompletion(events, 'through_ball'),
        switches: routeCompletion(events, 'switch_of_play'),
        fouls: events.filter((event) => event.type === 'foul').length,
        penaltiesAwarded: events.filter((event) => event.type === 'penalty' && event.outcome === 'penalty_foul').length,
        penaltiesScored: events.filter((event) => event.type === 'penalty' && event.outcome === 'goal').length,
        yellowCards: events.filter((event) => event.type === 'yellow_card').length,
        redCards: events.filter((event) => event.type === 'red_card').length,
        goalsByRoute,
        topPassers: topCounts(passes),
        topShooters: topCounts(shots),
    };
}

function analyseTacticalProfile(style: string, tactics: Partial<Tactics>, seeds: number[]): TacticalProfile {
    const profiles = seeds.map((seed) => {
        const homeTeam = createTeam(true, 'Home', homePositions);
        const awayTeam = createTeam(false, 'Away', awayPositions);
        const engine = new RealTimeEngine(homeTeam, awayTeam, {
            random: seededRandom(seed),
            homeTactics: tactics,
            awayTactics: {
                style: 'balanced',
            },
        });
        const snapshots = engine.simulate(90 * 60);
        const finalSnapshot = snapshots[snapshots.length - 1] as MatchSnapshot;
        const events = engine.events;
        const homePasses = events.filter((event) => event.teamSide === 'home' && event.type === 'pass');
        const homeReceives = events.filter((event) => event.teamSide === 'home' && event.type === 'receive');
        const homePossessions = possessionsFromEvents(events).filter((possession) => possession.side === 'home');
        const homePlayers = finalSnapshot.players.filter((player) => player.teamSide === 'home');

        return {
            finalThirdRecoveries: events.filter((event) => {
                return event.teamSide === 'home'
                    && ['interception', 'tackle', 'recovery'].includes(event.type)
                    && event.fieldZones.includes('final_third');
            }).length,
            passCompletion: ratio(homeReceives.length, homePasses.length),
            averagePossessionPasses: average(homePossessions.map((possession) => possession.passes)),
            secondBalls: events.filter((event) => event.teamSide === 'home' && ['second_ball', 'aerial_duel'].includes(event.type)).length,
            shotsFor: events.filter((event) => event.teamSide === 'home' && event.type === 'shot').length,
            shotsConceded: events.filter((event) => event.teamSide === 'away' && event.type === 'shot').length,
            averageStamina: average(homePlayers.map((player) => player.stamina)),
        };
    });

    return {
        style,
        finalThirdRecoveries: average(profiles.map((profile) => profile.finalThirdRecoveries)),
        passCompletion: average(profiles.map((profile) => profile.passCompletion)),
        averagePossessionPasses: average(profiles.map((profile) => profile.averagePossessionPasses)),
        secondBalls: average(profiles.map((profile) => profile.secondBalls)),
        shotsFor: average(profiles.map((profile) => profile.shotsFor)),
        shotsConceded: average(profiles.map((profile) => profile.shotsConceded)),
        averageStamina: average(profiles.map((profile) => profile.averageStamina)),
    };
}

function possessionsFromEvents(events: RealTimeMatchEvent[]): Possession[] {
    const possessions: Possession[] = [];
    let active: Possession | null = null;

    for (const event of events) {
        if (!event.teamSide || !possessionEventTypes.has(event.type)) {
            continue;
        }

        if (!active || active.side !== event.teamSide) {
            if (active) {
                possessions.push(active);
            }

            active = {
                side: event.teamSide,
                passes: 0,
            };
        }

        if (event.type === 'pass') {
            active.passes += 1;
        }
    }

    if (active) {
        possessions.push(active);
    }

    return possessions;
}

const possessionEventTypes = new Set([
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

function countPassesEndingInRestarts(events: RealTimeMatchEvent[]): number {
    return events.reduce((total, event, index) => {
        if (event.type !== 'pass') {
            return total;
        }

        const nextDecidingEvent = events
            .slice(index + 1)
            .find((candidate) => {
                return ['pass', 'receive', 'interception', 'recovery', 'tackle', 'throw_in', 'corner', 'goal_kick'].includes(candidate.type);
            });

        if (!nextDecidingEvent || !restartTypes.includes(nextDecidingEvent.type)) {
            return total;
        }

        return total + 1;
    }, 0);
}

function restartStats(events: RealTimeMatchEvent[]): Record<string, RestartStats> {
    const stats = Object.fromEntries(restartTypes.map((type) => [
        type,
        { awards: 0, executions: 0 },
    ])) as Record<string, RestartStats>;

    events.forEach((event) => {
        if (!restartTypes.includes(event.type)) {
            return;
        }

        if (restartAwardOutcomes.has(event.outcome || '')) {
            stats[event.type].awards += 1;

            return;
        }

        stats[event.type].executions += 1;
    });

    return stats;
}

function shotRouteConversions(
    shots: RealTimeMatchEvent[],
    goalsByRoute: Record<string, number>,
): Record<string, { shots: number, goals: number, conversion: number }> {
    const shotRoutes = countBy(shots, (event) => event.outcome || 'open_play');

    return Object.fromEntries(Object.entries(shotRoutes).map(([route, shotCount]) => {
        const goals = goalsByRoute[route] || 0;

        return [route, {
            shots: shotCount,
            goals,
            conversion: ratio(goals, shotCount),
        }];
    }));
}

function chanceQualityByRoute(shots: RealTimeMatchEvent[]): Record<string, number> {
    const routes = [...new Set(shots.map((event) => event.outcome || 'open_play'))];

    return Object.fromEntries(routes.map((route) => {
        const routeShots = shots.filter((event) => (event.outcome || 'open_play') === route);

        return [route, average(routeShots.map((event) => event.chanceQuality || 0).filter((quality) => quality > 0))];
    }));
}

function passRoutesByZone(passes: RealTimeMatchEvent[]): Record<string, Record<string, number>> {
    return passes.reduce<Record<string, Record<string, number>>>((zones, event) => {
        const route = event.outcome || 'open_play';
        const zone = event.fieldZones.find((fieldZone) => ['defensive_third', 'middle_third', 'attacking_third', 'final_third'].includes(fieldZone)) || 'unknown';

        zones[zone] = zones[zone] || {};
        zones[zone][route] = (zones[zone][route] || 0) + 1;

        return zones;
    }, {});
}

function possessionEntryTotal(
    events: RealTimeMatchEvent[],
    key: 'finalThirdEntries' | 'wideEntries' | 'boxEntries',
): number {
    const possessions = new Map<number, number>();

    events.forEach((event) => {
        possessions.set(event.possession.id, Math.max(possessions.get(event.possession.id) || 0, event.possession[key]));
    });

    return [...possessions.values()].reduce((total, value) => total + value, 0);
}

function routeCompletion(events: RealTimeMatchEvent[], route: string): RouteCompletion {
    return {
        attempted: events.filter((event) => event.type === 'pass' && normalizedPassRoute(event.outcome) === route).length,
        completed: events.filter((event) => event.type === 'receive' && event.possession.lastSuccessfulPassRoute === route).length,
    };
}

function normalizedPassRoute(route: string | undefined): string | undefined {
    return route?.replace(/_inaccurate$/, '');
}

function goalRoute(event: RealTimeMatchEvent): string {
    return (event.outcome || 'open_play_goal').replace(/_goal$/, '');
}

function positionGroup(position: Position | undefined): string {
    if (position === undefined) {
        return 'unknown';
    }

    if ([Position.LF, Position.CF, Position.RF, Position.ST, Position.LW, Position.RW].includes(position)) {
        return 'attackers';
    }

    if ([Position.LCM, Position.CM, Position.RCM, Position.LM, Position.RM, Position.LDM, Position.DM, Position.RDM, Position.LCOM, Position.COM, Position.RCOM].includes(position)) {
        return 'midfielders';
    }

    if ([Position.LB, Position.LCB, Position.CB, Position.RCB, Position.RB, Position.LWB, Position.RWB].includes(position)) {
        return 'defenders';
    }

    return 'goalkeepers';
}

function countBy(events: RealTimeMatchEvent[], keyForEvent: (event: RealTimeMatchEvent) => string): Record<string, number> {
    return events.reduce<Record<string, number>>((counts, event) => {
        const key = keyForEvent(event);

        counts[key] = (counts[key] || 0) + 1;

        return counts;
    }, {});
}

function topCounts(events: RealTimeMatchEvent[]): Record<string, number> {
    const counts = countBy(events, (event) => {
        const side = event.teamSide ? event.teamSide.toUpperCase() : 'MATCH';
        const name = event.player?.info.name || 'Unknown';

        return `${side} ${name}`;
    });

    return Object.fromEntries(
        Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5),
    );
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

function average(values: number[]): number {
    if (!values.length) {
        return 0;
    }

    return round(values.reduce((total, value) => total + value, 0) / values.length);
}

function ratio(value: number, total: number): number {
    return total ? round(value / total) : 0;
}

function round(value: number): number {
    return Math.round(value * 1000) / 1000;
}

function seededRandom(seed: number): () => number {
    let value = seed;

    return () => {
        value = (value * 16807) % 2147483647;

        return (value - 1) / 2147483646;
    };
}

function seedsFromArgs(): number[] {
    const seedArgument = process.argv.find((argument) => argument.startsWith('--seeds='));

    if (!seedArgument) {
        return defaultSeeds;
    }

    const seeds = seedArgument
        .replace('--seeds=', '')
        .split(',')
        .map((seed) => Number.parseInt(seed, 10))
        .filter((seed) => Number.isFinite(seed));

    return seeds.length ? seeds : defaultSeeds;
}

const matches = seedsFromArgs().map((seed) => analyseMatch(seed));
const tacticalProfileSeeds = seedsFromArgs();
const tacticalProfiles = [
    analyseTacticalProfile('high_press', { style: 'high_press' }, tacticalProfileSeeds),
    analyseTacticalProfile('low_block', { style: 'low_block' }, tacticalProfileSeeds),
    analyseTacticalProfile('possession', { style: 'possession' }, tacticalProfileSeeds),
    analyseTacticalProfile('direct', { style: 'direct' }, tacticalProfileSeeds),
];

console.log(JSON.stringify({
    matches,
    tacticalProfiles,
    averages: {
        passes: average(matches.map((match) => match.passes)),
        passCompletion: average(matches.map((match) => match.passCompletion)),
        shots: average(matches.map((match) => match.shots)),
        goals: average(matches.map((match) => match.goals)),
        averagePossessionPasses: average(matches.map((match) => match.averagePossessionPasses)),
        longestPossession: average(matches.map((match) => match.longestPossession)),
        possessionsWithThreePasses: average(matches.map((match) => match.possessionsWithThreePasses)),
        looseBallShare: average(matches.map((match) => match.looseBallShare)),
        ballOwnedShare: average(matches.map((match) => match.ballOwnedShare)),
        passesEndingInRestartShare: average(matches.map((match) => match.passesEndingInRestartShare)),
        averageChanceQuality: average(matches.map((match) => match.averageChanceQuality)),
        finalThirdEntries: average(matches.map((match) => match.finalThirdEntries)),
        wideEntries: average(matches.map((match) => match.wideEntries)),
        boxEntries: average(matches.map((match) => match.boxEntries)),
        crossesAttempted: average(matches.map((match) => match.crosses.attempted)),
        crossesCompleted: average(matches.map((match) => match.crosses.completed)),
        cutbacksAttempted: average(matches.map((match) => match.cutbacks.attempted)),
        cutbacksCompleted: average(matches.map((match) => match.cutbacks.completed)),
        throughBallsAttempted: average(matches.map((match) => match.throughBalls.attempted)),
        throughBallsCompleted: average(matches.map((match) => match.throughBalls.completed)),
        switchesAttempted: average(matches.map((match) => match.switches.attempted)),
        switchesCompleted: average(matches.map((match) => match.switches.completed)),
        fouls: average(matches.map((match) => match.fouls)),
        penaltiesAwarded: average(matches.map((match) => match.penaltiesAwarded)),
        penaltiesScored: average(matches.map((match) => match.penaltiesScored)),
        yellowCards: average(matches.map((match) => match.yellowCards)),
        redCards: average(matches.map((match) => match.redCards)),
    },
}, null, 2));
