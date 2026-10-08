import { describe, it, expect, vi } from 'vitest';
import { XRayStation } from './XRayStation';
import { Patient } from '../patients/Patient';
import type { InteractionContext } from './Interactable';

describe('XRayStation', () => {
  it('no escanea si no hay camilla con paciente cerca', () => {
    const station = new XRayStation({ col: 5, row: 5 }, () => null);
    const mockCtx: InteractionContext = {
      player: {} as any,
      cell: { col: 5, row: 5 },
    };

    station.onUseHold(mockCtx, 1.0);
    expect(station.isScanning).toBe(false);
    expect(station.progress).toBe(0);
  });

  it('no escanea si el paciente no tiene fractura o ya fue escaneado', () => {
    const pFiebre = new Patient('fiebre');
    const mockStretcher = {
      patient: pFiebre,
      isAdjacentToCell: () => true,
    } as any;

    const station = new XRayStation({ col: 5, row: 5 }, () => mockStretcher);
    const mockCtx: InteractionContext = {
      player: {} as any,
      cell: { col: 5, row: 5 },
    };

    station.onUseHold(mockCtx, 1.0);
    expect(station.isScanning).toBe(false);
  });

  it('completa el escaneo de Rayos X tras 4 segundos continuos', () => {
    const pFractura = new Patient('fractura');
    const mockStretcher = {
      patient: pFractura,
      isAdjacentToCell: () => true,
    } as any;

    const onComplete = vi.fn();
    const station = new XRayStation({ col: 5, row: 5 }, () => mockStretcher, onComplete);
    const mockCtx: InteractionContext = {
      player: {} as any,
      cell: { col: 5, row: 5 },
    };

    // 2 segundos -> 50%
    station.onUseHold(mockCtx, 2.0);
    expect(station.isScanning).toBe(true);
    expect(station.progress).toBeCloseTo(0.5);
    expect(pFractura.xrayCompleted).toBe(false);
    expect(onComplete).not.toHaveBeenCalled();

    // 2 segundos más -> 100%
    station.onUseHold(mockCtx, 2.0);
    expect(pFractura.xrayCompleted).toBe(true);
    expect(onComplete).toHaveBeenCalledWith(pFractura);
    expect(station.isScanning).toBe(false);
  });
});
