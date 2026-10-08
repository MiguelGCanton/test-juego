import Phaser from 'phaser';
import { TILE_SIZE, PLAYER_COLORS } from '../config/constants';

/**
 * Paleta para los distintos tipos de celdas/estaciones (leyenda NIVELES.md).
 */
export const STATION_COLORS: Record<string, { bg: number; border: number; label: string }> = {
  wall: { bg: 0x223048, border: 0x3d5475, label: '' },
  floor: { bg: 0x111c2e, border: 0x182840, label: '' },
  'station-D': { bg: 0x34495e, border: 0x5d6d7e, label: 'D' }, // Puerta entrada
  'station-R': { bg: 0x2980b9, border: 0x5dade2, label: 'R' }, // Triaje
  'station-B': { bg: 0x16a085, border: 0x48c9b0, label: 'B' }, // Cama
  'station-E': { bg: 0x27ae60, border: 0x58d68d, label: 'E' }, // Salida altas
  'station-C': { bg: 0x7f8c8d, border: 0xbdc3c7, label: 'C' }, // Encimera
  'station-G': { bg: 0xe67e22, border: 0xf39c12, label: 'G' }, // Gasas
  'station-P': { bg: 0x8e44ad, border: 0xbb8fce, label: 'P' }, // Farmacia / Viales
  'station-K': { bg: 0xd35400, border: 0xe59866, label: 'K' }, // Curación (gasas->venda)
  'station-J': { bg: 0x9b59b6, border: 0xd2b4de, label: 'J' }, // Preparación (vial->jeringa)
  'station-T': { bg: 0x1abc9c, border: 0xa3e4d7, label: 'T' }, // Camilla
  'station-X': { bg: 0x2c3e50, border: 0x3498db, label: 'X' }, // Rayos X
  'station-M': { bg: 0x1abc9c, border: 0x16a085, label: 'M' }, // Armario limpieza
  'station-L': { bg: 0x2980b9, border: 0x7fb3d5, label: 'L' }, // Lavabo
  'station-A': { bg: 0xc0392b, border: 0xe74c3c, label: 'A' }, // Autoclave
  'station-Q': { bg: 0x17202a, border: 0x2e4053, label: 'Q' }, // Mesa quirúrgica
  'station-N': { bg: 0x34495e, border: 0x85929e, label: 'N' }, // Anestesia
  'station-F': { bg: 0xe74c3c, border: 0xf1948a, label: 'F' }, // Desfibrilador
  'station-U': { bg: 0xf39c12, border: 0xf7dc6f, label: 'U' }, // Cuadro eléctrico
};

export const ITEM_COLORS: Record<string, number> = {
  'item-gasas': 0xfcf3cf,
  'item-vial': 0xbb8fce,
  'item-venda': 0xf9e79f,
  'item-jeringa': 0xd2b4de,
  'item-anestesia': 0x85c1e9,
  'item-sabanas': 0xa2d9ce,
  'item-mopa': 0xedbb99,
  'item-instrumental_limpio': 0x58d68d,
  'item-instrumental_sucio': 0xec7063,
  'item-instrumental_mojado': 0x5dade2,
  'item-desfibrilador': 0xf1948a,
};

/**
 * Genera texturas procedimentales para los elementos del mundo y los ítems.
 * Garantiza que existan en this.textures tras ejecutarse en PreloadScene.
 */
export function generatePlaceholderTextures(scene: Phaser.Scene): void {
  // 1. Texturas de suelo, paredes y estaciones (64x64)
  for (const [key, conf] of Object.entries(STATION_COLORS)) {
    if (scene.textures.exists(key)) continue;

    const g = scene.make.graphics({ x: 0, y: 0 });
    // Fondo
    g.fillStyle(conf.bg, 1);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

    // Borde
    g.lineStyle(key === 'floor' ? 1 : 2, conf.border, 1);
    g.strokeRect(1, 1, TILE_SIZE - 2, TILE_SIZE - 2);

    // Detalle decorativo interior para estaciones
    if (key.startsWith('station-')) {
      g.lineStyle(1, conf.border, 0.6);
      g.strokeRect(6, 6, TILE_SIZE - 12, TILE_SIZE - 12);
    } else if (key === 'wall') {
      g.lineStyle(1, 0x1b263b, 1);
      g.strokeRect(4, 4, TILE_SIZE - 8, TILE_SIZE - 8);
    }

    g.generateTexture(key, TILE_SIZE, TILE_SIZE);
    g.destroy();
  }

  // 2. Texturas de iconos de ítems (28x28 para llevar sobre la cabeza)
  const itemSize = 28;
  for (const [key, color] of Object.entries(ITEM_COLORS)) {
    if (scene.textures.exists(key)) continue;

    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x0e1726, 0.85);
    g.fillCircle(itemSize / 2, itemSize / 2, itemSize / 2);

    g.fillStyle(color, 1);
    g.fillCircle(itemSize / 2, itemSize / 2, itemSize / 2 - 3);

    g.lineStyle(2, 0xffffff, 0.9);
    g.strokeCircle(itemSize / 2, itemSize / 2, itemSize / 2 - 3);

    g.generateTexture(key, itemSize, itemSize);
    g.destroy();
  }

  // 3. Texturas para jugadores P1..P4
  const playerSize = 44;
  PLAYER_COLORS.forEach((color, idx) => {
    const key = `player-${idx + 1}`;
    if (scene.textures.exists(key)) return;

    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(color, 1);
    g.fillCircle(playerSize / 2, playerSize / 2, playerSize / 2 - 2);

    // Borde blanco
    g.lineStyle(3, 0xffffff, 1);
    g.strokeCircle(playerSize / 2, playerSize / 2, playerSize / 2 - 2);

    // Indicador frontal (pequeño punto/cono arriba)
    g.fillStyle(0xffffff, 1);
    g.fillCircle(playerSize / 2, 8, 4);

    g.generateTexture(key, playerSize, playerSize);
    g.destroy();
  });

  // 4. Texturas para pacientes (leves y graves)
  const patientSize = 40;
  if (!scene.textures.exists('patient-leve')) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x3498db, 1);
    g.fillCircle(patientSize / 2, patientSize / 2, patientSize / 2 - 2);
    g.lineStyle(2, 0xffffff, 1);
    g.strokeCircle(patientSize / 2, patientSize / 2, patientSize / 2 - 2);
    // Cruz médica blanca
    g.fillStyle(0xffffff, 1);
    g.fillRect(patientSize / 2 - 2, 8, 4, patientSize - 16);
    g.fillRect(8, patientSize / 2 - 2, patientSize - 16, 4);
    g.generateTexture('patient-leve', patientSize, patientSize);
    g.destroy();
  }

  if (!scene.textures.exists('patient-grave')) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xe74c3c, 1);
    g.fillCircle(patientSize / 2, patientSize / 2, patientSize / 2 - 2);
    g.lineStyle(2, 0xffffff, 1);
    g.strokeCircle(patientSize / 2, patientSize / 2, patientSize / 2 - 2);
    // Cruz médica blanca
    g.fillStyle(0xffffff, 1);
    g.fillRect(patientSize / 2 - 2, 8, 4, patientSize - 16);
    g.fillRect(8, patientSize / 2 - 2, patientSize - 16, 4);
    g.generateTexture('patient-grave', patientSize, patientSize);
    g.destroy();
  }

  if (!scene.textures.exists('icon-stretcher')) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x1abc9c, 1);
    g.fillRoundedRect(2, 6, 28, 16, 3);
    g.lineStyle(2, 0xffffff, 1);
    g.strokeRoundedRect(2, 6, 28, 16, 3);
    g.generateTexture('icon-stretcher', 32, 28);
    g.destroy();
  }
}
