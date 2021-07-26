import type Player from './Player';
import {
    attackPositions,
    centerPositions,
    defencePositions,
    leftPositions,
    midfieldPositions,
    Position, rightPositions
} from './enums/Position';
import {FieldArea} from "./enums/FieldArea";
import type {GameInfo} from "./types/GameInfo";
import {Action} from "./enums/Action";
import getRandomElement from "./lib/getRandomElement";
import type Field from "./Field";

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
        defenders: 6,
        midfielders: 3,
        attackers: 1,
    },
    2: {
        defenders: 5,
        midfielders: 3,
        attackers: 2,
    },
    3: {
        defenders: 2,
        midfielders: 5,
        attackers: 3,
    },
    4: {
        defenders: 2,
        midfielders: 4,
        attackers: 4,
    },
    5: {
        defenders: 1,
        midfielders: 3,
        attackers: 6,
    },
};

const colWeights: Weights = {
    1: {
        left: 6,
        center: 3,
        right: 1,
    },
    2: {
        left: 2,
        center: 6,
        right: 2,
    },
    3: {
        left: 1,
        center: 3,
        right: 6,
    },
};

const rowPositions: { [key: string]: Position[] } = {
    defenders: defencePositions,
    midfielders: midfieldPositions,
    attackers: attackPositions,
};

const colPositions: { [key: string]: Position[] } = {
    left: leftPositions,
    center: centerPositions,
    right: rightPositions,
};

export default class Team implements TeamInterface {
    players: Player[];
    home: boolean;
    name: string;
    field: Field|null = null;

    constructor(home: boolean, name: string, players: Player[]) {
        this.home = home;
        this.name = name;
        this.players = players;
    }

    setField(field: Field) {
        this.field = field;
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
        if (!this.field) {
            throw new Error('Field is not set');
        }

        const [col, row] = this.field.fieldAreaToNumber(fieldPosition);
        const rowWeight = rowWeights[row];
        const colWeight = colWeights[col];
        const rowOptions: [string, number][] = Object.entries(rowWeight);
        const colOptions: [string, number][] = Object.entries(colWeight);
        const rowPosition = getRandomElement(rowOptions);
        const colPosition = getRandomElement(colOptions);
        const playerRowPositions = rowPositions[rowPosition];
        const playerColPositions = colPositions[colPosition];
        const matchedPositions = playerRowPositions.filter((pos) => playerColPositions.includes(pos));
        let foundPlayers = this.getFieldPlayers(exclude).filter((player) => {
            return matchedPositions.includes(player.position);
        });

        if (!foundPlayers.length) {
            foundPlayers = this.getFieldPlayers(exclude).filter((player) => {
                return playerRowPositions.includes(player.position);
            });
        }

        return foundPlayers[Math.floor(Math.random() * foundPlayers.length)];
    }

    attacker(fieldPosition: FieldArea, exclude: Player[] = []): Player {
        return this.getProbablePlayer(fieldPosition, true, exclude);
    }

    defender(fieldPosition: FieldArea, exclude: Player[] = []): Player {
        return this.getProbablePlayer(fieldPosition, false, exclude);
    }
}
