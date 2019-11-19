import { GameEvent } from './types/GameEvent';
import { Event } from './enums/Event';

export default class Reporter {
    gameEvents: GameEvent[];

    constructor(gameEvents: GameEvent[]) {
        this.gameEvents = gameEvents;
    }

    getReport() {
        let homeGoals = 0;
        let awayGoals = 0;
        let homePossession = 0;
        let awayPossession = 0;
        let homeShots = 0;
        let awayShots = 0;
        let homeShotsOnGoal = 0;
        let awayShotsOnGoal = 0;
        const scoreSheet: { matchMinute: number, goalScorer: string | null, assist: string | false, team: string }[] = [];

        this.gameEvents.forEach(gameEvent => {
            if (gameEvent.attackingTeam && gameEvent.attackingTeam.home) {
                homePossession += 1;
            } else {
                awayPossession += 1;
            }

            if (gameEvent.event === Event.Goal || gameEvent.event === Event.Save) {
                if (gameEvent.attackingTeam.home) {
                    homeShots += 1;
                    homeShotsOnGoal += 1;
                } else {
                    awayShots += 1;
                    awayShotsOnGoal += 1;
                }
            }

            if (gameEvent.event === Event.Block) {
                if (gameEvent.attackingTeam.home) {
                    homeShots += 1;
                } else {
                    awayShots += 1;
                }
            }

            if (gameEvent.event === Event.Goal) {
                if (gameEvent.attackingTeam.home) {
                    homeGoals += 1;
                } else {
                    awayGoals += 1;
                }

                scoreSheet.push({
                    matchMinute: gameEvent.gameInfo.matchMinute,
                    goalScorer: (gameEvent.attackingPrimaryPlayer) ? `${gameEvent.attackingPrimaryPlayer.info.number}. ${gameEvent.attackingPrimaryPlayer.info.name}` : null,
                    assist: (gameEvent.assistType && gameEvent.attackingSecondaryPlayer) ? gameEvent.attackingSecondaryPlayer.info.name : false,
                    team: gameEvent.attackingTeam.name,
                });
            }
        });

        const totalPossession = homePossession + awayPossession;

        return {
            homeGoals,
            awayGoals,
            homePossession: homePossession / totalPossession,
            awayPossession: awayPossession / totalPossession,
            homeShots,
            homeShotsOnGoal,
            awayShots,
            awayShotsOnGoal,
            scoreSheet,
        };
    }
}
