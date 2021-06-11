import type Player from './Player';
import { FieldArea } from "./enums/FieldArea";
import type { GameInfo } from "./types/GameInfo";
import { Action } from "./enums/Action";
import type Engine from "./Engine";
export interface TeamInterface {
    players: Player[];
}
export default class Team implements TeamInterface {
    players: Player[];
    home: boolean;
    name: string;
    engine: Engine | null;
    constructor(home: boolean, name: string, players: Player[]);
    setEngine(engine: Engine): void;
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
