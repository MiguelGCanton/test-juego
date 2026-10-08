import { describe, it, expect } from 'vitest';
import { Counter } from './Counter';
import { Item } from '../items/Item';

describe('Counter (Encimera C)', () => {
  it('permite a un jugador depositar un ítem', () => {
    const counter = new Counter({ col: 3, row: 3 });
    let playerItem: Item | null = new Item('gasas');
    const fakePlayer = {
      hasItem: () => playerItem !== null,
      drop: () => {
        const it = playerItem;
        playerItem = null;
        return it;
      },
      pickUp: (it: Item) => {
        playerItem = it;
        return true;
      },
    };

    const deposited = counter.onGrab({ player: fakePlayer as any, cell: { col: 3, row: 3 } });
    expect(deposited).toBe(true);
    expect(counter.hasItem()).toBe(true);
    expect(counter.storedItem?.type).toBe('gasas');
    expect(playerItem).toBeNull();
  });

  it('permite a un jugador con manos vacías recoger el ítem depositado', () => {
    const counter = new Counter({ col: 3, row: 3 });
    counter.placeItem(new Item('vial'));

    let playerItem: Item | null = null;
    const fakePlayer = {
      hasItem: () => playerItem !== null,
      drop: () => null,
      pickUp: (it: Item) => {
        playerItem = it;
        return true;
      },
    };

    const taken = counter.onGrab({ player: fakePlayer as any, cell: { col: 3, row: 3 } });
    expect(taken).toBe(true);
    expect(counter.hasItem()).toBe(false);
    expect((playerItem as unknown as Item)?.type).toBe('vial');
  });

  it('no permite dejar un ítem si ya contiene otro', () => {
    const counter = new Counter({ col: 3, row: 3 });
    counter.placeItem(new Item('vial'));

    const fakePlayer = {
      hasItem: () => true,
      drop: () => new Item('gasas'),
      pickUp: () => false,
    };

    const result = counter.onGrab({ player: fakePlayer as any, cell: { col: 3, row: 3 } });
    expect(result).toBe(false);
    expect(counter.storedItem?.type).toBe('vial');
  });
});
