import Engine from '../Engine';
import { Position } from '../enums/Position';
import Team from '../Team';
import Player from '../Player';
import createPlayer from '../data/createPlayer';

const homePlayers: Player[] = [
    createPlayer(Position.GK),
    createPlayer(Position.LB),
    createPlayer(Position.LCB),
    createPlayer(Position.RCB),
    createPlayer(Position.RB),
    createPlayer(Position.LM),
    createPlayer(Position.LCM),
    createPlayer(Position.RCM),
    createPlayer(Position.RM),
    createPlayer(Position.LF),
    createPlayer(Position.RF),
];

const awayPlayers: Player[] = [
    createPlayer(Position.GK),
    createPlayer(Position.LB),
    createPlayer(Position.LCB),
    createPlayer(Position.RCB),
    createPlayer(Position.RB),
    createPlayer(Position.LCM),
    createPlayer(Position.CM),
    createPlayer(Position.RCM),
    createPlayer(Position.LW),
    createPlayer(Position.CF),
    createPlayer(Position.RW),
];

const homeTeam = new Team(true, 'Home', homePlayers);
const awayTeam = new Team(false, 'Away', awayPlayers);
