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
    let replayEndIndex: number | null = null;
    let selectedGoalIndex = 0;
    let selectedPlayerId = '';
    let eventFilter = 'all';

    $: snapshot = snapshots[index] as MatchSnapshot;
    $: elapsedEvents = eventsUntil(events, snapshot);
    $: report = reportFor(events, snapshot, snapshots);
    $: goals = formatScoreSheet(elapsedEvents);
    $: allGoals = formatScoreSheet(events);
    $: selectedPlayer = snapshot.players.find((player) => player.id === selectedPlayerId) || snapshot.players.find((player) => player.id === snapshot.ball.ownerId);
    $: filteredEvents = filterEvents(elapsedEvents, eventFilter);
    $: if (allGoals.length && selectedGoalIndex >= allGoals.length) {
        selectedGoalIndex = allGoals.length - 1;
    }

    function togglePlay(): void {
        playing = !playing;
        lastFrameTime = 0;
        replayEndIndex = null;
    }

    function restart(): void {
        simulation = createSimulation();
        snapshots = simulation.snapshots;
        events = simulation.events;
        index = 0;
        preciseIndex = 0;
        playing = false;
        lastFrameTime = 0;
        replayEndIndex = null;
        selectedGoalIndex = 0;
        selectedPlayerId = '';
    }

    function scrub(): void {
        playing = false;
        preciseIndex = index;
        replayEndIndex = null;
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

            if (
                index >= snapshots.length - 1
                || snapshots[index].period === 'ended'
                || (replayEndIndex !== null && index >= replayEndIndex)
            ) {
                playing = false;
                replayEndIndex = null;
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
        const outcome = event.outcome ? ` · ${event.outcome.replace(/_/g, ' ')}` : '';

        return `${event.type.replace(/_/g, ' ')} ${player}${outcome}`;
    }

    function formatPercent(value: number): string {
        return `${Math.round(value * 100)}%`;
    }

    function formatDecimal(value: number): string {
        return value.toFixed(1);
    }

    function restartLabel(type: string): string {
        return type.replace(/_/g, ' ');
    }

    function filterEvents(source: RealTimeMatchEvent[], filter: string): RealTimeMatchEvent[] {
        if (filter === 'goals') {
            return source.filter((event) => event.type === 'goal' || event.type === 'penalty');
        }

        if (filter === 'shots') {
            return source.filter((event) => ['shot', 'save', 'miss', 'goal', 'blocked_shot'].includes(event.type));
        }

        if (filter === 'set_pieces') {
            return source.filter((event) => ['throw_in', 'corner', 'goal_kick', 'free_kick', 'penalty'].includes(event.type));
        }

        if (filter === 'discipline') {
            return source.filter((event) => ['foul', 'yellow_card', 'red_card'].includes(event.type));
        }

        if (filter === 'stoppages') {
            return source.filter((event) => ['injury', 'substitution', 'half_time', 'full_time'].includes(event.type));
        }

        return source;
    }

    function snapshotIndexAt(time: number): number {
        const foundIndex = snapshots.findIndex((candidate) => candidate.time >= time);

        return foundIndex >= 0 ? foundIndex : snapshots.length - 1;
    }

    function jumpToGoal(goalIndex: number): void {
        const goal = allGoals[goalIndex];

        if (!goal) {
            return;
        }

        selectedGoalIndex = goalIndex;
        index = snapshotIndexAt(goal.time);
        preciseIndex = index;
        playing = false;
        replayEndIndex = null;
    }

    function jumpToNextGoal(): void {
        if (!allGoals.length) {
            return;
        }

        const nextIndex = allGoals.findIndex((goal) => goal.time > snapshot.time + 0.01);

        jumpToGoal(nextIndex >= 0 ? nextIndex : 0);
    }

    function jumpToPreviousGoal(): void {
        if (!allGoals.length) {
            return;
        }

        const reversedIndex = allGoals
            .slice()
            .reverse()
            .findIndex((goal) => goal.time < snapshot.time - 0.01);
        const previousIndex = reversedIndex >= 0 ? allGoals.length - 1 - reversedIndex : allGoals.length - 1;

        jumpToGoal(previousIndex);
    }

    function replayGoal(goal: RealTimeMatchEvent | undefined = allGoals[selectedGoalIndex] || allGoals[allGoals.length - 1]): void {
        if (!goal) {
            return;
        }

        const replayWindow = goal.replayWindow || {
            startTime: Math.max(0, goal.time - 12),
            endTime: Math.min(simulation.engine.matchLengthSeconds, goal.time + 4),
        };

        index = snapshotIndexAt(replayWindow.startTime);
        preciseIndex = index;
        replayEndIndex = snapshotIndexAt(replayWindow.endTime);
        selectedGoalIndex = allGoals.indexOf(goal);
        playing = true;
        lastFrameTime = 0;
    }

    function selectPlayer(event: CustomEvent<{ id: string }>): void {
        selectedPlayerId = event.detail.id;
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
        <button type="button" on:click={jumpToPreviousGoal} disabled={!allGoals.length}>Previous goal</button>
        <button type="button" on:click={jumpToNextGoal} disabled={!allGoals.length}>Next goal</button>
        {#if snapshot.period === 'ended' && allGoals.length}
            <button type="button" on:click={() => replayGoal()}>Replay goal</button>
        {/if}
        <label>
            Speed
            <select bind:value={speed}>
                <option value={1}>1x</option>
                <option value={5}>5x</option>
                <option value={15}>15x</option>
                <option value={45}>45x</option>
                <option value={90}>90x</option>
                <option value={180}>180x</option>
            </select>
        </label>
        <label>
            Events
            <select bind:value={eventFilter}>
                <option value="all">All</option>
                <option value="goals">Goals</option>
                <option value="shots">Shots</option>
                <option value="set_pieces">Set pieces</option>
                <option value="discipline">Discipline</option>
                <option value="stoppages">Stoppages</option>
            </select>
        </label>
        <div class="timeline">
            <input
                type="range"
                min="0"
                max={snapshots.length - 1}
                bind:value={index}
                on:input={scrub}
                aria-label="Timeline"
            >
            <div class="goal-markers">
                {#each allGoals as goal, goalIndex}
                    <button
                        type="button"
                        class:active={goalIndex === selectedGoalIndex}
                        style:left={`${goal.time / simulation.engine.matchLengthSeconds * 100}%`}
                        on:click={() => jumpToGoal(goalIndex)}
                        aria-label={`Goal ${goalIndex + 1} at ${formatTime(goal.time)}`}
                    ></button>
                {/each}
            </div>
        </div>
    </section>

    <Pitch {snapshot} {selectedPlayerId} on:selectPlayer={selectPlayer} />

    <section class="match-report" aria-label="Match report">
        <dl>
            <div>
                <dt>Avg possession</dt>
                <dd>{formatDecimal(report.match.averagePossessionPasses)}</dd>
            </div>
            <div>
                <dt>Longest</dt>
                <dd>{report.match.longestPossession}</dd>
            </div>
            <div>
                <dt>Owned</dt>
                <dd>{formatPercent(report.match.ballOwnedShare)}</dd>
            </div>
            <div>
                <dt>Loose</dt>
                <dd>{formatPercent(report.match.looseBallShare)}</dd>
            </div>
        </dl>
        <table>
            <thead>
                <tr>
                    <th>Restart</th>
                    <th>Awards</th>
                    <th>Exec</th>
                </tr>
            </thead>
            <tbody>
                {#each Object.entries(report.match.restarts) as [type, restarts]}
                    <tr>
                        <th>{restartLabel(type)}</th>
                        <td>{restarts.awards}</td>
                        <td>{restarts.executions}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </section>

    {#if selectedPlayer}
        <section class="inspector" aria-label="Selected player">
            <div>
                <strong>{selectedPlayer.playerName}</strong>
                <span>{selectedPlayer.teamSide.toUpperCase()} #{selectedPlayer.playerNumber} {selectedPlayer.roleName}</span>
            </div>
            <dl>
                <div>
                    <dt>Intent</dt>
                    <dd>{selectedPlayer.currentIntent.type.replace(/_/g, ' ')}</dd>
                </div>
                <div>
                    <dt>Target</dt>
                    <dd>{Math.round(selectedPlayer.target.x)}, {Math.round(selectedPlayer.target.y)}</dd>
                </div>
                <div>
                    <dt>Intent target</dt>
                    <dd>{Math.round(selectedPlayer.currentIntent.target.x)}, {Math.round(selectedPlayer.currentIntent.target.y)}</dd>
                </div>
                <div>
                    <dt>Stamina</dt>
                    <dd>{Math.round(selectedPlayer.stamina)}%</dd>
                </div>
                <div>
                    <dt>Cards</dt>
                    <dd>{selectedPlayer.yellowCards}{selectedPlayer.redCard ? 'R' : ''}</dd>
                </div>
                <div>
                    <dt>Fouls</dt>
                    <dd>{selectedPlayer.foulsCommitted}/{selectedPlayer.foulsSuffered}</dd>
                </div>
                <div>
                    <dt>Injury</dt>
                    <dd>{selectedPlayer.injurySeverity}</dd>
                </div>
            </dl>
        </section>
    {/if}

    <section class="events" aria-label="Recent events">
        <h2>Recent events</h2>
        <ol>
            {#each filteredEvents.slice(-8).reverse() as event}
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
