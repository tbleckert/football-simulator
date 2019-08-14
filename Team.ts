import Player, {PlayerRating} from './Player';
import {defencePositions, midfieldPositions, Position} from './Position';
import {FieldAreas} from "./Field";
import {GameInfo} from "./GameInfo";
import {Action} from "./Action";

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

    goalkeeperRating(): number {
        const goalkeepers = this.getGoalkeepers();

        if (!goalkeepers.length) {
            return 0;
        }

        return goalkeepers.map(player => player.ratingAverage()).reduce((a, b) => a + b) / goalkeepers.length;
    }

    defenceRating(): number {
        const players = this.getFieldPlayers();

        return players.map(player => {
            const rating = player.rating();

            return (
                (rating as PlayerRating).defending
                + (rating as PlayerRating).physique
                + (rating as PlayerRating).pace
            ) / 3;
        }).reduce((a, b) => a + b) / players.length;
    }

    possessionRating(): number {
        const players = this.getFieldPlayers();

        return players.map(player => {
            const rating = player.rating();

            return (
                (rating as PlayerRating).dribbling
                + (rating as PlayerRating).passing
                + (rating as PlayerRating).physique
            ) / 3;
        }).reduce((a, b) => a + b) / players.length;
    }

    attackRating(): number {
        const players = this.getFieldPlayers();

        return players.map(player => player.attackRating()).reduce((a, b) => a + b) / players.length;
    }

    simulateMove(ballPosition: FieldAreas, gameInfo: GameInfo): Action {
        const random = Math.floor(Math.random() * (10 - 1 + 1) + 1);

        if (ballPosition === FieldAreas.Offense) {
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

    getProbablePlayer(fieldPosition: FieldAreas, weights: Weights, exclude: Player[] = []): Player {
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

    attacker(fieldPosition: FieldAreas, exclude: Player[] = []): Player {
        const weights: Weights = {
            [FieldAreas.Defence]: {
                defenders: 0.6,
                midfielders: 0.3,
                attackers: 0.1,
            },
            [FieldAreas.Midfield]: {
                defenders: 0.25,
                midfielders: 0.5,
                attackers: 0.25,
            },
            [FieldAreas.Offense]: {
                defenders: 0.1,
                midfielders: 0.3,
                attackers: 0.6,
            }
        };

        return this.getProbablePlayer(fieldPosition, weights, exclude);
    }

    defender(fieldPosition: FieldAreas, exclude: Player[] = []): Player {
        const weights = {
            [FieldAreas.Defence]: {
                defenders: 0.1,
                midfielders: 0.3,
                attackers: 0.6,
            },
            [FieldAreas.Midfield]: {
                defenders: 0.25,
                midfielders: 0.5,
                attackers: 0.25,
            },
            [FieldAreas.Offense]: {
                defenders: 0.6,
                midfielders: 0.3,
                attackers: 0.1,
            }
        };

        return this.getProbablePlayer(fieldPosition, weights, exclude);
    }
}
