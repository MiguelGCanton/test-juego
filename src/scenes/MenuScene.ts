import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENE_KEYS, UI_COLORS } from '../config/constants';
import { getInput, getSound } from '../core/services';
import { addText, addTitle } from '../core/ui';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.Menu);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(UI_COLORS.background);
    addTitle(this, 'CÓDIGO CAOS', 220, 84);
    addText(this, GAME_WIDTH / 2, 310, 'Party game cooperativo de hospital', 28, UI_COLORS.textMuted);
    addText(this, GAME_WIDTH / 2, GAME_HEIGHT - 200, 'Pulsa AGARRAR (E / . / A) para empezar', 30);
  }

  update(): void {
    const input = getInput(this);
    input.update();
    if (input.getDevices().some((d) => input.read(d.id).grabPressed)) {
      getSound(this)?.playMenuSelect();
      this.scene.start(SCENE_KEYS.Lobby);
    }
  }
}
