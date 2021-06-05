import type Team from './Team';
import type { GameEvent } from './types/GameEvent';
import type Commentator from './Commentator';
import { EventEmitter } from 'events';
import Engine from './Engine';
import Reporter from './Reporter';

export default class Game extends EventEmitter {
    /**
     * Milliseconds between each simulation
     */
    gameSpeed = 500;

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
    events: GameEvent[] = [];

    constructor(homeTeam: Team, awayTeam: Team, commentator: Commentator) {
        super();

        this.homeTeam = homeTeam;
        this.awayTeam = awayTeam;
        this.commentator = commentator;
        this.engine = new Engine(this.homeTeam, this.awayTeam);
    }

    start() {
        this.engine.start();

        this.events = this.engine.gameEvents.slice();
        this.events.forEach(gameEvent => {
            this.emit('comment', {
                text: this.commentator.comment(gameEvent),
                gameInfo: this.engine.gameInfo,
            });
        });

        // Clear events so we only dispatch new ones
        this.events = [];

        this.simulate();
    }

    simulate() {
        this.engine.simulate();
        this.events = this.engine.gameEvents.slice();

        this.loop();
    }

    loop = () => {
        const event = this.events.shift();

        if (!event) {
            this.report();

            return;
        }

        this.emit('comment', {
            text: this.commentator.comment(event),
            gameInfo: event.gameInfo,
        });

        this.emit('event', event);

        setTimeout(this.loop, this.gameSpeed);
    };

    report() {
        const reporter = new Reporter(this.engine.gameEvents);

        this.emit('report', reporter.getReport());
    }
}
