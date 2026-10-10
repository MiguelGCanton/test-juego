import { describe, it, expect, vi } from 'vitest';
import { ElectricPanel } from './ElectricPanel';
import type { InteractionContext } from './Interactable';

describe('ElectricPanel (Cuadro Eléctrico U T-29)', () => {
  it('se activa durante un apagón y puede ser reparado con 3.0 s de uso continuo', () => {
    const onRestore = vi.fn();
    const panel = new ElectricPanel({ col: 14, row: 7 }, onRestore);

    panel.triggerBlackout();
    expect(panel.isBlackoutActive).toBe(true);

    const mockCtx: InteractionContext = {
      player: {} as any,
      cell: { col: 14, row: 7 },
    };

    // 1.5 s: 50%
    panel.onUseHold(mockCtx, 1.5);
    expect(panel.isFixing).toBe(true);
    expect(panel.progress).toBeCloseTo(0.5);
    expect(onRestore).not.toHaveBeenCalled();

    // 1.5 s más -> reparado
    panel.onUseHold(mockCtx, 1.5);
    expect(panel.isBlackoutActive).toBe(false);
    expect(onRestore).toHaveBeenCalledTimes(1);
  });

  it('se auto-resuelve tras 25 segundos si nadie lo repara manualmente', () => {
    const onRestore = vi.fn();
    const panel = new ElectricPanel({ col: 14, row: 7 }, onRestore);

    panel.triggerBlackout();

    // Avanzar 20 s -> sigue activo
    panel.update(20);
    expect(panel.isBlackoutActive).toBe(true);
    expect(onRestore).not.toHaveBeenCalled();

    // 5 s más (total 25 s) -> auto-restaurado
    panel.update(5);
    expect(panel.isBlackoutActive).toBe(false);
    expect(onRestore).toHaveBeenCalledTimes(1);
  });

  it('devuelve el VisualState adecuado para normal, avería y reparando (T-40)', () => {
    const panel = new ElectricPanel({ col: 14, row: 7 });

    // 1. Normal
    let vs = panel.getVisualState();
    expect(vs.variant).toBe('normal');
    expect(vs.activity).toBe('idle');
    expect(vs.badge).toBeNull();

    // 2. Avería
    panel.triggerBlackout();
    vs = panel.getVisualState();
    expect(vs.variant).toBe('averia');
    expect(vs.activity).toBe('alert');
    expect(vs.badge).toBe('bolt');

    // 3. Reparando
    const mockCtx: InteractionContext = {
      player: {} as any,
      cell: { col: 14, row: 7 },
    };
    panel.onUseHold(mockCtx, 1.5);
    vs = panel.getVisualState();
    expect(vs.variant).toBe('reparando');
    expect(vs.activity).toBe('working');
    expect(vs.badge).toBe('warning');
    expect(vs.progress?.value).toBeCloseTo(0.5, 2);
  });
});
