import { MAX_PLAYERS } from '../config/constants';
import { GamepadDevice, KeyboardDevice } from './devices';
import { KEYBOARD_SCHEMES } from './keyBindings';
import { EMPTY_FRAME, type InputDevice, type InputFrame, type InputState } from './types';

/**
 * Gestiona los dispositivos disponibles y calcula `InputFrame` (con flancos)
 * por dispositivo. Se actualiza UNA vez por frame con `update()`.
 * Llamar a `read(deviceId)` desde cualquier sistema después de `update()`.
 */
export class InputManager {
  private readonly devices = new Map<string, InputDevice>();
  private readonly prev = new Map<string, InputState>();
  private readonly frames = new Map<string, InputFrame>();

  constructor() {
    for (const scheme of KEYBOARD_SCHEMES) this.devices.set(scheme.id, new KeyboardDevice(scheme));
  }

  /** Lista de dispositivos conectados (teclados + gamepads). */
  getDevices(): InputDevice[] {
    return [...this.devices.values()].filter((d) => d.isConnected());
  }

  getDevice(id: string): InputDevice | undefined {
    return this.devices.get(id);
  }

  update(): void {
    this.syncGamepads();
    for (const [id, device] of this.devices) {
      if (!device.isConnected()) {
        this.frames.set(id, EMPTY_FRAME);
        continue;
      }
      const cur = device.read();
      const prev = this.prev.get(id) ?? { ...EMPTY_FRAME };
      this.frames.set(id, {
        ...cur,
        grabPressed: cur.grab && !prev.grab,
        usePressed: cur.use && !prev.use,
        useReleased: !cur.use && prev.use,
        dashPressed: cur.dash && !prev.dash,
        pausePressed: cur.pause && !prev.pause,
      });
      this.prev.set(id, cur);
    }
  }

  read(deviceId: string): InputFrame {
    return this.frames.get(deviceId) ?? EMPTY_FRAME;
  }

  private syncGamepads(): void {
    const pads = navigator.getGamepads?.() ?? [];
    for (const pad of pads) {
      if (!pad || !pad.connected) continue;
      const id = `pad-${pad.index}`;
      if (!this.devices.has(id)) this.devices.set(id, new GamepadDevice(pad.index, `Mando ${pad.index + 1}`));
    }
    // Dispositivos de mando que ya no existen se descartan.
    for (const [id, d] of this.devices) {
      if (d.kind === 'gamepad' && !d.isConnected()) this.devices.delete(id);
    }
  }
}

export { MAX_PLAYERS };
