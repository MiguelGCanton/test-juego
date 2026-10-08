import { Patient, type AilmentType } from './Patient';
import type { LevelData } from '../levels/types';

/**
 * Generador y gestor de ciclo de vida de pacientes en la sala.
 * Lógica pura sin dependencias de Phaser.
 */
export class PatientSpawner {
  public readonly level: LevelData;
  public readonly activePatients: Patient[] = [];
  public timerSec = 0;
  public nextIntervalSec = 0;
  private totalSpawned = 0;

  constructor(level: LevelData, initialDelaySec = 2) {
    this.level = level;
    this.nextIntervalSec = initialDelaySec;
  }

  /**
   * Actualiza el spawner y la paciencia de todos los pacientes activos.
   * Si vence el intervalo y hay cupo, genera un nuevo paciente y lo devuelve.
   */
  public update(deltaSec: number): Patient | null {
    // 1. Actualizar pacientes activos
    for (const patient of this.activePatients) {
      patient.update(deltaSec);
    }

    // 2. Comprobar temporizador de spawn
    this.timerSec += deltaSec;
    if (this.timerSec >= this.nextIntervalSec) {
      this.timerSec = 0;
      this.nextIntervalSec = this.calculateNextInterval();

      if (this.activePatients.length < this.level.maxPatients) {
        const ailment = this.chooseAilment();
        const patient = new Patient(ailment);
        this.activePatients.push(patient);
        this.totalSpawned++;
        return patient;
      }
    }

    return null;
  }

  /**
   * Elimina un paciente de la lista de activos (tras alta o pérdida).
   */
  public removePatient(patientId: string): boolean {
    const idx = this.activePatients.findIndex((p) => p.id === patientId);
    if (idx >= 0) {
      this.activePatients.splice(idx, 1);
      return true;
    }
    return false;
  }

  public get count(): number {
    return this.activePatients.length;
  }

  public get totalCount(): number {
    return this.totalSpawned;
  }

  /**
   * Selección ponderada de dolencia según LevelData.orders.
   */
  public chooseAilment(randomVal = Math.random()): AilmentType {
    const orders = this.level.orders;
    if (!orders || orders.length === 0) return 'herida';

    const totalWeight = orders.reduce((sum, o) => sum + o.weight, 0);
    let cumulative = 0;
    const target = randomVal * totalWeight;

    for (const order of orders) {
      cumulative += order.weight;
      if (target <= cumulative) {
        return order.recipeId as AilmentType;
      }
    }

    return (orders[0]?.recipeId ?? 'herida') as AilmentType;
  }

  private calculateNextInterval(): number {
    const [min, max] = this.level.orderIntervalSec;
    return min + Math.random() * (max - min);
  }
}
