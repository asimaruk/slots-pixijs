import { 
    defaultRandom, 
    Random, 
    Slots, 
} from 'slots-core';
import { observable } from '../utils/observable';

export class SlotReelsModel {

    public readonly lines = observable<SlotReelsModel.Lines>([]);
    public readonly wins = observable<SlotReelsModel.Wins>([]);
    public readonly reelsSize = observable<SlotReelsModel.ReelsSize>({ reels: 0, rows: 0 });

    constructor(
        symbols: Slots.Symbol[],
        reels: number,
        rows: number,
        private readonly slotMachine: Slots.Machine,
        random: Random = defaultRandom,
    ) {
        this.reelsSize.set({ reels, rows });
        const initialLines: Slots.Line[] = [];
        for (let i = 0; i < rows; i++) {
            const line: Slots.Line = [];
            for (let j = 0; j < reels; j++) {
                const rndSym = symbols[Math.floor(random() * symbols.length)];
                line.push(rndSym);
            }
            initialLines.push(line);
        }
        this.lines.set(initialLines);
    }

    spin() {
        const result = this.slotMachine.spin();
        this.lines.set(result.lines);
        this.wins.set(result.wins);
    }
}

export namespace SlotReelsModel {
    export type ReelsSize = {
        reels: number,
        rows: number,
    };
    export type Lines = Slots.Line[];
    export type Wins = Slots.SpinResult['wins'];
}