import type Phaser from 'phaser';
import { FONT_FAMILY, GAME_WIDTH, UI_COLORS } from '../config/constants';

export function addTitle(scene: Phaser.Scene, text: string, y = 90, size = 56): Phaser.GameObjects.Text {
  return scene.add
    .text(GAME_WIDTH / 2, y, text, { fontFamily: FONT_FAMILY, fontSize: `${size}px`, color: UI_COLORS.textAccent })
    .setOrigin(0.5);
}

export function addText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  size = 24,
  color: string = UI_COLORS.text,
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, { fontFamily: FONT_FAMILY, fontSize: `${size}px`, color }).setOrigin(0.5);
}
