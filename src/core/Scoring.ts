import type { Patient } from '../patients/Patient';

export const PATIENT_LOST_PENALTY = 50;

/**
 * Calcula los puntos otorgados por dar de alta a un paciente según su dolencia y paciencia restante.
 * Fórmula (MEC-01): puntosBase * (1 + 0.5 * ratioPaciencia), redondeado a decenas.
 */
export function calculateDischargePoints(patient: Patient): number {
  const base = patient.ailment.baseScore;
  const multiplier = 1 + 0.5 * patient.patienceRatio;
  return Math.round((base * multiplier) / 10) * 10;
}

/**
 * Calcula el número de estrellas obtenidas (0..3) en base a los umbrales del nivel.
 */
export function calculateStars(
  score: number,
  thresholds: readonly [number, number, number]
): number {
  if (score >= thresholds[2]) return 3;
  if (score >= thresholds[1]) return 2;
  if (score >= thresholds[0]) return 1;
  return 0;
}

/**
 * Gestor de puntuación y estadísticas de una partida.
 * Lógica pura sin dependencias de Phaser.
 */
export class ScoreTracker {
  public score = 0;
  public dischargedCount = 0;
  public lostCount = 0;

  public addDischarge(patient: Patient): number {
    const points = calculateDischargePoints(patient);
    this.score += points;
    this.dischargedCount++;
    return points;
  }

  public addPatientLost(): number {
    this.score = Math.max(0, this.score - PATIENT_LOST_PENALTY);
    this.lostCount++;
    return -PATIENT_LOST_PENALTY;
  }

  public addPoints(delta: number): number {
    this.score = Math.max(0, this.score + delta);
    return this.score;
  }

  public getStars(thresholds: readonly [number, number, number]): number {
    return calculateStars(this.score, thresholds);
  }

  public reset(): void {
    this.score = 0;
    this.dischargedCount = 0;
    this.lostCount = 0;
  }
}
