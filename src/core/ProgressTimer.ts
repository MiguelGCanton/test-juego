/**
 * Temporizador de progreso puro (sin Phaser) para estaciones de trabajo, tratamientos y cirugías.
 */
export class ProgressTimer {
  public readonly durationSec: number;
  public elapsedSec = 0;

  constructor(durationSec: number) {
    this.durationSec = Math.max(0.001, durationSec);
  }

  public get progress(): number {
    return Math.min(1, this.elapsedSec / this.durationSec);
  }

  public get isComplete(): boolean {
    return this.elapsedSec >= this.durationSec;
  }

  /**
   * Añade tiempo al temporizador. Devuelve `true` en el tick exacto en que se completa.
   */
  public advance(deltaSec: number): boolean {
    if (this.isComplete) return false;
    const wasComplete = this.isComplete;
    this.elapsedSec += Math.max(0, deltaSec);
    return !wasComplete && this.isComplete;
  }

  public reset(): void {
    this.elapsedSec = 0;
  }
}
