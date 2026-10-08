import { describe, it, expect } from 'vitest';
import { calculateDischargePoints, calculateStars, ScoreTracker } from './Scoring';
import { Patient } from '../patients/Patient';

describe('Scoring System (MEC-01)', () => {
  it('calcula puntos con bonificación de paciencia al 100%', () => {
    const patient = new Patient('herida'); // base 100
    // 100 * (1 + 0.5 * 1.0) = 150
    const points = calculateDischargePoints(patient);
    expect(points).toBe(150);
  });

  it('calcula puntos con bonificación de paciencia parcial redondeada a decenas', () => {
    const patient = new Patient('herida');
    patient.update(45); // paciencia al 50% (ratio = 0.5)
    // 100 * (1 + 0.5 * 0.5) = 125 -> redondeado a decenas = 130
    const points = calculateDischargePoints(patient);
    expect(points).toBe(130);
  });

  it('calcula puntos de fractura (base 250) al 100% de paciencia', () => {
    const patient = new Patient('fractura');
    // 250 * 1.5 = 375 -> redondeado a decenas = 380
    const points = calculateDischargePoints(patient);
    expect(points).toBe(380);
  });

  it('asigna estrellas según umbrales de puntuación', () => {
    const thresholds: readonly [number, number, number] = [300, 700, 1100];
    expect(calculateStars(250, thresholds)).toBe(0);
    expect(calculateStars(300, thresholds)).toBe(1);
    expect(calculateStars(690, thresholds)).toBe(1);
    expect(calculateStars(700, thresholds)).toBe(2);
    expect(calculateStars(1100, thresholds)).toBe(3);
    expect(calculateStars(1500, thresholds)).toBe(3);
  });

  it('ScoreTracker acumula puntos y penalizaciones por pacientes perdidos', () => {
    const tracker = new ScoreTracker();
    const p1 = new Patient('herida');
    tracker.addDischarge(p1);
    expect(tracker.score).toBe(150);
    expect(tracker.dischargedCount).toBe(1);

    tracker.addPatientLost();
    expect(tracker.score).toBe(100);
    expect(tracker.lostCount).toBe(1);
  });
});
