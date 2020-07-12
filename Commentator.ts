import { GameEvent } from './types/GameEvent';
import { Event } from './enums/Event';
import Team from "./Team";
import Player from "./Player";

export default class Commentator {
    static importantEvents = [
        Event.GameStart,
        Event.Kickoff,
        Event.HalfTime,
        Event.Advance,
        Event.Save,
        Event.Block,
        Event.Goal,
        Event.GameEnd,
        Event.Injury,
    ];

    name: string;

    constructor(name: string = 'Mr. Commentator') {
        this.name = name;
    }

    comment(event: GameEvent): string | null {
        const importantEvent = (this.constructor as typeof Commentator).importantEvents.indexOf(event.event) > -1;

        if (!importantEvent && Math.random() > 0.5) {
            return null;
        }

        switch (event.event) {
            case Event.GameStart:
                return this.gameStarted(event);
            case Event.Kickoff:
                return this.kickoff(event);
            case Event.HalfTime:
                return this.halfTime(event);
            case Event.Advance:
                return this.advance(event);
            case Event.Defence:
                return this.defence(event);
            case Event.Save:
                return this.save(event);
            case Event.Block:
                return this.block(event);
            case Event.Goal:
                return this.goal(event);
            case Event.GameEnd:
                return this.gameEnded(event);
            default:
                return null;
        }
    }

    gameStarted(event: GameEvent): string {
        return `The game between ${event.homeTeam.name} and ${event.awayTeam.name} has started.`;
    }

    kickoff(event: GameEvent): string {
        return `${(event.data as Team).name} with the kickoff.`;
    }

    halfTime(event: GameEvent): string {
        return `It's half time! The score is ${event.gameInfo.homeGoals} - ${event.gameInfo.awayGoals}`;
    }

    advance(event: GameEvent): string {
        return `${event.attackingTeam.name} advances with the ball.`;
    }

    defence(event: GameEvent): string {
        return `${event.defendingTeam.name} tries to advance but good defence by ${event.attackingTeam.name} that steals the ball.`;
    }

    rebound(comment: string, event: GameEvent): string {
        if (event.data === event.attackingTeam) {
            return `${event.attackingTeam.name} gets the ball back.`;
        }

        return [comment, `${event.attackingTeam.name} can take control over the ball.`].join(' ');
    }

    save(event: GameEvent): string {
        return this.rebound(`${(event.attackingPrimaryPlayer as Player).info.name} tries to score but the goalkeeper saves the ball.`, event);
    }

    block(event: GameEvent): string {
        return this.rebound(`${(event.attackingPrimaryPlayer as Player).info.name} tries to score but the ball was blocked by the defence.`, event);
    }

    goal(event: GameEvent): string {
        return `${(event.attackingPrimaryPlayer as Player).info.name} shoots and he scores! ${event.gameInfo.homeGoals}-${event.gameInfo.awayGoals}`;
    }

    gameEnded(event: GameEvent): string {
        if (event.gameInfo.homeGoals > event.gameInfo.awayGoals) {
            return `The game has ended! ${event.homeTeam.name} wins ${event.gameInfo.homeGoals}-${event.gameInfo.awayGoals}`;
        }

        if (event.gameInfo.homeGoals < event.gameInfo.awayGoals) {
            return `The game has ended! ${event.awayTeam.name} takes 3 points on the road! ${event.gameInfo.homeGoals}-${event.gameInfo.awayGoals}`;
        }

        return `The game ends with a draw! Final score ${event.gameInfo.homeGoals}-${event.gameInfo.awayGoals}`;
    }
}
