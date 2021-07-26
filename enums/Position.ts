export enum Position {
    GK,
    LB,
    LCB,
    CB,
    RCB,
    RB,
    LWB,
    LDM,
    DM,
    RDM,
    RWB,
    LM,
    LCM,
    CM,
    RCM,
    RM,
    LW,
    LCOM,
    COM,
    RCOM,
    RW,
    LF,
    CF,
    RF,
    ST,
}

export const defencePositions = [
    Position.LB,
    Position.LCB,
    Position.CB,
    Position.RCB,
    Position.RB,
    Position.LWB,
    Position.RWB,
];

export const midfieldPositions = [
    Position.LDM,
    Position.DM,
    Position.RDM,
    Position.LM,
    Position.LCM,
    Position.CM,
    Position.RCM,
    Position.RM,
];

export const attackPositions = [
    Position.LW,
    Position.LCOM,
    Position.COM,
    Position.RCOM,
    Position.RW,
    Position.LF,
    Position.CF,
    Position.RF,
    Position.ST,
];

export const leftPositions = [
    Position.LB,
    Position.LCB,
    Position.LDM,
    Position.LWB,
    Position.LM,
    Position.LCM,
    Position.LW,
    Position.LCOM,
    Position.LF,
];

export const centerPositions = [
    Position.LCB,
    Position.CB,
    Position.RCB,
    Position.LDM,
    Position.DM,
    Position.RDM,
    Position.LCM,
    Position.CM,
    Position.RCM,
    Position.LCOM,
    Position.COM,
    Position.RCOM,
    Position.CF,
    Position.ST,
];

export const rightPositions = [
    Position.RB,
    Position.RCB,
    Position.RDM,
    Position.RWB,
    Position.RM,
    Position.RCM,
    Position.RW,
    Position.RCOM,
    Position.RF,
];
