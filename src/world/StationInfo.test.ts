import { describe, it, expect } from 'vitest';
import { STATION_METADATA, getDeviceButtonLabels } from './StationInfo';

describe('StationInfo', () => {
  it('contiene metadatos para todos los caracteres del mapa', () => {
    const chars = ['D', 'R', 'B', 'E', 'C', 'G', 'P', 'K', 'J', 'T', 'X', 'M', 'L', 'A', 'Q', 'N', 'F', 'U'];
    for (const ch of chars) {
      expect(STATION_METADATA[ch]).toBeDefined();
      expect(STATION_METADATA[ch]?.name.length).toBeGreaterThan(0);
      expect(STATION_METADATA[ch]?.badge.length).toBeGreaterThan(0);
    }
  });

  it('devuelve las etiquetas de botones correctas según el dispositivo', () => {
    expect(getDeviceButtonLabels('kb-a')).toEqual({ grab: 'E', use: 'Q', dash: 'Espacio' });
    expect(getDeviceButtonLabels('kb-b')).toEqual({ grab: '.', use: ',', dash: 'M' });
    expect(getDeviceButtonLabels('pad-0')).toEqual({ grab: 'A', use: 'X', dash: 'B' });
  });
});
