import { describe, it, expect } from 'vitest';
import { ProgressTimer } from './ProgressTimer';

describe('ProgressTimer', () => {
  it('calcula progreso y detecta compleción', () => {
    const timer = new ProgressTimer(2);
    expect(timer.progress).toBe(0);
    expect(timer.isComplete).toBe(false);

    const step1 = timer.advance(1);
    expect(step1).toBe(false);
    expect(timer.progress).toBe(0.5);
    expect(timer.isComplete).toBe(false);

    const step2 = timer.advance(1);
    expect(step2).toBe(true);
    expect(timer.progress).toBe(1);
    expect(timer.isComplete).toBe(true);

    // Los avances posteriores no vuelven a disparar true
    const step3 = timer.advance(1);
    expect(step3).toBe(false);
  });

  it('permite reiniciar el temporizador', () => {
    const timer = new ProgressTimer(3);
    timer.advance(2);
    expect(timer.elapsedSec).toBe(2);
    timer.reset();
    expect(timer.elapsedSec).toBe(0);
    expect(timer.progress).toBe(0);
  });
});
