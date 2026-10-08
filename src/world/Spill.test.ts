import { describe, it, expect, vi } from 'vitest';
import { Spill } from './Spill';
import { Item } from '../items/Item';
import type { InteractionContext } from './Interactable';

describe('Spill (Derrame y mopa T-28)', () => {
  it('hace resbalar al jugador y le hace soltar su ítem si no está en dash', () => {
    const spill = new Spill({ col: 5, row: 5 });

    let carried: Item | null = new Item('gasas');
    const fakePlayer = {
      dashTimer: 0,
      slipTimer: 0,
      facing: { x: 1, y: 0, dir: 'right' },
      drop: () => {
        const it = carried;
        carried = null;
        return it;
      },
      slip: function (durationSec: number) {
        if (this.dashTimer > 0 || this.slipTimer > 0) return false;
        this.slipTimer = durationSec;
        this.drop();
        return true;
      },
    };

    const slipped = spill.checkPlayerSlip(fakePlayer as any);
    expect(slipped).toBe(true);
    expect(fakePlayer.slipTimer).toBe(0.6);
    expect(carried).toBeNull();
  });

  it('no hace resbalar al jugador si está haciendo dash', () => {
    const spill = new Spill({ col: 5, row: 5 });

    const fakePlayer = {
      dashTimer: 0.15, // en pleno dash
      slipTimer: 0,
      drop: vi.fn(),
      slip: function (durationSec: number) {
        if (this.dashTimer > 0 || this.slipTimer > 0) return false;
        this.slipTimer = durationSec;
        return true;
      },
    };

    const slipped = spill.checkPlayerSlip(fakePlayer as any);
    expect(slipped).toBe(false);
    expect(fakePlayer.slipTimer).toBe(0);
    expect(fakePlayer.drop).not.toHaveBeenCalled();
  });

  it('permite limpiar el charco con mopa tras 2.0 segundos de uso continuo', () => {
    const onClean = vi.fn();
    const spill = new Spill({ col: 5, row: 5 }, onClean);

    const mockCtx: InteractionContext = {
      player: {
        carriedItem: new Item('mopa'),
      } as any,
      cell: { col: 5, row: 5 },
    };

    // 1 segundo: 50%
    spill.onUseHold(mockCtx, 1.0);
    expect(spill.isCleaning).toBe(true);
    expect(spill.progress).toBeCloseTo(0.5);
    expect(onClean).not.toHaveBeenCalled();

    // 1 segundo más -> 100%
    spill.onUseHold(mockCtx, 1.0);
    expect(spill.isCleaning).toBe(false);
    expect(onClean).toHaveBeenCalledTimes(1);
  });
});
