import { Application } from 'pixi.js';
import { Slots, BasicFullLinesWinSlotMachine } from 'slots-core';
import { SlotReelsView } from './view/SlotReelsView';
import { SlotReelsModel } from './model/SlotReelsModel';
import { SlotReelsVM } from './viewmodel/SlotReelsVM';
import { SimpleTweenSystem } from './tween/simple-tween';
import { SlotMachineView } from './view/SlotMachineView';
import { DefaultStrings } from './strings/DefaultStrings';
import { SlotMachineVM } from './viewmodel/SlotMachineVM';

(async () => {
  const app = new Application();
  await app.init({
    backgroundColor: 0x1099bb,
    antialias: true,
    resizeTo: window,
  });

  document.body.appendChild(app.canvas);

  const tweenSystem = new SimpleTweenSystem();
  const slotConfig = {
    width: 3,
    height: 3,
    symbols: ['🍒', '🍋', '⭐', '💎', '🔔'],
  };
  const strings = new DefaultStrings();

  const slotMachine: Slots.Machine = new BasicFullLinesWinSlotMachine(slotConfig);
  const slotReelsModel: SlotReelsModel = new SlotReelsModel(
    slotConfig.symbols,
    slotConfig.width,
    slotConfig.height,
    slotMachine,
  );
  const slotReelsVM: SlotReelsVM = new SlotReelsVM(slotReelsModel);
  const slotMachineVM: SlotMachineVM = new SlotMachineVM(
    slotReelsModel,
    strings,
  );
  const slotReelsViewOptions = {
    width: 400,
    height: 300,
    spinDuration: 3.5,
    baseSpinSteps: 100,
    extraSpinSteps: 100,
  };
  const slotReelsView = new SlotReelsView(
    slotReelsVM,
    tweenSystem,
    slotConfig.symbols,
    slotReelsViewOptions,
  );
  const slotsMachineView = new SlotMachineView(
    slotReelsVM,
    slotMachineVM,
    tweenSystem,
    slotReelsView,
    strings,
  );

  app.stage.addChild(slotsMachineView);
  const gameScale = Math.min(1, window.innerWidth / 400, window.innerHeight / 600);
  app.stage.scale = gameScale;
  app.stage.position.set(
    window.innerWidth / 2,
    window.innerHeight / 2,
  );
  slotReelsView.scaleFont(gameScale);

  app.ticker.add((ticker) => {
    tweenSystem.update(ticker.deltaMS / 1000);
  });
})();
