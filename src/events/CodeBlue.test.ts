import { describe, it, expect, vi } from 'vitest';
import { CodeBlueManager } from './CodeBlueManager';
import { DefibrillatorStation } from '../world/DefibrillatorStation';
import { Bed } from '../world/Bed';
import { Patient } from '../patients/Patient';
import { Item } from '../items/Item';
import type { InteractionContext } from '../world/Interactable';

describe('CodeBlueManager & DefibrillatorStation (MEC-05 / T-30)', () => {
  it('DefibrillatorStation carga el desfibrilador en 3.0 s y entrega el ítem pesado', () => {
    const station = new DefibrillatorStation({ col: 18, row: 2 });
    let carried: Item | null = null;
    const fakePlayer = {
      hasItem: () => carried !== null,
      pickUp: (it: Item) => {
        carried = it;
        return true;
      },
    };

    const mockCtx: InteractionContext = {
      player: fakePlayer as any,
      cell: { col: 18, row: 2 },
    };

    // 1.5 s -> 50%
    station.onUseHold(mockCtx, 1.5);
    expect(station.isCharging).toBe(true);
    expect(station.progress).toBeCloseTo(0.5);
    expect(carried).toBeNull();

    // 1.5 s más -> entrega desfibrilador
    station.onUseHold(mockCtx, 1.5);
    expect(station.isCharging).toBe(false);
    expect(carried).not.toBeNull();
    expect((carried as Item | null)?.type).toBe('desfibrilador');
    expect((carried as Item | null)?.definition.isHeavy).toBe(true);
  });

  it('inicia el Código Azul en una cama ocupada y se resuelve exitosamente con desfibrilador', () => {
    const onResolution = vi.fn();
    const manager = new CodeBlueManager(onResolution);

    const bed = new Bed({ col: 1, row: 1 });
    const patient = new Patient('herida');
    bed.assignPatient(patient);

    expect(manager.start(bed)).toBe(true);
    expect(manager.isCodeBlueActive).toBe(true);

    manager.setDefibrillatorPresent(true);
    manager.addParticipant('p1');

    // En 1 jugador, 1 participante avanza el tratamiento (2.0 s)
    manager.update(1.0, 1);
    expect(manager.treatmentProgress).toBeCloseTo(0.5);
    expect(manager.status).toBe('activo');

    // 1.0 s más -> éxito (+200 pts)
    manager.update(1.0, 1);
    expect(manager.status).toBe('exito');
    expect(onResolution).toHaveBeenCalledWith(true, 200);
  });

  it('falla el Código Azul tras 25 s si no se atiende a tiempo (-150 pts y paciente perdido)', () => {
    const onResolution = vi.fn();
    const manager = new CodeBlueManager(onResolution);

    const bed = new Bed({ col: 1, row: 1 });
    const patient = new Patient('fiebre');
    bed.assignPatient(patient);

    manager.start(bed);
    expect(manager.isCodeBlueActive).toBe(true);

    // Avanzar 25 segundos
    manager.update(25.0, 1);
    expect(manager.status).toBe('fallo');
    expect(patient.state).toBe('Perdido');
    expect(bed.isOccupied).toBe(false);
    expect(onResolution).toHaveBeenCalledWith(false, -150);
  });
});
