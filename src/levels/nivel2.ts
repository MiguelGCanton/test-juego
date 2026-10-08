import type { LevelData } from './types';

export const LEVEL_2: LevelData = {
  id: 'nivel-2',
  name: 'Planta Quirúrgica: Código Azul',
  durationSec: 240,
  stars: [500, 1100, 1700],
  orders: [
    { recipeId: 'herida', weight: 3 },
    { recipeId: 'fiebre', weight: 3 },
    { recipeId: 'fractura', weight: 2 },
    { recipeId: 'cirugia', weight: 3 },
  ],
  orderIntervalSec: [12, 18],
  maxPatients: 5,
  events: [
    { type: 'spill', firstAtSec: 30, everySec: [35, 50] },
    { type: 'blackout', firstAtSec: 90, everySec: [60, 80] },
    { type: 'codeBlue', firstAtSec: 120, everySec: [70, 90] },
  ],
  layout: [
    '####################',
    '#B.B.B.B.GP.#.N.QQ##',
    '#...........#.....F#',
    '#..C.C..K.J.#......#',
    'D..R..............L#',
    'D..R...12.........A#',
    '#..C.C..34...#.....#',
    '#...........#.U....#',
    '#M..T..X...E#......#',
    '####################',
  ],
};
