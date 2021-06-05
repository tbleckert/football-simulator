import type { Event } from '../enums/Event';
import type { GameInfo } from './GameInfo';
import type Team from '../Team';
import type { FieldArea } from '../enums/FieldArea';
import type Player from '../Player';
import type { GoalType } from '../enums/GoalType';
import type { AssistType } from '../enums/AssistType';
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
