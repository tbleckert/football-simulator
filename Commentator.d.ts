import type { GameEvent } from './types/GameEvent';
export default class Commentator {
    name: string;
    constructor(name?: string);
    routeComment(event: GameEvent): string | null;
    comment(event: GameEvent): string | null;
    gameStarted(event: GameEvent): string;
    kickoff(event: GameEvent): string;
    halfTime(event: GameEvent): string;
    advance(event: GameEvent): string;
    defence(event: GameEvent): string;
    rebound(comment: string, event: GameEvent): string;
    save(event: GameEvent): string;
    block(event: GameEvent): string;
    goal(event: GameEvent): string;
    gameEnded(event: GameEvent): string;
}
