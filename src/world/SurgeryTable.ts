import type { GridPos } from '../levels/LevelLoader';
import type { Interactable, InteractionContext } from './Interactable';
import { Item } from '../items/Item';
import { ProgressTimer } from '../core/ProgressTimer';
import { SURGERY_DURATION_SEC } from '../config/constants';
import type { Patient } from '../patients/Patient';
import type { Stretcher } from './Stretcher';

export type SurgeryStep = 'esperando_suministros' | 'listo_para_operar' | 'operando' | 'completado';

/**
 * Mesa Quirúrgica 'Q' (MEC-04 / T-26).
 * Requiere:
 * 1. 1 `instrumental_limpio`
 * 2. 1 `anestesia`
 * 3. Paciente grave con dolencia 'cirugia' en camilla adyacente.
 * Operación cooperativa de 6 segundos:
 * - 2 jugadores simultáneos manteniendo 'use' en multijugador.
 * - 1 jugador manteniendo 'use' en modo solitario.
 * Produce 1 `instrumental_sucio` al terminar.
 */
export class SurgeryTable implements Interactable {
  public readonly cell: GridPos;
  public readonly type = 'Q';

  public hasCleanInstrument = false;
  public hasAnesthesia = false;
  public storedDirtyInstrument: Item | null = null;

  public readonly surgeryTimer = new ProgressTimer(SURGERY_DURATION_SEC);
  public operatingPlayerIds = new Set<string>();

  private getStretcherFn: () => Stretcher | null;
  private getTotalPlayersFn: () => number;
  private onCompleteCallback?: (patient: Patient) => void;

  constructor(
    cell: GridPos,
    getStretcher: () => Stretcher | null,
    getTotalPlayers: () => number = () => 1,
    startWithCleanInstrument = false,
    onComplete?: (patient: Patient) => void
  ) {
    this.cell = cell;
    this.getStretcherFn = getStretcher;
    this.getTotalPlayersFn = getTotalPlayers;
    this.hasCleanInstrument = startWithCleanInstrument;
    this.onCompleteCallback = onComplete;
  }

  public get progress(): number {
    return this.surgeryTimer.progress;
  }

  public get isOperating(): boolean {
    return this.operatingPlayerIds.size > 0;
  }

  public get isReadyToOperate(): boolean {
    if (!this.hasCleanInstrument || !this.hasAnesthesia) return false;
    const stretcher = this.getStretcherFn();
    if (!stretcher || !stretcher.patient) return false;
    return stretcher.patient.ailment.id === 'cirugia' && stretcher.isAdjacentToCell(this.cell);
  }

  public supplyItem(item: Item): boolean {
    if (item.type === 'instrumental_limpio' && !this.hasCleanInstrument) {
      this.hasCleanInstrument = true;
      return true;
    }
    if (item.type === 'anestesia' && !this.hasAnesthesia) {
      this.hasAnesthesia = true;
      return true;
    }
    return false;
  }

  public takeDirtyInstrument(): Item | null {
    if (!this.storedDirtyInstrument) return null;
    const it = this.storedDirtyInstrument;
    this.storedDirtyInstrument = null;
    return it;
  }

  public onGrab(ctx: InteractionContext): boolean {
    // 1. Si hay instrumental sucio tras la cirugía, recogerlo
    if (!ctx.player.hasItem() && this.storedDirtyInstrument) {
      const it = this.takeDirtyInstrument();
      if (it) {
        ctx.player.pickUp(it);
        return true;
      }
      return false;
    }

    // 2. Depositar suministros necesarios (instrumental limpio o anestesia)
    if (ctx.player.carriedItem) {
      const type = ctx.player.carriedItem.type;
      if (type === 'instrumental_limpio' && !this.hasCleanInstrument) {
        ctx.player.drop();
        this.hasCleanInstrument = true;
        return true;
      } else if (type === 'anestesia' && !this.hasAnesthesia) {
        ctx.player.drop();
        this.hasAnesthesia = true;
        return true;
      }
    }
    return false;
  }

  public onUseHold(ctx: InteractionContext, deltaSec: number): void {
    if (!this.isReadyToOperate) {
      this.operatingPlayerIds.delete(ctx.player.slot.deviceId);
      return;
    }

    this.operatingPlayerIds.add(ctx.player.slot.deviceId);

    const totalPlayers = this.getTotalPlayersFn();
    const requiredSurgeons = totalPlayers > 1 ? 2 : 1;

    // Solo avanza la cirugía si se alcanza el número de cirujanos requeridos
    if (this.operatingPlayerIds.size >= requiredSurgeons) {
      const completed = this.surgeryTimer.advance(deltaSec);

      if (completed) {
        this.surgeryTimer.reset();
        this.operatingPlayerIds.clear();

        // Consumir suministros y generar instrumental sucio
        this.hasCleanInstrument = false;
        this.hasAnesthesia = false;
        this.storedDirtyInstrument = new Item('instrumental_sucio');

        const stretcher = this.getStretcherFn();
        if (stretcher && stretcher.patient) {
          const patient = stretcher.patient;
          patient.discharge();
          if (this.onCompleteCallback) {
            this.onCompleteCallback(patient);
          }
        }
      }
    }
  }

  public onUseEnd(ctx: InteractionContext): void {
    this.operatingPlayerIds.delete(ctx.player.slot.deviceId);
  }

  public canInteract(ctx: InteractionContext): boolean {
    if (this.storedDirtyInstrument && !ctx.player.hasItem()) return true;
    if (ctx.player.carriedItem?.type === 'instrumental_limpio' && !this.hasCleanInstrument) return true;
    if (ctx.player.carriedItem?.type === 'anestesia' && !this.hasAnesthesia) return true;
    return this.isReadyToOperate;
  }
}
