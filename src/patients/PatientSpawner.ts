import { Patient, type AilmentType } from './Patient';
import type { LevelData } from '../levels/types';

/**
 * Generador y gestor de ciclo de vida de pacientes en la sala.
 * Soporta escalado según número de jugadores (T-32) y onboarding de nivel 1 (T-34).
 * Lógica pura sin dependencias de Phaser.
 */
export class PatientSpawner {
  public readonly level: LevelData;
  public readonly activePatients: Patient[] = [];
  public timerSec = 0;
  public nextIntervalSec = 0;
  public elapsedLevelSec = 0;
  public readonly playerCount: number;
  public readonly effectiveMaxPatients: number;
  public readonly effectiveOrderIntervalSec: [number, number];
  private totalSpawned = 0;

  constructor(level: LevelData, playerCount = 2, initialDelaySec = 2) {
    this.level = level;
    this.playerCount = Math.max(1, playerCount);

    // Escalado por número de jugadores (T-32)
    if (this.playerCount === 1) {
      this.effectiveMaxPatients = Math.max(1, level.maxPatients - 1);
      this.effectiveOrderIntervalSec = [level.orderIntervalSec[0], level.orderIntervalSec[1]];
    } else if (this.playerCount >= 3) {
      this.effectiveMaxPatients = level.maxPatients;
      this.effectiveOrderIntervalSec = [
        level.orderIntervalSec[0] * 0.85,
        level.orderIntervalSec[1] * 0.85,
      ];
    } else {
      this.effectiveMaxPatients = level.maxPatients;
      this.effectiveOrderIntervalSec = [level.orderIntervalSec[0], level.orderIntervalSec[1]];
    }

    this.nextIntervalSec = initialDelaySec;
  }

  /**
   * Actualiza el spawner y la paciencia de todos los pacientes activos.
   * Si vence el intervalo y hay cupo, genera un nuevo paciente y lo devuelve.
   */
  public update(deltaSec: number): Patient | null {
    this.elapsedLevelSec += deltaSec;

    // 1. Actualizar pacientes activos
    for (const patient of this.activePatients) {
      patient.update(deltaSec);
    }

    // 2. Comprobar temporizador de spawn
    this.timerSec += deltaSec;
    if (this.timerSec >= this.nextIntervalSec) {
      this.timerSec = 0;
      this.nextIntervalSec = this.calculateNextInterval();

      if (this.activePatients.length < this.effectiveMaxPatients) {
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
   * Selección ponderada de dolencia según LevelData.orders y reglas de Onboarding (T-34).
   */
  public chooseAilment(randomVal = Math.random()): AilmentType {
    // Onboarding de nivel 1: 1er paciente herida, 2do paciente fiebre, fractura solo tras 45s
    if (this.level.id === 'nivel-1') {
      if (this.totalSpawned === 0) return 'herida';
      if (this.totalSpawned === 1) return 'fiebre';
    }

    let orders = this.level.orders;
    if (!orders || orders.length === 0) return 'herida';

    // Nivel 1 onboarding: fractura bloqueada antes de 45 segundos de nivel
    if (this.level.id === 'nivel-1' && this.elapsedLevelSec < 45) {
      orders = orders.filter((o) => o.recipeId !== 'fractura');
    }

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
    const [min, max] = this.effectiveOrderIntervalSec;
    return min + Math.random() * (max - min);
  }
}
