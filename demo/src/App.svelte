<script lang="ts">
    import { onMount } from 'svelte';
    import type {
        MatchSnapshot,
        RealTimeMatchEvent,
        Tactics,
        TacticalStyle,
    } from '$simulator/RealTimeEngine.ts';
    import Pitch from './Pitch.svelte';
    import SquadView from './SquadView.svelte';
    import {
        createSimulation,
        eventsUntil,
        formatScoreSheet,
        formatTime,
        homeStartingTactics,
        reportFor,
        squadStats,
        tacticalPresets,
        type ScheduledTacticalChange,
        type Simulation,
    } from './simulation';

    type GameWindow = Window & {
        advanceTime?: (milliseconds: number) => void;
        render_game_to_text?: () => string;
    };

    const featuredEventTypes = new Set([
        'goal',
        'shot',
        'save',
        'miss',
        'blocked_shot',
        'offside',
        'yellow_card',
        'red_card',
        'substitution',
        'foul',
        'tactical_change',
    ]);

    const tacticalStyles: TacticalStyle[] = [
        'balanced',
        'possession',
        'direct',
        'counter',
        'low_block',
        'high_press',
    ];
    const formations = ['4-4-2', '4-3-3', '4-2-3-1'];

    let simulation: Simulation = createSimulation();
    let snapshots = simulation.snapshots;
    let events = simulation.events;
    let index = 0;
    let preciseIndex = 0;
    let playing = false;
    let speed = 45;
    let lastFrameTime = 0;
    let frameHandle = 0;
    let selectedPlayerId = '';
    let isFullscreen = false;
    let tacticalChanges: ScheduledTacticalChange[] = [];
    let tacticsOpen = false;
    let draftStyle: TacticalStyle = homeStartingTactics.style;
    let draftFormation = homeStartingTactics.formation;
    let tacticsView: 'plan' | 'squad' = 'plan';

    $: snapshot = snapshots[index] as MatchSnapshot;
    $: elapsedEvents = eventsUntil(events, snapshot);
    $: report = reportFor(events, snapshot, snapshots);
    $: goals = formatScoreSheet(elapsedEvents);
    $: selectedPlayer = snapshot.players.find((player) => player.id === selectedPlayerId)
        || snapshot.players.find((player) => player.id === snapshot.ball.ownerId)
        || snapshot.players[0];
    $: notableEvents = elapsedEvents.filter((event) => featuredEventTypes.has(event.type));
    $: recentEvents = (notableEvents.length ? notableEvents : elapsedEvents).slice(-3).reverse();
    $: controlledSquad = squadStats(simulation.homeTeam.players, snapshot, elapsedEvents, 'home');
    $: homeAbbreviation = teamAbbreviation(simulation.homeTeam.name);
    $: awayAbbreviation = teamAbbreviation(simulation.awayTeam.name);
    $: possessionTotal = report.home.possession + report.away.possession;
    $: homePossession = snapshot.time > 0 && possessionTotal > 0
        ? report.home.possession / possessionTotal
        : 0.5;
    $: momentumEvents = elapsedEvents.filter((event) => event.teamSide).slice(-22);
    $: timelineEndTime = snapshots[snapshots.length - 1]?.time || simulation.engine.matchLengthSeconds;
    $: activeTactics = tacticsAt(snapshot.time);
    $: draftPreset = tacticalPresets[draftStyle];
    $: draftTactics = draftStyle === activeTactics.style
        ? activeTactics
        : { formation: draftFormation, ...draftPreset.tactics };
    $: tacticalDraftChanged = draftStyle !== activeTactics.style
        || draftFormation !== activeTactics.formation;
    $: intentTarget = selectedPlayer
        ? {
            x: clamp(30, 88, 54 + (selectedPlayer.currentIntent.target.x - selectedPlayer.x) * 1.35),
            y: clamp(10, 52, 30 + (selectedPlayer.currentIntent.target.y - selectedPlayer.y) * 0.8),
        }
        : { x: 78, y: 20 };

    function clamp(minimum: number, maximum: number, value: number): number {
        return Math.min(maximum, Math.max(minimum, value));
    }

    function tacticsAt(time: number): Tactics {
        const changes = tacticalChanges.filter((change) => change.side === 'home' && change.at <= time);
        const latestChange = changes[changes.length - 1];

        return {
            ...homeStartingTactics,
            ...latestChange?.tactics,
        };
    }

    function togglePlay(): void {
        playing = !playing;
        lastFrameTime = 0;
    }

    function newMatch(): void {
        simulation = createSimulation();
        snapshots = simulation.snapshots;
        events = simulation.events;
        index = 0;
        preciseIndex = 0;
        playing = false;
        lastFrameTime = 0;
        selectedPlayerId = '';
        tacticalChanges = [];
        tacticsOpen = false;
        draftStyle = homeStartingTactics.style;
        draftFormation = homeStartingTactics.formation;
        tacticsView = 'plan';
    }

    function scrub(): void {
        playing = false;
        preciseIndex = index;
    }

    function advanceSimulation(deltaSeconds: number): void {
        if (!playing) {
            return;
        }

        preciseIndex += deltaSeconds * speed / simulation.engine.tickSeconds;
        index = Math.min(snapshots.length - 1, Math.floor(preciseIndex));

        if (
            index >= snapshots.length - 1
            || snapshots[index].period === 'ended'
        ) {
            playing = false;
        }
    }

    function frame(now: number): void {
        if (!lastFrameTime) {
            lastFrameTime = now;
        }

        const deltaSeconds = (now - lastFrameTime) / 1000;
        lastFrameTime = now;
        advanceSimulation(deltaSeconds);
        frameHandle = requestAnimationFrame(frame);
    }

    function eventLabel(event: RealTimeMatchEvent): string {
        if (event.type === 'tactical_change') {
            const style = event.outcome?.replace('manager_', '') as TacticalStyle | undefined;
            const label = style && tacticalPresets[style]
                ? tacticalPresets[style].label
                : 'New instructions';

            return `${homeAbbreviation} switch · ${label}`;
        }

        if (event.type === 'substitution') {
            return `${event.secondaryPlayer?.info.name || 'Player'} → ${event.player?.info.name || 'Substitute'}`;
        }

        if (event.type === 'offside') {
            return `${event.player?.info.name || 'Player'} caught offside`;
        }

        const player = event.player?.info.name || event.teamSide || 'Match';
        return `${player} · ${event.type.replace(/_/g, ' ')}`;
    }

    function eventDetail(event: RealTimeMatchEvent): string {
        if (event.type === 'tactical_change') {
            return tacticsAt(event.time).formation;
        }

        if (event.chanceQuality !== undefined) {
            return `${Math.round(event.chanceQuality * 100)}% chance`;
        }

        return (event.outcome || event.activeAttackPattern || 'match event').replace(/_/g, ' ');
    }

    function matchStatus(currentSnapshot: MatchSnapshot): string {
        if (currentSnapshot.period === 'ended') {
            return 'Full time';
        }

        if (currentSnapshot.phase === 'half_time') {
            return 'Half time';
        }

        return currentSnapshot.time > 0 ? formatTime(currentSnapshot.time) : '00:00';
    }

    function phaseLabel(phase: MatchSnapshot['phase']): string {
        return phase.replace(/_/g, ' ');
    }

    function teamAbbreviation(name: string): string {
        return name.slice(0, 3).toUpperCase();
    }

    function pitchX(value: number): number {
        return value / 105 * 100;
    }

    function pitchY(value: number): number {
        return value / 68 * 100;
    }

    function snapshotIndexAt(time: number): number {
        const foundIndex = snapshots.findIndex((candidate) => candidate.time >= time);
        return foundIndex >= 0 ? foundIndex : snapshots.length - 1;
    }

    function jumpToGoal(goalIndex: number): void {
        const goal = goals[goalIndex];

        if (!goal) {
            return;
        }

        index = snapshotIndexAt(goal.time);
        preciseIndex = index;
        playing = false;
    }

    function openTactics(): void {
        if (snapshot.period === 'ended') {
            return;
        }

        playing = false;
        draftStyle = activeTactics.style;
        draftFormation = activeTactics.formation;
        tacticsView = 'plan';
        tacticsOpen = true;
    }

    function closeTactics(): void {
        tacticsOpen = false;
    }

    function applyTactics(): void {
        if (!tacticalDraftChanged || snapshot.period === 'ended') {
            closeTactics();
            return;
        }

        const decisionTime = snapshot.time;
        const seed = simulation.seed;
        const nextTactics: Tactics = {
            ...draftTactics,
            formation: draftFormation,
        };

        tacticalChanges = [
            ...tacticalChanges.filter((change) => change.side !== 'home' || change.at < decisionTime),
            {
                at: decisionTime,
                side: 'home',
                tactics: nextTactics,
                reason: `manager_${draftStyle}`,
            },
        ];

        simulation = createSimulation(seed, tacticalChanges);
        snapshots = simulation.snapshots;
        events = simulation.events;
        index = snapshotIndexAt(decisionTime + simulation.engine.tickSeconds);
        preciseIndex = index;
        playing = false;
        lastFrameTime = 0;
        tacticsOpen = false;
    }

    function selectPlayer(event: CustomEvent<{ id: string }>): void {
        selectedPlayerId = event.detail.id;
    }

    async function toggleFullscreen(): Promise<void> {
        if (document.fullscreenElement) {
            await document.exitFullscreen();
            return;
        }

        await document.documentElement.requestFullscreen();
    }

    function handleKeydown(event: KeyboardEvent): void {
        const target = event.target as HTMLElement | null;

        if (event.key === 'Escape' && tacticsOpen) {
            closeTactics();
            return;
        }

        if (target?.matches('button, input, select, textarea')) {
            return;
        }

        if (event.code === 'Space') {
            event.preventDefault();
            togglePlay();
        }

        if (event.key.toLowerCase() === 'n') {
            newMatch();
        }

        if (event.key.toLowerCase() === 'f') {
            void toggleFullscreen();
        }

        if (event.key.toLowerCase() === 't') {
            tacticsOpen ? closeTactics() : openTactics();
        }
    }

    function renderGameToText(): string {
        return JSON.stringify({
            coordinateSystem: 'Pitch origin is top-left; x runs 0-105 left-to-right and y runs 0-68 top-to-bottom.',
            mode: playing ? 'playing' : 'paused',
            time: snapshot.time,
            period: snapshot.period,
            phase: snapshot.phase,
            speed,
            seed: simulation.seed,
            score: snapshot.score,
            controlledTeam: {
                side: 'home',
                name: simulation.homeTeam.name,
                abbreviation: homeAbbreviation,
            },
            tactics: {
                open: tacticsOpen,
                view: tacticsView,
                home: activeTactics,
                changes: tacticalChanges.map((change) => ({
                    at: change.at,
                    style: change.tactics.style,
                    formation: change.tactics.formation,
                })),
            },
            squad: tacticsOpen && tacticsView === 'squad'
                ? controlledSquad.map((player) => ({
                    name: player.name,
                    number: player.number,
                    position: player.position,
                    onPitch: player.onPitch,
                    stamina: player.stamina,
                    passes: [player.passesCompleted, player.passesAttempted],
                    defensiveActions: player.defensiveActions,
                    shots: player.shots,
                    goals: player.goals,
                }))
                : undefined,
            ball: snapshot.ball,
            selectedPlayer: selectedPlayer
                ? {
                    id: selectedPlayer.id,
                    name: selectedPlayer.playerName,
                    number: selectedPlayer.playerNumber,
                    teamSide: selectedPlayer.teamSide,
                    x: selectedPlayer.x,
                    y: selectedPlayer.y,
                    intent: selectedPlayer.currentIntent.type,
                    intentTarget: selectedPlayer.currentIntent.target,
                }
                : null,
            visiblePlayers: snapshot.players.map((player) => ({
                id: player.id,
                teamSide: player.teamSide,
                x: player.x,
                y: player.y,
            })),
            recentEvents: recentEvents.map((event) => ({
                time: event.time,
                type: event.type,
                teamSide: event.teamSide,
                player: event.player?.info.name,
            })),
        });
    }

    onMount(() => {
        const gameWindow = window as GameWindow;
        gameWindow.render_game_to_text = renderGameToText;
        gameWindow.advanceTime = (milliseconds: number) => advanceSimulation(milliseconds / 1000);

        const updateFullscreen = () => {
            isFullscreen = Boolean(document.fullscreenElement);
        };

        window.addEventListener('keydown', handleKeydown);
        document.addEventListener('fullscreenchange', updateFullscreen);
        frameHandle = requestAnimationFrame(frame);

        return () => {
            cancelAnimationFrame(frameHandle);
            window.removeEventListener('keydown', handleKeydown);
            document.removeEventListener('fullscreenchange', updateFullscreen);
            delete gameWindow.render_game_to_text;
            delete gameWindow.advanceTime;
        };
    });
</script>

<svelte:head>
    <title>Live match · Football simulator</title>
    <meta
        name="description"
        content="A live, seeded football match simulation with player intent, match shape and event analysis."
    >
</svelte:head>

<main class="game-shell">
    <div class="game-board">
        <section class="panel pitch-panel" aria-label="Live match pitch">
            <Pitch {snapshot} {selectedPlayerId} on:selectPlayer={selectPlayer} />
            <div class="pitch-team-label" aria-label={`You control ${simulation.homeTeam.name}`}>
                <i></i><span>Your team · {homeAbbreviation}</span>
            </div>
        </section>

        <aside class="panel match-rail" aria-label="Live match score and events">
            <div class="match-clock">
                <span>{matchStatus(snapshot)}</span>
                <small>{snapshot.period === 'ended' ? 'Match complete' : `Period ${snapshot.period}`}</small>
            </div>

            <div class="scoreline" aria-label={`You control ${simulation.homeTeam.name}. ${simulation.homeTeam.name} ${snapshot.score.home}, ${simulation.awayTeam.name} ${snapshot.score.away}`}>
                <span class="score-team controlled-score-team">
                    <small>Your team</small>
                    <b>{homeAbbreviation}</b>
                </span>
                <strong>{snapshot.score.home} — {snapshot.score.away}</strong>
                <span class="score-team opponent-score-team">
                    <small>Opponent</small>
                    <b>{awayAbbreviation}</b>
                </span>
            </div>

            <div class="phase"><span></span>{phaseLabel(snapshot.phase)}</div>

            <ol class="live-events" aria-label="Latest notable events">
                {#each recentEvents as event}
                    <li>
                        <time>{Math.floor(event.time / 60)}'</time>
                        <span class:home={event.teamSide === 'home'} class:away={event.teamSide === 'away'} class="event-dot"></span>
                        <div>
                            <strong>{eventLabel(event)}</strong>
                            <small>{eventDetail(event)}</small>
                        </div>
                    </li>
                {:else}
                    <li class="empty-event">
                        <time>00'</time>
                        <span class="event-dot home"></span>
                        <div>
                            <strong>Waiting for kickoff</strong>
                            <small>The match is ready</small>
                        </div>
                    </li>
                {/each}
            </ol>

            <div class="rail-metric possession-metric">
                <div class="metric-label">
                    <span>Possession</span>
                    <span>{Math.round(homePossession * 100)} / {Math.round((1 - homePossession) * 100)}</span>
                </div>
                <div class="possession-bar" aria-hidden="true">
                    <span style:width={`${homePossession * 100}%`}></span>
                </div>
            </div>

            <div class="rail-metric momentum-metric">
                <div class="metric-label"><span>Momentum</span><span>Last 22 events</span></div>
                <div class="momentum-bars" aria-hidden="true">
                    {#each momentumEvents as event, eventIndex}
                        <span
                            class:away={event.teamSide === 'away'}
                            style:height={`${32 + ((eventIndex * 17) % 58)}%`}
                        ></span>
                    {/each}
                </div>
            </div>
        </aside>

        <section class="support-grid" aria-label="Match analysis">
            <article class="panel timeline-card">
                <header>
                    <h2>Events</h2>
                    <span>{goals.length} {goals.length === 1 ? 'goal' : 'goals'}</span>
                </header>
                <div class="timeline-visual">
                    <div class="timeline-scale"><span>0'</span><span>HT</span><span>FT</span></div>
                    <div class="timeline-line">
                        {#each goals as goal, goalIndex}
                            <button
                                type="button"
                                class="goal-marker"
                                class:away={goal.teamSide === 'away'}
                                style:left={`${goal.time / timelineEndTime * 100}%`}
                                aria-label={`Jump to goal at ${formatTime(goal.time)}`}
                                on:click={() => jumpToGoal(goalIndex)}
                            >●</button>
                        {/each}
                        <span class="current-marker" style:left={`${snapshot.time / timelineEndTime * 100}%`}></span>
                    </div>
                    <input
                        class="timeline-input"
                        type="range"
                        min="0"
                        max={snapshots.length - 1}
                        bind:value={index}
                        on:input={scrub}
                        aria-label="Match timeline"
                    >
                    <strong>{matchStatus(snapshot)}</strong>
                </div>
            </article>

            <article class="panel intent-card">
                <header>
                    <h2>Player intent</h2>
                    <span>{selectedPlayer?.currentIntent.type.replace(/_/g, ' ')}</span>
                </header>
                <div class="intent-visual">
                    <div class="selected-player-badge">
                        <strong>{selectedPlayer?.playerNumber}</strong>
                        <span>{selectedPlayer?.playerName}</span>
                    </div>
                    <svg viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
                        <defs>
                            <marker id="intent-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                                <path d="M0,0 L6,3 L0,6 Z"></path>
                            </marker>
                        </defs>
                        <path d={`M24 30 Q48 ${intentTarget.y} ${intentTarget.x} ${intentTarget.y}`} marker-end="url(#intent-arrow)"></path>
                        <circle cx={intentTarget.x} cy={intentTarget.y} r="3"></circle>
                    </svg>
                </div>
            </article>

            <article class="panel shape-card">
                <header>
                    <h2>Match shape</h2>
                    <span>{snapshot.possession.teamSide ? `${snapshot.possession.teamSide} ball` : 'contested'}</span>
                </header>
                <div class="shape-visual" aria-label="Current team shapes">
                    <div class="mini-pitch">
                        {#each snapshot.players.filter((player) => player.teamSide === 'home') as player}
                            <span class="home" style:left={`${pitchX(player.x)}%`} style:top={`${pitchY(player.y)}%`}></span>
                        {/each}
                    </div>
                    <div class="shape-divider"></div>
                    <div class="mini-pitch">
                        {#each snapshot.players.filter((player) => player.teamSide === 'away') as player}
                            <span class="away" style:left={`${100 - pitchX(player.x)}%`} style:top={`${pitchY(player.y)}%`}></span>
                        {/each}
                    </div>
                </div>
            </article>
        </section>

        <footer class="panel control-bar" aria-label="Match controls">
            <button id="play-button" type="button" class="icon-control" on:click={togglePlay}>
                <span aria-hidden="true">{playing ? 'Ⅱ' : '▶'}</span>
                <span>{playing ? 'Pause' : 'Play'}</span>
            </button>
            <span class="control-divider"></span>
            <button id="new-match" type="button" on:click={newMatch}>New match</button>
            <span class="control-divider"></span>
            <label>
                <span>Speed</span>
                <select bind:value={speed} aria-label="Match speed">
                    <option value={1}>1x</option>
                    <option value={5}>5x</option>
                    <option value={15}>15x</option>
                    <option value={45}>45x</option>
                    <option value={90}>90x</option>
                    <option value={180}>180x</option>
                </select>
            </label>
            <span class="control-divider"></span>
            <button
                id="tactics-button"
                type="button"
                class="tactics-control"
                disabled={snapshot.period === 'ended'}
                on:click={openTactics}
            >
                <span class="tactics-prefix">{homeAbbreviation} tactics ·&nbsp;</span>{tacticalPresets[activeTactics.style].label} <kbd>T</kbd>
            </button>
            <span class="control-divider seed-divider"></span>
            <span class="seed">Seed {String(simulation.seed).padStart(10, '0')}</span>
            <button type="button" class="fullscreen-control" on:click={() => void toggleFullscreen()}>
                {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} <kbd>F</kbd>
            </button>
        </footer>
    </div>

    {#if tacticsOpen}
        <div class="tactics-backdrop">
            <div
                class="panel tactics-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="tactics-title"
            >
                <header class="tactics-header">
                    <div>
                        <span>Your team · {homeAbbreviation} · {formatTime(snapshot.time)}</span>
                        <h2 id="tactics-title">{tacticsView === 'plan' ? 'Tactical board' : 'Match squad'}</h2>
                    </div>
                    <div class="tactics-header-actions">
                        <div class="tactics-tabs" role="tablist" aria-label="Tactical board view">
                            <button
                                type="button"
                                role="tab"
                                aria-selected={tacticsView === 'plan'}
                                class:active={tacticsView === 'plan'}
                                on:click={() => tacticsView = 'plan'}
                            >Plan</button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={tacticsView === 'squad'}
                                class:active={tacticsView === 'squad'}
                                on:click={() => tacticsView = 'squad'}
                            >Squad · 22</button>
                        </div>
                        <button type="button" class="close-tactics" aria-label="Close tactics" on:click={closeTactics}>×</button>
                    </div>
                </header>

                {#if tacticsView === 'plan'}
                    <div class="tactics-layout">
                    <div class="tactics-styles" role="group" aria-label="Tactical style">
                        {#each tacticalStyles as style, styleIndex}
                            <button
                                type="button"
                                class:active={draftStyle === style}
                                aria-pressed={draftStyle === style}
                                on:click={() => draftStyle = style}
                            >
                                <small>0{styleIndex + 1}</small>
                                <strong>{tacticalPresets[style].label}</strong>
                                <span>{tacticalPresets[style].note}</span>
                            </button>
                        {/each}
                    </div>

                    <aside class="tactics-preview" aria-label="Tactical preview">
                        <div class="formation-selector" role="group" aria-label="Formation">
                            {#each formations as formation}
                                <button
                                    type="button"
                                    class:active={draftFormation === formation}
                                    aria-pressed={draftFormation === formation}
                                    on:click={() => draftFormation = formation}
                                >{formation}</button>
                            {/each}
                        </div>

                        <strong class="formation-display">{draftFormation}</strong>

                        <div class="tactical-metrics">
                            <div>
                                <span>Press <b>{draftTactics.press}</b></span>
                                <i><span style:width={`${draftTactics.press}%`}></span></i>
                            </div>
                            <div>
                                <span>Tempo <b>{draftTactics.tempo}</b></span>
                                <i><span style:width={`${draftTactics.tempo}%`}></span></i>
                            </div>
                            <div>
                                <span>Line <b>{draftTactics.defensiveLine}</b></span>
                                <i><span style:width={`${draftTactics.defensiveLine}%`}></span></i>
                            </div>
                        </div>

                        <button
                            type="button"
                            class="apply-tactics"
                            disabled={!tacticalDraftChanged}
                            on:click={applyTactics}
                        >
                            {tacticalDraftChanged ? `Apply at ${formatTime(snapshot.time)}` : 'Current setup'}
                        </button>
                    </aside>
                    </div>
                {:else}
                    <SquadView players={controlledSquad} />
                {/if}
            </div>
        </div>
    {/if}
</main>
