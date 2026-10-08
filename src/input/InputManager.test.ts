import { describe, it, expect, vi } from 'vitest';
import { InputManager } from './InputManager';

describe('InputManager & Disconnection (T-31)', () => {
  it('initializes default keyboard schemes and reports them connected', () => {
    const input = new InputManager();
    const devices = input.getDevices();
    expect(devices.length).toBeGreaterThan(0);
    expect(input.isDeviceConnected('kb-a')).toBe(true);
    expect(input.isDeviceConnected('kb-b')).toBe(true);
  });

  it('reports false for non-existent or disconnected devices', () => {
    const input = new InputManager();
    expect(input.isDeviceConnected('pad-99')).toBe(false);
    expect(input.isDeviceConnected('non-existent')).toBe(false);
  });

  it('supports registering onDisconnect and onConnect callbacks', () => {
    const input = new InputManager();
    const disconnectSpy = vi.fn();
    const connectSpy = vi.fn();

    const unsubDisconnect = input.onDisconnect(disconnectSpy);
    const unsubConnect = input.onConnect(connectSpy);

    // Call internal notify methods or listener trigger
    (input as any).notifyConnect('pad-0', 'Mando 1');
    expect(connectSpy).toHaveBeenCalledWith('pad-0', 'Mando 1');

    (input as any).notifyDisconnect('pad-0', 'Mando 1');
    expect(disconnectSpy).toHaveBeenCalledWith('pad-0', 'Mando 1');

    unsubDisconnect();
    unsubConnect();

    (input as any).notifyDisconnect('pad-0', 'Mando 1');
    expect(disconnectSpy).toHaveBeenCalledTimes(1);
  });
});
