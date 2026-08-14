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
