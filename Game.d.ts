/// <reference types="node" />
import Team from './Team';
import { GameEvent } from './types/GameEvent';
import Commentator from './Commentator';
import { EventEmitter } from 'events';
import Engine from './Engine';
export default class Game extends EventEmitter {
    /**
     * Milliseconds between each simulation
     */
    gameSpeed: number;
    /**
     * Engine
     */
    engine: Engine;
    /**
     * The home team
     */
    homeTeam: Team;
    /**
     * The away team
     */
    awayTeam: Team;
    /**
     * The commentator
     */
    commentator: Commentator;
    /**
     * Events copy
     */
    events: GameEvent[];
    constructor(homeTeam: Team, awayTeam: Team, commentator: Commentator);
    start(): void;
    simulate(): void;
    loop: () => void;
    report(): void;
}
