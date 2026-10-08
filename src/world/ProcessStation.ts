import type { GridPos } from '../levels/LevelLoader';
import type { Interactable, InteractionContext } from './Interactable';
import { Counter } from './Counter';
import { Item } from '../items/Item';
import type { ItemType } from '../items/ItemType';
import { ProgressTimer } from '../core/ProgressTimer';

export interface ProcessConfig {
  input: ItemType;
  output: ItemType;
  durationSec: number;
}

export const PROCESS_STATION_CONFIGS: Record<string, ProcessConfig> = {
  K: { input: 'gasas', output: 'venda', durationSec: 3 },
  J: { input: 'vial', output: 'jeringa', durationSec: 2 },
  L: { input: 'instrumental_sucio', output: 'instrumental_mojado', durationSec: 3 },
};

/**
 * Estación de procesamiento de suministros mediante pulsación mantenida de Usar.
 */
export class ProcessStation extends Counter implements Interactable {
  public readonly config: ProcessConfig;
  public timer: ProgressTimer;
  public isProcessing = false;
  public onComplete?: () => void;

  constructor(cell: GridPos, char: string, customConfig?: ProcessConfig, onComplete?: () => void) {
    super(cell, char);
    this.config = customConfig ?? PROCESS_STATION_CONFIGS[char] ?? {
      input: 'gasas',
      output: 'venda',
      durationSec: 3,
    };
    this.timer = new ProgressTimer(this.config.durationSec);
    this.onComplete = onComplete;
  }

  public override placeItem(item: Item): boolean {
    const placed = super.placeItem(item);
    if (placed) {
      this.timer.reset();
    }
    return placed;
  }

  public override takeItem(): Item | null {
    const item = super.takeItem();
    if (item) {
      this.timer.reset();
      this.isProcessing = false;
    }
    return item;
  }

  public onUseHold(_ctx: InteractionContext, deltaSec: number): void {
    if (!this.storedItem || this.storedItem.type !== this.config.input) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const completed = this.timer.advance(deltaSec);

    if (completed) {
      // Transformar el ítem al output
      this.storedItem = new Item(this.config.output);
      this.isProcessing = false;
      this.onComplete?.();
    }
  }

  public onUseEnd(_ctx: InteractionContext): void {
    this.isProcessing = false;
  }

  public override canInteract(ctx: InteractionContext): boolean {
    if (super.canInteract(ctx)) return true;
    // Si tiene el ítem de entrada depositado, se puede interactuar con 'use'
    return this.storedItem?.type === this.config.input;
  }
}
