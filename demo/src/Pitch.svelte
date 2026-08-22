<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { Position } from '$simulator/enums/Position.ts';
    import type { MatchSnapshot, TeamSide } from '$simulator/RealTimeEngine.ts';

    export let snapshot: MatchSnapshot;
    export let selectedPlayerId = '';

    const dispatch = createEventDispatcher<{ selectPlayer: { id: string } }>();
    const pitch = { length: 105, width: 68 };

    function x(value: number): number {
        return value / pitch.length * 100;
    }

    function y(value: number): number {
        return value / pitch.width * 100;
    }

    function isSetPiece(phase: string): boolean {
        return ['throw_in', 'corner', 'goal_kick', 'free_kick', 'penalty'].includes(phase);
    }

    function attackingDirection(side: TeamSide): number {
        const secondHalf = snapshot.period === 2;
        return side === 'home' === !secondHalf ? 1 : -1;
    }

    function offsideLine(side: TeamSide | null): number | null {
        if (!side || snapshot.phase !== 'open_play') {
            return null;
        }

        const direction = attackingDirection(side);
        const opponentPositions = snapshot.players
            .filter((player) => player.teamSide !== side)
            .map((player) => player.x)
            .sort((first, second) => direction > 0 ? second - first : first - second);
        const secondLastOpponent = opponentPositions[1];

        if (secondLastOpponent === undefined) {
            return null;
        }

        return direction > 0
            ? Math.max(snapshot.ball.x, secondLastOpponent)
            : Math.min(snapshot.ball.x, secondLastOpponent);
    }

    $: ballOwner = snapshot.players.find((player) => player.id === snapshot.ball.ownerId);
    $: selectedPlayer = snapshot.players.find((player) => player.id === selectedPlayerId) || ballOwner;
    $: attackingSide = ballOwner?.teamSide || snapshot.possession.teamSide;
    $: activeOffsideLine = offsideLine(attackingSide);
</script>

<div class="pitch">
    <div class="pitch-grain"></div>
    <div class="mark mark--outline"></div>
    <div class="mark mark--half"></div>
    <div class="mark mark--circle"></div>
    <div class="mark mark--home-box"></div>
    <div class="mark mark--away-box"></div>
    <div class="mark mark--home-six"></div>
    <div class="mark mark--away-six"></div>
    <div class="mark mark--home-spot"></div>
    <div class="mark mark--away-spot"></div>

    {#if activeOffsideLine !== null}
        <div class="offside-line" style:left={`${x(activeOffsideLine)}%`} aria-hidden="true"></div>
    {/if}

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

    {#if selectedPlayer}
        <svg class="intent-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs>
                <marker id="pitch-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
                    <path d="M0,0 L5,2.5 L0,5 Z"></path>
                </marker>
            </defs>
            <line
                x1={x(selectedPlayer.x)}
                y1={y(selectedPlayer.y)}
                x2={x(selectedPlayer.currentIntent.target.x)}
                y2={y(selectedPlayer.currentIntent.target.y)}
                marker-end="url(#pitch-arrow)"
            ></line>
        </svg>
    {/if}

    {#each snapshot.players as player}
        <span
            class:home={player.teamSide === 'home'}
            class:away={player.teamSide === 'away'}
            class="target"
            style:left={`${x(player.target.x)}%`}
            style:top={`${y(player.target.y)}%`}
        ></span>
    {/each}

    {#each snapshot.players as player}
        <button
            type="button"
            class:home={player.teamSide === 'home'}
            class:away={player.teamSide === 'away'}
            class:owner={player.id === snapshot.ball.ownerId}
            class:selected={player.id === selectedPlayer?.id}
            class="player"
            style:left={`${x(player.x)}%`}
            style:top={`${y(player.y)}%`}
            title={`${player.playerName} · ${Position[player.role]} · ${player.currentIntent.type.replace(/_/g, ' ')}`}
            aria-label={`Select ${player.playerName}, ${Position[player.role]}`}
            on:click={() => dispatch('selectPlayer', { id: player.id })}
        >
            <span>{player.playerNumber}</span>
        </button>
    {/each}

    <div
        class="ball"
        style:left={`${x(snapshot.ball.x)}%`}
        style:top={`${y(snapshot.ball.y)}%`}
        aria-hidden="true"
    ></div>
</div>
