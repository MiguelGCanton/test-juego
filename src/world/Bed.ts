import type { GridPos } from '../levels/LevelLoader';
import type { Interactable, InteractionContext } from './Interactable';
import type { Patient } from '../patients/Patient';
import type { Item } from '../items/Item';
import type { ItemType } from '../items/ItemType';
import { ProgressTimer } from '../core/ProgressTimer';
import { BED_CLEANING_TIME_SEC } from '../config/constants';
import type { VisualState, VisualStateProvider } from './VisualState';

export type BedState = 'limpia' | 'ocupada' | 'sucia';

/**
 * Cama 'B' del hospital donde se alojan, tratan y dan de alta a los pacientes.
 * Tras el alta pasa a 'sucia' y debe ser limpiada con 'sabanas' durante 2 segundos.
 */
export class Bed implements Interactable, VisualStateProvider {
  public readonly cell: GridPos;
  public readonly type = 'B';
  public state: BedState = 'limpia';
  public patient: Patient | null = null;
  public storedItem: Item | null = null;

  // Temporizador de tratamiento en cama (1.5 s)
  public readonly treatmentTimer = new ProgressTimer(1.5);
  public isTreating = false;

  // Temporizador de limpieza de cama sucia (2.0 s con sábanas)
  public readonly cleaningTimer = new ProgressTimer(BED_CLEANING_TIME_SEC);
  public isCleaning = false;

  // Estado de emergencia Código Azul
  public hasCodeBlue = false;
  public codeBlueWorkers = 0;
  public codeBlueRequiredWorkers = 2;
  public codeBlueProgress = 0;

  private onDischargeCallback?: (patient: Patient, bed: Bed) => void;

  constructor(cell: GridPos, onDischarge?: (patient: Patient, bed: Bed) => void) {
    this.cell = cell;
    this.onDischargeCallback = onDischarge;
  }

  public get isClean(): boolean {
    return this.state === 'limpia' && this.patient === null;
  }

  public get isOccupied(): boolean {
    return this.patient !== null;
  }

  public get isDirty(): boolean {
    return this.state === 'sucia';
  }

  public assignPatient(patient: Patient): boolean {
    if (!this.isClean) return false;
    this.patient = patient;
    this.state = 'ocupada';
    this.treatmentTimer.reset();
    return true;
  }

  public releasePatient(dirtyAfterward = true): Patient | null {
    const p = this.patient;
    this.patient = null;
    this.state = dirtyAfterward ? 'sucia' : 'limpia';
    this.treatmentTimer.reset();
    this.isTreating = false;
    this.isCleaning = false;
    this.hasCodeBlue = false;
    return p;
  }

  public clean(): boolean {
    if (this.state !== 'sucia') return false;
    this.state = 'limpia';
    this.cleaningTimer.reset();
    this.isCleaning = false;
    return true;
  }

  /**
   * Determina qué ítem requiere el paciente en cama para su tratamiento actual.
   */
  public getRequiredItemType(): ItemType | null {
    if (!this.patient) return null;
    const ailment = this.patient.ailment.id;
    if (ailment === 'herida') return 'venda';
    if (ailment === 'fractura') {
      return this.patient.xrayCompleted ? 'venda' : null;
    }
    if (ailment === 'fiebre') return 'jeringa';
    return null;
  }

  public onUseHold(ctx: InteractionContext, deltaSec: number): void {
    // 1. Limpieza de cama sucia con sábanas
    if (this.isDirty) {
      if (ctx.player.carriedItem?.type === 'sabanas') {
        this.isCleaning = true;
        const cleaned = this.cleaningTimer.advance(deltaSec);
        if (cleaned) {
          ctx.player.drop(); // Consumir sábanas limpias
          this.clean();
        }
      } else {
        this.isCleaning = false;
      }
      return;
    }

    // 2. Tratamiento de paciente en cama
    if (!this.patient || this.patient.state === 'Esperando' || this.patient.state === 'Alta' || this.patient.state === 'Perdido') {
      this.isTreating = false;
      return;
    }

    const reqItem = this.getRequiredItemType();
    // Validar si el jugador lleva el ítem requerido
    if (reqItem && ctx.player.carriedItem?.type !== reqItem) {
      this.isTreating = false;
      return;
    }

    this.isTreating = true;
    this.patient.startTreatment();
    const completed = this.treatmentTimer.advance(deltaSec);

    if (completed) {
      this.isTreating = false;
      this.treatmentTimer.reset();

      // Consumir el ítem del jugador si fue necesario
      if (reqItem) {
        ctx.player.drop();
      }

      const dischargedPatient = this.patient;
      dischargedPatient.discharge();
      this.releasePatient(true); // Cama queda sucia

      if (this.onDischargeCallback) {
        this.onDischargeCallback(dischargedPatient, this);
      }
    }
  }

  public onUseEnd(_ctx: InteractionContext): void {
    this.isCleaning = false;
    if (this.isTreating && this.patient) {
      this.isTreating = false;
      this.patient.stopTreatment();
    }
  }

  public canInteract(ctx: InteractionContext): boolean {
    if (this.isDirty) {
      return ctx.player.carriedItem?.type === 'sabanas';
    }
    if (this.isOccupied) {
      const req = this.getRequiredItemType();
      if (!req) return true;
      return ctx.player.carriedItem?.type === req;
    }
    return false;
  }

  public getVisualState(): VisualState {
    let variant = 'base';
    if (this.isDirty) {
      variant = 'sucia';
    } else if (this.patient) {
      if (this.patient.state === 'Triado') {
        variant = 'asignada';
      } else {
        variant = 'ocupada';
      }
    }

    let activity: VisualState['activity'] = 'idle';
    if (this.hasCodeBlue) {
      activity = 'alert';
    } else if (this.isTreating || this.isCleaning) {
      activity = 'working';
    } else if (this.isOccupied || this.isDirty) {
      activity = 'loaded';
    }

    let progress: VisualState['progress'] = null;
    if (this.hasCodeBlue) {
      progress = { value: this.codeBlueProgress, kind: 'alerta' };
    } else if (this.isCleaning) {
      progress = { value: this.cleaningTimer.progress, kind: 'limpieza' };
    } else if (this.isTreating) {
      progress = { value: this.treatmentTimer.progress, kind: 'tratamiento' };
    }

    const stain = this.isDirty
      ? (this.isCleaning ? Math.max(0, 1 - this.cleaningTimer.progress) : 1)
      : 0;

    const workers = this.hasCodeBlue
      ? { current: this.codeBlueWorkers, required: this.codeBlueRequiredWorkers }
      : null;

    const badge = this.hasCodeBlue ? 'warning' : null;

    const reqItem = this.isTreating ? this.getRequiredItemType() : null;
    const item = reqItem
      ? { type: reqItem }
      : this.storedItem
        ? { type: this.storedItem.type }
        : null;

    return {
      variant,
      activity,
      item,
      progress,
      workers,
      badge,
      stain,
    };
  }
}
