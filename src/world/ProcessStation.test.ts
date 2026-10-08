import { describe, it, expect } from 'vitest';
import { ProcessStation } from './ProcessStation';
import { Item } from '../items/Item';

describe('ProcessStation', () => {
  it('procesa gasas a venda en estación K tras 3 segundos', () => {
    const stationK = new ProcessStation({ col: 10, row: 3 }, 'K');
    stationK.placeItem(new Item('gasas'));

    expect(stationK.storedItem?.type).toBe('gasas');
    expect(stationK.timer.progress).toBe(0);

    // 1 segundo de procesado
    stationK.onUseHold({ player: {} as any, cell: { col: 10, row: 3 } }, 1);
    expect(stationK.storedItem?.type).toBe('gasas');
    expect(stationK.timer.progress).toBeCloseTo(1 / 3, 2);

    // 2 segundos más -> completa
    stationK.onUseHold({ player: {} as any, cell: { col: 10, row: 3 } }, 2);
    expect(stationK.storedItem?.type).toBe('venda');
    expect(stationK.timer.isComplete).toBe(true);
  });

  it('procesa vial a jeringa en estación J tras 2 segundos', () => {
    const stationJ = new ProcessStation({ col: 10, row: 4 }, 'J');
    stationJ.placeItem(new Item('vial'));

    stationKAdv: {
      stationJ.onUseHold({ player: {} as any, cell: { col: 10, row: 4 } }, 2);
    }
    expect(stationJ.storedItem?.type).toBe('jeringa');
  });

  it('no procesa si el ítem no coincide con el input esperado', () => {
    const stationK = new ProcessStation({ col: 10, row: 3 }, 'K');
    stationK.placeItem(new Item('vial')); // input incorrecto para K

    stationK.onUseHold({ player: {} as any, cell: { col: 10, row: 3 } }, 3);
    expect(stationK.storedItem?.type).toBe('vial');
    expect(stationK.timer.progress).toBe(0);
  });
});
