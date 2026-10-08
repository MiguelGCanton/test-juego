import Phaser from 'phaser';
import type { Patient } from './Patient';
import { cellToWorld } from '../levels/LevelLoader';

/**
 * Representación visual de un paciente en el mundo del juego.
 */
export class PatientView extends Phaser.GameObjects.Container {
  public readonly patient: Patient;
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly patienceBar: Phaser.GameObjects.Graphics;
  private readonly stretcherIcon: Phaser.GameObjects.Image;
  private readonly ailmentLabel: Phaser.GameObjects.Text;
  private isWalking = false;

  constructor(scene: Phaser.Scene, x: number, y: number, patient: Patient) {
    super(scene, x, y);
    this.patient = patient;

    // 1. Sprite base según severidad
    const texKey = patient.isSevere ? 'patient-grave' : 'patient-leve';
    this.sprite = scene.add.sprite(0, 0, scene.textures.exists(texKey) ? texKey : 'floor');
    this.add(this.sprite);

    // 2. Barra de paciencia (sobre la cabeza)
    this.patienceBar = scene.add.graphics();
    this.add(this.patienceBar);

    // 3. Icono de camilla (para pacientes graves esperando camilla)
    this.stretcherIcon = scene.add.image(0, -28, 'icon-stretcher')
      .setScale(0.7)
      .setVisible(patient.isSevere && patient.state === 'Triado');
    this.add(this.stretcherIcon);

    // 4. Etiqueta con el nombre de la dolencia
    this.ailmentLabel = scene.add.text(0, 24, patient.ailment.name, {
      fontFamily: '"Fredoka", "Trebuchet MS", sans-serif',
      fontSize: '11px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    this.add(this.ailmentLabel);

    scene.add.existing(this);
    this.setDepth(8);
  }

  public updateView(): void {
    if (this.patient.state === 'EnCamilla') {
      this.setVisible(false);
      return;
    }
    this.setVisible(true);

    if (this.patient.state === 'EnCama' && this.patient.assignedBedCell && !this.isWalking) {
      const pos = cellToWorld(this.patient.assignedBedCell.col, this.patient.assignedBedCell.row);
      this.setPosition(pos.x, pos.y);
    }

    // 1. Actualizar barra de paciencia
    this.patienceBar.clear();
    const ratio = this.patient.patienceRatio;
    const barW = 34;
    const barH = 5;
    const barX = -barW / 2;
    const barY = -24;

    // Fondo
    this.patienceBar.fillStyle(0x000000, 0.7);
    this.patienceBar.fillRect(barX, barY, barW, barH);

    // Color: verde > 50%, amarillo > 25%, rojo <= 25%
    let color = 0x2ecc71;
    if (ratio <= 0.25) {
      color = 0xe74c3c;
    } else if (ratio <= 0.5) {
      color = 0xf39c12;
    }

    this.patienceBar.fillStyle(color, 1);
    this.patienceBar.fillRect(barX, barY, barW * ratio, barH);

    // 2. Icono de camilla para pacientes graves triados
    this.stretcherIcon.setVisible(this.patient.isSevere && this.patient.state === 'Triado');

    // 3. Movimiento autónomo para pacientes leves tras ser triados
    if (
      this.patient.state === 'Triado' &&
      this.patient.canWalkAlone &&
      this.patient.assignedBedCell &&
      !this.isWalking
    ) {
      this.walkToBed();
    }
  }

  private walkToBed(): void {
    if (!this.patient.assignedBedCell) return;
    this.isWalking = true;
    const target = cellToWorld(this.patient.assignedBedCell.col, this.patient.assignedBedCell.row);

    this.scene.tweens.add({
      targets: this,
      x: target.x,
      y: target.y,
      duration: 1600,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.isWalking = false;
        this.patient.putInBed();
      },
    });
  }

  public walkToExit(exitPos: { x: number; y: number }, onDone: () => void): void {
    this.isWalking = true;
    this.scene.tweens.add({
      targets: this,
      x: exitPos.x,
      y: exitPos.y,
      duration: 1500,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        onDone();
        this.destroy();
      },
    });
  }
}
