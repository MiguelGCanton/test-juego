import { GRID_COLS, GRID_ROWS, HUD_HEIGHT, TILE_SIZE } from '../config/constants';
import type { LevelData } from './types';

export interface GridPos {
  col: number;
  row: number;
}

export interface PlayerSpawn extends GridPos {
  playerIndex: number;
}

export interface StationPos extends GridPos {
  char: string;
}

export interface ParsedLevel {
  data: LevelData;
  grid: string[][];
  spawns: PlayerSpawn[];
  doors: GridPos[];
  triage: GridPos[];
  beds: GridPos[];
  exits: GridPos[];
  stretcherSpawns: GridPos[];
  stations: StationPos[];
  walls: GridPos[];
  floors: GridPos[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Convierte coordenadas de cuadrícula (col, fila) a coordenadas en el mundo en px.
 * Por defecto devuelve el CENTRO de la celda.
 */
export function cellToWorld(col: number, row: number, center = true): { x: number; y: number } {
  const offset = center ? TILE_SIZE / 2 : 0;
  return {
    x: col * TILE_SIZE + offset,
    y: HUD_HEIGHT + row * TILE_SIZE + offset,
  };
}

/**
 * Convierte una posición en el mundo a celda de la cuadrícula.
 */
export function worldToCell(x: number, y: number): GridPos {
  return {
    col: Math.floor(x / TILE_SIZE),
    row: Math.floor((y - HUD_HEIGHT) / TILE_SIZE),
  };
}

/**
 * Comprueba si una celda está dentro de los límites de la rejilla.
 */
export function isInsideGrid(col: number, row: number): boolean {
  return col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS;
}

/**
 * Caracteres que representan estaciones u obstáculos sólidos.
 */
export const SOLID_STATION_CHARS = new Set([
  'R', 'B', 'C', 'G', 'P', 'K', 'J', 'X', 'M', 'L', 'A', 'Q', 'N', 'F', 'U'
]);

/**
 * Caracteres transitables a pie.
 */
export const WALKABLE_CHARS = new Set(['.', '1', '2', '3', '4', 'D', 'E', 'T']);

/**
 * Parsea el layout de un nivel extrayendo todas sus entidades y posiciones.
 */
export function parseLayout(level: LevelData): ParsedLevel {
  const grid: string[][] = [];
  const spawns: PlayerSpawn[] = [];
  const doors: GridPos[] = [];
  const triage: GridPos[] = [];
  const beds: GridPos[] = [];
  const exits: GridPos[] = [];
  const stretcherSpawns: GridPos[] = [];
  const stations: StationPos[] = [];
  const walls: GridPos[] = [];
  const floors: GridPos[] = [];

  for (let r = 0; r < level.layout.length; r++) {
    const rowStr = level.layout[r];
    const rowChars: string[] = [];

    for (let c = 0; c < rowStr.length; c++) {
      const char = rowStr[c];
      rowChars.push(char);
      const pos: GridPos = { col: c, row: r };

      if (char === '#') {
        walls.push(pos);
      } else if (char >= '1' && char <= '4') {
        spawns.push({ col: c, row: r, playerIndex: parseInt(char, 10) - 1 });
        floors.push(pos);
      } else if (char === '.') {
        floors.push(pos);
      } else if (char === 'D') {
        doors.push(pos);
        floors.push(pos);
      } else if (char === 'R') {
        triage.push(pos);
        stations.push({ col: c, row: r, char });
      } else if (char === 'B') {
        beds.push(pos);
        stations.push({ col: c, row: r, char });
      } else if (char === 'E') {
        exits.push(pos);
        floors.push(pos);
      } else if (char === 'T') {
        stretcherSpawns.push(pos);
        floors.push(pos);
      } else if (SOLID_STATION_CHARS.has(char)) {
        stations.push({ col: c, row: r, char });
      }
    }
    grid.push(rowChars);
  }

  // Ordenar spawns por índice de jugador (0 a 3)
  spawns.sort((a, b) => a.playerIndex - b.playerIndex);

  return {
    data: level,
    grid,
    spawns,
    doors,
    triage,
    beds,
    exits,
    stretcherSpawns,
    stations,
    walls,
    floors,
  };
}

/**
 * Valida que un nivel cumpla todas las reglas del juego (docs/NIVELES.md §Reglas de validez).
 */
export function validateLevel(level: LevelData): ValidationResult {
  const errors: string[] = [];

  // 1. Dimensiones 10 filas x 20 columnas
  if (!level.layout || level.layout.length !== GRID_ROWS) {
    errors.push(`El nivel debe tener exactamente ${GRID_ROWS} filas (tiene ${level.layout?.length ?? 0}).`);
  }

  for (let r = 0; r < (level.layout?.length ?? 0); r++) {
    if (level.layout[r].length !== GRID_COLS) {
      errors.push(`La fila ${r} debe tener exactamente ${GRID_COLS} columnas (tiene ${level.layout[r].length}).`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // 2. Perímetro '#' salvo 'D' (puertas)
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const isPerimeter = r === 0 || r === GRID_ROWS - 1 || c === 0 || c === GRID_COLS - 1;
      if (isPerimeter) {
        const char = level.layout[r][c];
        if (char !== '#' && char !== 'D') {
          errors.push(`El perímetro en (${c}, ${r}) debe ser '#' o 'D', encontrado '${char}'.`);
        }
      }
    }
  }

  // 3. Spawns exactos 1, 2, 3, 4
  const spawnCounts: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0 };
  let dCount = 0;
  let rCount = 0;
  let eCount = 0;
  let tCount = 0;

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const char = level.layout[r][c];
      if (char in spawnCounts) spawnCounts[char]++;
      if (char === 'D') dCount++;
      if (char === 'R') rCount++;
      if (char === 'E') eCount++;
      if (char === 'T') tCount++;
    }
  }

  for (const s of ['1', '2', '3', '4']) {
    if (spawnCounts[s] !== 1) {
      errors.push(`Debe existir exactamente un spawn '${s}' (encontrados ${spawnCounts[s]}).`);
    }
  }

  // 4. Al menos 1 D, R, E, T
  if (dCount < 1) errors.push('Debe existir al menos 1 puerta de ingreso "D".');
  if (rCount < 1) errors.push('Debe existir al menos 1 mostrador de triaje "R".');
  if (eCount < 1) errors.push('Debe existir al menos 1 salida de altas "E".');
  if (tCount < 1) errors.push('Debe existir al menos 1 posición de camilla "T".');

  // 5. Celdas transitables alcanzables desde spawn 1 mediante BFS
  const parsed = parseLayout(level);
  if (parsed.spawns.length > 0) {
    const start = parsed.spawns[0];
    const visited = new Set<string>();
    const queue: GridPos[] = [{ col: start.col, row: start.row }];
    visited.add(`${start.col},${start.row}`);

    const directions = [
      { col: 0, row: -1 },
      { col: 0, row: 1 },
      { col: -1, row: 0 },
      { col: 1, row: 0 },
    ];

    while (queue.length > 0) {
      const cur = queue.shift()!;
      for (const d of directions) {
        const nc = cur.col + d.col;
        const nr = cur.row + d.row;
        const key = `${nc},${nr}`;
        if (isInsideGrid(nc, nr) && !visited.has(key)) {
          const char = level.layout[nr][nc];
          if (WALKABLE_CHARS.has(char)) {
            visited.add(key);
            queue.push({ col: nc, row: nr });
          }
        }
      }
    }

    // Verificar que todos los floors/spawns/exits/camillas transitables fueron alcanzados
    for (const floor of parsed.floors) {
      const key = `${floor.col},${floor.row}`;
      if (!visited.has(key)) {
        errors.push(`Celda transitable inalcanzable en (${floor.col}, ${floor.row}).`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
