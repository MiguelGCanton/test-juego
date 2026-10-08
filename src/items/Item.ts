import { ITEM_DEFINITIONS, type ItemType, type ItemDefinition } from './ItemType';

let nextItemId = 1;

/**
 * Instancia de un ítem transportable o almacenable en encimeras/estaciones.
 */
export class Item {
  public readonly id: string;
  public readonly type: ItemType;

  constructor(type: ItemType, id?: string) {
    this.type = type;
    this.id = id ?? `item-${type}-${nextItemId++}`;
  }

  public get definition(): ItemDefinition {
    return ITEM_DEFINITIONS[this.type];
  }

  public get textureKey(): string {
    return this.definition.textureKey;
  }
}
