export namespace Slots {
    export type Symbol = string;
    export type Line = Symbol[];
    export type SpinResult = {
        lines: Line[],
        wins: { x: number, y: number }[][],
    };
    export interface Machine {
        spin(): SpinResult;
    };
}