import { SlotReelsModel } from '../model/SlotReelsModel';
import { Strings } from '../strings/Strings';
import { observable, Subscriber } from '../utils/observable';

const TRY_AGAIN_KEY = 'try_again';
const WIN_KEY = 'win';

export class SlotMachineVM {

    private subscriber = new Subscriber();
    
    public readonly title = observable<string>(this.strings.get(TRY_AGAIN_KEY));

    constructor(
        slotReelsModel: SlotReelsModel,
        private readonly strings: Strings,
    ) {
        this.subscriber.subscribe(slotReelsModel.wins, (wins) => this.onWins(wins));
    }

    private onWins(wins: SlotReelsModel.Wins) {
        this.title.set(this.strings.get(wins.length > 0 ? WIN_KEY : TRY_AGAIN_KEY));
    }

    unsubscribe() {
        this.subscriber.unsubscribe();
    }
}

export namespace SlotMachineVM {
    export type Wins = SlotReelsModel.Wins;
}