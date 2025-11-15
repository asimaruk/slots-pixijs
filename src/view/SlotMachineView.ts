import { Container, DestroyOptions, Graphics, Text, TextStyle, TextStyleOptions } from 'pixi.js';
import { SlotReelsVM } from '../viewmodel/SlotReelsVM';
import { TweenSystem } from '../tween/tween';
import { SlotReelsView } from './SlotReelsView';
import { Subscriber } from '../utils/observable';
import { SlotMachineVM } from '../viewmodel/SlotMachineVM';
import { SimpleTweenSystem } from '../tween/simple-tween';
import { Strings } from '../strings/Strings';

const BASIC_FONT_STYLE: Partial<TextStyleOptions> = {
    fontFamily: 'Roboto',
    fontSize: 36,
    fontWeight: 'bold',
    fill: '#FFF',
};

export class SlotMachineView extends Container {

    private titleText!: Text;
    private startButton!: Container;

    private subscriber: Subscriber = new Subscriber();

    constructor(
        private readonly slotReelsVM: SlotReelsVM,
        private readonly slotMachineVM: SlotMachineVM,
        private readonly tweenSystem: TweenSystem,
        private readonly slotReelsView: SlotReelsView,
        private readonly strings: Strings,
    ) {
        super();
        this.setupSlotReels();
        this.setupTitleText();
        this.setupStartButton();
    }

    private setupSlotReels(
    ) {
        this.slotReelsView.pivot.set(
            this.slotReelsView.width / 2,
            this.slotReelsView.height / 2,
        );
        this.addChild(this.slotReelsView);
    }

    private setupTitleText() {
        const style = new TextStyle({
            ...BASIC_FONT_STYLE,
            padding: 8,
            dropShadow: {
                color: 0xd3d83b,
                angle: 0,
                blur: 8,
                distance: 0,
            },
        });
        this.titleText = new Text({
            text: 'TRY AGAIN',
            style: style,
            visible: false,
        });
        this.addChild(this.titleText);
        this.titleText.y = -200;
        this.subscriber.subscribe(this.slotMachineVM.title, (title) => this.onTitle(title));
        this.subscriber.subscribe(this.slotReelsVM.lines, () => this.onSpin());
    }

    private setupStartButton() {
        this.startButton = new Container();
        this.addChild(this.startButton);
        this.startButton.y = 200;
        const startGraphics = new Graphics()
            .roundRect(0, 0, 150, 70, 15)
            .fill(0xf34825)
            .setStrokeStyle({
                color: 0xefcdc4,
                width: 2,
            })
            .stroke();
        startGraphics.pivot.set(75, 35);
        this.startButton.addChild(startGraphics);
        this.startButton.onpointerdown = () => this.onStartPressed();
        this.startButton.interactive = true;

        const style = new TextStyle({
            ...BASIC_FONT_STYLE,
        });
        const startText = new Text({
            text: this.strings.get('start').toUpperCase(),
            style: style,
        });
        startText.pivot.set(startText.width / 2, startText.height / 2);
        this.startButton.addChild(startText);

    }

    private async onStartPressed() {
        this.startButton.interactive = false;
        await this.tweenSystem.tweenTo(
            { scale: 1 },
            { scale: 0.75 },
            0.1,
            {
                easing: SimpleTweenSystem.Easing.easeInOutSine,
                onUpdate: (_dt, value, _prev) => {
                    this.startButton.scale = value.scale;
                }
            }
        ).complete();
        this.slotReelsVM.spin();
        await this.tweenSystem.tweenTo(
            { scale: 0.75 },
            { scale: 1 },
            0.1,
            {
                easing: SimpleTweenSystem.Easing.easeInOutSine,
                onUpdate: (_dt, value, _prev) => {
                    this.startButton.scale = value.scale;
                }
            }
        ).complete();
    }

    private async onSpin() {
        await this.tweenSystem.tweenTo(
            { scale: 1 },
            { scale: 0 },
            0.2,
            {
                easing: SimpleTweenSystem.Easing.easeInOutSine,
                onUpdate: (_dt, value, _prev) => {
                    this.titleText.scale = value.scale;
                }
            }
        ).complete();
        this.titleText.visible = false;
    }

    private async onTitle(title: string) {
        await this.slotReelsView.completeSpin();
        this.titleText.visible = true;
        this.titleText.text = title.toUpperCase();
        this.titleText.scale = 1;
        this.titleText.pivot.set(this.titleText.width / 2, this.titleText.height);
        this.titleText.scale = 0;
        await this.tweenSystem.tweenTo(
            { scale: 0 },
            { scale: 1 },
            0.5,
            {
                easing: SimpleTweenSystem.Easing.easeOutElastic,
                onUpdate: (_dt, value, _prev) => {
                    this.titleText.scale = value.scale;
                }
            }
        ).complete();
        this.startButton.interactive = true;
    }

    override destroy(options?: DestroyOptions): void {
        super.destroy(options);
        this.subscriber.unsubscribe();
    }
}