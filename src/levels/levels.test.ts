import { describe, it, expect } from 'vitest';
import { validateLevel } from './LevelLoader';
import { LEVEL_1 } from './nivel1';
import { LEVEL_2 } from './nivel2';
import { LEVELS, getLevelById } from './types';

describe('Level definitions (Nivel 1 y Nivel 2)', () => {
  it('Nivel 1 es válido según las reglas del juego', () => {
    const res = validateLevel(LEVEL_1);
    expect(res.errors).toEqual([]);
    expect(res.valid).toBe(true);
  });

  it('Nivel 2 es válido según las reglas del juego', () => {
    const res = validateLevel(LEVEL_2);
    expect(res.errors).toEqual([]);
    expect(res.valid).toBe(true);
  });

  it('LEVELS contiene ambos niveles y getLevelById funciona', () => {
    expect(LEVELS.length).toBe(2);
    expect(getLevelById('nivel-1')).toBe(LEVEL_1);
    expect(getLevelById('nivel-2')).toBe(LEVEL_2);
  });
});
