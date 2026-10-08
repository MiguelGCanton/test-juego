import type { LevelData } from './types';

export const LEVEL_1: LevelData = {
  id: 'nivel-1',
  name: 'Urgencias: Turno de Noche',
  durationSec: 180,
  stars: [300, 700, 1100],
  orders: [
    { recipeId: 'herida', weight: 5 },
    { recipeId: 'fiebre', weight: 4 },
    { recipeId: 'fractura', weight: 2 },
  ],
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
