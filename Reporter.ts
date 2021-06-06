import type { GameEvent } from './types/GameEvent';
import { Event } from './enums/Event';
import type {Report, ScoreSheet, TeamReport} from "./types/Report";

export default class Reporter {
    gameEvents: GameEvent[];
    home: TeamReport = {
        goals: 0,
        possession: 0,
        shots: 0,
        shotsOnGoal: 0,
    };

    away: TeamReport = {
        goals: 0,
        possession: 0,
        shots: 0,
        shotsOnGoal: 0,
    };

    scoreSheet: ScoreSheet = [];

    constructor(gameEvents: GameEvent[]) {
        this.gameEvents = gameEvents;
    }

    registerEvent = (gameEvent: GameEvent): void => {
        const side = (gameEvent.attackingTeam && gameEvent.attackingTeam.home) ? 'home' : 'away';

        this[side].possession += 1;

        if ([Event.Save, Event.Goal, Event.Block].includes(gameEvent.event)) {
            this[side].shots += 1;
        }

        if ([Event.Save, Event.Goal].includes(gameEvent.event)) {
            this[side].shotsOnGoal += 1;
        }

        if (gameEvent.event === Event.Goal) {
            this[side].goals += 1;

            this.scoreSheet.push({
                matchMinute: gameEvent.gameInfo.matchMinute,
                goalScorer: gameEvent.attackingPrimaryPlayer,
                assist: (gameEvent.assistType && gameEvent.attackingSecondaryPlayer) ? gameEvent.attackingSecondaryPlayer : false,
                team: gameEvent.attackingTeam,
            });
        }
    };

    getReport(): Report {
        this.gameEvents.forEach(this.registerEvent);

        const totalPossession = this.home.possession + this.away.possession;

        return {
            home: { ...this.home, possession: this.home.possession / totalPossession },
            away: { ...this.away, possession: this.away.possession / totalPossession },
            scoreSheet: this.scoreSheet,
        };
    }
}
