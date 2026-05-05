import Player, { type PlayerAttributes } from '$simulator/Player';
import RealTimeEngine, {
    type MatchSnapshot,
    type RealTimeMatchEvent,
    type TeamSide,
} from '$simulator/RealTimeEngine';
import Team from '$simulator/Team';
import { Position } from '$simulator/enums/Position';

export interface TeamStats {
    possession: number;
    passes: number;
    completedPasses: number;
    passCompletion: number;
    shots: number;
    shotsOnGoal: number;
    tackles: number;
    fouls: number;
    yellowCards: number;
    redCards: number;
}

export interface RestartStats {
    awards: number;
    executions: number;
}

export interface MatchStats {
    averagePossessionPasses: number;
    longestPossession: number;
    looseBallShare: number;
    ballOwnedShare: number;
    restarts: Record<string, RestartStats>;
}

export interface SimulationReport {
    home: TeamStats;
    away: TeamStats;
    match: MatchStats;
}

export interface Simulation {
    engine: RealTimeEngine;
    homeTeam: Team;
    awayTeam: Team;
    snapshots: MatchSnapshot[];
    events: RealTimeMatchEvent[];
}

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

const homeNames = [
    'Nickson Pettigrew',
    'Lasse Quizoz',
    'Marvellous Pak',
    'Rob Kaskel',
    'Jomuel Dugelman',
    'Mohamad Ashwoon',
    'Koddi Pak',
    'Morgyn Fletcher',
    'Flint Stahl',
    'Munir Johnsen',
    'Rhyse Olson',
];

const awayNames = [
    'Conal Keller',
    'Hadyn Kalleg',
    'Adenn Orwig',
    'Rhyley Ingram',
    'Muhammed Soulis',
    'Rees Baxster',
    'Peter Ventotla',
    'Jarell Van Zandt',
    'Ziyaan Myers',
    'Aaran Deitz',
    'Khalan Thompson',
];

const homeNumbers = [1, 17, 75, 7, 84, 76, 61, 26, 42, 14, 5];
const awayNumbers = [1, 37, 10, 59, 63, 59, 97, 84, 100, 64, 45];

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

const restartTypes = ['throw_in', 'corner', 'goal_kick', 'free_kick', 'penalty'];
const restartAwardOutcomes = new Set(['touchline', 'goal_line', 'foul', 'penalty_foul']);
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

export function createSimulation(): Simulation {
    const homeTeam = createTeam(true, 'Juventus', homePositions, homeNames, homeNumbers);
    const awayTeam = createTeam(false, 'Milan', awayPositions, awayNames, awayNumbers);
    const engine = new RealTimeEngine(homeTeam, awayTeam, {
        random: seededRandom(20260504),
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

    return {
        engine,
        homeTeam,
        awayTeam,
        snapshots,
        events: engine.events,
    };
}

export function reportFor(events: RealTimeMatchEvent[], snapshot: MatchSnapshot, snapshots: MatchSnapshot[] = []): SimulationReport {
    const elapsedEvents = events.filter((event) => event.time <= snapshot.time);
    const elapsedSnapshots = snapshots.filter((candidate) => candidate.time <= snapshot.time);
    const report = {
        home: emptyStats(),
        away: emptyStats(),
    };

    elapsedEvents.forEach((event) => {
        if (!event.teamSide) {
            return;
        }

        registerEvent(report[event.teamSide], event);
    });

    applySnapshotPossession(report, elapsedSnapshots);
    finalizeTeamStats(report.home);
    finalizeTeamStats(report.away);

    return {
        home: report.home,
        away: report.away,
        match: matchStats(elapsedEvents, elapsedSnapshots),
    };
}

export function eventsUntil(events: RealTimeMatchEvent[], snapshot: MatchSnapshot): RealTimeMatchEvent[] {
    return events.filter((event) => event.time <= snapshot.time);
}

export function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainder = Math.floor(seconds % 60);

    return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

export function formatScoreSheet(events: RealTimeMatchEvent[]): RealTimeMatchEvent[] {
    return events.filter((event) => event.type === 'goal');
}

function createTeam(
    home: boolean,
    name: string,
    positions: Position[],
    names: string[],
    numbers: number[],
): Team {
    const players = positions.map((position, index) => new Player(
        {
            name: names[index],
            number: numbers[index],
        },
        {
            height: 178 + (index % 5) * 3,
            weight: 72 + (index % 4) * 4,
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

function registerEvent(stats: TeamStats, event: RealTimeMatchEvent): void {
    if (event.type === 'pass') {
        stats.passes += 1;
    }

    if (event.type === 'receive') {
        stats.completedPasses += 1;
    }

    if (event.type === 'shot') {
        stats.shots += 1;
    }

    if (event.type === 'goal' || event.type === 'save') {
        stats.shotsOnGoal += 1;
    }

    if (event.type === 'tackle') {
        stats.tackles += 1;
    }

    if (event.type === 'foul') {
        stats.fouls += 1;
    }

    if (event.type === 'yellow_card') {
        stats.yellowCards += 1;
    }

    if (event.type === 'red_card') {
        stats.redCards += 1;
    }
}

function emptyStats(): TeamStats {
    return {
        possession: 0,
        passes: 0,
        completedPasses: 0,
        passCompletion: 0,
        shots: 0,
        shotsOnGoal: 0,
        tackles: 0,
        fouls: 0,
        yellowCards: 0,
        redCards: 0,
    };
}

function applySnapshotPossession(report: { home: TeamStats, away: TeamStats }, snapshots: MatchSnapshot[]): void {
    let homeOwned = 0;
    let awayOwned = 0;

    snapshots.forEach((snapshot) => {
        const owner = snapshot.players.find((player) => player.id === snapshot.ball.ownerId);

        if (owner?.teamSide === 'home') {
            homeOwned += 1;
        }

        if (owner?.teamSide === 'away') {
            awayOwned += 1;
        }
    });

    const totalOwned = homeOwned + awayOwned;

    report.home.possession = totalOwned ? homeOwned / totalOwned : 0;
    report.away.possession = totalOwned ? awayOwned / totalOwned : 0;
}

function finalizeTeamStats(stats: TeamStats): void {
    stats.passCompletion = stats.passes ? stats.completedPasses / stats.passes : 0;
}

function matchStats(events: RealTimeMatchEvent[], snapshots: MatchSnapshot[]): MatchStats {
    const possessions = possessionsFromEvents(events);
    const looseSnapshots = snapshots.filter((snapshot) => !snapshot.ball.ownerId);

    return {
        averagePossessionPasses: average(possessions.map((possession) => possession.passes)),
        longestPossession: Math.max(0, ...possessions.map((possession) => possession.passes)),
        looseBallShare: ratio(looseSnapshots.length, snapshots.length),
        ballOwnedShare: ratio(snapshots.length - looseSnapshots.length, snapshots.length),
        restarts: restartStats(events),
    };
}

function possessionsFromEvents(events: RealTimeMatchEvent[]): { side: TeamSide, passes: number }[] {
    const possessions: { side: TeamSide, passes: number }[] = [];
    let active: { side: TeamSide, passes: number } | null = null;

    events.forEach((event) => {
        if (!event.teamSide || !possessionEventTypes.has(event.type)) {
            return;
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
    });

    if (active) {
        possessions.push(active);
    }

    return possessions;
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

function average(values: number[]): number {
    if (!values.length) {
        return 0;
    }

    return values.reduce((total, value) => total + value, 0) / values.length;
}

function ratio(value: number, total: number): number {
    return total ? value / total : 0;
}

function seededRandom(seed: number): () => number {
    let value = seed;

    return () => {
        value = (value * 16807) % 2147483647;

        return (value - 1) / 2147483646;
    };
}
