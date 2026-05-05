import RealTimeEngine from './RealTimeEngine';
import type { TeamSide } from './RealTimeEngine';
export interface RealTimeReportTeam {
    name: string;
    style: string;
    goals: number;
    shots: number;
    passCompletion: number;
    finalThirdRecoveries: number;
    averageStamina: number;
}
export interface RealTimeReportSection {
    title: string;
    text: string;
    teamSide?: TeamSide;
    time?: number;
}
export interface RealTimeReport {
    headline: string;
    summary: string;
    teams: {
        home: RealTimeReportTeam;
        away: RealTimeReportTeam;
    };
    sections: RealTimeReportSection[];
    turningPoints: RealTimeReportSection[];
}
export default class RealTimeReporter {
    private engine;
    constructor(engine: RealTimeEngine);
    getReport(): RealTimeReport;
    private teamReport;
    private tacticalPatternSection;
    private chanceCreationSection;
    private pressingSection;
    private playerImpactSection;
    private managerImpactSection;
    private turningPoints;
    private turningPointText;
    private summary;
    private eventsFor;
    private finalThirdRecoveries;
    private topPlayer;
    private countBy;
    private topEntry;
    private finalSnapshot;
    private average;
    private label;
}
