import type { AilmentType } from '../patients/Patient';
import type { ItemType } from '../items/ItemType';

export interface RecipeStep {
  name: string;
  stationChar?: string;
  requiredItem?: ItemType;
  outputItem?: ItemType;
  durationSec?: number;
}

export interface Recipe {
  id: AilmentType;
  name: string;
  steps: readonly RecipeStep[];
}

export const RECIPES: Record<AilmentType, Recipe> = {
  herida: {
    id: 'herida',
    name: 'Curación de herida',
    steps: [
      { name: 'Tomar gasas en G', stationChar: 'G', outputItem: 'gasas' },
      { name: 'Doblar vendas en K (3 s)', stationChar: 'K', requiredItem: 'gasas', outputItem: 'venda', durationSec: 3 },
      { name: 'Aplicar venda en cama (1.5 s)', stationChar: 'B', requiredItem: 'venda', durationSec: 1.5 },
    ],
  },
  fiebre: {
    id: 'fiebre',
    name: 'Tratamiento de fiebre',
    steps: [
      { name: 'Tomar vial en P', stationChar: 'P', outputItem: 'vial' },
      { name: 'Cargar jeringa en J (2 s)', stationChar: 'J', requiredItem: 'vial', outputItem: 'jeringa', durationSec: 2 },
      { name: 'Inyectar en cama (1.5 s)', stationChar: 'B', requiredItem: 'jeringa', durationSec: 1.5 },
    ],
  },
  fractura: {
    id: 'fractura',
    name: 'Inmovilización de fractura',
    steps: [
      { name: 'Llevar en camilla a Rayos X (X)', stationChar: 'X' },
      { name: 'Escaneo de rayos X (4 s)', stationChar: 'X', durationSec: 4 },
      { name: 'Llevar a cama', stationChar: 'B' },
      { name: 'Aplicar venda en cama (1.5 s)', stationChar: 'B', requiredItem: 'venda', durationSec: 1.5 },
    ],
  },
  cirugia: {
    id: 'cirugia',
    name: 'Intervención quirúrgica',
    steps: [
      { name: 'Llevar a mesa quirúrgica (Q)', stationChar: 'Q' },
      { name: 'Suministrar instrumental limpio y anestesia', stationChar: 'Q', requiredItem: 'instrumental_limpio' },
      { name: 'Operación coordinada (6 s)', stationChar: 'Q', durationSec: 6 },
      { name: 'Trasladar a cama de recuperación', stationChar: 'B' },
    ],
  },
};
