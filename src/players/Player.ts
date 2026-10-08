import Phaser from 'phaser';
import {
  DASH_COOLDOWN_SEC,
  DASH_DURATION_SEC,
  DASH_SPEED_MULTIPLIER,
  GAME_HEIGHT,
  GAME_WIDTH,
  HUD_HEIGHT,
  PLAYER_SPEED,
  TILE_SIZE,
} from '../config/constants';
import type { InputFrame } from '../input/types';
import type { Item } from '../items/Item';
import type { PlayerSlot } from './Roster';

export type CardinalDirection = 'up' | 'down' | 'left' | 'right';

export interface Facing {
  x: number;
  y: number;
  dir: CardinalDirection;
}

/**
 * Entidad jugador controlada por un dispositivo físico mediante InputFrame.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  public readonly slot: PlayerSlot;
  public facing: Facing = { x: 0, y: 1, dir: 'down' };
  public speedMultiplier = 1.0;

  // Estado del Dash (T-06)
  public dashTimer = 0;
  public dashCooldown = 0;
  public dashVector = { x: 0, y: 1 };
  public canDash = true;

  // Estado de transporte de ítems (T-08)
  public carriedItem: Item | null = null;

  // Elementos visuales adjuntos
  private readonly label: Phaser.GameObjects.Text;
  private readonly pointerIndicator: Phaser.GameObjects.Arc;
  private readonly cooldownBar: Phaser.GameObjects.Graphics;
  private readonly carriedIcon: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number, slot: PlayerSlot) {
    const texKey = `player-${slot.index + 1}`;
    super(scene, x, y, scene.textures.exists(texKey) ? texKey : 'floor');

    this.slot = slot;

    // Añadir a la escena y al sistema de física
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(10);
    this.setCollideWorldBounds(true);

    // Configuración del cuerpo físico (círculo centrado para esquivar esquinas)
    const radius = TILE_SIZE * 0.32;
    this.setCircle(radius, (this.width - radius * 2) / 2, (this.height - radius * 2) / 2);

    // Etiqueta P1..P4
    this.label = scene.add.text(x, y - 28, `P${slot.index + 1}`, {
      fontFamily: '"Fredoka", "Trebuchet MS", sans-serif',
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(12);

    // Indicador visual de dirección (punto frontal)
    this.pointerIndicator = scene.add.circle(x, y + 20, 4, 0xffffff).setDepth(11);

    // Indicador visual de cooldown de dash (pequeña barra bajo los pies)
    this.cooldownBar = scene.add.graphics().setDepth(11);

    // Icono flotante de ítem transportado
    this.carriedIcon = scene.add.image(x, y - 24, 'item-gasas')
      .setScale(0.85)
      .setDepth(13)
      .setVisible(false);
  }

  /**
   * Recoge un ítem si las manos están vacías. Devuelve true si se recogió.
   */
  public pickUp(item: Item): boolean {
    if (this.carriedItem !== null) return false;
    this.carriedItem = item;

    // Si el ítem es pesado (p. ej. desfibrilador), reduce velocidad
    if (item.definition.isHeavy) {
      this.speedMultiplier = 0.7;
    } else {
      this.speedMultiplier = 1.0;
    }

    // Actualizar icono visual
    const tex = item.textureKey;
    if (this.scene.textures.exists(tex)) {
      this.carriedIcon.setTexture(tex);
    }
    this.carriedIcon.setVisible(true);
    return true;
  }

  /**
   * Suelta o entrega el ítem que lleva el jugador.
   */
  public drop(): Item | null {
    if (!this.carriedItem) return null;
    const item = this.carriedItem;
    this.carriedItem = null;
    this.speedMultiplier = 1.0;
    this.carriedIcon.setVisible(false);
    return item;
  }

  public hasItem(): boolean {
    return this.carriedItem !== null;
  }

  /**
   * Actualiza el movimiento, dash y la orientación a partir del frame de entrada.
   */
  public updatePlayer(input: InputFrame, delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    const deltaSec = delta / 1000;

    // Actualizar temporizadores de Dash
    if (this.dashCooldown > 0) {
      this.dashCooldown = Math.max(0, this.dashCooldown - deltaSec);
    }
    if (this.dashTimer > 0) {
      this.dashTimer = Math.max(0, this.dashTimer - deltaSec);
    }

    const moveX = input.moveX;
    const moveY = input.moveY;

    // Determinar dirección cardinal frontal si hay movimiento
    if (Math.abs(moveX) > 0.1 || Math.abs(moveY) > 0.1) {
      if (Math.abs(moveX) >= Math.abs(moveY)) {
        this.facing = moveX > 0
          ? { x: 1, y: 0, dir: 'right' }
          : { x: -1, y: 0, dir: 'left' };
      } else {
        this.facing = moveY > 0
          ? { x: 0, y: 1, dir: 'down' }
          : { x: 0, y: -1, dir: 'up' };
      }
    }

    // Iniciar Dash si se pulsa el botón y no está en cooldown
    if (input.dashPressed && this.canDash && this.dashCooldown <= 0) {
      this.dashTimer = DASH_DURATION_SEC;
      this.dashCooldown = DASH_COOLDOWN_SEC;

      const len = Math.hypot(moveX, moveY);
      if (len > 0.1) {
        this.dashVector = { x: moveX / len, y: moveY / len };
      } else {
        this.dashVector = { x: this.facing.x, y: this.facing.y };
      }

      // Efecto visual flash de dash
      this.setAlpha(0.6);
      this.scene.time.delayedCall(DASH_DURATION_SEC * 1000, () => {
        if (this.active) this.setAlpha(1);
      });
    }

    // Aplicar velocidad física
    if (this.dashTimer > 0) {
      const dashSpeed = PLAYER_SPEED * DASH_SPEED_MULTIPLIER * this.speedMultiplier;
      body.setVelocity(this.dashVector.x * dashSpeed, this.dashVector.y * dashSpeed);
    } else {
      const len = Math.hypot(moveX, moveY);
      if (len > 0.05) {
        const currentSpeed = PLAYER_SPEED * this.speedMultiplier;
        const vx = (moveX / Math.max(1, len)) * currentSpeed;
        const vy = (moveY / Math.max(1, len)) * currentSpeed;
        body.setVelocity(vx, vy);
      } else {
        body.setVelocity(0, 0);
      }
    }

    // Clamp vertical para no entrar a la zona de HUD
    if (this.y < HUD_HEIGHT + TILE_SIZE / 2) {
      this.y = HUD_HEIGHT + TILE_SIZE / 2;
    }
    if (this.y > GAME_HEIGHT - TILE_SIZE / 2) {
      this.y = GAME_HEIGHT - TILE_SIZE / 2;
    }
    if (this.x < TILE_SIZE / 2) {
      this.x = TILE_SIZE / 2;
    }
    if (this.x > GAME_WIDTH - TILE_SIZE / 2) {
      this.x = GAME_WIDTH - TILE_SIZE / 2;
    }

    // Actualizar posición de la etiqueta, el indicador frontal y el icono transportado
    this.label.setPosition(this.x, this.carriedItem ? this.y - 36 : this.y - 28);
    this.pointerIndicator.setPosition(
      this.x + this.facing.x * 20,
      this.y + this.facing.y * 20
    );
    if (this.carriedItem) {
      this.carriedIcon.setPosition(this.x, this.y - 20);
    }

    // Dibujar indicador visual de cooldown del dash
    this.renderCooldownBar();
  }

  private renderCooldownBar(): void {
    this.cooldownBar.clear();
    if (this.dashCooldown > 0) {
      const barW = 28;
      const barH = 4;
      const barX = this.x - barW / 2;
      const barY = this.y + 24;

      // Fondo oscuro
      this.cooldownBar.fillStyle(0x000000, 0.6);
      this.cooldownBar.fillRect(barX, barY, barW, barH);

      // Progreso
      const progress = 1 - this.dashCooldown / DASH_COOLDOWN_SEC;
      this.cooldownBar.fillStyle(0x2ec4b6, 0.9);
      this.cooldownBar.fillRect(barX, barY, barW * progress, barH);
    }
  }

  public override destroy(fromScene?: boolean): void {
    this.label.destroy();
    this.pointerIndicator.destroy();
    this.cooldownBar.destroy();
    this.carriedIcon.destroy();
    super.destroy(fromScene);
  }
}
