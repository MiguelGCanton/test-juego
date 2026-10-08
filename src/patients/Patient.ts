import type { GridPos } from '../levels/LevelLoader';

export type Severity = 'leve' | 'grave';

export type PatientState =
  | 'Esperando'
  | 'Triado'
  | 'EnCamilla'
  | 'EnCama'
  | 'EnTratamiento'
  | 'Alta'
  | 'Perdido';

export type AilmentType = 'herida' | 'fiebre' | 'fractura' | 'cirugia';

export interface AilmentDefinition {
  id: AilmentType;
  name: string;
  severity: Severity;
  patienceSec: number;
  canWalkAlone: boolean;
  baseScore: number;
}

export const AILMENTS: Record<AilmentType, AilmentDefinition> = {
  herida: {
    id: 'herida',
    name: 'Herida abierta',
    severity: 'leve',
    patienceSec: 90,
    canWalkAlone: true,
    baseScore: 100,
  },
  fiebre: {
    id: 'fiebre',
    name: 'Fiebre alta',
    severity: 'leve',
    patienceSec: 90,
    canWalkAlone: true,
    baseScore: 100,
  },
  fractura: {
    id: 'fractura',
    name: 'Fractura ósea',
    severity: 'grave',
    patienceSec: 75,
    canWalkAlone: false,
    baseScore: 250,
  },
  cirugia: {
    id: 'cirugia',
    name: 'Cirugía de urgencia',
    severity: 'grave',
    patienceSec: 90,
    canWalkAlone: false,
    baseScore: 400,
  },
};

let nextPatientId = 1;

/**
 * Modelo de paciente con máquina de estados finitos (FSM) y control de paciencia.
 * Lógica pura sin dependencias del motor de renderizado.
 */
export class Patient {
  public readonly id: string;
  public readonly ailment: AilmentDefinition;
  public state: PatientState = 'Esperando';

  public readonly maxPatienceSec: number;
  public currentPatienceSec: number;

  public assignedBedCell: GridPos | null = null;
  public currentStepIndex = 0;
  public xrayCompleted = false;

  constructor(ailmentType: AilmentType, id?: string) {
    this.ailment = AILMENTS[ailmentType];
    this.id = id ?? `patient-${ailmentType}-${nextPatientId++}`;
    this.maxPatienceSec = this.ailment.patienceSec;
    this.currentPatienceSec = this.maxPatienceSec;
  }

  public get patienceRatio(): number {
    return Math.max(0, Math.min(1, this.currentPatienceSec / this.maxPatienceSec));
  }

  public get isSevere(): boolean {
    return this.ailment.severity === 'grave';
  }

  public get canWalkAlone(): boolean {
    return this.ailment.canWalkAlone;
  }

  /**
   * Actualiza la paciencia del paciente con el paso del tiempo.
   * La paciencia se congela mientras se encuentra en tratamiento o una vez finalizado.
   */
  public update(deltaSec: number): void {
    if (this.state === 'EnTratamiento' || this.state === 'Alta' || this.state === 'Perdido') {
      return;
    }

    this.currentPatienceSec -= Math.max(0, deltaSec);

    if (this.currentPatienceSec <= 0) {
      this.currentPatienceSec = 0;
      this.state = 'Perdido';
    }
  }

  public triage(bedCell: GridPos): boolean {
    if (this.state !== 'Esperando') return false;
    this.assignedBedCell = bedCell;
    this.state = 'Triado';
    return true;
  }

  public loadOntoStretcher(): boolean {
    if (this.state !== 'Esperando' && this.state !== 'Triado') return false;
    this.state = 'EnCamilla';
    return true;
  }

  public completeXRay(): boolean {
    if (this.ailment.id !== 'fractura') return false;
    this.xrayCompleted = true;
    return true;
  }

  public putInBed(): boolean {
    if (this.state !== 'Triado' && this.state !== 'Esperando' && this.state !== 'EnCamilla') return false;
    this.state = 'EnCama';
    return true;
  }

  public startTreatment(): boolean {
    if (this.state !== 'EnCama') return false;
    this.state = 'EnTratamiento';
    return true;
  }

  public stopTreatment(): boolean {
    if (this.state !== 'EnTratamiento') return false;
    this.state = 'EnCama';
    return true;
  }

  public discharge(): boolean {
    if (this.state === 'Alta' || this.state === 'Perdido') return false;
    this.state = 'Alta';
    return true;
  }
}
