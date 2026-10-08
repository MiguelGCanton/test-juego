import { describe, it, expect, vi } from 'vitest';
import { Autoclave } from './Autoclave';
import { Item } from '../items/Item';
import type { InteractionContext } from './Interactable';

describe('Autoclave (Estación A)', () => {
  it('solo acepta instrumental_mojado y comienza a esterilizar automáticamente', () => {
    const auto = new Autoclave({ col: 18, row: 5 });
    const wet = new Item('instrumental_mojado');
    const dirty = new Item('instrumental_sucio');

    expect(auto.placeItem(dirty)).toBe(false);
    expect(auto.placeItem(wet)).toBe(true);
    expect(auto.state).toBe('esterilizando');
    expect(auto.isSterilizing).toBe(true);
  });

  it('completa la esterilización tras 8 segundos y genera instrumental_limpio', () => {
    const onComplete = vi.fn();
    const auto = new Autoclave({ col: 18, row: 5 }, onComplete);
    auto.placeItem(new Item('instrumental_mojado'));

    // 4 segundos: 50%
    auto.update(4.0);
    expect(auto.state).toBe('esterilizando');
    expect(auto.progress).toBeCloseTo(0.5);
    expect(onComplete).not.toHaveBeenCalled();

    // 4 segundos más -> listo
    auto.update(4.0);
    expect(auto.state).toBe('listo');
    expect(auto.storedItem?.type).toBe('instrumental_limpio');
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('contamina el instrumental limpio si no se recoge tras 20 segundos', () => {
    const onContaminate = vi.fn();
    const auto = new Autoclave({ col: 18, row: 5 }, undefined, onContaminate);
    auto.placeItem(new Item('instrumental_mojado'));

    // Completar 8 s
    auto.update(8.0);
    expect(auto.state).toBe('listo');
    expect(auto.storedItem?.type).toBe('instrumental_limpio');

    // Esperar 15 s -> aún limpio
    auto.update(15.0);
    expect(auto.state).toBe('listo');
    expect(auto.storedItem?.type).toBe('instrumental_limpio');

    // Pasar 5 s más (total 20 s) -> contaminado
    auto.update(5.0);
    expect(auto.state).toBe('contaminado');
    expect(auto.storedItem?.type).toBe('instrumental_sucio');
    expect(onContaminate).toHaveBeenCalledTimes(1);
  });

  it('permite recoger el ítem con grab y reinicia el estado a vacio', () => {
    const auto = new Autoclave({ col: 18, row: 5 });
    auto.placeItem(new Item('instrumental_mojado'));
    auto.update(8.0); // listo

    let carried: Item | null = null;
    const fakePlayer = {
      hasItem: () => carried !== null,
      pickUp: (item: Item) => {
        carried = item;
        return true;
      },
      drop: () => null,
    };

    const mockCtx: InteractionContext = {
      player: fakePlayer as any,
      cell: { col: 18, row: 5 },
    };

    auto.onGrab(mockCtx);
    expect((carried as Item | null)?.type).toBe('instrumental_limpio');
    expect(auto.state).toBe('vacio');
    expect(auto.storedItem).toBeNull();
  });
});
