import { Position } from './enums/Position';
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
    constructor(info: PlayerInfo, biometrics: PlayerBiometrics, attributes: PlayerAttributes, position: Position);
    ratingAverage(): number;
    rating(): PlayerRating | GoalkeeperRating;
    attackRating(): number;
    attributesAverage(...attributes: number[]): number;
}
