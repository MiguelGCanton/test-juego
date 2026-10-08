import { describe, it, expect } from 'vitest';
import { Dispenser } from './Dispenser';
import { Item } from '../items/Item';

describe('Dispenser', () => {
  it('dispensa gasas desde G cuando el jugador tiene manos libres', () => {
    const dispenser = new Dispenser({ col: 5, row: 1 }, 'G');
    let carried: Item | null = null;
    const fakePlayer = {
      hasItem: () => carried !== null,
      pickUp: (item: Item) => {
        carried = item;
        return true;
      },
    };

    const success = dispenser.onGrab({ player: fakePlayer as any, cell: { col: 5, row: 1 } });
    expect(success).toBe(true);
    expect(carried).not.toBeNull();
    expect((carried as unknown as Item)?.type).toBe('gasas');
  });

  it('no dispensa si el jugador ya lleva un ítem', () => {
    const dispenser = new Dispenser({ col: 5, row: 1 }, 'P');
    const fakePlayer = {
      hasItem: () => true,
      pickUp: () => false,
    };

    const success = dispenser.onGrab({ player: fakePlayer as any, cell: { col: 5, row: 1 } });
    expect(success).toBe(false);
  });

  it('armario M alterna entre sábanas y mopa al pulsar usar', () => {
    const closet = new Dispenser({ col: 1, row: 8 }, 'M');
    expect(closet.selectedItemType).toBe('sabanas');

    closet.onUseStart({ player: {} as any, cell: { col: 1, row: 8 } });
    expect(closet.selectedItemType).toBe('mopa');

    closet.onUseStart({ player: {} as any, cell: { col: 1, row: 8 } });
    expect(closet.selectedItemType).toBe('sabanas');
  });
});
