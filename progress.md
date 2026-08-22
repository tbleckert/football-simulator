Original prompt: Alright cool. Let's fix those two

## Goal

- Fix full-match completion and stoppage-time accounting while preserving partial simulation.
- Implement Law 11 offside handling with an indirect-free-kick restart.

## Progress

- Confirmed `master` is clean at `b831be7`; neither fix is present.
- Reproductions from the prior audit were revalidated against the current source.
- Added deterministic regression coverage for partial/full simulation, both halves' added time, and an offside receiver judged at the pass touch.
- Confirmed the clock regression fails because first-half stoppage time is omitted from the full-time boundary (`actual: 120`, `expected: 130`).
- Repaired full-match simulation, cumulative added-time boundaries, and stoppage-time replay windows.
- Confirmed the next regression failed because an offside receiver was allowed to complete the pass.
- Added pass/shot offside snapshots, involvement-time enforcement, rebound lineage, restart exemptions, and indirect free kicks.
- Added offside reporting, demo visibility, documentation, and added-time-aware replay/timeline rendering.
- Calibrated pass selection after the first broad run exposed implausible offside volume; five full matches now average 4 offsides and 1.4 goals.
- Recomputed offside candidates after every attacking touch, including loose first touches and headers following exempt restarts.
- Added active-interference handling when an offside intended receiver closely contests a keeper or defender, while keeping distant players passive.
- Added deterministic regressions for changed offside lines between touches, goal-kick lineage, sweeper/interceptor challenges, and passive keeper claims.
- Preserved offside lineage after the tactical second-ball window expires and used the exact ball position for every new attacking touch.
- Resolved loose-ball interference before a closer opponent recovery, with paired active and passive regressions.
- `npm test`, `npm run build`, `npm run demo:build`, `npm run analyse`, and the package dry-run pass.
- Browser verification reached `Full time` after 22,560 snapshots, rendered both offside stat rows and the match story, and reported no console errors.
- Two independent read-only reviews found no remaining reproducible clock, offside-lineage, or reset defects.

## TODO

- None.

---

## Current objective

Original prompt: I'm sold. Let's build the game. Feel free to use three-js if it makes things better/easier/cooler.

## Editorial game progress

- Audited the current Svelte demo, real-time simulation state, deployment constraints, and visual reference.
- Chose native Svelte, CSS, and SVG over Three.js because the approved direction is flat, editorial, and data-driven.
- Replaced the long diagnostic page with a full-screen live match board driven by the existing simulator state.
- Preserved seeded matches, playback speed, timeline scrubbing, goal jumps, player selection, and fullscreen controls.
- Added deterministic `window.render_game_to_text` and `window.advanceTime` hooks for browser-game verification.
- The first required Playwright game-client run produced live screenshots and state payloads with no reported console errors.
- Browser inspection caught a short-viewport overflow and future-goal timeline spoiler; both were corrected.
- A stable play-then-pause scenario confirmed the visual state and `render_game_to_text` agree, with no console-error artifact.
- Tightened the score rail and supporting modules so the entire board remains legible at the client's 1280x720 viewport.
- Fixed hidden Svelte dependencies that let event panels advance while leaving the visible clock and phase label stale.
- Direct browser QA verified speed changes, live playback, pausing, player selection, and scrub-to-full-time with a real 1–1 result.
- Restored goal-marker accessibility after finding that their decorative timeline parent hid the interactive buttons from the accessibility tree.
- Raised goal markers above the transparent scrubber so they remain clickable without reducing the timeline hit target.

## Editorial game verification

- Confirmed the 390px layout has no horizontal overflow and keeps the pitch, score rail, analysis cards, and sticky controls readable.
- Confirmed goal jumps, timeline scrubbing, player selection, playback, seeded match resets, and fullscreen controls against `render_game_to_text` state.
- Ran the required web-game Playwright client after the final interaction fix; its screenshot and paused simulation state agree, with no console-error artifact.
- Passed `npm run typecheck`, `npm test`, `npm run build`, `npm run demo:build`, and `git diff --check`.
