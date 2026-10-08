import type { Player } from '../players/Player';
import type { GridPos } from '../levels/LevelLoader';
import { worldToCell, isInsideGrid } from '../levels/LevelLoader';

export interface InteractionContext {
  player: Player;
  cell: GridPos;
}

/**
 * Contrato base para estaciones, camas, encimeras y cualquier objeto interactuable del mundo.
 */
export interface Interactable {
  readonly cell: GridPos;
  readonly type: string;
  /** Acción inmediata al pulsar el botón de agarrar/soltar. */
  onGrab?(ctx: InteractionContext): boolean;
  /** Inicio de acción mantenida (botón de usar). */
  onUseStart?(ctx: InteractionContext): void;
  /** Frame de acción mantenida. */
  onUseHold?(ctx: InteractionContext, deltaSec: number): void;
  /** Fin de acción mantenida (al soltar botón o perder foco). */
  onUseEnd?(ctx: InteractionContext): void;
  /** Comprueba si el jugador puede interactuar en este momento. */
  canInteract?(ctx: InteractionContext): boolean;
}

/**
 * Obtiene la clave de string para mapas con clave de celda.
 */
export function getCellKey(col: number, row: number): string {
  return `${col},${row}`;
}

/**
 * Calcula la celda de la rejilla que el jugador está mirando según su facing.
 */
export function getFacingCell(player: Pick<Player, 'x' | 'y' | 'facing'>): GridPos {
  const current = worldToCell(player.x, player.y);
  const targetCol = current.col + player.facing.x;
  const targetRow = current.row + player.facing.y;

  if (isInsideGrid(targetCol, targetRow)) {
    return { col: targetCol, row: targetRow };
  }
  return current;
}
