import { describe, it, expect } from 'vitest';
import { getFacingCell, getCellKey } from './Interactable';
import { cellToWorld } from '../levels/LevelLoader';

describe('Interactable & Targeting', () => {
  it('calcula la celda frontal según el facing del jugador', () => {
    // Jugador centrado en celda (5, 4)
    const pos = cellToWorld(5, 4);

    const facingDown = { x: pos.x, y: pos.y, facing: { x: 0, y: 1, dir: 'down' as const } };
    expect(getFacingCell(facingDown)).toEqual({ col: 5, row: 5 });

    const facingUp = { x: pos.x, y: pos.y, facing: { x: 0, y: -1, dir: 'up' as const } };
    expect(getFacingCell(facingUp)).toEqual({ col: 5, row: 3 });

    const facingRight = { x: pos.x, y: pos.y, facing: { x: 1, y: 0, dir: 'right' as const } };
    expect(getFacingCell(facingRight)).toEqual({ col: 6, row: 4 });

    const facingLeft = { x: pos.x, y: pos.y, facing: { x: -1, y: 0, dir: 'left' as const } };
    expect(getFacingCell(facingLeft)).toEqual({ col: 4, row: 4 });
  });

  it('no desborda los límites de la rejilla', () => {
    // Jugador en celda (0, 0) mirando hacia arriba
    const pos = cellToWorld(0, 0);
    const facingUp = { x: pos.x, y: pos.y, facing: { x: 0, y: -1, dir: 'up' as const } };
    expect(getFacingCell(facingUp)).toEqual({ col: 0, row: 0 });
  });

  it('getCellKey formatea col,row', () => {
    expect(getCellKey(3, 7)).toBe('3,7');
  });
});
