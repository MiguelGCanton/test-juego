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
  private disconnectListeners: Array<(deviceId: string, label: string) => void> = [];
  private connectListeners: Array<(deviceId: string, label: string) => void> = [];

  constructor() {
    for (const scheme of KEYBOARD_SCHEMES) this.devices.set(scheme.id, new KeyboardDevice(scheme));
    if (typeof window !== 'undefined') {
      window.addEventListener('gamepaddisconnected', (e: GamepadEvent) => {
        const id = `pad-${e.gamepad.index}`;
        const label = `Mando ${e.gamepad.index + 1}`;
        this.devices.delete(id);
        this.notifyDisconnect(id, label);
      });
      window.addEventListener('gamepadconnected', (e: GamepadEvent) => {
        const id = `pad-${e.gamepad.index}`;
        const label = `Mando ${e.gamepad.index + 1}`;
        if (!this.devices.has(id)) {
          this.devices.set(id, new GamepadDevice(e.gamepad.index, label));
        }
        this.notifyConnect(id, label);
      });
    }
  }

  public onDisconnect(listener: (deviceId: string, label: string) => void): () => void {
    this.disconnectListeners.push(listener);
    return () => {
      this.disconnectListeners = this.disconnectListeners.filter((l) => l !== listener);
    };
  }

  public onConnect(listener: (deviceId: string, label: string) => void): () => void {
    this.connectListeners.push(listener);
    return () => {
      this.connectListeners = this.connectListeners.filter((l) => l !== listener);
    };
  }

  private notifyDisconnect(deviceId: string, label: string): void {
    for (const l of this.disconnectListeners) l(deviceId, label);
  }

  private notifyConnect(deviceId: string, label: string): void {
    for (const l of this.connectListeners) l(deviceId, label);
  }

  /** Lista de dispositivos conectados (teclados + gamepads). */
  getDevices(): InputDevice[] {
    return [...this.devices.values()].filter((d) => d.isConnected());
  }

  getDevice(id: string): InputDevice | undefined {
    return this.devices.get(id);
  }

  isDeviceConnected(id: string): boolean {
    const d = this.devices.get(id);
    return d ? d.isConnected() : false;
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
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    const pads = navigator.getGamepads?.() ?? [];
    for (const pad of pads) {
      if (!pad || !pad.connected) continue;
      const id = `pad-${pad.index}`;
      if (!this.devices.has(id)) {
        this.devices.set(id, new GamepadDevice(pad.index, `Mando ${pad.index + 1}`));
      }
    }
    // Dispositivos de mando que ya no existen se descartan y notifican.
    for (const [id, d] of this.devices) {
      if (d.kind === 'gamepad' && !d.isConnected()) {
        this.devices.delete(id);
        this.notifyDisconnect(id, d.label);
      }
    }
  }
}

export { MAX_PLAYERS };
