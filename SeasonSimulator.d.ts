import type { Tactics } from './RealTimeEngine';
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
export default class SeasonSimulator {
    private teams;
    private options;
    constructor(teams: SeasonTeamInput[], options?: Partial<SeasonSimulatorOptions>);
    simulate(): SeasonReport;
    private fixtures;
    private teamFromInput;
    private emptyTable;
    private matchReport;
    private applyTableResult;
    private applyTeamResult;
    private collectPlayerStats;
    private collectStyleStats;
    private applyStyleStats;
    private sortedTable;
    private topPlayers;
    private finalizeStyleStats;
    private metrics;
    private ratio;
}
