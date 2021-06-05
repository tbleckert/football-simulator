import type { GameEvent } from './types/GameEvent';
import type Player from "./Player";
import type Team from "./Team";
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
    scoreSheet: {
        matchMinute: number;
        goalScorer: Player | null;
        assist: Player | false;
        team: Team;
    }[];
    constructor(gameEvents: GameEvent[]);
    registerEvent: (gameEvent: GameEvent) => void;
    getReport(): {
        home: {
            possession: number;
            goals: number;
            shots: number;
            shotsOnGoal: number;
        };
        away: {
            possession: number;
            goals: number;
            shots: number;
            shotsOnGoal: number;
        };
        scoreSheet: {
            matchMinute: number;
            goalScorer: Player | null;
            assist: false | Player;
            team: Team;
        }[];
    };
}
