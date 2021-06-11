import type Player from './Player';
import {defencePositions, midfieldPositions, Position} from './enums/Position';
import {FieldArea} from "./enums/FieldArea";
import type {GameInfo} from "./types/GameInfo";
import {Action} from "./enums/Action";
import getRandomElement from "./lib/getRandomElement";
import type Engine from "./Engine";

export interface TeamInterface {
    players: Player[];
}

interface Weights {
    [x: number]: {
        [x: string]: number
    };
}

const rowWeights: Weights = {
    1: {
        defenders: 0.6,
        midfielders: 0.3,
        attackers: 0.1,
    },
    2: {
        defenders: 0.5,
        midfielders: 0.3,
        attackers: 0.2,
    },
    3: {
        defenders: 0.2,
        midfielders: 0.5,
        attackers: 0.3,
    },
    4: {
        defenders: 0.2,
        midfielders: 0.4,
        attackers: 0.4,
    },
    5: {
        defenders: 0.1,
        midfielders: 0.3,
        attackers: 0.6,
    },
};

const colWeights: Weights = {
    1: {
        left: 0.6,
        center: 0.3,
        right: 0.1,
    },
    2: {
        left: 0.2,
        center: 0.6,
        right: 0.2,
    },
    3: {
        left: 0.1,
        center: 0.3,
        right: 0.6,
    },
};

export default class Team implements TeamInterface {
    players: Player[];
    home: boolean;
    name: string;
    engine: Engine|null = null;

    constructor(home: boolean, name: string, players: Player[]) {
        this.home = home;
        this.name = name;
        this.players = players;
    }

    setEngine(engine: Engine) {
        this.engine = engine;
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
        const playersList = (players) ? players : this.getFieldPlayers();
        return playersList.map(map).reduce((a, b) => a + b) / playersList.length;
    }

    goalkeeperRating(): number {
        return this.averageRating(player => player.ratingAverage(), this.getGoalkeepers());
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
        if ([FieldArea.AttackingLeft, FieldArea.AttackingCenter, FieldArea.AttackingRight].indexOf(ballPosition) >= 0) {
            const options = [[Action.GoalAttempt, 50], [Action.Stay, 35], [Action.Retreat, 15]];

            return getRandomElement(options);
        }

        const options = [[Action.Advance, 50], [Action.Stay, 35], [Action.Retreat, 15]];

        return getRandomElement(options);
    }

    getProbablePlayer(fieldPosition: FieldArea, attacker: boolean, exclude: Player[] = []): Player {
        if (!this.engine) {
            throw new Error('Engine is not set');
        }

        const [col, row] = this.engine.field.fieldAreaToNumber(fieldPosition);
        const rowWeight = rowWeights[row];
        const colWeight = colWeights[col];
        const rowOptions: number[][] = Object.entries(rowWeight);
        const colOptions: number[][] = Object.entries(colWeight);
        const rowPosition = getRandomElement(rowOptions);
        const colPosition = getRandomElement(colOptions);
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
