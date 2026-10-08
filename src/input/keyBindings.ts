/**
 * Esquemas de teclado por defecto. Los valores son `KeyboardEvent.code`
 * (p. ej. 'KeyW', 'Period', 'Space'), independientes del layout del teclado.
 * Ver docs/DECISIONES.md (DEC-006 y DEC-007).
 */
export interface KeyboardScheme {
  id: string;
  label: string;
  up: string;
  down: string;
  left: string;
  right: string;
  grab: string;
  use: string;
  dash: string;
  pause: string;
}

export const KEYBOARD_SCHEMES: readonly KeyboardScheme[] = [
  {
    id: 'kb-a',
    label: 'Teclado A',
    up: 'KeyW',
    down: 'KeyS',
    left: 'KeyA',
    right: 'KeyD',
    grab: 'KeyE',
    use: 'KeyQ',
    dash: 'Space',
    pause: 'Escape',
  },
  {
    id: 'kb-b',
    label: 'Teclado B',
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight',
    grab: 'Period',
    use: 'Comma',
    dash: 'KeyM',
    pause: 'Enter',
  },
];

/** Índices estándar (W3C "standard" mapping) de botones de gamepad. */
export const GAMEPAD_BUTTONS = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  Back: 8,
  Start: 9,
  DpadUp: 12,
  DpadDown: 13,
  DpadLeft: 14,
  DpadRight: 15,
} as const;

/** Texto de ayuda para la UI (lobby, tutoriales). */
export const CONTROL_HINTS: Record<string, string> = {
  'kb-a': 'WASD mover · E agarrar · Q usar · Espacio dash',
  'kb-b': 'Flechas mover · . agarrar · , usar · M dash',
  gamepad: 'Stick mover · A agarrar · X usar · B dash',
};
