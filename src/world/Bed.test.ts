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
});
