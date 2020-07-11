import { GameEvent } from './types/GameEvent';
export default class Reporter {
    gameEvents: GameEvent[];
    constructor(gameEvents: GameEvent[]);
    getReport(): {
        homeGoals: number;
        awayGoals: number;
        homePossession: number;
        awayPossession: number;
        homeShots: number;
        homeShotsOnGoal: number;
        awayShots: number;
        awayShotsOnGoal: number;
        scoreSheet: {
            matchMinute: number;
            goalScorer: string | null;
            assist: string | false;
            team: string;
        }[];
    };
}
