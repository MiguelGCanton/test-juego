import Phaser from 'phaser';
import type { ProgressKind } from '../world/VisualState';

export const PROGRESS_KIND_COLORS: Record<ProgressKind, number> = {
  proceso: 0xe67e22,     // Naranja
  limpieza: 0x3498db,    // Azul
  tratamiento: 0x2ecc71, // Verde
  carga: 0xf1c40f,       // Amarillo
  alerta: 0xe74c3c,      // Rojo
};

/**
 * Componente Phaser para barras de progreso flotantes en el mundo sobre celdas (T-42).
 * Dimensiones: 48x6 px.
 * Soporta colores según ProgressKind, modo atenuado con icono de pausa y visibilidad dinámica.
 */
export class WorldProgressBar {
  public static readonly WIDTH = 48;
  public static readonly HEIGHT = 6;

  public container: Phaser.GameObjects.Container;
  private bgGraphics: Phaser.GameObjects.Graphics;
  private barGraphics: Phaser.GameObjects.Graphics;
  private pauseText: Phaser.GameObjects.Text;
  private currentProgress = 0;
  private currentKind: ProgressKind = 'proceso';
  private isPaused = false;

  constructor(scene: Phaser.Scene, x = 0, y = 0) {
    this.container = scene.add.container(x, y).setDepth(20).setVisible(false);

    // Fondo oscuro con borde
    this.bgGraphics = scene.add.graphics();
    this.bgGraphics.fillStyle(0x0a0f18, 0.85);
    this.bgGraphics.fillRoundedRect(
      -WorldProgressBar.WIDTH / 2,
      -WorldProgressBar.HEIGHT / 2,
      WorldProgressBar.WIDTH,
      WorldProgressBar.HEIGHT,
      2
    );
    this.bgGraphics.lineStyle(1, 0xffffff, 0.6);
    this.bgGraphics.strokeRoundedRect(
      -WorldProgressBar.WIDTH / 2,
      -WorldProgressBar.HEIGHT / 2,
      WorldProgressBar.WIDTH,
      WorldProgressBar.HEIGHT,
      2
    );
    this.container.add(this.bgGraphics);

    // Barra de relleno
    this.barGraphics = scene.add.graphics();
    this.container.add(this.barGraphics);

    // Icono de pausa
    this.pauseText = scene.add.text(WorldProgressBar.WIDTH / 2 + 4, 0, '⏸', {
      fontFamily: 'sans-serif',
      fontSize: '10px',
      color: '#f1c40f',
    }).setOrigin(0, 0.5).setVisible(false);
    this.container.add(this.pauseText);
  }

  public setPosition(x: number, y: number): this {
    this.container.setPosition(x, y);
    return this;
  }

  public setVisible(visible: boolean): this {
    this.container.setVisible(visible);
    return this;
  }

  public setProgress(progress: number, kind: ProgressKind = 'proceso'): void {
    this.currentProgress = Math.max(0, Math.min(1, progress));
    this.currentKind = kind;
    this.redraw();
  }

  public setPaused(paused: boolean): void {
    if (this.isPaused === paused) return;
    this.isPaused = paused;
    this.container.setAlpha(paused ? 0.5 : 1.0);
    this.pauseText.setVisible(paused);
  }

  private redraw(): void {
    this.barGraphics.clear();
    if (this.currentProgress <= 0) return;

    const fillWidth = Math.max(2, (WorldProgressBar.WIDTH - 2) * this.currentProgress);
    const color = PROGRESS_KIND_COLORS[this.currentKind] ?? 0xe67e22;

    this.barGraphics.fillStyle(color, 1);
    this.barGraphics.fillRoundedRect(
      -WorldProgressBar.WIDTH / 2 + 1,
      -WorldProgressBar.HEIGHT / 2 + 1,
      fillWidth,
      WorldProgressBar.HEIGHT - 2,
      1
    );
  }

  public destroy(): void {
    this.container.destroy();
  }
}
