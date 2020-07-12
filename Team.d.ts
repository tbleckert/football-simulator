import Player from './Player';
import { FieldArea } from "./enums/FieldArea";
import { GameInfo } from "./types/GameInfo";
import { Action } from "./enums/Action";
export interface TeamInterface {
    players: Player[];
}
export default class Team implements TeamInterface {
    players: Player[];
    home: boolean;
    name: string;
    constructor(home: boolean, name: string, players: Player[]);
    rating(): {
        goalkeeping: number;
        defense: number;
        attack: number;
    };
    getGoalkeepers(): Player[];
    getFieldPlayers(exclude?: Player[]): Player[];
    averageRating(map: (player: Player) => number, players?: Player[] | null): number;
    goalkeeperRating(): number;
    defenceRating(): number;
    possessionRating(): number;
    attackRating(): number;
    simulateMove(ballPosition: FieldArea, gameInfo: GameInfo): Action;
    getProbablePlayer(fieldPosition: FieldArea, attacker: boolean, exclude?: Player[]): Player;
    attacker(fieldPosition: FieldArea, exclude?: Player[]): Player;
    defender(fieldPosition: FieldArea, exclude?: Player[]): Player;
}
