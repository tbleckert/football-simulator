import RealTimeEngine from './RealTimeEngine';
import type {
    MatchSnapshot,
    RealTimeMatchEvent,
    TeamSide,
} from './RealTimeEngine';

export interface RealTimeReportTeam {
    name: string;
    style: string;
    goals: number;
    shots: number;
    passCompletion: number;
    finalThirdRecoveries: number;
    averageStamina: number;
}

export interface RealTimeReportSection {
    title: string;
    text: string;
    teamSide?: TeamSide;
    time?: number;
}

export interface RealTimeReport {
    headline: string;
    summary: string;
    teams: {
        home: RealTimeReportTeam;
        away: RealTimeReportTeam;
    };
    sections: RealTimeReportSection[];
    turningPoints: RealTimeReportSection[];
}

interface TeamReportInputs {
    side: TeamSide;
    name: string;
    style: string;
    goals: number;
}

export default class RealTimeReporter {
    private engine: RealTimeEngine;

    constructor(engine: RealTimeEngine) {
        this.engine = engine;
    }

    getReport(): RealTimeReport {
        const finalSnapshot = this.finalSnapshot();
        const homeTeam = this.teamReport({
            side: 'home',
            name: this.engine.homeTeam.name,
            style: this.engine.state.tactics.home.style,
            goals: finalSnapshot.score.home,
        });
        const awayTeam = this.teamReport({
            side: 'away',
            name: this.engine.awayTeam.name,
            style: this.engine.state.tactics.away.style,
            goals: finalSnapshot.score.away,
        });
        const sections = [
            this.tacticalPatternSection(homeTeam, awayTeam),
            this.chanceCreationSection(),
            this.pressingSection(homeTeam, awayTeam),
            this.playerImpactSection(),
            this.managerImpactSection(),
        ];
        const turningPoints = this.turningPoints();

        return {
            headline: `${homeTeam.name} ${homeTeam.goals}-${awayTeam.goals} ${awayTeam.name}`,
            summary: this.summary(homeTeam, awayTeam, sections),
            teams: {
                home: homeTeam,
                away: awayTeam,
            },
            sections,
            turningPoints,
        };
    }

    private teamReport(input: TeamReportInputs): RealTimeReportTeam {
        const passes = this.eventsFor(input.side, 'pass').length;
        const completions = this.eventsFor(input.side, 'receive').length;
        const players = this.finalSnapshot().players.filter((player) => player.teamSide === input.side);

        return {
            name: input.name,
            style: input.style,
            goals: input.goals,
            shots: this.eventsFor(input.side, 'shot').length,
            passCompletion: passes ? completions / passes : 0,
            finalThirdRecoveries: this.finalThirdRecoveries(input.side),
            averageStamina: this.average(players.map((player) => player.stamina)),
        };
    }

    private tacticalPatternSection(home: RealTimeReportTeam, away: RealTimeReportTeam): RealTimeReportSection {
        const topPattern = this.topEntry(this.countBy(
            this.engine.events.filter((event) => event.activeAttackPattern && event.activeAttackPattern !== 'none'),
            (event) => event.activeAttackPattern,
        ));
        const team = home.finalThirdRecoveries >= away.finalThirdRecoveries ? home : away;

        if (!topPattern) {
            return {
                title: 'Tactical pattern',
                text: `${home.name} used ${this.label(home.style)} against ${away.name}'s ${this.label(away.style)}, but neither side established a dominant pattern.`,
            };
        }

        return {
            title: 'Tactical pattern',
            teamSide: team === home ? 'home' : 'away',
            text: `${home.name} used ${this.label(home.style)} against ${away.name}'s ${this.label(away.style)}. The match most often settled into ${this.label(topPattern.key)} sequences, with ${team.name} creating more high recoveries.`,
        };
    }

    private chanceCreationSection(): RealTimeReportSection {
        const shots = this.engine.events.filter((event) => event.type === 'shot');
        const topRoute = this.topEntry(this.countBy(shots, (event) => event.outcome || 'open_play'));
        const averageChance = this.average(shots
            .map((event) => event.chanceQuality || 0)
            .filter((quality) => quality > 0));

        if (!topRoute) {
            return {
                title: 'Chance creation',
                text: 'Neither side created a clear shot pattern.',
            };
        }

        return {
            title: 'Chance creation',
            text: `${this.label(topRoute.key)} was the main shot route (${topRoute.value} shots), with average chance quality ${averageChance.toFixed(2)}.`,
        };
    }

    private pressingSection(home: RealTimeReportTeam, away: RealTimeReportTeam): RealTimeReportSection {
        const strongerPress = home.finalThirdRecoveries >= away.finalThirdRecoveries ? home : away;
        const weakerPress = strongerPress === home ? away : home;
        const side = strongerPress === home ? 'home' : 'away';
        const staminaGap = weakerPress.averageStamina - strongerPress.averageStamina;
        const fatigueText = staminaGap > 4
            ? `, but their average stamina finished ${staminaGap.toFixed(1)} points lower`
            : '';

        return {
            title: 'Pressing',
            teamSide: side,
            text: `${strongerPress.name} made ${strongerPress.finalThirdRecoveries} final-third recoveries versus ${weakerPress.finalThirdRecoveries}${fatigueText}.`,
        };
    }

    private playerImpactSection(): RealTimeReportSection {
        const topShooter = this.topPlayer('shot');
        const topPasser = this.topPlayer('pass');
        const topDefender = this.topPlayer('tackle', 'interception');
        const parts = [
            topShooter ? `${topShooter.name} led the shot volume (${topShooter.count})` : '',
            topPasser ? `${topPasser.name} drove circulation (${topPasser.count} passes)` : '',
            topDefender ? `${topDefender.name} led defensive actions (${topDefender.count})` : '',
        ].filter(Boolean);

        return {
            title: 'Player impact',
            teamSide: topShooter?.side,
            text: parts.length ? `${parts.join('; ')}.` : 'No single player dominated the event profile.',
        };
    }

    private managerImpactSection(): RealTimeReportSection {
        const substitutions = this.engine.events.filter((event) => event.type === 'substitution');
        const tacticalChanges = this.engine.events.filter((event) => event.type === 'tactical_change');
        const roleChanges = this.engine.events.filter((event) => event.type === 'role_change');
        const redCards = this.engine.events.filter((event) => event.type === 'red_card');
        const injuries = this.engine.events.filter((event) => event.type === 'injury');

        if (!substitutions.length && !tacticalChanges.length && !roleChanges.length && !redCards.length && !injuries.length) {
            return {
                title: 'Manager impact',
                text: 'The match stayed mostly in the starting tactical plans, with no substitution, injury, or red-card reshaping.',
            };
        }

        const notes = [
            tacticalChanges.length ? `${tacticalChanges.length} tactical change${tacticalChanges.length === 1 ? '' : 's'}` : '',
            roleChanges.length ? `${roleChanges.length} role change${roleChanges.length === 1 ? '' : 's'}` : '',
            substitutions.length ? `${substitutions.length} substitution${substitutions.length === 1 ? '' : 's'}` : '',
            injuries.length ? `${injuries.length} injury event${injuries.length === 1 ? '' : 's'}` : '',
            redCards.length ? `${redCards.length} red card${redCards.length === 1 ? '' : 's'}` : '',
        ].filter(Boolean);

        return {
            title: 'Manager impact',
            text: `${notes.join(', ')} changed the personnel and match rhythm after the starting plans had taken shape.`,
        };
    }

    private turningPoints(): RealTimeReportSection[] {
        const events = this.engine.events.filter((event) => {
            return ['goal', 'penalty', 'red_card', 'substitution', 'tactical_change', 'role_change', 'injury'].includes(event.type);
        });

        return events.slice(0, 6).map((event) => ({
            title: this.label(event.type),
            text: this.turningPointText(event),
            teamSide: event.teamSide,
            time: event.time,
        }));
    }

    private turningPointText(event: RealTimeMatchEvent): string {
        const player = event.player?.info.name || event.teamSide || 'Match';
        const outcome = event.outcome ? ` from ${this.label(event.outcome.replace(/_goal$/, ''))}` : '';

        if (event.type === 'goal') {
            return `${player} scored${outcome} after possession #${event.possession.id}.`;
        }

        if (event.type === 'substitution') {
            return `${player} came on because of ${this.label(event.outcome || 'manager_choice')}.`;
        }

        if (event.type === 'tactical_change') {
            return `${event.teamSide || 'A team'} changed the tactical plan for ${this.label(event.outcome || 'manager_tactical_change')}.`;
        }

        if (event.type === 'role_change') {
            return `${player} changed role for ${this.label(event.outcome || 'manager_role_change')}.`;
        }

        if (event.type === 'penalty') {
            return `${player} was central to a penalty ${this.label(event.outcome || 'event')}.`;
        }

        return `${player} produced a ${this.label(event.type)} moment.`;
    }

    private summary(home: RealTimeReportTeam, away: RealTimeReportTeam, sections: RealTimeReportSection[]): string {
        const shotLeader = home.shots >= away.shots ? home : away;
        const passLeader = home.passCompletion >= away.passCompletion ? home : away;
        const leadSection = sections[0];

        return `${leadSection.text} ${shotLeader.name} led shots ${shotLeader.shots}-${shotLeader === home ? away.shots : home.shots}, while ${passLeader.name} had the cleaner passing rhythm.`;
    }

    private eventsFor(side: TeamSide, type: RealTimeMatchEvent['type']): RealTimeMatchEvent[] {
        return this.engine.events.filter((event) => event.teamSide === side && event.type === type);
    }

    private finalThirdRecoveries(side: TeamSide): number {
        return this.engine.events.filter((event) => {
            return event.teamSide === side
                && ['interception', 'tackle', 'recovery'].includes(event.type)
                && event.fieldZones.includes('final_third');
        }).length;
    }

    private topPlayer(...types: RealTimeMatchEvent['type'][]): { name: string, count: number, side: TeamSide } | null {
        const counts = new Map<string, { name: string, count: number, side: TeamSide }>();

        this.engine.events
            .filter((event) => event.teamSide && event.player && types.includes(event.type))
            .forEach((event) => {
                const key = `${event.teamSide}:${event.playerId}`;
                const current = counts.get(key) || {
                    name: event.player?.info.name || 'Unknown',
                    count: 0,
                    side: event.teamSide as TeamSide,
                };

                current.count += 1;
                counts.set(key, current);
            });

        return [...counts.values()].sort((a, b) => b.count - a.count)[0] || null;
    }

    private countBy(events: RealTimeMatchEvent[], keyForEvent: (event: RealTimeMatchEvent) => string): Record<string, number> {
        return events.reduce<Record<string, number>>((counts, event) => {
            const key = keyForEvent(event);

            counts[key] = (counts[key] || 0) + 1;

            return counts;
        }, {});
    }

    private topEntry(counts: Record<string, number>): { key: string, value: number } | null {
        const entry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

        return entry ? { key: entry[0], value: entry[1] } : null;
    }

    private finalSnapshot(): MatchSnapshot {
        return this.engine.snapshots[this.engine.snapshots.length - 1] || this.engine.start();
    }

    private average(values: number[]): number {
        if (!values.length) {
            return 0;
        }

        return values.reduce((total, value) => total + value, 0) / values.length;
    }

    private label(value: string): string {
        return value.replace(/_/g, ' ');
    }
}
