import { describe, it, expect } from 'vitest';
import type { VisualState, VisualStateProvider, VisualActivity, ProgressKind } from './VisualState';

describe('VisualState contract (T-36)', () => {
  it('conforms to VisualStateProvider interface correctly', () => {
    class DummyProvider implements VisualStateProvider {
      public getVisualState(): VisualState {
        return {
          variant: 'base',
          activity: 'idle',
          item: null,
          progress: null,
          badge: null,
        };
      }
    }

    const provider = new DummyProvider();
    const state = provider.getVisualState();
    expect(state.variant).toBe('base');
    expect(state.activity).toBe('idle');
    expect(state.item).toBeNull();
    expect(state.progress).toBeNull();
  });

  it('supports full fields including slots, workers, progress and badge', () => {
    const activity: VisualActivity = 'working';
    const kind: ProgressKind = 'proceso';
    const state: VisualState = {
      variant: 'activa',
      activity,
      item: { type: 'venda', freshness: 1 },
      slots: [{ type: 'instrumental_limpio' }, { type: 'anestesia' }],
      progress: { value: 0.75, kind },
      workers: { current: 1, required: 2 },
      badge: 'warning',
      stain: 0.5,
    };

    expect(state.activity).toBe('working');
    expect(state.progress?.value).toBe(0.75);
    expect(state.progress?.kind).toBe('proceso');
    expect(state.slots).toHaveLength(2);
    expect(state.workers?.current).toBe(1);
    expect(state.workers?.required).toBe(2);
    expect(state.badge).toBe('warning');
    expect(state.stain).toBe(0.5);
  });
});
