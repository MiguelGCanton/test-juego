/**
 * Gestor de efectos de sonido sintetizados proceduralmente vía WebAudio API (T-33).
 * No requiere archivos de audio externos, latencia cero y compatible con headless/Node.
 */
export class SoundManager {
  private ctx: AudioContext | null = null;
  public isMuted = false;

  constructor() {
    this.initContext();
  }

  private initContext(): void {
    if (typeof window === 'undefined') return;
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxClass) return;

    try {
      this.ctx = new AudioCtxClass();
    } catch {
      this.ctx = null;
    }
  }

  /** Intenta reanudar el AudioContext si está suspendido por políticas de autoplay. */
  public resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /** Tono sintético con envolvente de ganancia y frecuencia opcional */
  private playTone(
    startFreq: number,
    endFreq: number,
    durationSec: number,
    type: OscillatorType = 'sine',
    gainVal = 0.15
  ): void {
    if (this.isMuted || !this.ctx) return;
    this.resume();

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(startFreq, now);
      if (startFreq !== endFreq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), now + durationSec);
      }

      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + durationSec);
    } catch {
      // Ignorar errores en navegadores restringidos
    }
  }

  /** SFX: Tomar ítem */
  public playPickup(): void {
    this.playTone(400, 650, 0.08, 'sine', 0.12);
  }

  /** SFX: Soltar / depositar ítem */
  public playDrop(): void {
    this.playTone(320, 160, 0.08, 'sine', 0.1);
  }

  /** SFX: Proceso completado en estación (K, J, L, A, etc.) */
  public playProcessComplete(): void {
    this.playTone(880, 1320, 0.25, 'triangle', 0.15);
  }

  /** SFX: Paciente curado / Alta exitosa */
  public playDischarge(): void {
    if (this.isMuted || !this.ctx) return;
    this.resume();
    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // Do, Mi, Sol, Do agudo
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.12, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.15);
      });
    } catch {
      // Fallback
    }
  }

  /** SFX: Paciente perdido / fallo */
  public playPatientLost(): void {
    this.playTone(220, 110, 0.4, 'sawtooth', 0.15);
  }

  /** SFX: Alarma de evento de emergencia (Derrame, Apagón, Código Azul) */
  public playEmergencyAlarm(): void {
    if (this.isMuted || !this.ctx) return;
    this.resume();
    try {
      const now = this.ctx.currentTime;
      [880, 587.33, 880, 587.33].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.1, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.07);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.07);
      });
    } catch {
      // Fallback
    }
  }

  /** SFX: Deslizamiento Dash */
  public playDash(): void {
    this.playTone(600, 200, 0.12, 'sine', 0.12);
  }

  /** SFX: Resbalón con charco */
  public playSlip(): void {
    this.playTone(700, 180, 0.25, 'sawtooth', 0.12);
  }

  /** SFX: Descarga de desfibrilador */
  public playDefibShock(): void {
    this.playTone(180, 440, 0.3, 'sawtooth', 0.2);
  }

  /** SFX: Navegación de menú */
  public playMenuMove(): void {
    this.playTone(440, 440, 0.04, 'sine', 0.08);
  }

  /** SFX: Selección / Confirmación en menú */
  public playMenuSelect(): void {
    this.playTone(587, 880, 0.1, 'triangle', 0.12);
  }

  /** SFX: Triaje de paciente */
  public playTriage(): void {
    this.playTone(440, 660, 0.15, 'sine', 0.12);
  }
}
