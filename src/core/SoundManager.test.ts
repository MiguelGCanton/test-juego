import { describe, it, expect } from 'vitest';
import { SoundManager } from './SoundManager';

describe('SoundManager (T-33)', () => {
  it('instantiates safely without error in Node/headless environment', () => {
    const sound = new SoundManager();
    expect(sound.isMuted).toBe(false);

    // Call all methods to ensure no exceptions are thrown when AudioContext is absent or headless
    expect(() => {
      sound.playPickup();
      sound.playDrop();
      sound.playProcessComplete();
      sound.playDischarge();
      sound.playPatientLost();
      sound.playEmergencyAlarm();
      sound.playDash();
      sound.playSlip();
      sound.playDefibShock();
      sound.playMenuMove();
      sound.playMenuSelect();
      sound.playTriage();
    }).not.toThrow();
  });

  it('can be muted and unmuted', () => {
    const sound = new SoundManager();
    sound.isMuted = true;
    expect(sound.isMuted).toBe(true);
    expect(() => sound.playPickup()).not.toThrow();
  });
});
