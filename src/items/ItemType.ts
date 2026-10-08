/**
 * Tipos de ítems del juego según MEC-02, MEC-04 y MEC-05.
 */
export type ItemType =
  | 'gasas'
  | 'venda'
  | 'vial'
  | 'jeringa'
  | 'anestesia'
  | 'sabanas'
  | 'mopa'
  | 'instrumental_sucio'
  | 'instrumental_mojado'
  | 'instrumental_limpio'
  | 'desfibrilador';

export interface ItemDefinition {
  type: ItemType;
  name: string;
  textureKey: string;
  isHeavy?: boolean;
}

export const ITEM_DEFINITIONS: Record<ItemType, ItemDefinition> = {
  gasas: { type: 'gasas', name: 'Gasas', textureKey: 'item-gasas' },
  venda: { type: 'venda', name: 'Venda', textureKey: 'item-venda' },
  vial: { type: 'vial', name: 'Vial de medicina', textureKey: 'item-vial' },
  jeringa: { type: 'jeringa', name: 'Jeringa cargada', textureKey: 'item-jeringa' },
  anestesia: { type: 'anestesia', name: 'Anestesia', textureKey: 'item-anestesia' },
  sabanas: { type: 'sabanas', name: 'Sábanas limpias', textureKey: 'item-sabanas' },
  mopa: { type: 'mopa', name: 'Mopa', textureKey: 'item-mopa' },
  instrumental_sucio: { type: 'instrumental_sucio', name: 'Instrumental sucio', textureKey: 'item-instrumental_sucio' },
  instrumental_mojado: { type: 'instrumental_mojado', name: 'Instrumental enjuagado', textureKey: 'item-instrumental_mojado' },
  instrumental_limpio: { type: 'instrumental_limpio', name: 'Instrumental estéril', textureKey: 'item-instrumental_limpio' },
  desfibrilador: { type: 'desfibrilador', name: 'Desfibrilador', textureKey: 'item-desfibrilador', isHeavy: true },
};
