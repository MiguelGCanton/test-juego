import type { GridPos } from '../levels/LevelLoader';
import type { Interactable, InteractionContext } from './Interactable';
import { ProgressTimer } from '../core/ProgressTimer';
import { SLIP_DURATION_SEC, SPILL_CLEAN_TIME_SEC } from '../config/constants';
import type { Player } from '../players/Player';

/**
 * Charco de derrame (MEC-05 / T-28).
 * - Quien lo pise (sin dash) resbala durante 0.6 s y suelta su ítem.
 * - Limpieza: portar 'mopa' y mantener 'use' durante 2.0 s.
 */
export class Spill implements Interactable {
  public readonly cell: GridPos;
  public readonly type = 'spill';
  public readonly cleanTimer = new ProgressTimer(SPILL_CLEAN_TIME_SEC);
  public isCleaning = false;

  private onCleanCallback?: () => void;

  constructor(cell: GridPos, onClean?: () => void) {
    this.cell = cell;
    this.onCleanCallback = onClean;
  }

  public get progress(): number {
    return this.cleanTimer.progress;
  }

  public checkPlayerSlip(player: Player): boolean {
    return player.slip(SLIP_DURATION_SEC);
  }

  public onUseHold(ctx: InteractionContext, deltaSec: number): void {
    if (ctx.player.carriedItem?.type !== 'mopa') {
      this.isCleaning = false;
      return;
    }

    this.isCleaning = true;
    const completed = this.cleanTimer.advance(deltaSec);

    if (completed) {
      this.isCleaning = false;
      this.cleanTimer.reset();
      if (this.onCleanCallback) {
        this.onCleanCallback();
      }
    }
  }

  public onUseEnd(_ctx: InteractionContext): void {
    this.isCleaning = false;
  }

  public canInteract(ctx: InteractionContext): boolean {
    return ctx.player.carriedItem?.type === 'mopa';
  }
}
