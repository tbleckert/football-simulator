import type { GameEvent } from './types/GameEvent';
import type { Report, ScoreSheet, TeamReport } from "./types/Report";
export default class Reporter {
    gameEvents: GameEvent[];
    home: TeamReport;
    away: TeamReport;
    scoreSheet: ScoreSheet;
    constructor(gameEvents: GameEvent[]);
    registerEvent: (gameEvent: GameEvent) => void;
    getReport(): Report;
}
