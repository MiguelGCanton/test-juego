import type { GridPos } from '../levels/LevelLoader';
import type { Interactable, InteractionContext } from './Interactable';
import { Item } from '../items/Item';
import { ProgressTimer } from '../core/ProgressTimer';
import { DEFIB_CHARGE_TIME_SEC } from '../config/constants';

/**
 * Estación de Desfibrilador 'F' (MEC-05 / T-30).
 * Permite cargar el desfibrilador manteniendo 'use' durante 3.0 segundos.
 * Entrega el ítem pesado 'desfibrilador' (-30% de velocidad).
 */
export class DefibrillatorStation implements Interactable {
  public readonly cell: GridPos;
  public readonly type = 'F';

  public readonly chargeTimer = new ProgressTimer(DEFIB_CHARGE_TIME_SEC);
  public isCharging = false;

  private onChargedCallback?: () => void;

  constructor(cell: GridPos, onCharged?: () => void) {
    this.cell = cell;
    this.onChargedCallback = onCharged;
  }

  public get progress(): number {
    return this.chargeTimer.progress;
  }

  public onUseHold(ctx: InteractionContext, deltaSec: number): void {
    // Solo puede cargar si el jugador tiene las manos libres
    if (ctx.player.hasItem()) {
      this.isCharging = false;
      return;
    }

    this.isCharging = true;
    const completed = this.chargeTimer.advance(deltaSec);

    if (completed) {
      this.isCharging = false;
      this.chargeTimer.reset();
      const defibItem = new Item('desfibrilador');
      ctx.player.pickUp(defibItem);
      if (this.onChargedCallback) {
        this.onChargedCallback();
      }
    }
  }

  public onUseEnd(_ctx: InteractionContext): void {
    this.isCharging = false;
  }

  public canInteract(ctx: InteractionContext): boolean {
    return !ctx.player.hasItem();
  }
}
