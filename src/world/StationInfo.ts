/**
 * Metadatos y textos descriptivos para cada estación y componente del hospital.
 */
export interface StationMeta {
  char: string;
  name: string;
  badge: string;
  icon: string;
  desc: string;
}

export const STATION_METADATA: Record<string, StationMeta> = {
  D: { char: 'D', name: 'ENTRADA', badge: '🚪 ENTRADA', icon: '🚪', desc: 'Puerta de llegada de pacientes' },
  R: { char: 'R', name: 'TRIAJE', badge: '📋 TRIAJE', icon: '📋', desc: 'Asigna cama limpia a pacientes' },
  B: { char: 'B', name: 'CAMA', badge: '🛏️ CAMA', icon: '🛏️', desc: 'Atención y recuperación de pacientes' },
  E: { char: 'E', name: 'SALIDA', badge: '🚪 SALIDA', icon: '🚪', desc: 'Salida de pacientes dados de alta' },
  C: { char: 'C', name: 'ENCIMERA', badge: '📦 ENCIMERA', icon: '📦', desc: 'Almacena 1 ítem temporalmente' },
  G: { char: 'G', name: 'GASAS', badge: '🩹 GASAS', icon: '🩹', desc: 'Dispensador infinito de gasas' },
  P: { char: 'P', name: 'FARMACIA', badge: '💊 FARMACIA', icon: '💊', desc: 'Dispensador infinito de viales' },
  K: { char: 'K', name: 'CURACIÓN', badge: '✂️ VENDAS', icon: '✂️', desc: 'Doblar gasas -> vendas (3s)' },
  J: { char: 'J', name: 'PREPARACIÓN', badge: '💉 JERINGAS', icon: '💉', desc: 'Cargar viales -> jeringas (2s)' },
  T: { char: 'T', name: 'CAMILLA', badge: '🛞 CAMILLA', icon: '🛞', desc: 'Transporte de pacientes graves' },
  X: { char: 'X', name: 'RAYOS X', badge: '🩻 RAYOS X', icon: '🩻', desc: 'Escaneo de fracturas en camilla (4s)' },
  M: { char: 'M', name: 'ARMARIO', badge: '🧹 ARMARIO', icon: '🧹', desc: 'Sábanas limpias y mopa' },
  L: { char: 'L', name: 'LAVABO', badge: '🚰 LAVABO', icon: '🚰', desc: 'Lavar instrumental sucio -> mojado (3s)' },
  A: { char: 'A', name: 'AUTOCLAVE', badge: '🔥 AUTOCLAVE', icon: '🔥', desc: 'Esterilizar instrumental mojado (8s)' },
  Q: { char: 'Q', name: 'QUIRÓFANO', badge: '🏥 QUIRÓFANO', icon: '🏥', desc: 'Cirugía coordinada (2P, 6s)' },
  N: { char: 'N', name: 'ANESTESIA', badge: '🧪 ANESTESIA', icon: '🧪', desc: 'Dispensador de anestesia' },
  F: { char: 'F', name: 'DESFIBRILADOR', badge: '⚡ DESFIB.', icon: '⚡', desc: 'Cargar desfibrilador (3s)' },
  U: { char: 'U', name: 'CUADRO LUZ', badge: '💡 LUZ', icon: '💡', desc: 'Cuadro eléctrico para apagones (3s)' },
};

/**
 * Devuelve los nombres legibles de botones para un dispositivo determinado.
 */
export function getDeviceButtonLabels(deviceId: string): { grab: string; use: string; dash: string } {
  if (deviceId === 'kb-a') {
    return { grab: 'E', use: 'Q', dash: 'Espacio' };
  }
  if (deviceId === 'kb-b') {
    return { grab: '.', use: ',', dash: 'M' };
  }
  return { grab: 'A', use: 'X', dash: 'B' };
}
