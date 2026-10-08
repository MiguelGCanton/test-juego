/**
 * Contratos del sistema de entrada multijugador.
 * Todo el gameplay lee entrada a través de `InputFrame`, NUNCA directamente
 * de teclado/gamepad. Así un jugador puede usar cualquier dispositivo.
 */

export type DeviceKind = 'keyboard' | 'gamepad';

/** Estado "crudo" de un dispositivo en un frame. */
export interface InputState {
  /** Eje horizontal normalizado [-1, 1]. */
  moveX: number;
  /** Eje vertical normalizado [-1, 1] (positivo = abajo). */
  moveY: number;
  /** Botón Agarrar / Soltar (teclado: E o "." ; gamepad: A). */
  grab: boolean;
  /** Botón Usar / Interactuar mantenido (teclado: Q o "," ; gamepad: X). */
  use: boolean;
  /** Botón Dash (teclado: Espacio o M ; gamepad: B / RB). */
  dash: boolean;
  /** Botón Pausa / Start (teclado: Esc o Enter ; gamepad: Start). */
  pause: boolean;
}

/** Estado de un frame con flancos (pressed = acaba de pulsarse este frame). */
export interface InputFrame extends InputState {
  grabPressed: boolean;
  usePressed: boolean;
  useReleased: boolean;
  dashPressed: boolean;
  pausePressed: boolean;
}

/** Un dispositivo físico (o esquema de teclado) que puede controlar a un jugador. */
export interface InputDevice {
  readonly id: string;
  readonly kind: DeviceKind;
  readonly label: string;
  isConnected(): boolean;
  read(): InputState;
}

export const EMPTY_STATE: Readonly<InputState> = Object.freeze({
  moveX: 0,
  moveY: 0,
  grab: false,
  use: false,
  dash: false,
  pause: false,
});

export const EMPTY_FRAME: Readonly<InputFrame> = Object.freeze({
  ...EMPTY_STATE,
  grabPressed: false,
  usePressed: false,
  useReleased: false,
  dashPressed: false,
  pausePressed: false,
});
