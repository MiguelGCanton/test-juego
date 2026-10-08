import type { GridPos } from '../levels/LevelLoader';
import type { Interactable, InteractionContext } from './Interactable';
import { Item } from '../items/Item';
import { ProgressTimer } from '../core/ProgressTimer';
import {
  AUTOCLAVE_CONTAMINATION_TIME_SEC,
  AUTOCLAVE_PROCESS_TIME_SEC,
} from '../config/constants';

export type AutoclaveState = 'vacio' | 'esterilizando' | 'listo' | 'contaminado';

/**
 * Autoclave 'A' para la esterilización de instrumental (MEC-04 / T-25).
 * - Acepta 'instrumental_mojado'.
 * - Esteriliza automáticamente durante 8 segundos -> 'instrumental_limpio'.
 * - Si no se recoge en 20 segundos -> se contamina y vuelve a 'instrumental_sucio'.
 */
export class Autoclave implements Interactable {
  public readonly cell: GridPos;
  public readonly type = 'A';
  public storedItem: Item | null = null;
  public state: AutoclaveState = 'vacio';

  public readonly processTimer = new ProgressTimer(AUTOCLAVE_PROCESS_TIME_SEC);
  public readonly contaminationTimer = new ProgressTimer(AUTOCLAVE_CONTAMINATION_TIME_SEC);

  private onCompleteCallback?: () => void;
  private onContaminateCallback?: () => void;

  constructor(
    cell: GridPos,
    onComplete?: () => void,
    onContaminate?: () => void
  ) {
    this.cell = cell;
    this.onCompleteCallback = onComplete;
    this.onContaminateCallback = onContaminate;
  }

  public get progress(): number {
    if (this.state === 'esterilizando') {
      return this.processTimer.progress;
    }
    return 0;
  }

  public get contaminationProgress(): number {
    if (this.state === 'listo') {
      return this.contaminationTimer.progress;
    }
    return 0;
  }

  public get isSterilizing(): boolean {
    return this.state === 'esterilizando';
  }

  public placeItem(item: Item): boolean {
    if (this.storedItem !== null) return false;
    if (item.type !== 'instrumental_mojado') return false;

    this.storedItem = item;
    this.state = 'esterilizando';
    this.processTimer.reset();
    this.contaminationTimer.reset();
    return true;
  }

  public takeItem(): Item | null {
    if (!this.storedItem) return null;
    const item = this.storedItem;
    this.storedItem = null;
    this.state = 'vacio';
    this.processTimer.reset();
    this.contaminationTimer.reset();
    return item;
  }

  public update(deltaSec: number): void {
    if (this.state === 'esterilizando') {
      const completed = this.processTimer.advance(deltaSec);
      if (completed) {
        this.storedItem = new Item('instrumental_limpio');
        this.state = 'listo';
        this.contaminationTimer.reset();
        if (this.onCompleteCallback) {
          this.onCompleteCallback();
        }
      }
    } else if (this.state === 'listo') {
      const contaminated = this.contaminationTimer.advance(deltaSec);
      if (contaminated) {
        this.storedItem = new Item('instrumental_sucio');
        this.state = 'contaminado';
        if (this.onContaminateCallback) {
          this.onContaminateCallback();
        }
      }
    }
  }

  public onGrab(ctx: InteractionContext): boolean {
    // Si el jugador lleva las manos vacías y el autoclave tiene un ítem, lo recoge
    if (!ctx.player.hasItem() && this.storedItem) {
      const item = this.takeItem();
      if (item) {
        ctx.player.pickUp(item);
        return true;
      }
      return false;
    }

    // Si el jugador lleva instrumental mojado y el autoclave está vacío, lo deposita
    if (ctx.player.carriedItem?.type === 'instrumental_mojado' && this.storedItem === null) {
      const item = ctx.player.drop();
      if (item) {
        return this.placeItem(item);
      }
    }
    return false;
  }

  public canInteract(ctx: InteractionContext): boolean {
    if (this.storedItem !== null && !ctx.player.hasItem()) return true;
    if (this.storedItem === null && ctx.player.carriedItem?.type === 'instrumental_mojado') return true;
    return false;
  }
}
