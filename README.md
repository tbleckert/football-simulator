# Football simulator

A football (soccer) simulator written in Typescript.

## Real-time engine

`RealTimeEngine` is an agent-based simulation loop that advances the match in 0.25 second slices by default. Each slice updates tactical target positions, decides player intents, resolves a ball action, moves players and the ball, then detects match events.

```ts
import RealTimeEngine from './RealTimeEngine';

const engine = new RealTimeEngine(homeTeam, awayTeam, {
  homeTactics: {
    formation: '4-4-2',
    style: 'high_press',
    press: 60,
    width: 55,
    tempo: 65,
    mentality: 'attacking',
    defensiveLine: 70,
    compactness: 48,
    focus: 'wide',
  },
});

const snapshots = engine.simulate(90 * 60);
```

Snapshots include match time, score, ball position and velocity, all 22 player positions, stamina, tactical targets, current intents, and events from that slice. The event stream includes passes, receptions, interceptions, tackles, shots, fouls, saves, misses, goals, kickoffs, half time, and full time.

Tactical presets (`balanced`, `possession`, `direct`, `counter`, `low_block`, and `high_press`) provide readable defaults for press, width, tempo, defensive line, compactness, mentality, and attacking focus. Individual values can still be overridden per team.

`RealTimeReporter` turns the completed simulation into a match story with tactical pattern, chance creation, pressing, player impact, manager impact, and turning-point sections.

## Development

1. `npm install`
2. `npm run demo`

`npm run demo` starts the visual dev environment at `http://localhost:5173`.
`npm test` runs the real-time engine smoke test.
