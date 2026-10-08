import Phaser from 'phaser';
import { GAME_WIDTH, SCENE_KEYS, UI_COLORS } from '../config/constants';
import { getInput, getSound } from '../core/services';
import { addText, addTitle } from '../core/ui';
import { LEVELS } from '../levels/types';

export class LevelSelectScene extends Phaser.Scene {
  private selected = 0;
  private labels: Phaser.GameObjects.Text[] = [];

  constructor() {
    super(SCENE_KEYS.LevelSelect);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(UI_COLORS.background);
    addTitle(this, 'ELIGE NIVEL', 100);
    addText(this, GAME_WIDTH / 2, 170, 'Arriba/Abajo · AGARRAR para jugar', 22, UI_COLORS.textMuted);
    this.labels = LEVELS.map((l, i) => addText(this, GAME_WIDTH / 2, 300 + i * 90, l.name, 36));
    this.selected = 0;
  }

  update(): void {
    const input = getInput(this);
    input.update();
    let dy = 0;
    let confirm = false;
    for (const d of input.getDevices()) {
      const f = input.read(d.id);
      const prevY = this.prevY.get(d.id) ?? 0;
      if (Math.abs(f.moveY) > 0.5 && Math.abs(prevY) <= 0.5) dy = Math.sign(f.moveY);
      this.prevY.set(d.id, f.moveY);
      if (f.grabPressed) confirm = true;
    }
    if (dy) {
      this.selected = Phaser.Math.Wrap(this.selected + dy, 0, LEVELS.length);
      getSound(this)?.playMenuMove();
    }
    this.labels.forEach((t, i) => t.setColor(i === this.selected ? UI_COLORS.textAccent : UI_COLORS.text));
    if (confirm) {
      getSound(this)?.playMenuSelect();
      this.scene.start(SCENE_KEYS.Game, { levelId: LEVELS[this.selected]!.id });
    }
  }

  private readonly prevY = new Map<string, number>();
}
