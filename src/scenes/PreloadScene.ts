import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/constants';
import { generatePlaceholderTextures } from '../core/TextureFactory';

/** Aquí se generan o cargan las texturas placeholder. */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.Preload);
  }

  preload(): void {
    // Generación de texturas procedurales para paredes, suelos, estaciones e ítems
    generatePlaceholderTextures(this);
  }

  create(): void {
    this.scene.start(SCENE_KEYS.Menu);
  }
}
