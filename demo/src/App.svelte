<script lang="ts">
    import { onMount } from 'svelte';
    import type { MatchSnapshot, RealTimeMatchEvent } from '$simulator/RealTimeEngine';
    import Pitch from './Pitch.svelte';
    import TeamReport from './TeamReport.svelte';
    import {
        createSimulation,
        eventsUntil,
        formatScoreSheet,
        formatTime,
        reportFor,
        type Simulation,
    } from './simulation';

    let simulation: Simulation = createSimulation();
    let snapshots = simulation.snapshots;
    let events = simulation.events;
    let index = 0;
    let preciseIndex = 0;
    let playing = false;
    let speed = 45;
    let lastFrameTime = 0;
    let frameHandle = 0;

    $: snapshot = snapshots[index] as MatchSnapshot;
    $: elapsedEvents = eventsUntil(events, snapshot);
    $: report = reportFor(events, snapshot);
    $: goals = formatScoreSheet(elapsedEvents);

    function togglePlay(): void {
        playing = !playing;
        lastFrameTime = 0;
    }

    function restart(): void {
        simulation = createSimulation();
        snapshots = simulation.snapshots;
        events = simulation.events;
        index = 0;
        preciseIndex = 0;
        playing = false;
        lastFrameTime = 0;
    }

    function scrub(): void {
        playing = false;
        preciseIndex = index;
    }

    function frame(now: number): void {
        if (!lastFrameTime) {
            lastFrameTime = now;
        }

        const deltaSeconds = (now - lastFrameTime) / 1000;
        lastFrameTime = now;

        if (playing) {
            preciseIndex += deltaSeconds * speed / simulation.engine.tickSeconds;
            index = Math.min(snapshots.length - 1, Math.floor(preciseIndex));

            if (index >= snapshots.length - 1 || snapshots[index].period === 'ended') {
                playing = false;
            }
        }

        frameHandle = requestAnimationFrame(frame);
    }

    onMount(() => {
        frameHandle = requestAnimationFrame(frame);

        return () => cancelAnimationFrame(frameHandle);
    });

    function eventLabel(event: RealTimeMatchEvent): string {
        const player = event.player?.info.name || event.teamSide || 'Match';

        return `${event.type.replace('_', ' ')} ${player}`;
    }
</script>

<svelte:head>
    <title>Football simulator example</title>
</svelte:head>

<main>
    <section class="scoreboard">
        <button type="button" class="match-minute" on:click={togglePlay}>
            {#if playing}
                Pause
            {:else if snapshot.time > 0}
                {formatTime(snapshot.time)}
            {:else}
                Start
            {/if}
        </button>
        <div class="scores">
            <span>{snapshot.score.home}</span>
            <span>-</span>
            <span>{snapshot.score.away}</span>
        </div>
        {#if goals.length}
            <div class="score-sheet">
                {#each goals as goal}
                    <div class:away={goal.teamSide === 'away'} class="score-sheet__item">
                        <span>{goal.player?.info.name}</span>
                        <span>{Math.floor(goal.time / 60)}'</span>
                    </div>
                {/each}
            </div>
        {/if}
    </section>

    <section class="controls" aria-label="Match controls">
        <button type="button" on:click={togglePlay}>{playing ? 'Pause' : 'Play'}</button>
        <button type="button" on:click={restart}>Restart</button>
        <label>
            Speed
            <select bind:value={speed}>
                <option value={15}>15x</option>
                <option value={45}>45x</option>
                <option value={90}>90x</option>
                <option value={180}>180x</option>
            </select>
        </label>
        <input
            type="range"
            min="0"
            max={snapshots.length - 1}
            bind:value={index}
            on:input={scrub}
            aria-label="Timeline"
        >
    </section>

    <Pitch {snapshot} />

    <section class="events" aria-label="Recent events">
        <h2>Recent events</h2>
        <ol>
            {#each elapsedEvents.slice(-8).reverse() as event}
                <li>
                    <span>{formatTime(event.time)}</span>
                    <strong>{eventLabel(event)}</strong>
                </li>
            {/each}
        </ol>
    </section>

    <section class="teams">
        <TeamReport team={simulation.homeTeam} report={report.home} />
        <TeamReport team={simulation.awayTeam} report={report.away} />
    </section>
</main>
