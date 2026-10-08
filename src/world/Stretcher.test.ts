import { describe, it, expect } from 'vitest';
import {
  calculateStretcherSpeedFactor,
  calculateStretcherVelocity,
  canLoadPatientOnStretcher,
  canUnloadPatientToBed,
  canPerformXRay,
} from './StretcherLogic';
import { Patient } from '../patients/Patient';
import { Bed } from './Bed';

describe('StretcherLogic', () => {
  describe('Speed Factor & Scaling', () => {
    it('devuelve 0 si no hay empujadores', () => {
      expect(calculateStretcherSpeedFactor(0, 1)).toBe(0);
      expect(calculateStretcherSpeedFactor(0, 2)).toBe(0);
      expect(calculateStretcherSpeedFactor(0, 4)).toBe(0);
    });

    it('en partida de 1 jugador, 1 empujador da 70% de velocidad', () => {
      expect(calculateStretcherSpeedFactor(1, 1)).toBe(0.7);
    });

    it('en partida de >=2 jugadores, 1 empujador da 40% y 2 empujadores da 100%', () => {
      expect(calculateStretcherSpeedFactor(1, 2)).toBe(0.4);
      expect(calculateStretcherSpeedFactor(2, 2)).toBe(1.0);
      expect(calculateStretcherSpeedFactor(1, 4)).toBe(0.4);
      expect(calculateStretcherSpeedFactor(2, 4)).toBe(1.0);
    });
  });

  describe('Velocity & Cooperative Average Vectors', () => {
    it('calcula velocidad para 1 jugador solitario', () => {
      const vel = calculateStretcherVelocity([{ moveX: 1, moveY: 0 }], 1, 180);
      expect(vel.vx).toBeCloseTo(180 * 0.7);
      expect(vel.vy).toBe(0);
      expect(vel.speedFactor).toBe(0.7);
    });

    it('calcula velocidad cuando 2 jugadores empujan en la misma dirección', () => {
      const vel = calculateStretcherVelocity(
        [
          { moveX: 1, moveY: 0 },
          { moveX: 1, moveY: 0 },
        ],
        2,
        180
      );
      expect(vel.vx).toBe(180);
      expect(vel.vy).toBe(0);
      expect(vel.speedFactor).toBe(1.0);
    });

    it('cancela el movimiento si dos jugadores empujan en direcciones opuestas', () => {
      const vel = calculateStretcherVelocity(
        [
          { moveX: 1, moveY: 0 },
          { moveX: -1, moveY: 0 },
        ],
        2,
        180
      );
      expect(vel.vx).toBe(0);
      expect(vel.vy).toBe(0);
    });

    it('promedia direcciones ortogonales cuando cooperan en ángulo', () => {
      const vel = calculateStretcherVelocity(
        [
          { moveX: 1, moveY: 0 },
          { moveX: 0, moveY: 1 },
        ],
        2,
        180
      );
      expect(vel.vx).toBe(90);
      expect(vel.vy).toBe(90);
    });

    it('maneja 1 jugador empujando en partida cooperativa (40% velocidad)', () => {
      const vel = calculateStretcherVelocity([{ moveX: 0, moveY: -1 }], 2, 180);
      expect(vel.vx).toBe(0);
      expect(vel.vy).toBeCloseTo(-180 * 0.4);
    });
  });

  describe('Patient Loading / Unloading Logic', () => {
    it('solo permite cargar pacientes graves que estén esperando o triados', () => {
      const pLeve = new Patient('herida');
      const pGrave = new Patient('fractura');

      // Paciente leve no se puede subir en camilla
      expect(canLoadPatientOnStretcher(null, pLeve)).toBe(false);

      // Paciente grave esperando se puede subir
      expect(canLoadPatientOnStretcher(null, pGrave)).toBe(true);

      // Si ya hay un paciente en camilla, rechaza
      expect(canLoadPatientOnStretcher(pGrave, pGrave)).toBe(false);
    });

    it('valida descarga a cama solo si la cama está limpia', () => {
      const p = new Patient('fractura');
      const bed = new Bed({ col: 2, row: 2 });

      expect(canUnloadPatientToBed(p, bed)).toBe(true);

      // Si la cama ya está ocupada
      const otherPatient = new Patient('herida');
      bed.assignPatient(otherPatient);
      expect(canUnloadPatientToBed(p, bed)).toBe(false);

      // Si la camilla está vacía
      expect(canUnloadPatientToBed(null, bed)).toBe(false);
    });

    it('valida requisitos para Rayos X', () => {
      const pFractura = new Patient('fractura');
      const pFiebre = new Patient('fiebre');

      expect(canPerformXRay(pFractura)).toBe(true);
      expect(canPerformXRay(pFiebre)).toBe(false);
      expect(canPerformXRay(null)).toBe(false);

      // Una vez escaneado, no requiere rayos X de nuevo
      pFractura.completeXRay();
      expect(canPerformXRay(pFractura)).toBe(false);
    });
  });
});
