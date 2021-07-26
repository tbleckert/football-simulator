import { FieldArea } from "./enums/FieldArea";
import type { FieldColumn } from "./types/FieldColumn";
export default class Field {
    areas: FieldArea[][];
    fieldAreaToNumber(area: FieldArea): number[];
    columnToNumber(col: FieldColumn): number;
    startPosition(): FieldArea;
    randomDirection(): FieldColumn;
    reverseSide(current: FieldArea): FieldArea;
    move(current: FieldArea, rowDirection?: number, columnDirection?: FieldColumn | null): FieldArea;
    advance(current: FieldArea, columnDirection?: FieldColumn | null): FieldArea;
    retreat(current: FieldArea, columnDirection?: FieldColumn | null): FieldArea;
}
