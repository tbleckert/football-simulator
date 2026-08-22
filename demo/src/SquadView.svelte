<script lang="ts">
    import type { SquadPlayerStats } from './simulation';

    export let players: SquadPlayerStats[];

    $: groups = [
        {
            title: 'On pitch',
            note: 'Live XI',
            players: players.filter((player) => player.onPitch),
        },
        {
            title: 'Off pitch',
            note: 'Bench & used',
            players: players.filter((player) => !player.onPitch),
        },
    ];

    function status(player: SquadPlayerStats): string {
        if (player.onPitch) {
            return 'Playing';
        }

        return player.appeared ? 'Off' : 'Bench';
    }
</script>

<div class="squad-board">
    {#each groups as group}
        <section class="squad-group" aria-labelledby={`squad-${group.title.replace(' ', '-').toLowerCase()}`}>
            <header>
                <div>
                    <h3 id={`squad-${group.title.replace(' ', '-').toLowerCase()}`}>{group.title}</h3>
                    <span>{group.note}</span>
                </div>
                <strong>{group.players.length}</strong>
            </header>

            <div class="squad-table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th scope="col">Player</th>
                            <th scope="col">Fit</th>
                            <th scope="col">Pass</th>
                            <th scope="col">Def</th>
                            <th scope="col">Sh</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each group.players as player}
                            <tr class:off-pitch={!player.onPitch}>
                                <th scope="row">
                                    <span class="squad-number">{player.number}</span>
                                    <span class="squad-identity">
                                        <strong>{player.name}</strong>
                                        <small>
                                            {player.position} · {status(player)}
                                            {#if player.yellowCards}<i class="card yellow" title={`${player.yellowCards} yellow card`}></i>{/if}
                                            {#if player.redCard}<i class="card red" title="Red card"></i>{/if}
                                            {#if player.injurySeverity !== 'none'}<b class="injury">{player.injurySeverity}</b>{/if}
                                        </small>
                                    </span>
                                </th>
                                <td class:low-fitness={player.stamina !== null && player.stamina < 60}>
                                    <span>{player.stamina ?? '—'}</span>
                                    {#if player.stamina !== null}
                                        <i class="fitness-bar"><span style:width={`${player.stamina}%`}></span></i>
                                    {/if}
                                </td>
                                <td title="Completed / attempted passes">{player.passesCompleted}/{player.passesAttempted}</td>
                                <td title="Tackles, interceptions, saves and blocks">{player.defensiveActions}</td>
                                <td title="Shots and goals">
                                    {player.shots}{#if player.goals}<sup>· {player.goals}G</sup>{/if}
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </section>
    {/each}
</div>
