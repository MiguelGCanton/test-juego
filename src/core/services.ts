import type Phaser from 'phaser';
import { REGISTRY_KEYS } from '../config/constants';
import { InputManager } from '../input/InputManager';
import { Roster } from '../players/Roster';

/** Servicios globales compartidos por todas las escenas (registry de Phaser). */
export function initServices(game: Phaser.Game): void {
  game.registry.set(REGISTRY_KEYS.roster, new Roster());
  game.registry.set(REGISTRY_KEYS.input, new InputManager());
}

export const getRoster = (scene: Phaser.Scene): Roster => scene.registry.get(REGISTRY_KEYS.roster) as Roster;
export const getInput = (scene: Phaser.Scene): InputManager => scene.registry.get(REGISTRY_KEYS.input) as InputManager;
