import type { GridPos } from '../levels/LevelLoader';
import type { Interactable, InteractionContext } from './Interactable';
import { ProgressTimer } from '../core/ProgressTimer';
import { XRAY_PROCESS_TIME_SEC } from '../config/constants';
import type { Patient } from '../patients/Patient';
import type { Stretcher } from './Stretcher';
import { canPerformXRay } from './StretcherLogic';

/**
 * Estación de Rayos X 'X'.
 * Escanea pacientes con fractura colocados en una camilla adyacente tras mantener 'use' durante 4 segundos.
 */
export class XRayStation implements Interactable {
  public readonly cell: GridPos;
  public readonly type = 'X';
  public readonly timer = new ProgressTimer(XRAY_PROCESS_TIME_SEC);
  public isScanning = false;

  private getStretcherFn: () => Stretcher | null;
  private onCompleteCallback?: (patient: Patient) => void;

  constructor(
    cell: GridPos,
    getStretcher: () => Stretcher | null,
    onComplete?: (patient: Patient) => void
  ) {
    this.cell = cell;
    this.getStretcherFn = getStretcher;
    this.onCompleteCallback = onComplete;
  }

  public get progress(): number {
    return this.timer.progress;
  }

  public onUseHold(_ctx: InteractionContext, deltaSec: number): void {
    const stretcher = this.getStretcherFn();
    if (!stretcher || !stretcher.patient) {
      this.isScanning = false;
      return;
    }

    if (!canPerformXRay(stretcher.patient)) {
      this.isScanning = false;
      return;
    }

    // Verificar proximidad de la camilla a la estación de Rayos X (a 1.5 celdas máx.)
    if (!stretcher.isAdjacentToCell(this.cell)) {
      this.isScanning = false;
      return;
    }

    this.isScanning = true;
    const completed = this.timer.advance(deltaSec);

    if (completed) {
      this.isScanning = false;
      this.timer.reset();
      stretcher.patient.completeXRay();
      if (this.onCompleteCallback) {
        this.onCompleteCallback(stretcher.patient);
      }
    }
  }

  public onUseEnd(_ctx: InteractionContext): void {
    this.isScanning = false;
  }

  public canInteract(_ctx: InteractionContext): boolean {
    const stretcher = this.getStretcherFn();
    return (
      stretcher !== null &&
      stretcher.patient !== null &&
      canPerformXRay(stretcher.patient) &&
      stretcher.isAdjacentToCell(this.cell)
    );
  }
}
