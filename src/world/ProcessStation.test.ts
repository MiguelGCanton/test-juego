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

    stationJ.onUseHold({ player: {} as any, cell: { col: 10, row: 4 } }, 2);
    expect(stationJ.storedItem?.type).toBe('jeringa');
  });

  it('no procesa si el ítem no coincide con el input esperado', () => {
    const stationK = new ProcessStation({ col: 10, row: 3 }, 'K');
    stationK.placeItem(new Item('vial')); // input incorrecto para K

    stationK.onUseHold({ player: {} as any, cell: { col: 10, row: 3 } }, 3);
    expect(stationK.storedItem?.type).toBe('vial');
    expect(stationK.timer.progress).toBe(0);
  });

  it('refleja adecuadamente los estados en getVisualState() (T-37)', () => {
    const station = new ProcessStation({ col: 5, row: 5 }, 'K');

    // 1. Idle (vacía)
    let vs = station.getVisualState();
    expect(vs.variant).toBe('base');
    expect(vs.activity).toBe('idle');
    expect(vs.item).toBeNull();
    expect(vs.progress).toBeNull();

    // 2. Loaded (con gasas)
    station.placeItem(new Item('gasas'));
    vs = station.getVisualState();
    expect(vs.variant).toBe('base');
    expect(vs.activity).toBe('loaded');
    expect(vs.item?.type).toBe('gasas');
    expect(vs.progress).toBeNull();

    // 3. Working (mientras procesa)
    station.onUseHold({ player: {} as any, cell: { col: 5, row: 5 } }, 1);
    expect(station.isProcessing).toBe(true);
    vs = station.getVisualState();
    expect(vs.variant).toBe('activa');
    expect(vs.activity).toBe('working');
    expect(vs.progress?.value).toBeCloseTo(1 / 3, 2);
    expect(vs.progress?.kind).toBe('proceso');

    // 4. Paused (al soltar use con progreso acumulado)
    station.onUseEnd({ player: {} as any, cell: { col: 5, row: 5 } });
    expect(station.isProcessing).toBe(false);
    vs = station.getVisualState();
    expect(vs.variant).toBe('base');
    expect(vs.activity).toBe('paused');
    expect(vs.progress?.value).toBeCloseTo(1 / 3, 2);

    // 5. Done (completado a venda)
    station.onUseHold({ player: {} as any, cell: { col: 5, row: 5 } }, 2);
    vs = station.getVisualState();
    expect(vs.variant).toBe('base');
    expect(vs.activity).toBe('done');
    expect(vs.badge).toBe('check');
    expect(vs.item?.type).toBe('venda');

    // 6. Disabled (apagón)
    station.isDisabled = true;
    vs = station.getVisualState();
    expect(vs.variant).toBe('disabled');
    expect(vs.activity).toBe('disabled');
    expect(vs.badge).toBe('bolt');
  });
});
