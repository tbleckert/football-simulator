import { Event } from './Event';
import { GameInfo } from './GameInfo';
import Team from "./Team";
import { FieldAreas } from "./Field";
import Player from "./Player";

export interface GameEvent {
    event: Event;
    data: any;
    gameInfo: GameInfo;
    attackingTeam: Team;
    defendingTeam: Team;
    fieldPosition: FieldAreas;
    attackingPrimaryPlayer: Player | null;
    attackingSecondaryPlayer: Player | null;
    defendingPrimaryPlayer: Player | null;
    defendingSecondaryPlayer: Player | null;
    homeTeam: Team;
    awayTeam: Team;
}
