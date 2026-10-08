import { describe, expect, it } from 'vitest';
import { MAX_PLAYERS } from '../config/constants';
import { Roster } from './Roster';

describe('Roster', () => {
  it('asigna slots contiguos y respeta el máximo', () => {
    const r = new Roster();
    for (let i = 0; i < MAX_PLAYERS + 2; i++) r.join(`dev-${i}`);
    expect(r.players).toHaveLength(MAX_PLAYERS);
    expect(r.players.map((p) => p.name)).toEqual(['P1', 'P2', 'P3', 'P4']);
  });

  it('no duplica un dispositivo y reindexa al salir', () => {
    const r = new Roster();
    r.join('a');
    r.join('b');
    expect(r.join('a')).toBeNull();
    r.leave('a');
    expect(r.players[0]).toMatchObject({ deviceId: 'b', index: 0, name: 'P1' });
  });
});
