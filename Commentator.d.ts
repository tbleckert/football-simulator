import { GameEvent } from './types/GameEvent';
import { Event } from './enums/Event';
export default class Commentator {
    static importantEvents: Event[];
    name: string;
    constructor(name?: string);
    comment(event: GameEvent): string | null;
    gameStarted(event: GameEvent): string;
    kickoff(event: GameEvent): string;
    halfTime(event: GameEvent): string;
    advance(event: GameEvent): string;
    defence(event: GameEvent): string;
    save(event: GameEvent): string;
    block(event: GameEvent): string;
    goal(event: GameEvent): string;
    gameEnded(event: GameEvent): string;
}
