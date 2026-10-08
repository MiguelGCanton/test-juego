import { describe, it, expect } from 'vitest';
import { cellToWorld, worldToCell, parseLayout, validateLevel } from './LevelLoader';
import type { LevelData } from './types';
import { HUD_HEIGHT, TILE_SIZE } from '../config/constants';

describe('LevelLoader', () => {
  const validLevel: LevelData = {
    id: 'test-1',
    name: 'Test Level',
    durationSec: 180,
    stars: [300, 700, 1100],
    orders: [{ recipeId: 'herida', weight: 5 }],
    orderIntervalSec: [14, 22],
    maxPatients: 4,
    events: [],
    layout: [
      '####################',
      '#B.B.B.....G.G.P.P.#',
      '#..................#',
      '#...C.C.........K..#',
      'D..R...12.......J..#',
      'D..R...34.......J..#',
      '#...C.C.........K..#',
      '#..................#',
      '#M..T......X......E#',
      '####################',
    ],
  };

  it('convierte coordenadas mundo <-> celda correctamente', () => {
    const center = cellToWorld(2, 3);
    expect(center.x).toBe(2 * TILE_SIZE + TILE_SIZE / 2);
    expect(center.y).toBe(HUD_HEIGHT + 3 * TILE_SIZE + TILE_SIZE / 2);

    const cell = worldToCell(center.x, center.y);
    expect(cell.col).toBe(2);
    expect(cell.row).toBe(3);
  });

  it('parsea un layout extrayendo entidades clave', () => {
    const parsed = parseLayout(validLevel);
    expect(parsed.spawns.length).toBe(4);
    expect(parsed.spawns[0]).toEqual({ col: 7, row: 4, playerIndex: 0 });
    expect(parsed.spawns[1]).toEqual({ col: 8, row: 4, playerIndex: 1 });
    expect(parsed.doors.length).toBe(2);
    expect(parsed.triage.length).toBe(2);
    expect(parsed.beds.length).toBe(3);
    expect(parsed.stretcherSpawns.length).toBe(1);
    expect(parsed.exits.length).toBe(1);
  });

  it('valida con éxito un nivel correcto', () => {
    const res = validateLevel(validLevel);
    expect(res.valid).toBe(true);
    expect(res.errors).toEqual([]);
  });

  it('detecta errores de dimensión', () => {
    const badRows = { ...validLevel, layout: ['####'] };
    const res = validateLevel(badRows);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('filas'))).toBe(true);
  });

  it('detecta perímetros inválidos y spawns faltantes', () => {
    const badPerimeter: LevelData = {
      ...validLevel,
      layout: [
        '####################',
        '#B.B.B.....G.G.P.P.#',
        '#..................#',
        '#...C.C.........K..#',
        'D..R............J..#', // falta spawn 1 y 2
        'D..R...34.......J..#',
        '#...C.C.........K..#',
        '#..................#',
        '.M..T......X......E#', // '.' en perímetro
        '####################',
      ],
    };
    const res = validateLevel(badPerimeter);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('perímetro'))).toBe(true);
    expect(res.errors.some((e) => e.includes("spawn '1'"))).toBe(true);
  });

  it('detecta celdas transitables aisladas/inalcanzables', () => {
    const isolatedBox: LevelData = {
      ...validLevel,
      layout: [
        '####################',
        '#B.B.B.....G.G.P.P.#',
        '#..................#',
        '###.C.C.........K..#',
        'D##R...12.......J..#', // D aislado por paredes
        'D##R...34.......J..#',
        '###.C.C.........K..#',
        '#..................#',
        '#M..T......X......E#',
        '####################',
      ],
    };
    const res = validateLevel(isolatedBox);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('inalcanzable'))).toBe(true);
  });
});
