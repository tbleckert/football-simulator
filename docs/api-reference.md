# API Reference

This reference covers the public classes that are useful for a web or text based football manager game.

## Player

```ts
import Player, { type PlayerAttributes } from '$simulator/Player';
import { Position } from '$simulator/enums/Position';

const player = new Player(
    { name: 'Alex Striker', number: 9 },
    { height: 184, weight: 78 },
    attributes,
    Position.ST,
);
```

Constructor arguments:

| Argument | Description |
| --- | --- |
| `info` | `{ name: string, number: number }` |
| `biometrics` | `{ height: number, weight: number }` |
| `attributes` | Full `PlayerAttributes` object |
| `position` | `Position` enum value |

Attributes use a `1` to `20` scale. The engine expects every attribute field to exist. In game code, keep a complete default attribute object and merge player-specific overrides into it.

Useful methods:

| Method | Description |
| --- | --- |
| `rating()` | Returns derived outfield or goalkeeper ratings. |
| `ratingAverage()` | Returns average derived rating. |
| `defenceRating()` | Returns a broad defensive rating. |
| `possessionRating()` | Returns a broad possession rating. |
| `attackRating()` | Returns a broad attacking rating. |

## Position

```ts
import { Position } from '$simulator/enums/Position';
```

Available positions:

```ts
Position.GK
Position.LB
Position.LCB
Position.CB
Position.RCB
Position.RB
Position.LWB
Position.LDM
Position.DM
Position.RDM
Position.RWB
Position.LM
Position.LCM
Position.CM
Position.RCM
Position.RM
Position.LW
Position.LCOM
Position.COM
Position.RCOM
Position.RW
Position.LF
Position.CF
Position.RF
Position.ST
```

## Team

```ts
import Team from '$simulator/Team';

const team = new Team(true, 'Northbridge FC', players);
```

Constructor arguments:

| Argument | Description |
| --- | --- |
| `home` | `true` for home team, `false` for away team. |
| `name` | Team display name. |
| `players` | Ordered list of `Player` instances. |

For `RealTimeEngine`, the first 11 players are starters and players 12 to 16 are substitutes. If the bench is missing, the engine generates fallback substitutes.

Useful methods:

| Method | Description |
| --- | --- |
| `rating()` | Returns `{ goalkeeping, defense, attack }`. |
| `getGoalkeepers()` | Returns players with `Position.GK`. |
| `getFieldPlayers()` | Returns non-goalkeepers. |
| `goalkeeperRating()` | Returns average goalkeeper rating. |
| `defenceRating()` | Returns team defensive rating. |
| `possessionRating()` | Returns team possession rating. |
| `attackRating()` | Returns team attacking rating. |

## RealTimeEngine

```ts
import RealTimeEngine from '$simulator/RealTimeEngine';

const engine = new RealTimeEngine(homeTeam, awayTeam, options);
```

`RealTimeEngine` is the recommended match engine. It advances the match in small time slices, updates tactical positions and player intents, resolves ball actions, and records match events.

### Options

All options are optional.

| Option | Default | Description |
| --- | --- | --- |
| `tickSeconds` | `0.25` | Simulation seconds per tick. |
| `matchLengthSeconds` | `90 * 60` | Regulation match length. |
| `homeTactics` | balanced defaults | Partial tactics for the home side. |
| `awayTactics` | balanced defaults | Partial tactics for the away side. |
| `referee` | default referee profile | Partial referee profile. |
| `random` | `Math.random` | Random function. Use a seeded function for reproducible matches. |

### Tactics

```ts
type TacticalStyle = 'balanced' | 'possession' | 'direct' | 'counter' | 'low_block' | 'high_press';
type Mentality = 'defensive' | 'balanced' | 'attacking';
type AttackingFocus = 'balanced' | 'wide' | 'central';

interface Tactics {
    formation: string;
    style: TacticalStyle;
    press: number;
    width: number;
    tempo: number;
    mentality: Mentality;
    defensiveLine: number;
    compactness: number;
    focus: AttackingFocus;
}
```

You may pass partial tactics. The selected style preset fills missing values. Numeric values are clamped from `0` to `100`.

### Referee Profile

```ts
interface RefereeProfile {
    strictness: number;
    advantagePatience: number;
    penaltyThreshold: number;
    bookingThreshold: number;
}
```

Numeric referee values are clamped from `0` to `100`.

### Methods

| Method | Description |
| --- | --- |
| `start()` | Starts the match and returns the first snapshot. Called automatically by `simulate()` or `tick()`. |
| `tick()` | Advances the match by one tick and returns `{ state, events, snapshot }`. |
| `simulate(untilSeconds)` | Runs until the requested second or full time and returns all snapshots. |
| `applyTacticalChange(side, changes, reason)` | Changes tactics for `home` or `away` and records a `tactical_change` event. |
| `applyRoleChange(playerId, role, reason)` | Changes one simulated player's role and records a `role_change` event. |

### Stateful Properties

| Property | Description |
| --- | --- |
| `state` | Current mutable match state. |
| `events` | All events committed so far. |
| `snapshots` | All snapshots committed so far. |
| `homeTeam` | Home `Team`. |
| `awayTeam` | Away `Team`. |
| `tickSeconds` | Tick size in seconds. |
| `matchLengthSeconds` | Match length in seconds. |

## MatchSnapshot

`MatchSnapshot` is the best object for rendering a pitch replay or showing current match state.

Important fields:

| Field | Description |
| --- | --- |
| `time` | Match time in seconds. |
| `period` | `1`, `2`, or `'ended'`. |
| `phase` | Current match phase, such as `open_play`, `corner`, `half_time`, or `full_time`. |
| `score` | `{ home, away }`. |
| `ball` | Ball position, velocity, and owner id. |
| `players` | All simulated player positions, stamina, role, cards, injury status, target, and current intent. |
| `events` | Events produced during this snapshot. |
| `possession` | Current possession context. |
| `fieldZones` | Current field zones for the ball/possession. |
| `activeAttackPattern` | Current attack pattern label. |
| `activePassTarget` | Target point of the active pass, if any. |
| `activeShot` | Shot route, chance quality, and target, if a shot is active. |
| `secondBall` | Second-ball marker, if any. |

Pitch coordinates are in meters on a `105 x 68` pitch.

## RealTimeMatchEvent

`RealTimeMatchEvent` is the best object for text commentary, timelines, match reports, and post-match stat collection.

Important fields:

| Field | Description |
| --- | --- |
| `type` | Event type. |
| `time` | Match time in seconds. |
| `team` | Team object, when applicable. |
| `teamSide` | `'home'` or `'away'`, when applicable. |
| `player` | Primary player, when applicable. |
| `secondaryPlayer` | Secondary player, when applicable. |
| `position` | Event pitch position. |
| `score` | Score after the event. |
| `outcome` | Route, restart outcome, foul reason, or other event detail. |
| `fieldZones` | Field zones involved in the event. |
| `possession` | Possession context at the event. |
| `activeAttackPattern` | Attack pattern at the event. |
| `chanceQuality` | Shot or penalty quality when available. |
| `replayWindow` | Suggested replay window for goals. |

Event types:

```ts
'match_start'
'kickoff'
'half_time'
'full_time'
'throw_in'
'corner'
'goal_kick'
'free_kick'
'penalty'
'dribble'
'challenge'
'yellow_card'
'red_card'
'injury'
'substitution'
'tactical_change'
'role_change'
'advantage'
'aerial_duel'
'blocked_shot'
'goalkeeper_claim'
'goalkeeper_punch'
'pass'
'receive'
'second_ball'
'interception'
'tackle'
'shot'
'save'
'miss'
'foul'
'goal'
'recovery'
```

## RealTimeReporter

```ts
import RealTimeReporter from '$simulator/RealTimeReporter';

const report = new RealTimeReporter(engine).getReport();
```

`RealTimeReporter` turns a completed `RealTimeEngine` match into a structured report.

Report fields:

| Field | Description |
| --- | --- |
| `headline` | Scoreline headline. |
| `summary` | One paragraph summary. |
| `teams.home` | Home team report data. |
| `teams.away` | Away team report data. |
| `sections` | Tactical pattern, chance creation, pressing, player impact, and manager impact sections. |
| `turningPoints` | Important match events as report sections. |

## SeasonSimulator

```ts
import SeasonSimulator from '$simulator/SeasonSimulator';

const simulator = new SeasonSimulator(teams, {
    rounds: 2,
    matchLengthSeconds: 90 * 60,
    random: seededRandom(1234),
});

const season = simulator.simulate();
```

`SeasonSimulator` creates round-robin fixtures and runs each fixture through `RealTimeEngine`.

Team input:

```ts
interface SeasonTeamInput {
    name: string;
    players: Team['players'];
    tactics?: Partial<Tactics>;
}
```

Options:

| Option | Default | Description |
| --- | --- | --- |
| `rounds` | `2` | Number of round-robin passes. |
| `matchLengthSeconds` | `90 * 60` | Match length for each fixture. |
| `random` | `Math.random` | Random function used across season fixtures. |

Season report fields:

| Field | Description |
| --- | --- |
| `matches` | Match summaries for every fixture. |
| `table` | Sorted league table. |
| `topScorers` | Top goal scorers. |
| `topPassers` | Top passers. |
| `styleStats` | Aggregates by tactical style. |
| `metrics` | League-level goals, shots, cards, injuries, and home win share. |

## Legacy Engine

The older `Engine`, `Game`, `Commentator`, and `Reporter` classes simulate a simpler event flow. Prefer `RealTimeEngine` for new manager game features because it exposes richer tactical state, modern event types, snapshots, and reporting.

