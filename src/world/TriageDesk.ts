import type { GridPos } from '../levels/LevelLoader';
import type { Interactable, InteractionContext } from './Interactable';
import { ProgressTimer } from '../core/ProgressTimer';
import type { Patient } from '../patients/Patient';
import type { Bed } from './Bed';

export interface TriageResult {
  patient: Patient;
  bed: Bed;
}

/**
 * Mostrador de triaje 'R' donde el personal sanitario clasifica pacientes
 * y les asigna una cama limpia libre mediante una acción mantenida de 1.5 s.
 */
export class TriageDesk implements Interactable {
  public readonly cell: GridPos;
  public readonly type = 'R';
  public readonly timer = new ProgressTimer(1.5);
  public isTriaging = false;
  public noBedsMessage = false;

  private patientProvider: () => Patient[];
  private bedProvider: () => Bed[];
  private onTriagedCallback?: (res: TriageResult) => void;

  constructor(
    cell: GridPos,
    patientProvider: () => Patient[],
    bedProvider: () => Bed[],
    onTriaged?: (res: TriageResult) => void
  ) {
    this.cell = cell;
    this.patientProvider = patientProvider;
    this.bedProvider = bedProvider;
    this.onTriagedCallback = onTriaged;
  }

  public getWaitingPatient(): Patient | undefined {
    return this.patientProvider().find((p) => p.state === 'Esperando');
  }

  public getAvailableBed(): Bed | undefined {
    return this.bedProvider().find((b) => b.isClean);
  }

  public onUseHold(_ctx: InteractionContext, deltaSec: number): void {
    const waitingPatient = this.getWaitingPatient();
    const availableBed = this.getAvailableBed();

    if (!waitingPatient) {
      this.isTriaging = false;
      this.noBedsMessage = false;
      this.timer.reset();
      return;
    }

    if (!availableBed) {
      this.isTriaging = false;
      this.noBedsMessage = true;
      this.timer.reset();
      return;
    }

    this.noBedsMessage = false;
    this.isTriaging = true;
    const complete = this.timer.advance(deltaSec);

    if (complete) {
      this.timer.reset();
      this.isTriaging = false;

      availableBed.assignPatient(waitingPatient);
      waitingPatient.triage(availableBed.cell);

      if (this.onTriagedCallback) {
        this.onTriagedCallback({ patient: waitingPatient, bed: availableBed });
      }
    }
  }

  public onUseEnd(_ctx: InteractionContext): void {
    this.isTriaging = false;
  }

  public canInteract(_ctx: InteractionContext): boolean {
    return this.getWaitingPatient() !== undefined;
  }
}
