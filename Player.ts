import {Position} from './Position';

export interface PlayerInfo {
    name: string;
    number: number;
}

export interface PlayerBiometrics {
    height: number;
    weight: number;
}

export interface MentalAttributes {
    aggression: number;
    anticipation: number;
    bravery: number;
    composure: number;
    concentration: number;
    decisions: number;
    determination: number;
    flair: number;
    leadership: number;
    offTheBall: number;
    positioning: number;
    teamwork: number;
    vision: number;
    workRate: number;
}

export interface PhysicalAttributes {
    acceleration: number;
    agility: number;
    balance: number;
    jumpingReach: number;
    naturalFitness: number;
    pace: number;
    stamina: number;
    strength: number;
}

export interface TechnicalAttributes {
    corners: number;
    crossing: number;
    dribbling: number;
    finishing: number;
    firstTouch: number;
    freeKickTaking: number;
    heading: number;
    longShots: number;
    longThrows: number;
    marking: number;
    passing: number;
    penaltyTaking: number;
    tackling: number;
    technique: number;
}

export interface GoalkeeperAttributes {
    aerialReach: number;
    commandOfArea: number;
    communication: number;
    eccentricity: number;
    handling: number;
    oneOnOnes: number;
    reflexes: number;
    rushingOut: number;
    tendencyToPunch: number;
    throwing: number;
}

export interface PlayerAttributes extends MentalAttributes, PhysicalAttributes, TechnicalAttributes, GoalkeeperAttributes {

}

export interface PlayerInterface {
    info: PlayerInfo;
    biometrics: PlayerBiometrics;
    attributes: PlayerAttributes;
}

export interface PlayerRating {
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physique: number;
}

export interface GoalkeeperRating {
    diving: number;
    hands: number;
    kicking: number;
    reflexes: number;
    speed: number;
    positioning: number;
}

export default class Player implements PlayerInterface {
    info: PlayerInfo;
    biometrics: PlayerBiometrics;
    attributes: PlayerAttributes;
    position: Position;

    constructor(info: PlayerInfo, biometrics: PlayerBiometrics, attributes: PlayerAttributes, position: Position) {
        this.info = info;
        this.biometrics = biometrics;
        this.attributes = attributes;
        this.position = position;
    }

    ratingAverage() {
        const rating = this.rating();

        return Object.values(rating).reduce((a, b) => a + b) / Object.values(rating).length;
    }

    rating(): PlayerRating | GoalkeeperRating {
        if (this.position === Position.GK) {
            return {
                diving: this.attributesAverage(
                    this.attributes.agility,
                    this.attributes.balance,
                    this.attributes.naturalFitness,
                    this.attributes.strength,
                ),
                hands: this.attributesAverage(
                    this.attributes.agility,
                    this.attributes.balance,
                    this.attributes.naturalFitness,
                    this.attributes.handling,
                    this.attributes.aerialReach,
                ),
                kicking: this.attributesAverage(
                    this.attributes.agility,
                    this.attributes.balance,
                    this.attributes.naturalFitness,
                    this.attributes.strength,
                    this.attributes.longShots,
                ),
                reflexes: this.attributesAverage(
                    this.attributes.agility,
                    this.attributes.balance,
                    this.attributes.naturalFitness,
                    this.attributes.strength,
                    this.attributes.reflexes,
                ),
                speed: this.attributesAverage(
                    this.attributes.agility,
                    this.attributes.balance,
                    this.attributes.naturalFitness,
                    this.attributes.strength,
                    this.attributes.pace,
                    this.attributes.acceleration,
                ),
                positioning: this.attributesAverage(
                    this.attributes.anticipation,
                    this.attributes.positioning,
                    this.attributes.offTheBall,
                    this.attributes.vision,
                ),
            }
        }

        return {
            pace: this.attributesAverage(
                this.attributes.acceleration,
                this.attributes.agility,
                this.attributes.balance,
                this.attributes.naturalFitness,
                this.attributes.pace,
                this.attributes.strength,
            ),
            shooting: this.attributesAverage(
                this.attributes.agility,
                this.attributes.balance,
                this.attributes.naturalFitness,
                this.attributes.strength,
                this.attributes.finishing,
                this.attributes.longShots,
                this.attributes.technique,
                this.attributes.freeKickTaking,
                this.attributes.penaltyTaking,
                this.attributes.jumpingReach,
            ),
            passing: this.attributesAverage(
                this.attributes.agility,
                this.attributes.balance,
                this.attributes.naturalFitness,
                this.attributes.strength,
                this.attributes.passing,
                this.attributes.crossing,
                this.attributes.corners,
            ),
            dribbling: this.attributesAverage(
                this.attributes.agility,
                this.attributes.balance,
                this.attributes.naturalFitness,
                this.attributes.dribbling,
                this.attributes.firstTouch,
                this.attributes.technique,
            ),
            defending: this.attributesAverage(
                this.attributes.agility,
                this.attributes.balance,
                this.attributes.naturalFitness,
                this.attributes.strength,
                this.attributes.tackling,
                this.attributes.marking,
                this.attributes.aggression,
                this.attributes.teamwork,
                this.attributes.workRate,
                this.attributes.positioning,
                this.attributes.anticipation,
                this.attributes.jumpingReach,
            ),
            physique: this.attributesAverage(
                this.attributes.agility,
                this.attributes.balance,
                this.attributes.naturalFitness,
                this.attributes.strength,
                this.attributes.jumpingReach,
                this.attributes.stamina,
                this.attributes.pace,
            ),
        };
    }

    attackRating(): number {
        const rating = this.rating();

        return (
            (rating as PlayerRating).dribbling
            + (rating as PlayerRating).pace
            + (rating as PlayerRating).passing
            + (rating as PlayerRating).shooting
            + (rating as PlayerRating).physique
        ) / 5;
    }

    attributesAverage(...attributes: number[]): number {
        return (attributes.reduce((a, b) => a + b) / attributes.length) / 20 * 100;
    }
}
