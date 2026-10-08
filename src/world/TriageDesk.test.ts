import { describe, it, expect } from 'vitest';
import { TriageDesk, type TriageResult } from './TriageDesk';
import { Bed } from './Bed';
import { Patient } from '../patients/Patient';

describe('TriageDesk (Mostrador R)', () => {
  it('asigna una cama limpia libre a un paciente en espera tras 1.5 s de uso', () => {
    const patient = new Patient('herida');
    const bed = new Bed({ col: 1, row: 1 });
    let triagedEvent: TriageResult | null = null;

    const desk = new TriageDesk(
      { col: 3, row: 4 },
      () => [patient],
      () => [bed],
      (res) => {
        triagedEvent = res;
      }
    );

    expect(patient.state).toBe('Esperando');
    expect(bed.isClean).toBe(true);

    // 0.8 s: avanza progreso
    desk.onUseHold({ player: {} as any, cell: { col: 3, row: 4 } }, 0.8);
    expect(desk.isTriaging).toBe(true);
    expect(patient.state).toBe('Esperando');

    // 0.8 s más (total 1.6 s) -> completa triaje
    desk.onUseHold({ player: {} as any, cell: { col: 3, row: 4 } }, 0.8);
    expect(patient.state).toBe('Triado');
    expect(patient.assignedBedCell).toEqual({ col: 1, row: 1 });
    expect(bed.isOccupied).toBe(true);
    expect(triagedEvent).not.toBeNull();
  });

  it('muestra aviso de Sin camas si todas las camas están ocupadas o sucias', () => {
    const patient = new Patient('fiebre');
    const dirtyBed = new Bed({ col: 1, row: 1 });
    dirtyBed.state = 'sucia';

    const desk = new TriageDesk(
      { col: 3, row: 4 },
      () => [patient],
      () => [dirtyBed]
    );

    desk.onUseHold({ player: {} as any, cell: { col: 3, row: 4 } }, 1.0);
    expect(desk.noBedsMessage).toBe(true);
    expect(desk.isTriaging).toBe(false);
    expect(patient.state).toBe('Esperando');
  });
});
