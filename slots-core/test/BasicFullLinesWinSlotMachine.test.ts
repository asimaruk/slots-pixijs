import { describe, it, expect } from '@jest/globals';
import { BasicFullLinesWinSlotMachine } from '../src/BasicFullLinesWinSlotMachine';
import { Slots } from '../src/SlotMachine';
import { Random } from '../src/random/random';

describe('BasicFullLinesWinSlotMachine', () => {

    const SYMBOLS: Slots.Symbol[] = ['A', 'B', 'C', 'D', 'E'];
    const CONFIG: BasicFullLinesWinSlotMachine.Config = {
        width: 3,
        height: 3,
        symbols: SYMBOLS,
    };

    const symbolSequenceRandom: (sequence: Slots.Symbol[]) => Random = (sequence: Slots.Symbol[]) => {
        let index: number = 0;
        return () => {
            const sym = sequence[index];
            index = (index + 1) % sequence.length;
            return SYMBOLS.indexOf(sym) / SYMBOLS.length;
        }
    }

    it('No wins', () => {
        const nextLines = [
            ['A', 'B', 'C'],
            ['B', 'C', 'D'],
            ['C', 'D', 'E'],
        ];
        const machine = new BasicFullLinesWinSlotMachine(
            CONFIG,
            symbolSequenceRandom(nextLines.flat()),
        );
        const res = machine.spin();
        expect(res.wins).toHaveLength(0);
        expect(res.lines).toEqual(nextLines);
    });

    it('One middle row win', () => {
        const nextLines = [
            ['A', 'B', 'C'],
            ['C', 'C', 'C'],
            ['C', 'D', 'E'],
        ];
        const machine = new BasicFullLinesWinSlotMachine(
            CONFIG,
            symbolSequenceRandom(nextLines.flat()),
        );
        const res = machine.spin();
        expect(res.wins).toEqual(expect.arrayContaining([
            [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
        ]));
        expect(res.lines).toEqual(nextLines);
    });

    it('All row wins', () => {
        const nextLines = [
            ['A', 'A', 'A'],
            ['C', 'C', 'C'],
            ['D', 'D', 'D'],
        ];
        const machine = new BasicFullLinesWinSlotMachine(
            CONFIG,
            symbolSequenceRandom(nextLines.flat()),
        );
        const res = machine.spin();
        expect(res.wins).toEqual(expect.arrayContaining([
            [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
            [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
            [{ x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }],
        ]));
        expect(res.lines).toEqual(nextLines);
    });
});