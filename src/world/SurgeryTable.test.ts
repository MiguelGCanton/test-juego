import { describe, it, expect, vi } from 'vitest';
import { SurgeryTable } from './SurgeryTable';
import { Item } from '../items/Item';
import { Patient } from '../patients/Patient';
import type { InteractionContext } from './Interactable';

describe('SurgeryTable (Mesa Quirúrgica Q)', () => {
  it('recibe instrumental_limpio y anestesia para estar lista', () => {
    const table = new SurgeryTable({ col: 16, row: 1 }, () => null, () => 1, false);
    expect(table.hasCleanInstrument).toBe(false);
    expect(table.hasAnesthesia).toBe(false);

    let carried: Item | null = new Item('instrumental_limpio');
    const fakePlayer = {
      hasItem: () => carried !== null,
      carriedItem: carried,
      drop: () => {
        const it = carried;
        carried = null;
        return it;
      },
    };

    table.onGrab({ player: fakePlayer as any, cell: { col: 16, row: 1 } });
    expect(table.hasCleanInstrument).toBe(true);
    expect(carried).toBeNull();

    // Suministrar anestesia
    fakePlayer.carriedItem = new Item('anestesia');
    table.onGrab({ player: fakePlayer as any, cell: { col: 16, row: 1 } });
    expect(table.hasAnesthesia).toBe(true);
  });

  it('en modo 1 jugador, 1 cirujano completa la cirugía en 6 segundos y produce instrumental_sucio', () => {
    const pCirugia = new Patient('cirugia');
    const mockStretcher = {
      patient: pCirugia,
      isAdjacentToCell: () => true,
    } as any;

    const onComplete = vi.fn();
    const table = new SurgeryTable(
      { col: 16, row: 1 },
      () => mockStretcher,
      () => 1, // 1 jugador
      true,    // empieza con instrumental limpio
      onComplete
    );
    table.hasAnesthesia = true;

    expect(table.isReadyToOperate).toBe(true);

    const ctx: InteractionContext = {
      player: { slot: { deviceId: 'dev-1' } } as any,
      cell: { col: 16, row: 1 },
    };

    // 3 segundos: 50%
    table.onUseHold(ctx, 3.0);
    expect(table.isOperating).toBe(true);
    expect(table.progress).toBeCloseTo(0.5);
    expect(pCirugia.state).toBe('Esperando');

    // 3 segundos más -> 100%
    table.onUseHold(ctx, 3.0);
    expect(pCirugia.state).toBe('Alta');
    expect(table.storedDirtyInstrument?.type).toBe('instrumental_sucio');
    expect(table.hasCleanInstrument).toBe(false);
    expect(table.hasAnesthesia).toBe(false);
    expect(onComplete).toHaveBeenCalledWith(pCirugia);
  });

  it('en multijugador (>=2 jugadores), requiere 2 cirujanos simultáneos para avanzar', () => {
    const pCirugia = new Patient('cirugia');
    const mockStretcher = {
      patient: pCirugia,
      isAdjacentToCell: () => true,
    } as any;

    const onComplete = vi.fn();
    const table = new SurgeryTable(
      { col: 16, row: 1 },
      () => mockStretcher,
      () => 2, // 2 jugadores en la partida
      true,
      onComplete
    );
    table.hasAnesthesia = true;

    const p1Ctx: InteractionContext = {
      player: { slot: { deviceId: 'dev-1' } } as any,
      cell: { col: 16, row: 1 },
    };
    const p2Ctx: InteractionContext = {
      player: { slot: { deviceId: 'dev-2' } } as any,
      cell: { col: 16, row: 1 },
    };

    // Solo jugador 1 opera -> no avanza el progreso
    table.onUseHold(p1Ctx, 2.0);
    expect(table.progress).toBe(0);

    // Ambos jugadores operan simultáneamente -> avanza 3 segundos
    table.onUseHold(p1Ctx, 0);
    table.onUseHold(p2Ctx, 3.0);
    expect(table.progress).toBeCloseTo(0.5);

    // P1 suelta use
    table.onUseEnd(p1Ctx);
    table.onUseHold(p2Ctx, 3.0);
    // Como solo queda P2, no avanza
    expect(table.progress).toBeCloseTo(0.5);
  });
});
