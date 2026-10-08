import Phaser from 'phaser';
import {
  GAME_WIDTH, HUD_HEIGHT, SCENE_KEYS, TILE_SIZE, UI_COLORS,
} from '../config/constants';
import { getInput, getRoster } from '../core/services';
import { addText } from '../core/ui';
import { cellToWorld, parseLayout, type ParsedLevel } from '../levels/LevelLoader';
import { LEVEL_1 } from '../levels/nivel1';
import { getLevelById } from '../levels/types';
import { Player } from '../players/Player';
import { getCellKey, getFacingCell, type Interactable } from '../world/Interactable';

/**
 * ESCENA DE JUEGO.
 * Renderiza el nivel, gestiona los jugadores, colisiones, interactuables y resaltado frontal.
 */
export class GameScene extends Phaser.Scene {
  private levelId = '';
  public parsedLevel!: ParsedLevel;
  public obstacles!: Phaser.Physics.Arcade.StaticGroup;
  public players = new Map<string, Player>();
  public interactables = new Map<string, Interactable>();
  private targetHighlights!: Phaser.GameObjects.Graphics;

  constructor() {
    super(SCENE_KEYS.Game);
  }

  init(data: { levelId?: string }): void {
    this.levelId = data.levelId ?? 'nivel-1';
  }

  create(): void {
    this.cameras.main.setBackgroundColor(UI_COLORS.background);
    this.players.clear();
    this.interactables.clear();

    const levelData = getLevelById(this.levelId) ?? LEVEL_1;
    this.parsedLevel = parseLayout(levelData);

    // 1. Grupo de obstáculos estáticos (física Arcade)
    this.obstacles = this.physics.add.staticGroup();

    // 2. Renderizar suelo base para todas las celdas
    for (let r = 0; r < this.parsedLevel.grid.length; r++) {
      for (let c = 0; c < this.parsedLevel.grid[r].length; c++) {
        const { x, y } = cellToWorld(c, r);
        this.add.image(x, y, 'floor').setDepth(0);
      }
    }

    // 3. Renderizar paredes como obstáculos estáticos
    for (const wall of this.parsedLevel.walls) {
      const { x, y } = cellToWorld(wall.col, wall.row);
      const wallSprite = this.obstacles.create(x, y, 'wall') as Phaser.Physics.Arcade.Sprite;
      wallSprite.setDepth(1);
      wallSprite.refreshBody();
    }

    // 4. Renderizar estaciones como obstáculos estáticos
    for (const st of this.parsedLevel.stations) {
      const { x, y } = cellToWorld(st.col, st.row);
      const texKey = `station-${st.char}`;
      const tex = this.textures.exists(texKey) ? texKey : 'wall';
      const stSprite = this.obstacles.create(x, y, tex) as Phaser.Physics.Arcade.Sprite;
      stSprite.setDepth(1);
      stSprite.refreshBody();

      // Etiqueta con el tipo de estación para máxima claridad
      this.add.text(x, y, st.char, {
        fontFamily: '"Fredoka", "Trebuchet MS", sans-serif',
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(2);
    }

    // 5. Renderizar puertas 'D' y salidas 'E' (no bloqueantes, profundidad 0.5)
    for (const door of this.parsedLevel.doors) {
      const { x, y } = cellToWorld(door.col, door.row);
      this.add.image(x, y, 'station-D').setDepth(0.5);
      this.add.text(x, y, 'D', {
        fontFamily: '"Fredoka", "Trebuchet MS", sans-serif',
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(0.6);
    }

    for (const exit of this.parsedLevel.exits) {
      const { x, y } = cellToWorld(exit.col, exit.row);
      this.add.image(x, y, 'station-E').setDepth(0.5);
      this.add.text(x, y, 'E', {
        fontFamily: '"Fredoka", "Trebuchet MS", sans-serif',
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(0.6);
    }

    // 6. Gráficos de resaltado de la celda objetivo frontal
    this.targetHighlights = this.add.graphics().setDepth(3);

    // 7. HUD superior temporal (hasta T-18)
    addText(this, GAME_WIDTH / 2, HUD_HEIGHT / 2, `${levelData.name} — ESC para volver`, 22, UI_COLORS.textMuted);

    // 8. Spawns de entidades Player según el Roster
    const roster = getRoster(this);
    roster.players.forEach((slot) => {
      const spawn = this.parsedLevel.spawns[slot.index] ?? { col: 7 + slot.index, row: 4 };
      const { x, y } = cellToWorld(spawn.col, spawn.row);
      const player = new Player(this, x, y, slot);
      this.players.set(slot.deviceId, player);

      // Colisión con obstáculos
      this.physics.add.collider(player, this.obstacles);
    });

    // Colisión entre jugadores
    const playerArray = Array.from(this.players.values());
    for (let i = 0; i < playerArray.length; i++) {
      for (let j = i + 1; j < playerArray.length; j++) {
        this.physics.add.collider(playerArray[i], playerArray[j]);
      }
    }
  }

  update(_time: number, delta: number): void {
    const input = getInput(this);
    input.update();

    this.targetHighlights.clear();

    for (const slot of getRoster(this).players) {
      const frame = input.read(slot.deviceId);
      const player = this.players.get(slot.deviceId);
      if (player) {
        player.updatePlayer(frame, delta);

        // Resaltado de la celda objetivo frontal
        const targetCell = getFacingCell(player);
        const { x, y } = cellToWorld(targetCell.col, targetCell.row, false);
        const targetInteractable = this.interactables.get(getCellKey(targetCell.col, targetCell.row));

        // Color de resaltado según si hay interactuable o es celda vacía
        const strokeColor = targetInteractable ? 0x2ec4b6 : slot.color;
        this.targetHighlights.lineStyle(2, strokeColor, 0.6);
        this.targetHighlights.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
      }

      if (frame.pausePressed) {
        this.scene.start(SCENE_KEYS.Menu);
      }
    }
  }
}
