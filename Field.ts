import {FieldArea} from "./enums/FieldArea";
import type {FieldColumn} from "./types/FieldColumn";

const cols: { [col: string]: number } = {
    'A': 1,
    'B': 2,
    'C': 3,
};

export default class Field {
    areas: FieldArea[][] = [
        [FieldArea.DefensiveLeft, FieldArea.DefensiveCenter, FieldArea.DefensiveRight],
        [FieldArea.PreDefensiveLeft, FieldArea.PreDefensiveCenter, FieldArea.PreDefensiveRight],
        [FieldArea.MidfieldLeft, FieldArea.MidfieldCenter, FieldArea.MidfieldRight],
        [FieldArea.PreAttackingLeft, FieldArea.PreAttackingCenter, FieldArea.PreAttackingRight],
        [FieldArea.AttackingLeft, FieldArea.AttackingCenter, FieldArea.AttackingRight],
    ];

    fieldAreaToNumber(area: FieldArea): number[] {
        const [column, row] = area;

        return [cols[column], parseInt(row, 10)];
    }

    columnToNumber(col: FieldColumn): number {
        return cols[col];
    }

    startPosition(): FieldArea {
        return FieldArea.MidfieldCenter;
    }

    randomDirection(): FieldColumn {
        const alts: FieldColumn[] = ['A', 'B', 'C'];

        return alts[Math.floor(Math.random() * alts.length)];
    }

    reverseSide(current: FieldArea): FieldArea {
        const [col, row] = this.fieldAreaToNumber(current);
        const reversed = this.areas.reverse();
        const newRow = reversed[row - 1].reverse();

        return newRow[col - 1];
    }

    move(current: FieldArea, rowDirection = 1, columnDirection: FieldColumn|null = null) {
        const [, row] = this.fieldAreaToNumber(current);
        const nextRow = Math.max(1, Math.min(row + rowDirection, this.areas.length));
        const nextCol = columnDirection || this.randomDirection();

        return this.areas[nextRow - 1][this.columnToNumber(nextCol) - 1];
    }

    advance(current: FieldArea, columnDirection: FieldColumn|null = null) {
        return this.move(current, 1, columnDirection);
    }

    retreat(current: FieldArea, columnDirection: FieldColumn|null = null) {
        return this.move(current, -1, columnDirection);
    }
}
