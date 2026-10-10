import type { ItemType } from '../items/ItemType';

export type VisualActivity = 'idle' | 'loaded' | 'working' | 'paused' | 'done' | 'alert' | 'disabled';
export type ProgressKind = 'proceso' | 'limpieza' | 'tratamiento' | 'carga' | 'alerta';
export type VisualBadge = 'check' | 'warning' | 'bolt' | 'skull';

export interface VisualStateItem {
  type: ItemType;
  freshness?: number;
}

export interface VisualStateProgress {
  value: number; // 0..1
  kind: ProgressKind;
}

export interface VisualStateWorkers {
  current: number;
  required: number;
}

export interface VisualState {
  variant: string;
  activity: VisualActivity;
  item?: VisualStateItem | null;
  slots?: readonly ({ type: ItemType } | null)[];
  progress?: VisualStateProgress | null;
  workers?: VisualStateWorkers | null;
  badge?: VisualBadge | null;
  stain?: number; // 0..1 intensidad de suciedad
}

export interface VisualStateProvider {
  getVisualState(): VisualState;
}
