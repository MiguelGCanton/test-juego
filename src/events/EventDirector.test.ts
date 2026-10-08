import { describe, it, expect, vi } from 'vitest';
import { EventDirector } from './EventDirector';
import type { LevelEventSpec } from '../levels/types';

describe('EventDirector (Planificador de emergencias T-27)', () => {
  const sampleEvents: LevelEventSpec[] = [
    { type: 'spill', firstAtSec: 30, everySec: [20, 30] },
    { type: 'blackout', firstAtSec: 60, everySec: [40, 50] },
  ];

  it('no dispara eventos antes de su firstAtSec', () => {
    const director = new EventDirector(sampleEvents);
    expect(director.isEventActive('spill')).toBe(false);

    // Avanzar a 25 s (antes de 30 s)
    const triggered = director.update(25);
    expect(triggered.length).toBe(0);
    expect(director.isEventActive('spill')).toBe(false);
  });

  it('dispara el evento exactamente al alcanzar firstAtSec', () => {
    const onStart = vi.fn();
    const director = new EventDirector(sampleEvents, onStart);

    // Avanzar 30 s
    const triggered = director.update(30);
    expect(triggered).toContain('spill');
    expect(director.isEventActive('spill')).toBe(true);
    expect(onStart).toHaveBeenCalledWith('spill');
  });

  it('solo permite un evento activo de cada tipo a la vez', () => {
    const director = new EventDirector(sampleEvents);
    director.update(30); // activa spill
    expect(director.isEventActive('spill')).toBe(true);

    // Intentar forzar inicio mientras ya está activo
    const started = director.startEvent('spill');
    expect(started).toBe(false);
    expect(director.activeEventCount).toBe(1);
  });

  it('al resolver un evento programa el siguiente en el intervalo everySec', () => {
    const onEnd = vi.fn();
    const director = new EventDirector(sampleEvents, undefined, onEnd);
    director.update(30); // activa spill
    expect(director.isEventActive('spill')).toBe(true);

    // Resolver evento
    director.endEvent('spill', true);
    expect(director.isEventActive('spill')).toBe(false);
    expect(onEnd).toHaveBeenCalledWith('spill', true);

    // Siguiente activación programada entre 30 + 20 = 50s y 30 + 30 = 60s
    const nextTrigger = director.nextTriggerSec.get('spill')!;
    expect(nextTrigger).toBeGreaterThanOrEqual(50);
    expect(nextTrigger).toBeLessThanOrEqual(60);
  });
});
