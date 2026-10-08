import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/constants';
import { initServices } from '../core/services';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.Boot);
  }

  create(): void {
    initServices(this.game);
    this.scene.start(SCENE_KEYS.Preload);
  }
}
