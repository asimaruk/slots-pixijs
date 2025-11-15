import {
  BlurFilter,
  Container,
  DestroyOptions,
  Graphics,
  Text,
  TextStyle,
} from 'pixi.js';
import { SlotReelsVM } from '../viewmodel/SlotReelsVM';
import { Subscriber } from '../utils/observable';
import { TweenSystem } from '../tween/tween';
import { SimpleTweenSystem } from '../tween/simple-tween';
import { Slots } from 'slots-core';

type Reel = {
    container: Container,
    symbols: Text[],
    position: number,
    blur: BlurFilter,
};

export namespace SlotReelsView {
    export type Options = {
        width: number,
        height: number,
        spinDuration: number,
        baseSpinSteps: number,
        extraSpinSteps: number,
    };
};

export class SlotReelsView extends Container {

    private reels: Reel[] = [];
    private subscriber: Subscriber = new Subscriber();
    private _width: number = 0;
    private _height: number = 0;
    private isFirstLines = true;
    private symbolSize: number = 0;
    private spinPromise: Promise<void> | null = null;
    private resolveSpin: (() => void) | null = null;

    override get width() { return this._width }
    override get height() { return this._height }

    constructor(
        private readonly slotReelsVM: SlotReelsVM,
        private readonly tweenSystem: TweenSystem,
        private readonly symbols: Slots.Symbol[],
        private readonly options: SlotReelsView.Options,
    ) {
        super();
        this._width = options.width;
        this._height = options.height;
        this.subscriber.subscribe(slotReelsVM.reelsSize, (size) => this.onReelsSizeChanged(size));
        this.subscriber.subscribe(slotReelsVM.lines, (lines) => this.onLinesChanged(lines));
    }

    private onReelsSizeChanged(size: SlotReelsVM.ReelsSize) {
        this.removeChildren();
        this.reels.splice(0, this.reels.length);
        const reelWidth = this.width / size.reels;
        this.symbolSize = Math.min(
            reelWidth * 0.8,
            (this.height / size.rows) * 0.8
        );
        for (let i = 0; i < size.reels; i++) {
            const reel = this.createReel(reelWidth, i);
            this.reels.push(reel);
            this.createReelSymbols(reelWidth, this.symbolSize, reel, size.rows);
        }

        const mask = new Graphics()
            .rect(0, 0, this.width, this.symbolSize * size.rows)
            .fill({ color: 0x000000 });
        this.addChild(mask);
        this.reels.forEach(r => r.container.mask = mask);
    }

    private createReel(reelWidth: number, reelPos: number): Reel {
        const reelContainer = new Container();
        reelContainer.x = reelPos * reelWidth;
        this.addChild(reelContainer);
        const reel: Reel = {
            container: reelContainer,
            symbols: [],
            position: 0,
            blur: new BlurFilter(),
        };
        reel.blur.strengthX = 0;
        reel.blur.strengthY = 0;
        reelContainer.filters = [reel.blur];
        return reel;
    }

    private createReelSymbols(reelWidth: number, symbolSize: number, reel: Reel, count: number) {
        const symbolTextStyle = new TextStyle({
            fontSize: symbolSize,
        });
        const reelSymbolsCount = count + 1;
        for (let j = 0; j < reelSymbolsCount; j++) {
            const symbolText = new Text({
                style: symbolTextStyle,
                width: symbolSize,
                height: symbolSize,
                pivot: { x: symbolSize / 2, y: symbolSize / 2 },
                position: { x: reelWidth / 2, y: j * symbolSize + symbolSize / 2 },
            });
            reel.symbols.push(symbolText);
            reel.container.addChild(symbolText);
        }
    }

    private async onLinesChanged(lines: SlotReelsVM.Lines) {
        console.log(lines);
        if (this.isFirstLines) {
            this.setupLines(lines);
            this.isFirstLines = false;
        } else {
            await this.spinReelsTo(lines);
            this.onSpinComplete();
        }
    }

    private setupLines(lines: SlotReelsVM.Lines) {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            for (let j = 0; j < line.length; j++) {
                this.reels[j].symbols[i].text = line[j];
            }
        }
    }

    private async spinReelsTo(lines: SlotReelsVM.Lines): Promise<void> {
        const maxExtraSteps = (this.reels.length - 1) * this.options.extraSpinSteps;
        const maxSpinSteps = this.options.baseSpinSteps + maxExtraSteps;
        const speed = maxSpinSteps / this.options.spinDuration;
        const reelTweens = this.reels.map(async (reel, reelIdx): Promise<Reel> => {
            const extraPositions = this.options.extraSpinSteps * reelIdx;
            const endPosition = reel.position + this.options.baseSpinSteps + extraPositions;
            const duration = this.options.spinDuration - (maxExtraSteps - extraPositions) / speed;
            const tween = this.tweenSystem.tweenTo(
                reel,
                {
                    position: endPosition,
                },
                duration,
                {
                    easing: SimpleTweenSystem.Easing.backout(0.2),
                    onUpdate: (dt, value, prev) => {
                        this.updateReel(lines, reel, reelIdx, prev, endPosition, dt);
                    },
                },
            );
            await tween.complete();
            return reel;
        });
        const tweenedReels = await Promise.all(reelTweens);
        tweenedReels.forEach(r => r.blur.strengthY = 0);
    }

    private updateReel(
        lines: SlotReelsVM.Lines,
        reel: Reel,
        reelIndex: number,
        prevProperties: Pick<Reel, 'position'>,
        endPosition: number,
        dt: number,
    ) {
        const positionDiff = reel.position - prevProperties.position;
        reel.blur.strengthY = positionDiff / (dt * 10);
        reel.symbols.forEach((symbol, i) => {
            const prevY = symbol.y;
            symbol.y = ((reel.position + i) % reel.symbols.length) * this.symbolSize - this.symbolSize / 2;
            if (symbol.y < 0 && (prevY > 0 || positionDiff >= 1)) { // on high speeds y and prevY might both be less then zero becouse of full reel round in one update
                this.swapSymbol(lines, symbol, reel.position, endPosition, reelIndex);
            }
        });
    }

    private swapSymbol(
        lines: SlotReelsVM.Lines,
        symbol: Reel['symbols'][number], 
        reelPosition: number, 
        reelTargetPosition: number, 
        reelIndex: number,
    ) {
        const rows = this.slotReelsVM.reelsSize.get().rows;
        const reelPosDiff = Math.floor(reelTargetPosition - reelPosition);
        if (reelPosDiff >= 0 && reelTargetPosition - reelPosition < rows) {
            symbol.text = lines[reelPosDiff][reelIndex];
        } else {
            symbol.text = this.symbols[Math.floor(Math.random() * this.symbols.length)];
        }
    }

    private onSpinComplete() {
        this.isFirstLines = false;
        this.interactive = true;
        this.resolveSpin?.();
        this.resolveSpin = null;
        this.spinPromise = null;
    }

    override destroy(options?: DestroyOptions): void {
        super.destroy(options);
        this.subscriber.unsubscribe();
    }

    public completeSpin(): Promise<void> {
        this.spinPromise ??= new Promise((res, _) => {
            this.resolveSpin = res;
        });
        return this.spinPromise;
    }
}
