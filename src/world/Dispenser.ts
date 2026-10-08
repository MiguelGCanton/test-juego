import type { GridPos } from '../levels/LevelLoader';
import type { Interactable, InteractionContext } from './Interactable';
import { Item } from '../items/Item';
import type { ItemType } from '../items/ItemType';

export interface DispenserConfig {
  type: string;
  itemType: ItemType;
  /** Si tiene ítems alternativos (p. ej. Armario M con sábanas y mopa) */
  alternateItemTypes?: ItemType[];
}

export const DISPENSER_CONFIGS: Record<string, DispenserConfig> = {
  G: { type: 'G', itemType: 'gasas' },
  P: { type: 'P', itemType: 'vial' },
  N: { type: 'N', itemType: 'anestesia' },
  M: { type: 'M', itemType: 'sabanas', alternateItemTypes: ['sabanas', 'mopa'] },
};

/**
 * Estación dispensadora de suministros infinitos.
 */
export class Dispenser implements Interactable {
  public readonly cell: GridPos;
  public readonly type: string;
  private currentItemType: ItemType;
  private alternateItemTypes?: ItemType[];
  private alternateIndex = 0;

  constructor(cell: GridPos, char: string) {
    this.cell = cell;
    this.type = char;
    const config = DISPENSER_CONFIGS[char] ?? { type: char, itemType: 'gasas' as ItemType };
    this.currentItemType = config.itemType;
    this.alternateItemTypes = config.alternateItemTypes;
  }

  public get selectedItemType(): ItemType {
    return this.currentItemType;
  }

  public onGrab(ctx: InteractionContext): boolean {
    if (ctx.player.hasItem()) return false;
    const item = new Item(this.currentItemType);
    return ctx.player.pickUp(item);
  }

  public onUseStart(_ctx: InteractionContext): void {
    // Si tiene modos alternativos, cambia de ítem al pulsar Usar
    if (this.alternateItemTypes && this.alternateItemTypes.length > 1) {
      this.alternateIndex = (this.alternateIndex + 1) % this.alternateItemTypes.length;
      this.currentItemType = this.alternateItemTypes[this.alternateIndex];
    }
  }

  public canInteract(ctx: InteractionContext): boolean {
    return !ctx.player.hasItem() || (this.alternateItemTypes !== undefined && this.alternateItemTypes.length > 1);
  }
}
