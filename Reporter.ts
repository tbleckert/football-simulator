import {GameEvent} from './GameEvent';
import {Event} from "./Event";
import Player from "./Player";

export default class Reporter {
    gameEvents: GameEvent[];

    constructor(gameEvents: GameEvent[]) {
        this.gameEvents = gameEvents;
    }

    getReport() {
        let homePossession = 0;
        let awayPossession = 0;
        let homeShots = 0;
        let awayShots = 0;
        let homeShotsOnGoal = 0;
        let awayShotsOnGoal = 0;
        const scoreSheet: { matchMinute: number, goalScorer: string | null, team: string }[] = [];

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
                scoreSheet.push({
                    matchMinute: gameEvent.gameInfo.matchMinute,
                    goalScorer: (gameEvent.attackingPrimaryPlayer) ? gameEvent.attackingPrimaryPlayer.info.name : null,
                    team: gameEvent.attackingTeam.name,
                });
            }
        });

        const totalPossession = homePossession + awayPossession;

        return {
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
