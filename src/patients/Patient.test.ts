import { describe, it, expect } from 'vitest';
import { Patient } from './Patient';

describe('Patient FSM & Patience', () => {
  it('inicializa un paciente con su dolencia, severidad y paciencia', () => {
    const pLeve = new Patient('herida');
    expect(pLeve.ailment.id).toBe('herida');
    expect(pLeve.isSevere).toBe(false);
    expect(pLeve.canWalkAlone).toBe(true);
    expect(pLeve.currentPatienceSec).toBe(90);
    expect(pLeve.state).toBe('Esperando');

    const pGrave = new Patient('fractura');
    expect(pGrave.isSevere).toBe(true);
    expect(pGrave.canWalkAlone).toBe(false);
    expect(pGrave.currentPatienceSec).toBe(75);
  });

  it('permite transiciones válidas del ciclo de vida', () => {
    const p = new Patient('fiebre');
    expect(p.state).toBe('Esperando');

    // Triaje
    const triaged = p.triage({ col: 1, row: 1 });
    expect(triaged).toBe(true);
    expect(p.state).toBe('Triado');
    expect(p.assignedBedCell).toEqual({ col: 1, row: 1 });

    // Llegar a cama
    p.putInBed();
    expect(p.state).toBe('EnCama');

    // Iniciar tratamiento
    p.startTreatment();
    expect(p.state).toBe('EnTratamiento');

    // Alta
    p.discharge();
    expect(p.state).toBe('Alta');
  });

  it('congela la paciencia durante el tratamiento', () => {
    const p = new Patient('herida');
    p.triage({ col: 1, row: 1 });
    p.putInBed();

    // Sin tratamiento: baja paciencia
    p.update(10);
    expect(p.currentPatienceSec).toBe(80);

    // En tratamiento: se congela
    p.startTreatment();
    p.update(20);
    expect(p.currentPatienceSec).toBe(80);

    // Si se interrumpe el tratamiento: vuelve a decrecer
    p.stopTreatment();
    p.update(5);
    expect(p.currentPatienceSec).toBe(75);
  });

  it('transiciona a Perdido cuando la paciencia llega a 0', () => {
    const p = new Patient('fractura');
    p.update(74);
    expect(p.state).toBe('Esperando');
    expect(p.currentPatienceSec).toBe(1);

    p.update(2);
    expect(p.state).toBe('Perdido');
    expect(p.currentPatienceSec).toBe(0);
  });
});
