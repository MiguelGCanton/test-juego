import { GAMEPAD_DEADZONE } from '../config/constants';
import { GAMEPAD_BUTTONS, type KeyboardScheme } from './keyBindings';
import { type InputDevice, type InputState } from './types';

/** Estado compartido de teclas pulsadas (por `KeyboardEvent.code`). */
const heldKeys = new Set<string>();
let keyboardListening = false;

function ensureKeyboardListeners(): void {
  if (typeof window === 'undefined' || keyboardListening) return;
  keyboardListening = true;
  window.addEventListener('keydown', (e) => {
    heldKeys.add(e.code);
    // Evita scroll con flechas/espacio.
    if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
  });
  window.addEventListener('keyup', (e) => heldKeys.delete(e.code));
  window.addEventListener('blur', () => heldKeys.clear());
}

export class KeyboardDevice implements InputDevice {
  readonly kind = 'keyboard' as const;
  readonly id: string;
  readonly label: string;

  private readonly scheme: KeyboardScheme;

  constructor(scheme: KeyboardScheme) {
    this.scheme = scheme;
    this.id = scheme.id;
    this.label = scheme.label;
    ensureKeyboardListeners();
  }

  isConnected(): boolean {
    return true;
  }

  read(): InputState {
    const s = this.scheme;
    const k = (code: string) => heldKeys.has(code);
    return {
      moveX: (k(s.right) ? 1 : 0) - (k(s.left) ? 1 : 0),
      moveY: (k(s.down) ? 1 : 0) - (k(s.up) ? 1 : 0),
      grab: k(s.grab),
      use: k(s.use),
      dash: k(s.dash),
      pause: k(s.pause),
    };
  }
}

export class GamepadDevice implements InputDevice {
  readonly kind = 'gamepad' as const;
  readonly id: string;
  readonly label: string;

  private readonly index: number;

  constructor(index: number, label: string) {
    this.index = index;
    this.id = `pad-${index}`;
    this.label = label;
  }

  private pad(): Gamepad | null {
    return navigator.getGamepads()[this.index] ?? null;
  }

  isConnected(): boolean {
    return this.pad()?.connected ?? false;
  }

  read(): InputState {
    const pad = this.pad();
    if (!pad) return { moveX: 0, moveY: 0, grab: false, use: false, dash: false, pause: false };
    const b = (i: number) => pad.buttons[i]?.pressed ?? false;
    let x = pad.axes[0] ?? 0;
    let y = pad.axes[1] ?? 0;
    if (Math.hypot(x, y) < GAMEPAD_DEADZONE) {
      x = 0;
      y = 0;
    }
    x += (b(GAMEPAD_BUTTONS.DpadRight) ? 1 : 0) - (b(GAMEPAD_BUTTONS.DpadLeft) ? 1 : 0);
    y += (b(GAMEPAD_BUTTONS.DpadDown) ? 1 : 0) - (b(GAMEPAD_BUTTONS.DpadUp) ? 1 : 0);
    return {
      moveX: Math.max(-1, Math.min(1, x)),
      moveY: Math.max(-1, Math.min(1, y)),
      grab: b(GAMEPAD_BUTTONS.A),
      use: b(GAMEPAD_BUTTONS.X),
      dash: b(GAMEPAD_BUTTONS.B) || b(GAMEPAD_BUTTONS.RB),
      pause: b(GAMEPAD_BUTTONS.Start),
    };
  }
}
