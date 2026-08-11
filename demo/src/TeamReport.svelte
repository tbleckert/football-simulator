<script lang="ts">
    import { Position } from '$simulator/enums/Position.ts';
    import type Team from '$simulator/Team.ts';
    import type { TeamStats } from './simulation';

    export let team: Team;
    export let report: TeamStats;

    const shortNames: Record<string, string> = {
        goalkeeping: 'GK',
        defense: 'DEF',
        attack: 'ATT',
    };

    $: ratings = Object.entries(team.rating());
</script>

<section class="team">
    <h2>{team.name}</h2>
    <ul class="ratings" aria-label={`${team.name} ratings`}>
        {#each ratings as [key, value]}
            <li>
                <strong>{shortNames[key]}</strong>
                <span>{Math.round(value)}</span>
            </li>
        {/each}
    </ul>

    <table class="report">
        <tbody>
            <tr>
                <th>Possession</th>
                <td>{Math.round(report.possession * 100)}%</td>
            </tr>
            <tr>
                <th>Passes</th>
                <td>{report.passes}</td>
            </tr>
            <tr>
                <th>Pass completion</th>
                <td>{Math.round(report.passCompletion * 100)}%</td>
            </tr>
            <tr>
                <th>Shots</th>
                <td>{report.shots}</td>
            </tr>
            <tr>
                <th>Shots on goal</th>
                <td>{report.shotsOnGoal}</td>
            </tr>
            <tr>
                <th>Tackles</th>
                <td>{report.tackles}</td>
            </tr>
            <tr>
                <th>Fouls</th>
                <td>{report.fouls}</td>
            </tr>
            <tr>
                <th>Yellow cards</th>
                <td>{report.yellowCards}</td>
            </tr>
            <tr>
                <th>Red cards</th>
                <td>{report.redCards}</td>
            </tr>
        </tbody>
    </table>

    <table class="players">
        <thead>
            <tr>
                <th>#</th>
                <th>Name</th>
                <th>Position</th>
            </tr>
        </thead>
        <tbody>
            <tr class="players__group">
                <th colspan="3">Starting XI</th>
            </tr>
            {#each team.players.slice(0, 11) as player}
                <tr>
                    <td>{player.info.number}</td>
                    <td>{player.info.name}</td>
                    <td>{Position[player.position]}</td>
                </tr>
            {/each}
        </tbody>
        {#if team.players.length > 11}
            <tbody>
                <tr class="players__group">
                    <th colspan="3">Substitutes</th>
                </tr>
                {#each team.players.slice(11) as player}
                    <tr>
                        <td>{player.info.number}</td>
                        <td>{player.info.name}</td>
                        <td>{Position[player.position]}</td>
                    </tr>
                {/each}
            </tbody>
        {/if}
    </table>
</section>
