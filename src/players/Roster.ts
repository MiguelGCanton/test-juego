import { MAX_PLAYERS, PLAYER_COLORS } from '../config/constants';

/** Un jugador "unido" a la partida: slot (0..3) + dispositivo que lo controla. */
export interface PlayerSlot {
  index: number;
  deviceId: string;
  color: number;
  name: string;
}

/** Lista de jugadores activos. Vive en el registry global (REGISTRY_KEYS.roster). */
export class Roster {
  readonly players: PlayerSlot[] = [];

  has(deviceId: string): boolean {
    return this.players.some((p) => p.deviceId === deviceId);
  }

  join(deviceId: string): PlayerSlot | null {
    if (this.has(deviceId) || this.players.length >= MAX_PLAYERS) return null;
    const index = this.players.length;
    const slot: PlayerSlot = { index, deviceId, color: PLAYER_COLORS[index]!, name: `P${index + 1}` };
    this.players.push(slot);
    return slot;
  }

  leave(deviceId: string): void {
    const i = this.players.findIndex((p) => p.deviceId === deviceId);
    if (i < 0) return;
    this.players.splice(i, 1);
    // Reasigna índices/colores para mantener slots contiguos.
    this.players.forEach((p, idx) => {
      p.index = idx;
      p.color = PLAYER_COLORS[idx]!;
      p.name = `P${idx + 1}`;
    });
  }

  clear(): void {
    this.players.length = 0;
  }
}
