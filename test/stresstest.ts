import Engine from '../Engine';
import { Position } from '../enums/Position';
import Team from '../Team';
import Player from '../Player';
import createPlayer from '../data/createPlayer';
import Reporter from "../Reporter";

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
const totalGames = 10;
const results = [];

console.log('Home', homeTeam.rating());
console.log('Away', awayTeam.rating());

for (let i = 0; i < totalGames; i += 1) {
    const engine = new Engine(homeTeam, awayTeam);

    engine.simulate();

    const report = new Reporter(engine.gameEvents);

    results.push(report.getReport());
}

const homeTeamWins = results.filter((report) => report.homeGoals > report.awayGoals).length;
const awayTeamWins = results.filter((report) => report.homeGoals < report.awayGoals).length;
const totalHomeGoals = results.map((report) => report.homeGoals).reduce((acc, current) => acc + current);
const totalAwayGoals = results.map((report) => report.awayGoals).reduce((acc, current) => acc + current);
const totalHomeShots = results.map((report) => report.homeShots).reduce((acc, current) => acc + current);
const totalAwayShots = results.map((report) => report.awayShots).reduce((acc, current) => acc + current);
const homeGoalScorers: {
    [name: string]: number,
} = {};

results.forEach((report) => {
    const scorers = report.scoreSheet.filter((item) => item.team === 'Home');

    scorers.forEach((item) => {
        if (!item.goalScorer) {
            return;
        }

        let [number, name] = item.goalScorer.split('. ');
        const player = homeTeam.players.filter((player) => player.info.number === parseInt(number, 10));

        if (player.length) {
            name = `${number}. ${name} (${Position[player[0].position]})`;
        }

        if (!(name in homeGoalScorers)) {
            homeGoalScorers[name] = 0;
        }

        homeGoalScorers[name] += 1;
    });
});

const awayGoalScorers: {
    [name: string]: number,
} = {};

results.forEach((report) => {
    const scorers = report.scoreSheet.filter((item) => item.team === 'Away');

    scorers.forEach((item) => {
        if (!item.goalScorer) {
            return;
        }

        let [number, name] = item.goalScorer.split('. ');
        const player = awayTeam.players.filter((player) => player.info.number === parseInt(number, 10));

        if (player.length) {
            name = `${number}. ${name} (${Position[player[0].position]})`;
        }

        if (!(name in awayGoalScorers)) {
            awayGoalScorers[name] = 0;
        }

        awayGoalScorers[name] += 1;
    });
});

console.log({
    homeTeamWins,
    totalHomeGoals,
    totalHomeShots,
    homeGoalScorers,
    awayTeamWins,
    totalAwayGoals,
    totalAwayShots,
    awayGoalScorers,
});
