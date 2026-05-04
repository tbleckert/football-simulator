# Football simulator

A football (soccer) simulator written in Typescript.

## Real-time engine

`RealTimeEngine` is an agent-based simulation loop that advances the match in 0.25 second slices by default. Each slice updates tactical target positions, decides player intents, resolves a ball action, moves players and the ball, then detects match events.

```ts
import RealTimeEngine from './RealTimeEngine';

const engine = new RealTimeEngine(homeTeam, awayTeam, {
  homeTactics: {
    formation: '4-4-2',
    press: 60,
    width: 55,
    tempo: 65,
    mentality: 'attacking',
  },
});

const snapshots = engine.simulate(90 * 60);
```

Snapshots include match time, score, ball position and velocity, all 22 player positions, stamina, tactical targets, current intents, and events from that slice. The event stream includes passes, receptions, interceptions, tackles, shots, fouls, saves, misses, goals, kickoffs, half time, and full time.

## Development

1. `npm install`
2. `npm run demo`

`npm run demo` starts the visual dev environment at `http://localhost:5173`.
`npm test` runs the real-time engine smoke test.
