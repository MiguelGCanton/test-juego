import {
  STRETCHER_1P_SPEED_FACTOR,
  STRETCHER_2P_1ATTACHED_FACTOR,
  STRETCHER_2P_2ATTACHED_FACTOR,
  STRETCHER_SPEED,
} from '../config/constants';
import type { Patient } from '../patients/Patient';
import type { Bed } from './Bed';

export interface MovementInput {
  moveX: number;
  moveY: number;
}

/**
 * Calcula el multiplicador de velocidad según el número de empujadores y el tamaño de la partida.
 * Reglas MEC-03:
 * - 1 jugador: camilla funciona con 1 jugador al 70% de velocidad.
 * - >=2 jugadores: se necesitan 2 empujadores para 100% de velocidad; con 1 solo empujador avanza al 40%.
 */
export function calculateStretcherSpeedFactor(
  pushersCount: number,
  totalPlayersInGame: number
): number {
  if (pushersCount <= 0) return 0;

  if (totalPlayersInGame <= 1) {
    return STRETCHER_1P_SPEED_FACTOR;
  }

  if (pushersCount >= 2) {
    return STRETCHER_2P_2ATTACHED_FACTOR;
  }

  return STRETCHER_2P_1ATTACHED_FACTOR;
}

/**
 * Calcula el vector de velocidad resultante para la camilla en función de las entradas de los empujadores.
 * El vector resultante es el promedio de los vectores de los empujadores multiplicado por la velocidad base y el factor.
 */
export function calculateStretcherVelocity(
  pushersInput: readonly MovementInput[],
  totalPlayersInGame: number,
  baseSpeed: number = STRETCHER_SPEED
): { vx: number; vy: number; speedFactor: number } {
  if (pushersInput.length === 0) {
    return { vx: 0, vy: 0, speedFactor: 0 };
  }

  const speedFactor = calculateStretcherSpeedFactor(pushersInput.length, totalPlayersInGame);
  if (speedFactor === 0) {
    return { vx: 0, vy: 0, speedFactor: 0 };
  }

  let totalX = 0;
  let totalY = 0;

  for (const input of pushersInput) {
    totalX += input.moveX;
    totalY += input.moveY;
  }

  const avgX = totalX / pushersInput.length;
  const avgY = totalY / pushersInput.length;

  // Si ambos empujan en direcciones opuestas se anulan
  const vx = avgX * baseSpeed * speedFactor;
  const vy = avgY * baseSpeed * speedFactor;

  return { vx, vy, speedFactor };
}

/**
 * Verifica si un paciente puede ser subido a la camilla.
 */
export function canLoadPatientOnStretcher(
  currentPatient: Patient | null,
  candidatePatient: Patient | null
): boolean {
  if (currentPatient !== null || !candidatePatient) return false;
  if (!candidatePatient.isSevere) return false;
  return candidatePatient.state === 'Esperando' || candidatePatient.state === 'Triado';
}

/**
 * Verifica si el paciente de la camilla puede ser transferido a una cama.
 */
export function canUnloadPatientToBed(
  stretcherPatient: Patient | null,
  bed: Bed
): boolean {
  if (!stretcherPatient) return false;
  return bed.isClean;
}

/**
 * Verifica si el paciente de la camilla puede realizarse un escaneo de rayos X.
 */
export function canPerformXRay(stretcherPatient: Patient | null): boolean {
  if (!stretcherPatient) return false;
  return stretcherPatient.ailment.id === 'fractura' && !stretcherPatient.xrayCompleted;
}
