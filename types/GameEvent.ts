import { Event } from '../enums/Event';
import { GameInfo } from './GameInfo';
import Team from "../Team";
import { FieldArea } from "../enums/FieldArea";
import Player from "../Player";
import { GoalType } from "../enums/GoalType";
import { AssistType } from "../enums/AssistType";

export interface GameEvent {
    event: Event;
    data: any;
    gameInfo: GameInfo;
    attackingTeam: Team;
    defendingTeam: Team;
    fieldPosition: FieldArea;
    attackingPrimaryPlayer: Player | null;
    attackingSecondaryPlayer: Player | null;
    defendingPrimaryPlayer: Player | null;
    defendingSecondaryPlayer: Player | null;
    homeTeam: Team;
    awayTeam: Team;
    goalType: GoalType | null;
    assistType: AssistType | null;
}
