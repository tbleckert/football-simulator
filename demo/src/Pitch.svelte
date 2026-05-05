<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { Position } from '$simulator/enums/Position';
    import type { MatchSnapshot } from '$simulator/RealTimeEngine';

    export let snapshot: MatchSnapshot;
    export let selectedPlayerId = '';

    const dispatch = createEventDispatcher<{ selectPlayer: { id: string } }>();

    const pitch = {
        length: 105,
        width: 68,
    };

    function x(value: number): number {
        return value / pitch.length * 100;
    }

    function y(value: number): number {
        return value / pitch.width * 100;
    }

    function shortRole(roleName: string): string {
        return roleName.replace(/[A-Z]?([A-Z])[^A-Z]*/g, '$1').slice(0, 3);
    }

    function phaseLabel(phase: string): string {
        return phase.replace('_', ' ');
    }

    function isSetPiece(phase: string): boolean {
        return ['throw_in', 'corner', 'goal_kick', 'free_kick', 'penalty'].includes(phase);
    }

    $: ballOwner = snapshot.players.find((player) => player.id === snapshot.ball.ownerId);
</script>

<div class="pitch-shell">
    <div class="pitch-meta">
        <span>{snapshot.period === 'ended' ? 'Full time' : `Period ${snapshot.period}`}</span>
        <span>{phaseLabel(snapshot.phase)}</span>
        <span>
            {#if ballOwner}
                {ballOwner.teamSide.toUpperCase()} {ballOwner.roleName}
            {:else}
                Loose ball
            {/if}
        </span>
    </div>
    <div class="pitch">
        <div class="mark mark--half"></div>
        <div class="mark mark--circle"></div>
        <div class="mark mark--home-box"></div>
        <div class="mark mark--away-box"></div>
        {#if isSetPiece(snapshot.phase)}
            <div
                class="restart-zone"
                style:left={`${x(snapshot.ball.x)}%`}
                style:top={`${y(snapshot.ball.y)}%`}
            ></div>
        {/if}
        {#if snapshot.activePassTarget}
            <div
                class="pass-target"
                style:left={`${x(snapshot.activePassTarget.x)}%`}
                style:top={`${y(snapshot.activePassTarget.y)}%`}
            ></div>
        {/if}
        {#if snapshot.secondBall}
            <div
                class="second-ball-marker"
                style:left={`${x(snapshot.secondBall.x)}%`}
                style:top={`${y(snapshot.secondBall.y)}%`}
            ></div>
        {/if}
        {#each snapshot.players as player}
            <div
                class:home={player.teamSide === 'home'}
                class:away={player.teamSide === 'away'}
                class="target"
                style:left={`${x(player.target.x)}%`}
                style:top={`${y(player.target.y)}%`}
            ></div>
        {/each}
        {#each snapshot.players as player}
            <button
                type="button"
                class:home={player.teamSide === 'home'}
                class:away={player.teamSide === 'away'}
                class:owner={player.id === snapshot.ball.ownerId}
                class:selected={player.id === selectedPlayerId}
                class="player"
                style:left={`${x(player.x)}%`}
                style:top={`${y(player.y)}%`}
                title={`${player.playerName} ${Position[player.role]} ${player.currentIntent.type}`}
                aria-label={`${player.playerName} ${Position[player.role]}`}
                on:click={() => dispatch('selectPlayer', { id: player.id })}
            >
                {shortRole(player.roleName)}
            </button>
        {/each}
        <div
            class="ball"
            style:left={`${x(snapshot.ball.x)}%`}
            style:top={`${y(snapshot.ball.y)}%`}
        ></div>
    </div>
</div>
