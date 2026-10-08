import type { GridPos } from '../levels/LevelLoader';
import type { Interactable, InteractionContext } from './Interactable';
import { ProgressTimer } from '../core/ProgressTimer';
import {
  BLACKOUT_MAX_DURATION_SEC,
  PANEL_FIX_TIME_SEC,
} from '../config/constants';

/**
 * Cuadro Eléctrico 'U' para resolver apagones (MEC-05 / T-29).
 * - En apagón: estaciones de proceso se desactivan y la pantalla se oscurece.
 * - Resolución: mantener 'use' 3.0 s en U (o auto-resolución tras 25 s).
 */
export class ElectricPanel implements Interactable {
  public readonly cell: GridPos;
  public readonly type = 'U';

  public isBlackoutActive = false;
  public readonly fixTimer = new ProgressTimer(PANEL_FIX_TIME_SEC);
  public readonly autoTimer = new ProgressTimer(BLACKOUT_MAX_DURATION_SEC);
  public isFixing = false;

  private onRestoreCallback?: () => void;

  constructor(cell: GridPos, onRestore?: () => void) {
    this.cell = cell;
    this.onRestoreCallback = onRestore;
  }

  public get progress(): number {
    return this.fixTimer.progress;
  }

  public triggerBlackout(): void {
    this.isBlackoutActive = true;
    this.fixTimer.reset();
    this.autoTimer.reset();
    this.isFixing = false;
  }

  public restorePower(): void {
    if (!this.isBlackoutActive) return;
    this.isBlackoutActive = false;
    this.fixTimer.reset();
    this.autoTimer.reset();
    this.isFixing = false;
    if (this.onRestoreCallback) {
      this.onRestoreCallback();
    }
  }

  public update(deltaSec: number): void {
    if (!this.isBlackoutActive) return;

    // Temporizador de auto-resolución (25 s)
    const autoResolved = this.autoTimer.advance(deltaSec);
    if (autoResolved) {
      this.restorePower();
    }
  }

  public onUseHold(_ctx: InteractionContext, deltaSec: number): void {
    if (!this.isBlackoutActive) {
      this.isFixing = false;
      return;
    }

    this.isFixing = true;
    const completed = this.fixTimer.advance(deltaSec);
    if (completed) {
      this.restorePower();
    }
  }

  public onUseEnd(_ctx: InteractionContext): void {
    this.isFixing = false;
  }

  public canInteract(_ctx: InteractionContext): boolean {
    return this.isBlackoutActive;
  }
}
