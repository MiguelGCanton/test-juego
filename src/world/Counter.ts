import type { GridPos } from '../levels/LevelLoader';
import type { Interactable, InteractionContext } from './Interactable';
import type { Item } from '../items/Item';

/**
 * Encimera 'C' que permite depositar o recoger un ítem.
 * Base para superficies de apoyo y estaciones de procesado.
 */
export class Counter implements Interactable {
  public readonly cell: GridPos;
  public readonly type: string;
  public storedItem: Item | null = null;

  constructor(cell: GridPos, type = 'C') {
    this.cell = cell;
    this.type = type;
  }

  public hasItem(): boolean {
    return this.storedItem !== null;
  }

  public placeItem(item: Item): boolean {
    if (this.storedItem !== null) return false;
    this.storedItem = item;
    return true;
  }

  public takeItem(): Item | null {
    const item = this.storedItem;
    this.storedItem = null;
    return item;
  }

  public onGrab(ctx: InteractionContext): boolean {
    // 1. Si el jugador lleva un ítem y la encimera está libre: dejarlo
    if (ctx.player.hasItem() && !this.hasItem()) {
      const dropped = ctx.player.drop();
      if (dropped) {
        this.placeItem(dropped);
        return true;
      }
      return false;
    }

    // 2. Si el jugador tiene manos libres y la encimera tiene un ítem: recogerlo
    if (!ctx.player.hasItem() && this.hasItem()) {
      const item = this.takeItem();
      if (item) {
        return ctx.player.pickUp(item);
      }
      return false;
    }

    return false;
  }

  public canInteract(ctx: InteractionContext): boolean {
    return (ctx.player.hasItem() && !this.hasItem()) || (!ctx.player.hasItem() && this.hasItem());
  }
}
