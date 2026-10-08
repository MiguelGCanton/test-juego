/**
 * Constantes globales del juego.
 * Cualquier valor "mágico" compartido entre sistemas debe vivir aquí.
 * Ver docs/ARQUITECTURA.md §Convenciones.
 */

/** Resolución lógica del juego (se escala con Phaser.Scale.FIT). */
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

/** Tamaño de una celda de la cuadrícula del nivel, en píxeles. */
export const TILE_SIZE = 64;

/** Dimensiones de la cuadrícula de todos los niveles (20 x 10 celdas = 1280 x 640 px). */
export const GRID_COLS = 20;
export const GRID_ROWS = 10;

/** Franja superior reservada para el HUD (720 - 640 = 80 px). */
export const HUD_HEIGHT = GAME_HEIGHT - GRID_ROWS * TILE_SIZE;

/** Número máximo de jugadores locales simultáneos. */
export const MAX_PLAYERS = 4;

/** Color identificativo de cada jugador (P1..P4). Paleta "uniformes de hospital". */
export const PLAYER_COLORS: readonly number[] = [0x4fc3f7, 0xff8a65, 0x9ccc65, 0xce93d8];

/** Movimiento base del jugador en px/s. */
export const PLAYER_SPEED = 240;

/** Parámetros del Dash (T-06). */
export const DASH_SPEED_MULTIPLIER = 2.5;
export const DASH_DURATION_SEC = 0.18;
export const DASH_COOLDOWN_SEC = 1.5;

/** Parámetros de Camilla (MEC-03 / T-21 / T-22). */
export const STRETCHER_SPEED = 180;
export const STRETCHER_1P_SPEED_FACTOR = 0.7;
export const STRETCHER_2P_1ATTACHED_FACTOR = 0.4;
export const STRETCHER_2P_2ATTACHED_FACTOR = 1.0;
export const STRETCHER_TRANSFER_TIME_SEC = 1.0;

/** Parámetros de Rayos X (T-23). */
export const XRAY_PROCESS_TIME_SEC = 4.0;

/** Parámetros de Limpieza y Esterilización (MEC-04 / T-24 / T-25 / T-26). */
export const BED_CLEANING_TIME_SEC = 2.0;
export const AUTOCLAVE_PROCESS_TIME_SEC = 8.0;
export const AUTOCLAVE_CONTAMINATION_TIME_SEC = 20.0;
export const SURGERY_DURATION_SEC = 6.0;

/** Parámetros de Emergencias (MEC-05 / T-27 / T-28 / T-29 / T-30). */
export const SLIP_DURATION_SEC = 0.6;
export const SPILL_CLEAN_TIME_SEC = 2.0;
export const BLACKOUT_MAX_DURATION_SEC = 25.0;
export const BLACKOUT_VISION_RADIUS_PX = 160;
export const PANEL_FIX_TIME_SEC = 3.0;
export const CODE_BLUE_TIMEOUT_SEC = 25.0;
export const DEFIB_CHARGE_TIME_SEC = 3.0;
export const CODE_BLUE_TREAT_TIME_SEC = 2.0;
export const CODE_BLUE_SUCCESS_POINTS = 200;
export const CODE_BLUE_FAIL_PENALTY = 150;

/** Zona muerta para sticks analógicos. */
export const GAMEPAD_DEADZONE = 0.25;

/** Paleta de UI compartida (menús, HUD). */
export const UI_COLORS = {
  background: 0x0e1726,
  panel: 0x16243a,
  panelLight: 0x1f3352,
  accent: 0x2ec4b6,
  danger: 0xff5a5f,
  warning: 0xffc857,
  text: '#e8f1ff',
  textMuted: '#8aa0bf',
  textAccent: '#2ec4b6',
  textWarning: '#ffc857',
} as const;

export const FONT_FAMILY = '"Fredoka", "Trebuchet MS", sans-serif';

/** Claves de escenas. Usar SIEMPRE estas constantes en scene.start(...). */
export const SCENE_KEYS = {
  Boot: 'BootScene',
  Preload: 'PreloadScene',
  Menu: 'MenuScene',
  Lobby: 'LobbyScene',
  LevelSelect: 'LevelSelectScene',
  Game: 'GameScene',
  Hud: 'HudScene',
  Results: 'ResultsScene',
} as const;

/** Claves del registry global (this.game.registry). */
export const REGISTRY_KEYS = {
  roster: 'roster',
  input: 'input',
  sound: 'sound',
} as const;
