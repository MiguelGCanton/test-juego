import type { LevelEventSpec } from '../levels/types';

export type EventType = 'spill' | 'blackout' | 'codeBlue';

export interface ActiveEvent {
  type: EventType;
  startedAtSec: number;
  durationSec: number;
}

/**
 * Planificador y orquestador de eventos de emergencia y caos (MEC-05 / T-27).
 * Lógica pura sin dependencias de Phaser para tests con reloj simulado.
 */
export class EventDirector {
  public elapsedSec = 0;
  public readonly configs = new Map<EventType, LevelEventSpec>();
  public readonly activeEvents = new Map<EventType, ActiveEvent>();
  public readonly nextTriggerSec = new Map<EventType, number>();

  private onEventStartCallback?: (type: EventType) => void;
  private onEventEndCallback?: (type: EventType, success?: boolean) => void;

  constructor(
    eventsConfig: readonly LevelEventSpec[] = [],
    onEventStart?: (type: EventType) => void,
    onEventEnd?: (type: EventType, success?: boolean) => void
  ) {
    this.onEventStartCallback = onEventStart;
    this.onEventEndCallback = onEventEnd;

    for (const conf of eventsConfig) {
      const type = conf.type as EventType;
      this.configs.set(type, conf);
      this.nextTriggerSec.set(type, conf.firstAtSec);
    }
  }

  public isEventActive(type: EventType): boolean {
    return this.activeEvents.has(type);
  }

  public get activeEventCount(): number {
    return this.activeEvents.size;
  }

  public update(deltaSec: number): EventType[] {
    this.elapsedSec += Math.max(0, deltaSec);
    const newlyTriggered: EventType[] = [];

    for (const [type, nextSec] of this.nextTriggerSec) {
      // No disparar si ya hay un evento activo de este tipo o si aún no toca
      if (this.isEventActive(type) || this.elapsedSec < nextSec) {
        continue;
      }

      this.startEvent(type);
      newlyTriggered.push(type);
    }

    return newlyTriggered;
  }

  public startEvent(type: EventType): boolean {
    if (this.isEventActive(type)) return false;

    this.activeEvents.set(type, {
      type,
      startedAtSec: this.elapsedSec,
      durationSec: 0,
    });

    if (this.onEventStartCallback) {
      this.onEventStartCallback(type);
    }
    return true;
  }

  public endEvent(type: EventType, success = true): boolean {
    if (!this.isEventActive(type)) return false;

    this.activeEvents.delete(type);
    this.scheduleNext(type);

    if (this.onEventEndCallback) {
      this.onEventEndCallback(type, success);
    }
    return true;
  }

  private scheduleNext(type: EventType): void {
    const conf = this.configs.get(type);
    if (!conf || !conf.everySec) return;

    const [minInterval, maxInterval] = conf.everySec;
    const interval = minInterval + Math.random() * (maxInterval - minInterval);
    this.nextTriggerSec.set(type, this.elapsedSec + interval);
  }
}
