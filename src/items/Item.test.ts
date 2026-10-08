import { describe, it, expect } from 'vitest';
import { Item } from './Item';
import { ITEM_DEFINITIONS } from './ItemType';

describe('Item System', () => {
  it('crea ítems con su tipo y textura asociada', () => {
    const gasas = new Item('gasas');
    expect(gasas.type).toBe('gasas');
    expect(gasas.textureKey).toBe('item-gasas');
    expect(gasas.definition.name).toBe('Gasas');
  });

  it('reconoce ítems pesados como el desfibrilador', () => {
    const desfib = new Item('desfibrilador');
    expect(desfib.definition.isHeavy).toBe(true);
    expect(ITEM_DEFINITIONS.gasas.isHeavy).toBeFalsy();
  });

  it('genera ids únicos para distintas instancias', () => {
    const item1 = new Item('vial');
    const item2 = new Item('vial');
    expect(item1.id).not.toBe(item2.id);
  });
});
