import http, {IncomingMessage, ServerResponse} from 'http';
import fs from 'fs';
import { WebSocketServer } from 'ws';
import {Position} from '../enums/Position';
import Team from '../Team';
import type Player from '../Player';
import createPlayer from '../data/createPlayer';
import Engine from "../Engine";

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

const homeTeam = new Team(true, 'Juventus', homePlayers);
const awayTeam = new Team(false, 'Milan', awayPlayers);

const requestHandler: http.RequestListener = (request: IncomingMessage, response: ServerResponse) => {
    if (request.url !== '/') {
        return;
    }

    const html = fs.readFileSync('./test/index.html');

    response.writeHead(200, {'Content-Type': 'text/html'});
    response.write(html);
    response.end();
};

const server = http.createServer(requestHandler);

server.listen(3005, () => {
    console.log('server is listening on port 3005');
});

const wss = new WebSocketServer({ port: 8080 });
const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
};

wss.on('connection', (ws) => {
    const engine = new Engine(homeTeam, awayTeam);

    engine.simulate();

    ws.send(JSON.stringify({
        event: 'events',
        data: {
            home: homeTeam,
            away: awayTeam,
            events: engine.gameEvents,
        },
    }));
});
