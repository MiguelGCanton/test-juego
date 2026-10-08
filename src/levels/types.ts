/**
 * Esquema de datos de niveles. Los niveles se definen como DATOS (no código).
 * Ver docs/NIVELES.md para el diseño y leyenda de caracteres del `layout`.
 */

/** Leyenda de caracteres del layout ASCII (una cadena de 20 chars por fila, 10 filas). */
export type TileChar = string;

export interface LevelOrderSpec {
  /** id de receta/tarea, definido en docs/MECANICAS.md */
  recipeId: string;
  weight: number;
}

export type EventType = 'spill' | 'blackout' | 'codeBlue';

export interface LevelEventSpec {
  type: EventType;
  /** Primer disparo (segundos desde el inicio). */
  firstAtSec: number;
  /** Intervalo (min, max) entre repeticiones; omitir para evento único. */
  everySec?: readonly [number, number];
}

export interface LevelData {
  id: string;
  name: string;
  /** 10 filas × 20 columnas. Ver leyenda en docs/NIVELES.md */
  layout: readonly string[];
  /** Duración de la partida en segundos. */
  durationSec: number;
  /** Umbrales de puntuación para 1, 2 y 3 estrellas. */
  stars: readonly [number, number, number];
  orders: readonly LevelOrderSpec[];
  /** Segundos entre apariciones de nuevas órdenes (min, max). */
  orderIntervalSec: readonly [number, number];
  /** Eventos de caos (MEC-05). Vacío en niveles tutorial. */
  events: readonly LevelEventSpec[];
  /** Máx. de pacientes simultáneos en la sala (esperando + atendidos). */
  maxPatients: number;
}

import { LEVEL_1 } from './nivel1';
import { LEVEL_2 } from './nivel2';

/** Registro de niveles diseñados en el juego. */
export const LEVELS: LevelData[] = [LEVEL_1, LEVEL_2];

export function getLevelById(id: string): LevelData | undefined {
  return LEVELS.find((l) => l.id === id);
}
