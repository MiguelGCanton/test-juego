import { ProgressTimer } from '../core/ProgressTimer';
import {
  CODE_BLUE_FAIL_PENALTY,
  CODE_BLUE_SUCCESS_POINTS,
  CODE_BLUE_TIMEOUT_SEC,
  CODE_BLUE_TREAT_TIME_SEC,
} from '../config/constants';
import type { Bed } from '../world/Bed';

export type CodeBlueStatus = 'inactivo' | 'activo' | 'exito' | 'fallo';

/**
 * Gestor del evento de emergencia Código Azul (MEC-05 / T-30).
 * - Temporizador límite de 25 segundos para salvar al paciente en cama.
 * - Requiere ítem 'desfibrilador' + uso conjunto (2 jugadores en multijugador, 1 en solitario) durante 2.0 s.
 * - Éxito: +200 pts.
 * - Fallo: -150 pts y paciente perdido.
 */
export class CodeBlueManager {
  public status: CodeBlueStatus = 'inactivo';
  public targetBed: Bed | null = null;

  public readonly timeoutTimer = new ProgressTimer(CODE_BLUE_TIMEOUT_SEC);
  public readonly treatTimer = new ProgressTimer(CODE_BLUE_TREAT_TIME_SEC);
  public participatingPlayerIds = new Set<string>();
  public hasDefibrillatorPresent = false;

  private onResolutionCallback?: (success: boolean, pointsDelta: number) => void;

  constructor(onResolution?: (success: boolean, pointsDelta: number) => void) {
    this.onResolutionCallback = onResolution;
  }

  public get isCodeBlueActive(): boolean {
    return this.status === 'activo';
  }

  public get remainingTimeSec(): number {
    return Math.max(0, CODE_BLUE_TIMEOUT_SEC - this.timeoutTimer.elapsedSec);
  }

  public get treatmentProgress(): number {
    return this.treatTimer.progress;
  }

  public start(bed: Bed): boolean {
    if (this.status === 'activo' || !bed.isOccupied) return false;

    this.status = 'activo';
    this.targetBed = bed;
    this.timeoutTimer.reset();
    this.treatTimer.reset();
    this.participatingPlayerIds.clear();
    this.hasDefibrillatorPresent = false;
    return true;
  }

  public update(deltaSec: number, totalPlayersInGame: number): CodeBlueStatus {
    if (this.status !== 'activo' || !this.targetBed) return this.status;

    // 1. Cuenta atrás del límite de tiempo (25 s)
    const timedOut = this.timeoutTimer.advance(deltaSec);
    if (timedOut) {
      return this.resolve(false);
    }

    // 2. Avance del tratamiento coordinado
    const requiredPlayers = totalPlayersInGame > 1 ? 2 : 1;
    if (this.hasDefibrillatorPresent && this.participatingPlayerIds.size >= requiredPlayers) {
      const completed = this.treatTimer.advance(deltaSec);
      if (completed) {
        return this.resolve(true);
      }
    }

    return this.status;
  }

  public setDefibrillatorPresent(present: boolean): void {
    this.hasDefibrillatorPresent = present;
  }

  public addParticipant(playerId: string): void {
    this.participatingPlayerIds.add(playerId);
  }

  public removeParticipant(playerId: string): void {
    this.participatingPlayerIds.delete(playerId);
  }

  public resolve(success: boolean): CodeBlueStatus {
    if (this.status !== 'activo') return this.status;

    this.status = success ? 'exito' : 'fallo';
    const pointsDelta = success ? CODE_BLUE_SUCCESS_POINTS : -CODE_BLUE_FAIL_PENALTY;

    if (!success && this.targetBed?.patient) {
      this.targetBed.patient.state = 'Perdido';
      this.targetBed.releasePatient(false);
    }

    if (this.onResolutionCallback) {
      this.onResolutionCallback(success, pointsDelta);
    }

    this.targetBed = null;
    this.participatingPlayerIds.clear();
    this.hasDefibrillatorPresent = false;
    return this.status;
  }
}
