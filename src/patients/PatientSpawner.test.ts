import { describe, it, expect } from 'vitest';
import { PatientSpawner } from './PatientSpawner';
import { LEVEL_1 } from '../levels/nivel1';
import { LEVEL_2 } from '../levels/nivel2';

describe('PatientSpawner (T-13, T-32, T-34)', () => {
  it('genera pacientes tras vencer el intervalo inicial', () => {
    const spawner = new PatientSpawner(LEVEL_1, 2, 2);
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

  it('respeta el escalado de maxPatients para 1 jugador (T-32)', () => {
    const spawner1P = new PatientSpawner(LEVEL_1, 1);
    expect(spawner1P.effectiveMaxPatients).toBe(LEVEL_1.maxPatients - 1); // 4 - 1 = 3

    const spawner2P = new PatientSpawner(LEVEL_1, 2);
    expect(spawner2P.effectiveMaxPatients).toBe(LEVEL_1.maxPatients); // 4
  });

  it('respeta el escalado de intervalos para 3 y 4 jugadores (T-32)', () => {
    const spawner3P = new PatientSpawner(LEVEL_1, 3);
    expect(spawner3P.effectiveOrderIntervalSec[0]).toBeCloseTo(LEVEL_1.orderIntervalSec[0] * 0.85);
    expect(spawner3P.effectiveOrderIntervalSec[1]).toBeCloseTo(LEVEL_1.orderIntervalSec[1] * 0.85);

    const spawner4P = new PatientSpawner(LEVEL_1, 4);
    expect(spawner4P.effectiveOrderIntervalSec[0]).toBeCloseTo(LEVEL_1.orderIntervalSec[0] * 0.85);
  });

  it('respeta la secuencia de onboarding del Nivel 1 (T-34)', () => {
    const spawner = new PatientSpawner(LEVEL_1, 2, 0.1);

    // 1er paciente de Nivel 1 siempre es 'herida'
    const p1 = spawner.update(0.2);
    expect(p1?.ailment.id).toBe('herida');

    // 2do paciente de Nivel 1 siempre es 'fiebre' (intervalo entre 14 y 22s)
    const p2 = spawner.update(25.0);
    expect(p2?.ailment.id).toBe('fiebre');

    // Antes de los 45s de nivel, nunca debe ser 'fractura' (elapsedLevelSec = 25.2s < 45s)
    for (let i = 0; i < 20; i++) {
      const ailment = spawner.chooseAilment(0.99); // normalmente daría fractura por peso alto
      expect(ailment).not.toBe('fractura');
    }

    // Tras 45s, 'fractura' ya es posible
    spawner.elapsedLevelSec = 50;
    const ailmentAfter45 = spawner.chooseAilment(0.99);
    expect(ailmentAfter45).toBe('fractura');
  });

  it('permite dolencias completas inmediatamente en Nivel 2', () => {
    const spawnerL2 = new PatientSpawner(LEVEL_2, 2, 0.1);
    // En Nivel 2 no hay onboarding forzado de herida/fiebre
    expect(['herida', 'fiebre', 'fractura', 'cirugia']).toContain(spawnerL2.chooseAilment(0.99));
  });
});
