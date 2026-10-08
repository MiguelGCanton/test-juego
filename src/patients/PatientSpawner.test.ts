import { describe, it, expect } from 'vitest';
import { PatientSpawner } from './PatientSpawner';
import { LEVEL_1 } from '../levels/nivel1';

describe('PatientSpawner', () => {
  it('genera pacientes tras vencer el intervalo inicial', () => {
    const spawner = new PatientSpawner(LEVEL_1, 2);
    expect(spawner.count).toBe(0);

    // 1 segundo: no spawnea aún
    const p1 = spawner.update(1);
    expect(p1).toBeNull();
    expect(spawner.count).toBe(0);

    // 1.5 segundos más (total 2.5s): spawnea el primer paciente
    const p2 = spawner.update(1.5);
    expect(p2).not.toBeNull();
    expect(spawner.count).toBe(1);
  });

  it('respeta el límite maxPatients', () => {
    const smallLevel = { ...LEVEL_1, maxPatients: 2, orderIntervalSec: [1, 1] as const };
    const spawner = new PatientSpawner(smallLevel, 0.1);

    spawner.update(0.2); // 1
    spawner.update(1.1); // 2 (al límite)
    expect(spawner.count).toBe(2);

    const extra = spawner.update(1.1); // 3 (debe ignorarse por cupo lleno)
    expect(extra).toBeNull();
    expect(spawner.count).toBe(2);

    // Si se retira un paciente, puede spawnear de nuevo
    spawner.removePatient(spawner.activePatients[0]!.id);
    expect(spawner.count).toBe(1);
    const newP = spawner.update(1.1);
    expect(newP).not.toBeNull();
    expect(spawner.count).toBe(2);
  });

  it('selecciona dolencias ponderadas según los pesos del nivel', () => {
    const spawner = new PatientSpawner(LEVEL_1);
    // orders: herida (5/11), fiebre (4/11), fractura (2/11)
    // 5/11 ≈ 0.454, 9/11 ≈ 0.818

    expect(spawner.chooseAilment(0.1)).toBe('herida');
    expect(spawner.chooseAilment(0.5)).toBe('fiebre');
    expect(spawner.chooseAilment(0.9)).toBe('fractura');
  });
});
