import Phaser from 'phaser';
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  HUD_HEIGHT,
  PLAYER_COLORS,
  STRETCHER_SPEED,
  STRETCHER_TRANSFER_TIME_SEC,
  TILE_SIZE,
} from '../config/constants';
import type { InputFrame } from '../input/types';
import type { GridPos } from '../levels/LevelLoader';
import { cellToWorld } from '../levels/LevelLoader';
import type { Patient } from '../patients/Patient';
import type { Player } from '../players/Player';
import type { Bed } from './Bed';
import { ProgressTimer } from '../core/ProgressTimer';
import {
  calculateStretcherVelocity,
  canLoadPatientOnStretcher,
  canUnloadPatientToBed,
} from './StretcherLogic';

/**
 * Entidad física y visual de la Camilla (MEC-03 / T-21 / T-22).
 * Ocupa 2x1 celdas y permite el empuje cooperativo de hasta 2 jugadores.
 */
export class Stretcher extends Phaser.GameObjects.Container {
  public patient: Patient | null = null;
  public attachedPlayerIds = new Set<string>();

  // Temporizador de carga y descarga (1 s)
  public transferTimer = new ProgressTimer(STRETCHER_TRANSFER_TIME_SEC);
  public isTransferring = false;

  private readonly bgImage: Phaser.GameObjects.Image;
  private readonly patientSprite: Phaser.GameObjects.Sprite;
  private readonly patienceBar: Phaser.GameObjects.Graphics;
  private readonly transferBar: Phaser.GameObjects.Graphics;
  private readonly pusherBadgeGraphics: Phaser.GameObjects.Graphics;
  private readonly ailmentLabel: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // 1. Imagen base de la camilla
    this.bgImage = scene.add.image(0, 0, 'stretcher-body');
    this.add(this.bgImage);

    // 2. Sprite de paciente tumbado
    this.patientSprite = scene.add.sprite(8, -2, 'patient-grave')
      .setScale(0.85)
      .setVisible(false);
    this.add(this.patientSprite);

    // 3. Etiqueta de dolencia
    this.ailmentLabel = scene.add.text(0, -36, '', {
      fontFamily: '"Fredoka", "Trebuchet MS", sans-serif',
      fontSize: '11px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setVisible(false);
    this.add(this.ailmentLabel);

    // 4. Barra de paciencia del paciente en camilla
    this.patienceBar = scene.add.graphics();
    this.add(this.patienceBar);

    // 5. Barra de progreso de carga/descarga
    this.transferBar = scene.add.graphics();
    this.add(this.transferBar);

    // 6. Indicadores de jugadores enganchados
    this.pusherBadgeGraphics = scene.add.graphics();
    this.add(this.pusherBadgeGraphics);

    scene.add.existing(this);
    scene.physics.world.enable(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(104, 44);
    body.setOffset(-52, -22);
    body.setCollideWorldBounds(true);

    this.setDepth(9);
  }

  public get isOccupied(): boolean {
    return this.patient !== null;
  }

  public get attachedCount(): number {
    return this.attachedPlayerIds.size;
  }

  public isAttached(player: Player): boolean {
    return this.attachedPlayerIds.has(player.slot.deviceId);
  }

  public attachPlayer(player: Player): boolean {
    if (this.attachedPlayerIds.has(player.slot.deviceId)) {
      return false;
    }
    if (this.attachedPlayerIds.size >= 2) {
      return false;
    }

    this.attachedPlayerIds.add(player.slot.deviceId);
    player.canDash = false;
    return true;
  }

  public detachPlayer(player: Player): boolean {
    if (!this.attachedPlayerIds.has(player.slot.deviceId)) {
      return false;
    }

    this.attachedPlayerIds.delete(player.slot.deviceId);
    player.canDash = true;
    return true;
  }

  public toggleAttachPlayer(player: Player): boolean {
    if (this.isAttached(player)) {
      return this.detachPlayer(player);
    }
    return this.attachPlayer(player);
  }

  public isAdjacentToCell(cell: GridPos, maxDist = 90): boolean {
    const worldPos = cellToWorld(cell.col, cell.row);
    return Math.hypot(this.x - worldPos.x, this.y - worldPos.y) <= maxDist;
  }

  public isAdjacentToWorld(wx: number, wy: number, maxDist = 80): boolean {
    return Math.hypot(this.x - wx, this.y - wy) <= maxDist;
  }

  public loadPatient(patient: Patient): boolean {
    if (!canLoadPatientOnStretcher(this.patient, patient)) {
      return false;
    }

    this.patient = patient;
    patient.loadOntoStretcher();
    this.updatePatientVisuals();
    return true;
  }

  public unloadToBed(bed: Bed): boolean {
    if (!this.patient || !canUnloadPatientToBed(this.patient, bed)) {
      return false;
    }

    const p = this.patient;
    this.patient = null;
    bed.assignPatient(p);
    p.putInBed();
    this.updatePatientVisuals();
    return true;
  }

  public releasePatient(): Patient | null {
    const p = this.patient;
    this.patient = null;
    this.updatePatientVisuals();
    return p;
  }

  private updatePatientVisuals(): void {
    if (this.patient) {
      this.patientSprite.setVisible(true);
      this.ailmentLabel.setText(this.patient.ailment.name).setVisible(true);
    } else {
      this.patientSprite.setVisible(false);
      this.ailmentLabel.setVisible(false);
      this.patienceBar.clear();
    }
  }

  public updateStretcher(
    inputs: Map<string, InputFrame>,
    players: Map<string, Player>,
    totalPlayersInGame: number,
    deltaSec: number
  ): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    // 1. Recopilar entradas de los empujadores enganchados
    const movementInputs: { moveX: number; moveY: number }[] = [];
    const attachedPlayerObjects: Player[] = [];

    for (const deviceId of this.attachedPlayerIds) {
      const player = players.get(deviceId);
      const input = inputs.get(deviceId);
      if (player && input) {
        movementInputs.push({ moveX: input.moveX, moveY: input.moveY });
        attachedPlayerObjects.push(player);
      }
    }

    // 2. Calcular velocidad física resultante
    const { vx, vy } = calculateStretcherVelocity(
      movementInputs,
      totalPlayersInGame,
      STRETCHER_SPEED
    );

    body.setVelocity(vx, vy);

    // 3. Arrastrar a los jugadores enganchados con la camilla
    if (attachedPlayerObjects.length > 0) {
      attachedPlayerObjects.forEach((p, index) => {
        // Asignar posición ergonómica a cada extremo de la camilla
        const offsetX = index === 0 ? -54 : 54;
        const targetX = this.x + offsetX;
        const targetY = this.y;

        // Si la camilla se mueve, arrastra suavemente al jugador
        if (Math.abs(vx) > 0 || Math.abs(vy) > 0) {
          const pBody = p.body as Phaser.Physics.Arcade.Body;
          if (pBody) {
            pBody.setVelocity(vx, vy);
          }
        }

        // Mantener al jugador acoplado si se aleja
        const dist = Math.hypot(p.x - targetX, p.y - targetY);
        if (dist > 60) {
          p.setPosition(
            Phaser.Math.Linear(p.x, targetX, 0.2),
            Phaser.Math.Linear(p.y, targetY, 0.2)
          );
        }
      });
    }

    // 4. Clampear límites de la camilla al área de juego
    if (this.y < HUD_HEIGHT + TILE_SIZE / 2) this.y = HUD_HEIGHT + TILE_SIZE / 2;
    if (this.y > GAME_HEIGHT - TILE_SIZE / 2) this.y = GAME_HEIGHT - TILE_SIZE / 2;
    if (this.x < TILE_SIZE) this.x = TILE_SIZE;
    if (this.x > GAME_WIDTH - TILE_SIZE) this.x = GAME_WIDTH - TILE_SIZE;

    // 5. Actualizar paciencia del paciente
    if (this.patient) {
      this.patient.update(deltaSec);
      this.renderPatienceBar();
    }

    // 6. Renderizar badges de jugadores enganchados
    this.renderPusherBadges(attachedPlayerObjects);
  }

  private renderPatienceBar(): void {
    if (!this.patient) return;

    this.patienceBar.clear();
    const ratio = this.patient.patienceRatio;
    const barW = 60;
    const barH = 5;
    const barX = -barW / 2;
    const barY = -24;

    this.patienceBar.fillStyle(0x000000, 0.7);
    this.patienceBar.fillRect(barX, barY, barW, barH);

    let color = 0x2ecc71;
    if (ratio <= 0.25) {
      color = 0xe74c3c;
    } else if (ratio <= 0.5) {
      color = 0xf39c12;
    }

    this.patienceBar.fillStyle(color, 1);
    this.patienceBar.fillRect(barX, barY, barW * ratio, barH);
  }

  private renderPusherBadges(attachedPlayers: Player[]): void {
    this.pusherBadgeGraphics.clear();

    attachedPlayers.forEach((p, idx) => {
      const color = PLAYER_COLORS[p.slot.index] ?? 0xffffff;
      const posX = idx === 0 ? -42 : 42;
      const posY = 16;

      this.pusherBadgeGraphics.fillStyle(color, 1);
      this.pusherBadgeGraphics.fillCircle(posX, posY, 6);
      this.pusherBadgeGraphics.lineStyle(1, 0xffffff, 1);
      this.pusherBadgeGraphics.strokeCircle(posX, posY, 6);
    });
  }

  public renderTransferProgress(progress: number): void {
    this.transferBar.clear();
    if (progress <= 0 || progress >= 1) return;

    const barW = 70;
    const barH = 6;
    const barX = -barW / 2;
    const barY = 24;

    this.transferBar.fillStyle(0x000000, 0.8);
    this.transferBar.fillRect(barX, barY, barW, barH);

    this.transferBar.fillStyle(0x2ec4b6, 1);
    this.transferBar.fillRect(barX, barY, barW * progress, barH);
  }

  public clearTransferProgress(): void {
    this.transferBar.clear();
  }

  public override destroy(fromScene?: boolean): void {
    this.bgImage.destroy();
    this.patientSprite.destroy();
    this.patienceBar.destroy();
    this.transferBar.destroy();
    this.pusherBadgeGraphics.destroy();
    this.ailmentLabel.destroy();
    super.destroy(fromScene);
  }
}
