import type Player from "../Player";
import type Team from "../Team";
export interface TeamReport {
    goals: number;
    possession: number;
    shots: number;
    shotsOnGoal: number;
}
export interface ScoreItem {
    matchMinute: number;
    goalScorer: Player | null;
    assist: boolean | Player;
    team: Team;
}
export declare type ScoreSheet = ScoreItem[];
export interface Report {
    away: TeamReport;
    home: TeamReport;
    scoreSheet: ScoreSheet;
}
