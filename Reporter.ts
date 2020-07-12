import {GameEvent} from './types/GameEvent';
import {Event} from './enums/Event';

export default class Reporter {
    gameEvents: GameEvent[];
    home = {
        goals: 0,
        possession: 0,
        shots: 0,
        shotsOnGoal: 0,
    };

    away = {
        goals: 0,
        possession: 0,
        shots: 0,
        shotsOnGoal: 0,
    };

    constructor(gameEvents: GameEvent[]) {
        this.gameEvents = gameEvents;
    }

    getReport() {
        const scoreSheet: { matchMinute: number, goalScorer: string | null, assist: string | false, team: string }[] = [];

        this.gameEvents.forEach(gameEvent => {
            const side = (gameEvent.attackingTeam && gameEvent.attackingTeam.home) ? 'home' : 'away';

            this[side].possession += 1;

            if ([Event.Save, Event.Block].includes(gameEvent.event)) {
                this[side].shots += 1;
            }

            if (gameEvent.event === Event.Block) {
                this[side].shotsOnGoal += 1;
            }

            if (gameEvent.event === Event.Goal) {
                this[side].goals += 1;
                this[side].shots += 1;
                this[side].shotsOnGoal += 1;

                scoreSheet.push({
                    matchMinute: gameEvent.gameInfo.matchMinute,
                    goalScorer: (gameEvent.attackingPrimaryPlayer) ? `${gameEvent.attackingPrimaryPlayer.info.number}. ${gameEvent.attackingPrimaryPlayer.info.name}` : null,
                    assist: (gameEvent.assistType && gameEvent.attackingSecondaryPlayer) ? gameEvent.attackingSecondaryPlayer.info.name : false,
                    team: gameEvent.attackingTeam.name,
                });
            }
        });

        const totalPossession = this.home.possession + this.away.possession;

        this.home.possession = this.home.possession / totalPossession;
        this.away.possession = this.away.possession / totalPossession;

        return {
            home: this.home,
            away: this.away,
            scoreSheet,
        };
    }
}
