import { GameEvent } from './types/GameEvent';
export default class Reporter {
    gameEvents: GameEvent[];
    home: {
        goals: number;
        possession: number;
        shots: number;
        shotsOnGoal: number;
    };
    away: {
        goals: number;
        possession: number;
        shots: number;
        shotsOnGoal: number;
    };
    constructor(gameEvents: GameEvent[]);
    getReport(): {
        home: {
            goals: number;
            possession: number;
            shots: number;
            shotsOnGoal: number;
        };
        away: {
            goals: number;
            possession: number;
            shots: number;
            shotsOnGoal: number;
        };
        scoreSheet: {
            matchMinute: number;
            goalScorer: string | null;
            assist: string | false;
            team: string;
        }[];
    };
}
