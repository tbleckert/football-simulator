# Football Simulator Documentation

This documentation explains how to use the simulator as the match engine for a web or text based football manager game.

The recommended integration path is:

1. Build your own game data model for clubs, squads, fixtures, managers, and saves.
2. Convert the selected players and tactics into simulator `Player`, `Team`, and `Tactics` objects when a match starts.
3. Run `RealTimeEngine` on the server or in a trusted worker.
4. Store a compact event log, final score, and report text in your game database.
5. Render the result as commentary, a timeline, a match report, or a lightweight replay in the browser.

## Documents

- [Web/text manager integration guide](web-manager-integration.md) covers the full application workflow.
- [API reference](api-reference.md) documents the main classes, options, event shapes, and output data.
- [Usage examples](examples.md) gives copyable TypeScript examples for common game features.

## Which Engine Should I Use?

Use `RealTimeEngine` for new football manager game work. It produces snapshots, tactical state, match events, score, possession context, chance quality, set pieces, discipline, injuries, substitutions, and manager-driven tactical changes.

The older `Engine`, `Game`, `Commentator`, and `Reporter` classes still exist for a simpler event based simulation, but they expose less tactical detail. They are useful for a very lightweight prototype, not for a manager game that needs rich text, tactical reports, or replay data.

## Import Paths

The published package exposes a root API.

```ts
import {
    Player,
    RealTimeEngine,
    Team,
} from '@bleckert/football-simulator';
```

The local demo app still imports simulator modules through the `$simulator` alias configured in `vite.config.ts`, but game integrations should prefer the package root import.
