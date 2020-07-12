import Player, { PlayerRating } from './Player';
import { defencePositions, midfieldPositions, Position } from './enums/Position';
import { FieldArea } from "./enums/FieldArea";
import { GameInfo } from "./types/GameInfo";
import { Action } from "./enums/Action";

export interface TeamInterface {
    players: Player[];
}

interface Weights {
    [x: number]: {
        defenders: number;
        midfielders: number;
        attackers: number;
    }
}

function createWeights(attacker = false): Weights {
    return {
        [FieldArea.Defence]: {
            defenders: (attacker) ? 0.6 : 0.1,
            midfielders: 0.3,
            attackers: (attacker) ? 0.1 : 0.6,
        },
        [FieldArea.Midfield]: {
            defenders: 0.25,
            midfielders: 0.5,
            attackers: 0.25,
        },
        [FieldArea.Offense]: {
            defenders: (attacker) ? 0.1 : 0.6,
            midfielders: 0.3,
            attackers: (attacker) ? 0.6 : 0.1,
        }
    };
}

export default class Team implements TeamInterface {
    players: Player[];
    home: boolean;
    name: string;

    constructor(home: boolean, name: string, players: Player[]) {
        this.home = home;
        this.name = name;
        this.players = players;
    }

    rating() {
        return {
            goalkeeping: this.goalkeeperRating(),
            defense: this.defenceRating(),
            attack: this.attackRating(),
        };
    }

    getGoalkeepers(): Player[] {
        return this.players.filter(player => player.position === Position.GK);
    }

    getFieldPlayers(exclude: Player[] = []): Player[] {
        return this.players.filter(player => player.position !== Position.GK).filter(player => !exclude.length ||exclude.indexOf(player) < 0);
    }

    averageRating(map: (player: Player) => number, players: Player[]|null = null): number {
        const playersList = players || this.getFieldPlayers();
        return playersList.map(map).reduce((a, b) => a + b) / playersList.length;
    }

    goalkeeperRating(): number {
        return this.averageRating(player => player.defenceRating(), this.getGoalkeepers());
    }

    defenceRating(): number {
        return this.averageRating(player => player.defenceRating());
    }

    possessionRating(): number {
        return this.averageRating(player => player.possessionRating());
    }

    attackRating(): number {
        return this.averageRating(player => player.attackRating());
    }

    simulateMove(ballPosition: FieldArea, gameInfo: GameInfo): Action {
        const random = Math.floor(Math.random() * 11);

        if (ballPosition === FieldArea.Offense) {
            if (random > 5) {
                return Action.GoalAttempt;
            }

            if (random > 3) {
                return Action.Stay;
            }

            return Action.Retreat;
        }

        if (random > 6) {
            return Action.Advance;
        }

        if (random > 3) {
            return Action.Stay;
        }

        return Action.Retreat;
    }

    getProbablePlayer(fieldPosition: FieldArea, attacker: boolean, exclude: Player[] = []): Player {
        const weights = createWeights(attacker);
        const players: { weight: number, player: Player }[] = [];

        this.getFieldPlayers(exclude).forEach(player => {
            if (defencePositions.indexOf(player.position) > -1) {
                players.push({ player, weight: weights[fieldPosition].defenders });
            } else if (midfieldPositions.indexOf(player.position) > -1) {
                players.push({ player, weight: weights[fieldPosition].midfielders });
            } else {
                players.push({ player, weight: weights[fieldPosition].attackers });
            }
        });

        const random = Math.min(Math.random(), 0.6);
        const foundPlayers = players.filter(player => player.weight >= random).map(obj => obj.player);

        return foundPlayers[Math.floor(Math.random() * foundPlayers.length)];
    }

    attacker(fieldPosition: FieldArea, exclude: Player[] = []): Player {
        return this.getProbablePlayer(fieldPosition, true, exclude);
    }

    defender(fieldPosition: FieldArea, exclude: Player[] = []): Player {
        return this.getProbablePlayer(fieldPosition, false, exclude);
    }
}
