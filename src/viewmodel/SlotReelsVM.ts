import { SlotReelsModel } from '../model/SlotReelsModel';
import { observable, Subscriber } from '../utils/observable';

export class SlotReelsVM {

    private subscriber = new Subscriber();

    public readonly lines = observable<SlotReelsVM.Lines>([]);
    public readonly reelsSize = observable<SlotReelsVM.ReelsSize>({ reels: 0, rows: 0 });

    constructor(private readonly slotReelsModel: SlotReelsModel) {
        this.subscriber.subscribe(slotReelsModel.lines, (lines: SlotReelsModel.Lines) => {
            this.lines.set(lines);
        });
        this.subscriber.subscribe(slotReelsModel.reelsSize, (size: SlotReelsModel.ReelsSize) => {
            this.reelsSize.set(size);
        });
    }

    unsubscribe() {
        this.subscriber.unsubscribe();
    }

    spin() {
        this.slotReelsModel.spin();
    }
}

export namespace SlotReelsVM {
    export type ReelsSize = SlotReelsModel.ReelsSize;
    export type Lines = SlotReelsModel.Lines;
}