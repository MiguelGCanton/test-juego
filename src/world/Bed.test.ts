import { describe, it, expect } from 'vitest';
import { Bed } from './Bed';
import { Patient } from '../patients/Patient';
import { Item } from '../items/Item';

describe('Bed (Cama B) & Treatment', () => {
  it('aplica venda a un paciente con herida y genera el alta', () => {
    let discharged: Patient | null = null;
    const bed = new Bed({ col: 1, row: 1 }, (p) => {
      discharged = p;
    });

    const patient = new Patient('herida');
    patient.triage({ col: 1, row: 1 });
    patient.putInBed();
    bed.assignPatient(patient);

    let carriedItem: Item | null = new Item('venda');
    const fakePlayer = {
      carriedItem,
      drop: () => {
        const it = carriedItem;
        carriedItem = null;
        return it;
      },
    };

    // 0.8 s: avanza pero no termina
    bed.onUseHold({ player: fakePlayer as any, cell: { col: 1, row: 1 } }, 0.8);
    expect(bed.isTreating).toBe(true);
    expect(patient.state).toBe('EnTratamiento');
    expect(carriedItem).not.toBeNull();

    // 0.8 s más (total 1.6 s) -> completa
    bed.onUseHold({ player: fakePlayer as any, cell: { col: 1, row: 1 } }, 0.8);
    expect(patient.state).toBe('Alta');
    expect(bed.state).toBe('sucia'); // Cama pasa a sucia
    expect(carriedItem).toBeNull(); // Consumió la venda
    expect(discharged).toBe(patient);
  });

  it('no permite tratar si el jugador no lleva el ítem requerido', () => {
    const bed = new Bed({ col: 1, row: 1 });
    const patient = new Patient('fiebre'); // requiere jeringa
    patient.triage({ col: 1, row: 1 });
    patient.putInBed();
    bed.assignPatient(patient);

    const fakePlayer = {
      carriedItem: new Item('gasas'), // ítem erróneo
      drop: () => null,
    };

    bed.onUseHold({ player: fakePlayer as any, cell: { col: 1, row: 1 } }, 1.5);
    expect(bed.isTreating).toBe(false);
    expect(patient.state).toBe('EnCama');
  });

  it('permite limpiar una cama sucia con sábanas tras 2.0 s de uso continuo', () => {
    const bed = new Bed({ col: 1, row: 1 });
    bed.state = 'sucia';
    expect(bed.isDirty).toBe(true);
    expect(bed.isClean).toBe(false);

    let carriedItem: Item | null = new Item('sabanas');
    const fakePlayer = {
      carriedItem,
      drop: () => {
        const it = carriedItem;
        carriedItem = null;
        return it;
      },
    };

    // 1.0 s: avanza pero sigue sucia
    bed.onUseHold({ player: fakePlayer as any, cell: { col: 1, row: 1 } }, 1.0);
    expect(bed.isCleaning).toBe(true);
    expect(bed.state).toBe('sucia');
    expect(carriedItem).not.toBeNull();

    // 1.0 s más (total 2.0 s) -> limpia la cama y consume sábanas
    bed.onUseHold({ player: fakePlayer as any, cell: { col: 1, row: 1 } }, 1.0);
    expect(bed.state).toBe('limpia');
    expect(bed.isClean).toBe(true);
    expect(carriedItem).toBeNull();
  });

  it('devuelve el VisualState adecuado para todas las combinaciones de estado (T-38)', () => {
    const bed = new Bed({ col: 2, row: 2 });

    // 1. Base limpia
    let vs = bed.getVisualState();
    expect(vs.variant).toBe('base');
    expect(vs.activity).toBe('idle');
    expect(vs.stain).toBe(0);
    expect(vs.badge).toBeNull();
    expect(vs.progress).toBeNull();

    // 2. Asignada (paciente triado caminando hacia la cama)
    const patient = new Patient('herida');
    patient.triage({ col: 2, row: 2 });
    bed.assignPatient(patient);
    vs = bed.getVisualState();
    expect(vs.variant).toBe('asignada');

    // 3. Ocupada (paciente en cama)
    patient.putInBed();
    vs = bed.getVisualState();
    expect(vs.variant).toBe('ocupada');
    expect(vs.activity).toBe('loaded');

    // 4. Tratando
    const playerWithVenda = {
      carriedItem: new Item('venda'),
      drop: () => null,
    };
    bed.onUseHold({ player: playerWithVenda as any, cell: { col: 2, row: 2 } }, 0.5);
    vs = bed.getVisualState();
    expect(vs.activity).toBe('working');
    expect(vs.progress?.kind).toBe('tratamiento');
    expect(vs.progress?.value).toBeCloseTo(0.5 / 1.5, 2);
    expect(vs.item?.type).toBe('venda');

    // 5. Sucia tras alta
    bed.releasePatient(true);
    vs = bed.getVisualState();
    expect(vs.variant).toBe('sucia');
    expect(vs.stain).toBe(1);
    expect(vs.progress).toBeNull();

    // 6. Limpiando (desvanecimiento progresivo de stain)
    const playerWithSheets = {
      carriedItem: new Item('sabanas'),
      drop: () => null,
    };
    bed.onUseHold({ player: playerWithSheets as any, cell: { col: 2, row: 2 } }, 1.0);
    vs = bed.getVisualState();
    expect(vs.activity).toBe('working');
    expect(vs.progress?.kind).toBe('limpieza');
    expect(vs.stain).toBeCloseTo(0.5, 2); // 1 - (1.0 / 2.0)

    // 7. Código Azul
    bed.hasCodeBlue = true;
    bed.codeBlueWorkers = 1;
    bed.codeBlueRequiredWorkers = 2;
    bed.codeBlueProgress = 0.4;
    vs = bed.getVisualState();
    expect(vs.activity).toBe('alert');
    expect(vs.badge).toBe('warning');
    expect(vs.workers?.current).toBe(1);
    expect(vs.workers?.required).toBe(2);
    expect(vs.progress?.kind).toBe('alerta');
  });
});
