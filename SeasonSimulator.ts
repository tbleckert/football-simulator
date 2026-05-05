import RealTimeEngine from './RealTimeEngine';
import type { RealTimeMatchEvent, Tactics } from './RealTimeEngine';
import Team from './Team';

export interface SeasonTeamInput {
    name: string;
    players: Team['players'];
    tactics?: Partial<Tactics>;
}

export interface SeasonSimulatorOptions {
    rounds: number;
    matchLengthSeconds: number;
    random: () => number;
}

export interface SeasonMatchReport {
    homeTeam: string;
    awayTeam: string;
    homeGoals: number;
    awayGoals: number;
    shots: number;
    fouls: number;
    yellowCards: number;
    redCards: number;
    injuries: number;
}

export interface SeasonStanding {
    teamName: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
}

export interface SeasonPlayerStats {
    playerName: string;
    teamName: string;
    goals: number;
    shots: number;
    passes: number;
    defensiveActions: number;
}

export interface SeasonStyleStats {
    style: string;
    matches: number;
    goalsFor: number;
    shotsFor: number;
    finalThirdRecoveries: number;
    averageGoalsFor: number;
    averageShotsFor: number;
    averageFinalThirdRecoveries: number;
}

export interface SeasonMetrics {
    goalsPerMatch: number;
    shotsPerMatch: number;
    yellowCardsPerMatch: number;
    redCardsPerMatch: number;
    injuriesPerMatch: number;
    homeWinShare: number;
}

export interface SeasonReport {
    matches: SeasonMatchReport[];
    table: SeasonStanding[];
    topScorers: SeasonPlayerStats[];
    topPassers: SeasonPlayerStats[];
    styleStats: SeasonStyleStats[];
    metrics: SeasonMetrics;
}

const defaultOptions: SeasonSimulatorOptions = {
    rounds: 2,
    matchLengthSeconds: 90 * 60,
    random: Math.random,
};

export default class SeasonSimulator {
    private teams: SeasonTeamInput[];
    private options: SeasonSimulatorOptions;

    constructor(teams: SeasonTeamInput[], options: Partial<SeasonSimulatorOptions> = {}) {
        this.teams = teams;
        this.options = {
            ...defaultOptions,
            ...options,
        };
    }

    simulate(): SeasonReport {
        const table = this.emptyTable();
        const playerStats = new Map<string, SeasonPlayerStats>();
        const styleStats = new Map<string, SeasonStyleStats>();
        const matches: SeasonMatchReport[] = [];

        this.fixtures().forEach(([homeInput, awayInput]) => {
            const homeTeam = this.teamFromInput(homeInput, true);
            const awayTeam = this.teamFromInput(awayInput, false);
            const engine = new RealTimeEngine(homeTeam, awayTeam, {
                matchLengthSeconds: this.options.matchLengthSeconds,
                random: this.options.random,
                homeTactics: homeInput.tactics,
                awayTactics: awayInput.tactics,
            });

            engine.simulate(this.options.matchLengthSeconds);

            const report = this.matchReport(engine);
            matches.push(report);
            this.applyTableResult(table, report);
            this.collectPlayerStats(playerStats, engine.events);
            this.collectStyleStats(styleStats, homeInput, awayInput, engine.events, report);
        });

        return {
            matches,
            table: this.sortedTable(table),
            topScorers: this.topPlayers(playerStats, 'goals'),
            topPassers: this.topPlayers(playerStats, 'passes'),
            styleStats: this.finalizeStyleStats(styleStats),
            metrics: this.metrics(matches),
        };
    }

    private fixtures(): [SeasonTeamInput, SeasonTeamInput][] {
        const fixtures: [SeasonTeamInput, SeasonTeamInput][] = [];

        for (let round = 0; round < this.options.rounds; round += 1) {
            for (let homeIndex = 0; homeIndex < this.teams.length; homeIndex += 1) {
                for (let awayIndex = homeIndex + 1; awayIndex < this.teams.length; awayIndex += 1) {
                    const homeTeam = round % 2 === 0 ? this.teams[homeIndex] : this.teams[awayIndex];
                    const awayTeam = round % 2 === 0 ? this.teams[awayIndex] : this.teams[homeIndex];

                    fixtures.push([homeTeam, awayTeam]);
                }
            }
        }

        return fixtures;
    }

    private teamFromInput(input: SeasonTeamInput, home: boolean): Team {
        return new Team(home, input.name, input.players);
    }

    private emptyTable(): Map<string, SeasonStanding> {
        return new Map(this.teams.map((team) => [
            team.name,
            {
                teamName: team.name,
                played: 0,
                won: 0,
                drawn: 0,
                lost: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                goalDifference: 0,
                points: 0,
            },
        ]));
    }

    private matchReport(engine: RealTimeEngine): SeasonMatchReport {
        const finalSnapshot = engine.snapshots[engine.snapshots.length - 1];

        return {
            homeTeam: engine.homeTeam.name,
            awayTeam: engine.awayTeam.name,
            homeGoals: finalSnapshot?.score.home || 0,
            awayGoals: finalSnapshot?.score.away || 0,
            shots: engine.events.filter((event) => event.type === 'shot').length,
            fouls: engine.events.filter((event) => event.type === 'foul').length,
            yellowCards: engine.events.filter((event) => event.type === 'yellow_card').length,
            redCards: engine.events.filter((event) => event.type === 'red_card').length,
            injuries: engine.events.filter((event) => event.type === 'injury').length,
        };
    }

    private applyTableResult(table: Map<string, SeasonStanding>, report: SeasonMatchReport): void {
        const home = table.get(report.homeTeam);
        const away = table.get(report.awayTeam);

        if (!home || !away) {
            return;
        }

        this.applyTeamResult(home, report.homeGoals, report.awayGoals);
        this.applyTeamResult(away, report.awayGoals, report.homeGoals);
    }

    private applyTeamResult(standing: SeasonStanding, goalsFor: number, goalsAgainst: number): void {
        standing.played += 1;
        standing.goalsFor += goalsFor;
        standing.goalsAgainst += goalsAgainst;
        standing.goalDifference = standing.goalsFor - standing.goalsAgainst;

        if (goalsFor > goalsAgainst) {
            standing.won += 1;
            standing.points += 3;

            return;
        }

        if (goalsFor === goalsAgainst) {
            standing.drawn += 1;
            standing.points += 1;

            return;
        }

        standing.lost += 1;
    }

    private collectPlayerStats(stats: Map<string, SeasonPlayerStats>, events: RealTimeMatchEvent[]): void {
        events.forEach((event) => {
            if (!event.player || !event.team) {
                return;
            }

            const key = `${event.team.name}:${event.player.info.number}:${event.player.info.name}`;
            const playerStats = stats.get(key) || {
                playerName: event.player.info.name,
                teamName: event.team.name,
                goals: 0,
                shots: 0,
                passes: 0,
                defensiveActions: 0,
            };

            if (event.type === 'goal') {
                playerStats.goals += 1;
            }

            if (event.type === 'shot') {
                playerStats.shots += 1;
            }

            if (event.type === 'pass') {
                playerStats.passes += 1;
            }

            if (['interception', 'tackle', 'blocked_shot'].includes(event.type)) {
                playerStats.defensiveActions += 1;
            }

            stats.set(key, playerStats);
        });
    }

    private collectStyleStats(
        stats: Map<string, SeasonStyleStats>,
        homeInput: SeasonTeamInput,
        awayInput: SeasonTeamInput,
        events: RealTimeMatchEvent[],
        report: SeasonMatchReport,
    ): void {
        this.applyStyleStats(stats, homeInput.tactics?.style || 'balanced', 'home', events, report.homeGoals);
        this.applyStyleStats(stats, awayInput.tactics?.style || 'balanced', 'away', events, report.awayGoals);
    }

    private applyStyleStats(
        stats: Map<string, SeasonStyleStats>,
        style: string,
        side: 'home' | 'away',
        events: RealTimeMatchEvent[],
        goalsFor: number,
    ): void {
        const current = stats.get(style) || {
            style,
            matches: 0,
            goalsFor: 0,
            shotsFor: 0,
            finalThirdRecoveries: 0,
            averageGoalsFor: 0,
            averageShotsFor: 0,
            averageFinalThirdRecoveries: 0,
        };

        current.matches += 1;
        current.goalsFor += goalsFor;
        current.shotsFor += events.filter((event) => event.teamSide === side && event.type === 'shot').length;
        current.finalThirdRecoveries += events.filter((event) => {
            return event.teamSide === side
                && ['interception', 'tackle', 'recovery'].includes(event.type)
                && event.fieldZones.includes('final_third');
        }).length;

        stats.set(style, current);
    }

    private sortedTable(table: Map<string, SeasonStanding>): SeasonStanding[] {
        return [...table.values()].sort((a, b) => {
            return b.points - a.points
                || b.goalDifference - a.goalDifference
                || b.goalsFor - a.goalsFor
                || a.teamName.localeCompare(b.teamName);
        });
    }

    private topPlayers(stats: Map<string, SeasonPlayerStats>, key: keyof Pick<SeasonPlayerStats, 'goals' | 'passes'>): SeasonPlayerStats[] {
        return [...stats.values()]
            .filter((playerStats) => playerStats[key] > 0)
            .sort((a, b) => b[key] - a[key])
            .slice(0, 10);
    }

    private finalizeStyleStats(stats: Map<string, SeasonStyleStats>): SeasonStyleStats[] {
        return [...stats.values()].map((style) => ({
            ...style,
            averageGoalsFor: this.ratio(style.goalsFor, style.matches),
            averageShotsFor: this.ratio(style.shotsFor, style.matches),
            averageFinalThirdRecoveries: this.ratio(style.finalThirdRecoveries, style.matches),
        }));
    }

    private metrics(matches: SeasonMatchReport[]): SeasonMetrics {
        return {
            goalsPerMatch: this.ratio(matches.reduce((total, match) => total + match.homeGoals + match.awayGoals, 0), matches.length),
            shotsPerMatch: this.ratio(matches.reduce((total, match) => total + match.shots, 0), matches.length),
            yellowCardsPerMatch: this.ratio(matches.reduce((total, match) => total + match.yellowCards, 0), matches.length),
            redCardsPerMatch: this.ratio(matches.reduce((total, match) => total + match.redCards, 0), matches.length),
            injuriesPerMatch: this.ratio(matches.reduce((total, match) => total + match.injuries, 0), matches.length),
            homeWinShare: this.ratio(matches.filter((match) => match.homeGoals > match.awayGoals).length, matches.length),
        };
    }

    private ratio(value: number, total: number): number {
        return total ? Math.round(value / total * 1000) / 1000 : 0;
    }
}
