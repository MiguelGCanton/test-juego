import Phaser from 'phaser';
import type { GridPos } from '../levels/LevelLoader';
import { cellToWorld } from '../levels/LevelLoader';
import type { Interactable } from './Interactable';
import type { VisualState, VisualStateProvider } from './VisualState';
import { WorldProgressBar } from '../core/WorldProgressBar';
import { getSound } from '../core/services';

/**
 * Renderizador Phaser genérico para interactuables y estaciones (T-43).
 * Lee el VisualState cada frame y actualiza texturas, iconos, barra de progreso en el mundo,
 * badges, overlays de trabajadores y animaciones de feedback (T-44, T-45, T-46, T-47).
 */
export class StationView {
  public readonly scene: Phaser.Scene;
  public readonly interactable: Interactable;
  public readonly sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image;
  public readonly baseTextureKey: string;
  public readonly cell: GridPos;

  public readonly progressBar: WorldProgressBar;
  public readonly itemContainer: Phaser.GameObjects.Container;
  public readonly itemSprite: Phaser.GameObjects.Image;
  public readonly shadowGraphics: Phaser.GameObjects.Graphics;

  public readonly slotImages: Phaser.GameObjects.Image[] = [];
  public readonly badgeText: Phaser.GameObjects.Text;
  public readonly workersText: Phaser.GameObjects.Text;
  public readonly borderGraphics: Phaser.GameObjects.Graphics;
  public readonly stainGraphics: Phaser.GameObjects.Graphics;
  public readonly rejectGraphics: Phaser.GameObjects.Graphics;

  private originalX: number;
  private originalY: number;

  private prevItemType: string | null = null;
  private prevActivity: string = 'idle';

  private tempDoneTimer = 0;
  private whiteFlashTimer = 0;
  private rejectTimer = 0;
  private blinkTimer = 0;

  constructor(
    scene: Phaser.Scene,
    interactable: Interactable,
    sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image,
    baseTextureKey: string
  ) {
    this.scene = scene;
    this.interactable = interactable;
    this.sprite = sprite;
    this.baseTextureKey = baseTextureKey;
    this.cell = interactable.cell;

    const { x, y } = cellToWorld(this.cell.col, this.cell.row);
    this.originalX = x;
    this.originalY = y;

    // 1. Gráficos de rechazo / contorno de alerta
    this.rejectGraphics = scene.add.graphics().setDepth(22);
    this.borderGraphics = scene.add.graphics().setDepth(15);
    this.stainGraphics = scene.add.graphics().setDepth(2);

    // 2. Icono de ítem apoyado (36 px con sombra) (T-43 / T-44)
    this.itemContainer = scene.add.container(x, y - 4).setDepth(12).setVisible(false);
    this.shadowGraphics = scene.add.graphics();
    this.shadowGraphics.fillStyle(0x000000, 0.4);
    this.shadowGraphics.fillEllipse(0, 16, 26, 10);
    this.itemContainer.add(this.shadowGraphics);

    this.itemSprite = scene.add.image(0, 0, 'item-gasas').setDisplaySize(36, 36);
    this.itemContainer.add(this.itemSprite);

    // 3. Ranuras multi-ítem para estaciones como la Mesa Quirúrgica Q
    const slot1 = scene.add.image(x - 14, y - 6, 'item-gasas').setDisplaySize(22, 22).setDepth(12).setVisible(false);
    const slot2 = scene.add.image(x + 14, y - 6, 'item-anestesia').setDisplaySize(22, 22).setDepth(12).setVisible(false);
    this.slotImages = [slot1, slot2];

    // 4. Barra de progreso en el mundo (T-42) colocada sobre la estación
    this.progressBar = new WorldProgressBar(scene, x, y - 24);

    // 5. Badge (✔ / ⚠ / ⚡ / 💀)
    this.badgeText = scene.add.text(x + 18, y - 24, '', {
      fontFamily: '"Fredoka", "Trebuchet MS", sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(25).setVisible(false);

    // 6. Indicador de personal / workers (ej. 1/2 cirujanos)
    this.workersText = scene.add.text(x, y + 20, '', {
      fontFamily: '"Fredoka", "Trebuchet MS", sans-serif',
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#1b263b',
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(22).setVisible(false);
  }

  public update(deltaSec: number): void {
    const provider = this.interactable as unknown as Partial<VisualStateProvider>;
    if (!provider.getVisualState) return;

    const state: VisualState = provider.getVisualState();

    // 1. Textura variante (T-41)
    let targetTexture = this.baseTextureKey;
    if (state.activity === 'disabled') {
      const disabledKey = `${this.baseTextureKey}-disabled`;
      if (this.scene.textures.exists(disabledKey)) {
        targetTexture = disabledKey;
      }
    } else if (state.variant && state.variant !== 'base') {
      const variantKey = `${this.baseTextureKey}-${state.variant}`;
      if (this.scene.textures.exists(variantKey)) {
        targetTexture = variantKey;
      }
    }

    if (this.sprite.texture.key !== targetTexture && this.scene.textures.exists(targetTexture)) {
      this.sprite.setTexture(targetTexture);
    }

    // 2. Icono de ítem apoyado y animaciones pop/fly (T-44)
    const currentItem = state.item?.type ?? null;
    if (currentItem !== this.prevItemType) {
      if (currentItem) {
        const itemTexKey = `item-${currentItem}`;
        if (this.scene.textures.exists(itemTexKey)) {
          this.itemSprite.setTexture(itemTexKey);
          this.itemSprite.setDisplaySize(36, 36);
          this.itemContainer.setPosition(this.originalX, this.originalY - 4);
          this.itemContainer.setAlpha(1);
          this.itemContainer.setVisible(true);

          // Pop de escala (1.2 -> 1.0 en 0.12 s)
          this.itemContainer.setScale(1.2);
          this.scene.tweens.add({
            targets: this.itemContainer,
            scale: 1.0,
            duration: 120,
            ease: 'Back.easeOut',
          });
        }
      } else {
        // Ítem recogido: pequeña animación de elevación y desvanecimiento rápido
        if (this.itemContainer.visible) {
          this.scene.tweens.add({
            targets: this.itemContainer,
            alpha: 0,
            y: this.originalY - 16,
            duration: 100,
            onComplete: () => {
              this.itemContainer.setVisible(false);
              this.itemContainer.setAlpha(1);
              this.itemContainer.y = this.originalY - 4;
            },
          });
        }
      }
      this.prevItemType = currentItem;
    }

    // 3. Multi-slot visual (para Q)
    if (state.slots && state.slots.length > 0 && !state.item) {
      state.slots.forEach((slot, idx) => {
        const img = this.slotImages[idx];
        if (!img) return;
        if (slot) {
          const tex = `item-${slot.type}`;
          if (this.scene.textures.exists(tex)) {
            img.setTexture(tex).setVisible(true);
          }
        } else {
          img.setVisible(false);
        }
      });
    } else {
      this.slotImages.forEach((img) => img.setVisible(false));
    }

    // 4. Barra de progreso en el mundo (T-42)
    if (state.progress && state.progress.value > 0) {
      this.progressBar.setVisible(true);
      this.progressBar.setProgress(state.progress.value, state.progress.kind);
      this.progressBar.setPaused(state.activity === 'paused');
    } else {
      this.progressBar.setVisible(false);
    }

    // 5. Animación de proceso y pausa (T-45)
    if (state.activity === 'working') {
      const shakeX = (Math.random() - 0.5) * 2;
      const shakeY = (Math.random() - 0.5) * 2;
      this.sprite.setPosition(this.originalX + shakeX, this.originalY + shakeY);
    } else if (this.rejectTimer <= 0) {
      this.sprite.setPosition(this.originalX, this.originalY);
    }

    // Al completar proceso: destello blanco 0.15 s + insignia temporal ✔ 1.0 s
    if (this.prevActivity === 'working' && state.activity === 'done') {
      this.whiteFlashTimer = 0.15;
      this.tempDoneTimer = 1.0;
    }
    this.prevActivity = state.activity;

    if (this.whiteFlashTimer > 0) {
      this.whiteFlashTimer -= deltaSec;
      this.sprite.setTint(0xffffff);
    } else if (state.activity === 'disabled') {
      this.sprite.setTint(0x7f8c8d);
    } else {
      this.sprite.clearTint();
    }

    if (this.tempDoneTimer > 0) {
      this.tempDoneTimer -= deltaSec;
    }

    // 6. Insignias / Badges (✔, ⚠, ⚡, 💀)
    let badgeChar = '';
    let badgeColor = '#ffffff';

    if (state.badge === 'warning') {
      badgeChar = '⚠';
      badgeColor = '#e74c3c';
    } else if (state.badge === 'bolt' || state.activity === 'disabled') {
      badgeChar = '⚡';
      badgeColor = '#f1c40f';
    } else if (state.badge === 'skull') {
      badgeChar = '💀';
      badgeColor = '#ecf0f1';
    } else if (state.badge === 'check' || this.tempDoneTimer > 0) {
      badgeChar = '✔';
      badgeColor = '#2ecc71';
    }

    if (badgeChar) {
      this.badgeText.setText(badgeChar);
      this.badgeText.setColor(badgeColor);
      this.badgeText.setVisible(true);
    } else {
      this.badgeText.setVisible(false);
    }

    // 7. Parpadeo rojo 2 Hz del borde para alertas (T-46)
    if (state.badge === 'warning' || state.activity === 'alert') {
      this.blinkTimer += deltaSec;
      const isBlinkOn = Math.floor(this.blinkTimer * 4) % 2 === 0;
      this.borderGraphics.clear();
      if (isBlinkOn) {
        this.borderGraphics.lineStyle(3, 0xe74c3c, 0.9);
        this.borderGraphics.strokeRect(this.originalX - 30, this.originalY - 30, 60, 60);
      }
    } else {
      this.borderGraphics.clear();
      this.blinkTimer = 0;
    }

    // 8. Personal requerido / workers overlay
    if (state.workers && state.workers.required > 0) {
      this.workersText.setText(`👥 ${state.workers.current}/${state.workers.required}`);
      this.workersText.setVisible(true);
    } else {
      this.workersText.setVisible(false);
    }

    // 9. Camas y charcos (T-47)
    if (state.stain !== undefined) {
      this.stainGraphics.clear();
      if (state.stain > 0.05) {
        this.stainGraphics.fillStyle(0x3e2723, 0.5 * state.stain);
        this.stainGraphics.fillCircle(this.originalX - 12, this.originalY - 6, 8 * state.stain);
        this.stainGraphics.fillCircle(this.originalX + 10, this.originalY + 8, 10 * state.stain);
      }
    }

    if (this.interactable.type === 'spill') {
      const prog = state.progress ? state.progress.value : 0;
      const scale = Math.max(0.2, 1 - 0.7 * prog);
      const alpha = Math.min(1.0, 0.7 + 0.3 * prog);
      this.sprite.setScale(scale);
      this.sprite.setAlpha(alpha);
    }

    // 10. Temporizador de rechazo de interacción
    if (this.rejectTimer > 0) {
      this.rejectTimer -= deltaSec;
      const shakeOffset = (Math.random() - 0.5) * 6;
      this.sprite.setX(this.originalX + shakeOffset);

      this.rejectGraphics.clear();
      this.rejectGraphics.lineStyle(3, 0xe74c3c, 1);
      this.rejectGraphics.strokeRect(this.originalX - 31, this.originalY - 31, 62, 62);

      if (this.rejectTimer <= 0) {
        this.sprite.setX(this.originalX);
        this.rejectGraphics.clear();
      }
    }
  }

  /**
   * Ejecuta el feedback de interacción rechazada / inválida (T-46, DEC-023).
   * Contorno rojo 0.25 s + sacudida horizontal ±3 px + SFX error.
   */
  public rejectInteraction(): void {
    this.rejectTimer = 0.25;
    getSound(this.scene)?.playError();
  }

  public destroy(): void {
    this.progressBar.destroy();
    this.itemContainer.destroy();
    this.slotImages.forEach((img) => img.destroy());
    this.badgeText.destroy();
    this.workersText.destroy();
    this.borderGraphics.destroy();
    this.stainGraphics.destroy();
    this.rejectGraphics.destroy();
  }
}
