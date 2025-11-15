import { defaultRandom, Random } from './random/random';
import { Slots } from './SlotMachine'

export class BasicFullLinesWinSlotMachine implements Slots.Machine {

    constructor(
        private readonly config: BasicFullLinesWinSlotMachine.Config,
        private readonly random: Random = defaultRandom,
    ) {}

    spin(): Slots.SpinResult {
        const lines: Slots.Line[] = [];
        const wins: Slots.SpinResult['wins'] = [];
        for (let y = 0; y < this.config.height; y++) {
            const line = this.getRandomLine();
            lines.push(line);
            if (line.every(s => s === line[0])) {
                wins.push(Array.from({ length: this.config.width }).map((_, x) => ({ x, y })));
            }
        }
        return { lines, wins };
    }

    private getRandomLine(): Slots.Line {
        return this.getRandomSymbols(this.config.width);
    }

    private getRandomSymbols(n: number): Slots.Line {
        const line: Slots.Line = [];
        for (let i = 0; i < n; i++) {
            const idx = Math.floor(this.random() * this.config.symbols.length);
            const sym = this.config.symbols[idx];
            if (sym) {
                line.push(sym);
            }
        }
        return line;
    }
}

export namespace BasicFullLinesWinSlotMachine {
    export type Config = {
        width: number,
        height: number,
        symbols: Slots.Symbol[],
    }
}