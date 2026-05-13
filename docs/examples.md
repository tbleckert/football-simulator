# Usage Examples

These examples use the published package root import.

## Seeded Random

Use a deterministic random function for official fixtures. Store the seed with the match result.

```ts
export function seededRandom(seed: number): () => number {
    let value = seed;

    return () => {
        value = (value * 16807) % 2147483647;

        return (value - 1) / 2147483646;
    };
}
```

## Build Players From Game Data

The simulator expects a complete `PlayerAttributes` object. Keep a complete baseline and merge saved player attributes into it.

```ts
import {
    Player,
    Position,
    type PlayerAttributes,
} from '@bleckert/football-simulator';

const defaultAttributes: PlayerAttributes = {
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

interface GamePlayer {
    name: string;
    number: number;
    position: Position;
    height: number;
    weight: number;
    attributes: Partial<PlayerAttributes>;
}

function toSimulatorPlayer(player: GamePlayer): Player {
    return new Player(
        {
            name: player.name,
            number: player.number,
        },
        {
            height: player.height,
            weight: player.weight,
        },
        {
            ...defaultAttributes,
            ...player.attributes,
        },
        player.position,
    );
}
```

## Build a Match-Day Team

Order matters. The first 11 players become starters. The next five become substitutes.

```ts
import { Team } from '@bleckert/football-simulator';

function toSimulatorTeam(home: boolean, name: string, selectedPlayers: GamePlayer[]): Team {
    return new Team(
        home,
        name,
        selectedPlayers.map(toSimulatorPlayer),
    );
}
```

## Simulate a Finished Match

```ts
import {
    RealTimeEngine,
    RealTimeReporter,
} from '@bleckert/football-simulator';

const homeTeam = toSimulatorTeam(true, 'Northbridge FC', homeSelection);
const awayTeam = toSimulatorTeam(false, 'Eastport United', awaySelection);

const engine = new RealTimeEngine(homeTeam, awayTeam, {
    random: seededRandom(matchSeed),
    homeTactics: {
        formation: '4-4-2',
        style: 'high_press',
        mentality: 'attacking',
        press: 72,
        tempo: 68,
        width: 58,
    },
    awayTactics: {
        formation: '4-3-3',
        style: 'counter',
        mentality: 'defensive',
        defensiveLine: 38,
        compactness: 66,
    },
});

const snapshots = engine.simulate(90 * 60);
const finalSnapshot = snapshots[snapshots.length - 1];
const report = new RealTimeReporter(engine).getReport();

const result = {
    homeGoals: finalSnapshot.score.home,
    awayGoals: finalSnapshot.score.away,
    headline: report.headline,
    summary: report.summary,
    events: engine.events.map(toStoredEvent),
};
```

## Create a Text Match Feed

```ts
import type { RealTimeMatchEvent } from '@bleckert/football-simulator';

function matchMinute(time: number): number {
    return Math.max(1, Math.ceil(time / 60));
}

function formatEvent(event: RealTimeMatchEvent): string | null {
    const minute = matchMinute(event.time);
    const player = event.player?.info.name;
    const team = event.team?.name || event.teamSide;

    switch (event.type) {
        case 'match_start':
            return 'The match is underway.';
        case 'half_time':
            return `Half time. ${event.score.home}-${event.score.away}.`;
        case 'full_time':
            return `Full time. ${event.score.home}-${event.score.away}.`;
        case 'goal':
            return `${minute}' Goal for ${team}. ${player} scores.`;
        case 'shot':
            return `${minute}' ${player} shoots.`;
        case 'save':
            return `${minute}' The goalkeeper makes the save.`;
        case 'miss':
            return `${minute}' ${player} misses the target.`;
        case 'blocked_shot':
            return `${minute}' ${player}'s shot is blocked.`;
        case 'penalty':
            return `${minute}' Penalty event for ${team}.`;
        case 'yellow_card':
            return `${minute}' ${player} is shown a yellow card.`;
        case 'red_card':
            return `${minute}' ${player} is sent off.`;
        case 'injury':
            return `${minute}' ${player} needs treatment.`;
        case 'substitution':
            return `${minute}' ${team} make a substitution.`;
        case 'tactical_change':
            return `${minute}' ${team} change their tactical approach.`;
        default:
            return null;
    }
}

const feed = engine.events
    .map(formatEvent)
    .filter((line): line is string => Boolean(line));
```

## Simulate With Half-Time Decisions

Use `tick()` when your match screen needs manager interaction.

```ts
import { Position } from '@bleckert/football-simulator';

engine.start();

while (engine.state.period === 1) {
    engine.tick();
}

const halfTimeScore = { ...engine.state.score };

if (halfTimeScore.home < halfTimeScore.away) {
    engine.applyTacticalChange('home', {
        style: 'direct',
        mentality: 'attacking',
        tempo: 80,
        press: 74,
    }, 'half_time_team_talk');

    const midfielder = engine.state.players.find((player) => {
        return player.side === 'home' && player.role === Position.CM;
    });

    if (midfielder) {
        engine.applyRoleChange(midfielder.id, Position.COM, 'pushed_midfielder_forward');
    }
}

engine.simulate(90 * 60);
```

## Store Compact Events

```ts
import type { RealTimeMatchEvent } from '@bleckert/football-simulator';

function toStoredEvent(event: RealTimeMatchEvent) {
    return {
        type: event.type,
        time: event.time,
        minute: matchMinute(event.time),
        teamSide: event.teamSide ?? null,
        teamName: event.team?.name ?? null,
        playerName: event.player?.info.name ?? null,
        playerNumber: event.player?.info.number ?? null,
        secondaryPlayerName: event.secondaryPlayer?.info.name ?? null,
        outcome: event.outcome ?? null,
        score: event.score,
        position: event.position,
        fieldZones: event.fieldZones,
        attackPattern: event.activeAttackPattern,
        chanceQuality: event.chanceQuality ?? null,
        possessionId: event.possession.id,
    };
}
```

## Run a Small Season

```ts
import {
    SeasonSimulator,
    type SeasonTeamInput,
} from '@bleckert/football-simulator';

const teams: SeasonTeamInput[] = clubs.map((club) => ({
    name: club.name,
    players: club.selectedPlayers.map(toSimulatorPlayer),
    tactics: club.tactics,
}));

const season = new SeasonSimulator(teams, {
    rounds: 2,
    matchLengthSeconds: 90 * 60,
    random: seededRandom(seasonSeed),
}).simulate();

console.table(season.table);
console.table(season.topScorers);
console.log(season.metrics.goalsPerMatch);
```

`SeasonSimulator` is useful for tests, balancing, previews, and background leagues. In a persistent manager game, you may still prefer to simulate fixtures one by one so you can apply injuries, suspensions, morale, fatigue, and transfers between match days.
