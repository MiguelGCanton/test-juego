import Phaser from 'phaser';
import {
  GAME_HEIGHT, GAME_WIDTH, SCENE_KEYS, TILE_SIZE, UI_COLORS,
} from '../config/constants';
import { getInput, getRoster } from '../core/services';
import { cellToWorld, parseLayout, type ParsedLevel } from '../levels/LevelLoader';
import { LEVEL_1 } from '../levels/nivel1';
import { getLevelById } from '../levels/types';
import { Player } from '../players/Player';
import { getCellKey, getFacingCell, type Interactable } from '../world/Interactable';
import { Dispenser } from '../world/Dispenser';
import { Counter } from '../world/Counter';
import { ProcessStation } from '../world/ProcessStation';
import { Bed } from '../world/Bed';
import { TriageDesk } from '../world/TriageDesk';
import { Stretcher } from '../world/Stretcher';
import { XRayStation } from '../world/XRayStation';
import { PatientSpawner } from '../patients/PatientSpawner';
import { PatientView } from '../patients/PatientView';
import { ScoreTracker } from '../core/Scoring';
import { addText } from '../core/ui';

/**
 * ESCENA DE JUEGO.
 * Orquesta la física, el mapa, los jugadores, estaciones interactivas, camilla, rayos X, triaje, pacientes, pausa y HUD.
 */
export class GameScene extends Phaser.Scene {
  private levelId = '';
  public parsedLevel!: ParsedLevel;
  public obstacles!: Phaser.Physics.Arcade.StaticGroup;
  public players = new Map<string, Player>();
  public interactables = new Map<string, Interactable>();
  public beds: Bed[] = [];
  public triageDesks: TriageDesk[] = [];
  public xRayStations: XRayStation[] = [];
  public stretcher!: Stretcher;

  public spawner!: PatientSpawner;
  public patientViews = new Map<string, PatientView>();
  public scoreTracker = new ScoreTracker();
  public remainingSec = 180;
  public isLevelFinished = false;
  public isPaused = false;

  private targetHighlights!: Phaser.GameObjects.Graphics;
  private pauseContainer!: Phaser.GameObjects.Container;
  private pauseOptions = ['REANUDAR', 'REINTENTAR', 'SALIR AL MENÚ'];
  private pauseOptionLabels: Phaser.GameObjects.Text[] = [];
  private pauseSelectedIndex = 0;
  private prevPauseY = new Map<string, number>();

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
    this.beds = [];
    this.triageDesks = [];
    this.patientViews.clear();
    this.scoreTracker.reset();
    this.isLevelFinished = false;
    this.isPaused = false;

    const levelData = getLevelById(this.levelId) ?? LEVEL_1;
    this.parsedLevel = parseLayout(levelData);
    this.remainingSec = levelData.durationSec;
    this.spawner = new PatientSpawner(levelData);

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

    // 4. Instanciar estaciones e interactuables
    for (const st of this.parsedLevel.stations) {
      const { x, y } = cellToWorld(st.col, st.row);
      const texKey = `station-${st.char}`;
      const tex = this.textures.exists(texKey) ? texKey : 'wall';
      const stSprite = this.obstacles.create(x, y, tex) as Phaser.Physics.Arcade.Sprite;
      stSprite.setDepth(1);
      stSprite.refreshBody();

      this.add.text(x, y, st.char, {
        fontFamily: '"Fredoka", "Trebuchet MS", sans-serif',
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(2);

      const key = getCellKey(st.col, st.row);

      if (st.char === 'G' || st.char === 'P' || st.char === 'N' || st.char === 'M') {
        const disp = new Dispenser({ col: st.col, row: st.row }, st.char);
        this.interactables.set(key, disp);
      } else if (st.char === 'C') {
        const counter = new Counter({ col: st.col, row: st.row }, 'C');
        this.interactables.set(key, counter);
      } else if (st.char === 'K' || st.char === 'J' || st.char === 'L') {
        const proc = new ProcessStation({ col: st.col, row: st.row }, st.char);
        this.interactables.set(key, proc);
      } else if (st.char === 'B') {
        const bed = new Bed({ col: st.col, row: st.row }, (patient, b) => {
          this.handlePatientDischarge(patient, b);
        });
        this.beds.push(bed);
        this.interactables.set(key, bed);
      } else if (st.char === 'X') {
        const xRay = new XRayStation(
          { col: st.col, row: st.row },
          () => this.stretcher,
          (patient) => {
            this.events.emit('hud:message', {
              text: `¡Rayos X completado para ${patient.ailment.name}!`,
              color: '#3498db',
            });
          }
        );
        this.xRayStations.push(xRay);
        this.interactables.set(key, xRay);
      } else if (st.char === 'R') {
        const desk = new TriageDesk(
          { col: st.col, row: st.row },
          () => this.spawner.activePatients,
          () => this.beds,
          (res) => {
            this.events.emit('hud:message', {
              text: `Paciente asignado a cama (${res.bed.cell.col}, ${res.bed.cell.row})`,
              color: '#2ec4b6',
            });
          }
        );
        this.triageDesks.push(desk);
        this.interactables.set(key, desk);
      }
    }

    // 5. Puertas 'D' y salidas 'E'
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

    // 6. Resaltado de celda frontal
    this.targetHighlights = this.add.graphics().setDepth(3);

    // 7. Spawns de entidades Player
    const roster = getRoster(this);
    roster.players.forEach((slot) => {
      const spawn = this.parsedLevel.spawns[slot.index] ?? { col: 7 + slot.index, row: 4 };
      const { x, y } = cellToWorld(spawn.col, spawn.row);
      const player = new Player(this, x, y, slot);
      this.players.set(slot.deviceId, player);

      this.physics.add.collider(player, this.obstacles);
    });

    // 8. Spawn de Camilla (MEC-03 / T-21)
    const stSpawn = this.parsedLevel.stretcherSpawns[0] ?? { col: 4, row: 8 };
    const stWorld = cellToWorld(stSpawn.col, stSpawn.row);
    this.stretcher = new Stretcher(this, stWorld.x, stWorld.y);

    this.physics.add.collider(this.stretcher, this.obstacles);
    this.players.forEach((player) => {
      this.physics.add.collider(
        player,
        this.stretcher,
        undefined,
        () => !this.stretcher.isAttached(player)
      );
    });

    // 9. Crear overlay de pausa (T-20)
    this.createPauseOverlay();

    // 9. Pausar al perder foco de ventana
    this.game.events.on('blur', () => {
      if (!this.isPaused && !this.isLevelFinished) {
        this.togglePause(true);
      }
    });

    // 10. Iniciar escena paralela de HUD
    this.scene.launch(SCENE_KEYS.Hud, { levelData });
  }

  private createPauseOverlay(): void {
    this.pauseContainer = this.add.container(0, 0).setDepth(50).setVisible(false);

    // Telón translúcido
    const bg = this.add.graphics();
    bg.fillStyle(0x0e1726, 0.85);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.pauseContainer.add(bg);

    // Título
    const title = this.add.text(GAME_WIDTH / 2, 200, 'PAUSA', {
      fontFamily: '"Fredoka", "Trebuchet MS", sans-serif',
      fontSize: '56px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.pauseContainer.add(title);

    // Opciones
    this.pauseOptionLabels = [];
    this.pauseOptions.forEach((opt, idx) => {
      const label = addText(this, GAME_WIDTH / 2, 330 + idx * 70, opt, 32);
      this.pauseOptionLabels.push(label);
      this.pauseContainer.add(label);
    });

    const hint = addText(this, GAME_WIDTH / 2, 570, 'Arriba/Abajo para elegir · AGARRAR o START para confirmar', 20, UI_COLORS.textMuted);
    this.pauseContainer.add(hint);
  }

  public togglePause(forceState?: boolean): void {
    this.isPaused = forceState ?? !this.isPaused;

    if (this.isPaused) {
      this.physics.pause();
      this.pauseContainer.setVisible(true);
      this.pauseSelectedIndex = 0;
      this.updatePauseLabels();
    } else {
      this.physics.resume();
      this.pauseContainer.setVisible(false);
    }
  }

  private updatePauseLabels(): void {
    this.pauseOptionLabels.forEach((lbl, i) => {
      lbl.setColor(i === this.pauseSelectedIndex ? UI_COLORS.textAccent : UI_COLORS.text);
    });
  }

  private handlePatientDischarge(patient: import('../patients/Patient').Patient, _bed: Bed): void {
    const points = this.scoreTracker.addDischarge(patient);
    const stars = this.scoreTracker.getStars(this.parsedLevel.data.stars);

    this.events.emit('hud:score', { score: this.scoreTracker.score, stars });
    this.events.emit('hud:message', { text: `¡Alta exitosa! +${points} pts`, color: '#2ecc71' });

    const view = this.patientViews.get(patient.id);
    if (view && this.parsedLevel.exits.length > 0) {
      const exitPos = cellToWorld(this.parsedLevel.exits[0]!.col, this.parsedLevel.exits[0]!.row);
      view.walkToExit(exitPos, () => {
        this.patientViews.delete(patient.id);
        this.spawner.removePatient(patient.id);
      });
    } else {
      view?.destroy();
      this.patientViews.delete(patient.id);
      this.spawner.removePatient(patient.id);
    }
  }

  update(_time: number, delta: number): void {
    if (this.isLevelFinished) return;

    const deltaSec = delta / 1000;
    const input = getInput(this);
    input.update();

    // Gestión del menú de pausa cuando el juego está pausado
    if (this.isPaused) {
      let dy = 0;
      let confirm = false;
      let toggle = false;

      for (const d of input.getDevices()) {
        const f = input.read(d.id);
        const prev = this.prevPauseY.get(d.id) ?? 0;
        if (Math.abs(f.moveY) > 0.5 && Math.abs(prev) <= 0.5) {
          dy = Math.sign(f.moveY);
        }
        this.prevPauseY.set(d.id, f.moveY);

        if (f.grabPressed) confirm = true;
        if (f.pausePressed) toggle = true;
      }

      if (dy) {
        this.pauseSelectedIndex = Phaser.Math.Wrap(this.pauseSelectedIndex + dy, 0, this.pauseOptions.length);
        this.updatePauseLabels();
      }

      if (toggle) {
        this.togglePause(false);
        return;
      }

      if (confirm) {
        if (this.pauseSelectedIndex === 0) {
          this.togglePause(false);
        } else if (this.pauseSelectedIndex === 1) {
          this.scene.stop(SCENE_KEYS.Hud);
          this.scene.restart({ levelId: this.levelId });
        } else {
          this.scene.stop(SCENE_KEYS.Hud);
          this.scene.start(SCENE_KEYS.Menu);
        }
      }
      return;
    }

    // 1. Temporizador de nivel
    this.remainingSec = Math.max(0, this.remainingSec - deltaSec);
    this.events.emit('hud:time', { remainingSec: this.remainingSec });

    if (this.remainingSec <= 0) {
      this.finishLevel();
      return;
    }

    // 2. Generación y actualización de pacientes
    const newPatient = this.spawner.update(deltaSec);
    if (newPatient && this.parsedLevel.doors.length > 0) {
      const doorCell = this.parsedLevel.doors[0]!;
      const { x, y } = cellToWorld(doorCell.col, doorCell.row);
      const view = new PatientView(this, x, y, newPatient);
      this.patientViews.set(newPatient.id, view);
    }

    // Actualizar vistas de pacientes y comprobar si se perdieron
    for (const patient of [...this.spawner.activePatients]) {
      const view = this.patientViews.get(patient.id);
      if (view) {
        view.updateView();
      }

      if (patient.state === 'Perdido') {
        this.scoreTracker.addPatientLost();
        const stars = this.scoreTracker.getStars(this.parsedLevel.data.stars);
        this.events.emit('hud:score', { score: this.scoreTracker.score, stars });
        this.events.emit('hud:message', { text: '¡Paciente perdido! -50 pts', color: '#e74c3c' });

        if (patient.assignedBedCell) {
          const bed = this.beds.find((b) => b.cell.col === patient.assignedBedCell?.col && b.cell.row === patient.assignedBedCell?.row);
          bed?.releasePatient(false);
        }

        view?.destroy();
        this.patientViews.delete(patient.id);
        this.spawner.removePatient(patient.id);
      }
    }

    // Emitir tickets de pedidos al HUD
    const tickets = this.spawner.activePatients.map((p) => ({
      id: p.id,
      ailmentName: p.ailment.name,
      patienceRatio: p.patienceRatio,
      bedText: p.assignedBedCell ? `Cama (${p.assignedBedCell.col},${p.assignedBedCell.row})` : 'En espera',
      isSevere: p.isSevere,
    }));
    this.events.emit('hud:orders', { tickets });

    // Comprobar si el paciente en camilla se perdió por falta de paciencia
    if (this.stretcher.patient?.state === 'Perdido') {
      const lost = this.stretcher.releasePatient()!;
      this.scoreTracker.addPatientLost();
      const stars = this.scoreTracker.getStars(this.parsedLevel.data.stars);
      this.events.emit('hud:score', { score: this.scoreTracker.score, stars });
      this.events.emit('hud:message', { text: '¡Paciente en camilla perdido! -50 pts', color: '#e74c3c' });

      if (lost.assignedBedCell) {
        const bed = this.beds.find((b) => b.cell.col === lost.assignedBedCell?.col && b.cell.row === lost.assignedBedCell?.row);
        bed?.releasePatient(false);
      }

      const view = this.patientViews.get(lost.id);
      view?.destroy();
      this.patientViews.delete(lost.id);
      this.spawner.removePatient(lost.id);
    }

    // 3. Jugadores e interacción
    this.targetHighlights.clear();
    const inputFrames = new Map<string, import('../input/types').InputFrame>();

    for (const slot of getRoster(this).players) {
      const frame = input.read(slot.deviceId);
      inputFrames.set(slot.deviceId, frame);
      const player = this.players.get(slot.deviceId);
      if (!player) continue;

      if (frame.pausePressed) {
        this.togglePause(true);
        return;
      }

      player.updatePlayer(frame, delta);

      const targetCell = getFacingCell(player);
      const key = getCellKey(targetCell.col, targetCell.row);
      const interactable = this.interactables.get(key);

      const { x, y } = cellToWorld(targetCell.col, targetCell.row, false);
      const strokeColor = interactable ? 0x2ec4b6 : slot.color;
      this.targetHighlights.lineStyle(2, strokeColor, 0.6);
      this.targetHighlights.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);

      const isNearStretcher = this.stretcher.isAdjacentToWorld(player.x, player.y);

      // Enganche / desenganche de camilla con GRAB
      if (frame.grabPressed && isNearStretcher && !player.hasItem()) {
        this.stretcher.toggleAttachPlayer(player);
      } else if (interactable) {
        const ctx = { player, cell: targetCell };

        if (frame.grabPressed) {
          interactable.onGrab?.(ctx);
        }

        if (frame.usePressed) {
          interactable.onUseStart?.(ctx);
        }

        if (frame.use) {
          interactable.onUseHold?.(ctx, deltaSec);
        }

        if (frame.useReleased) {
          interactable.onUseEnd?.(ctx);
        }
      }

      // Carga / descarga de pacientes en camilla con USE mantenido
      if (isNearStretcher && frame.use) {
        if (!this.stretcher.isOccupied) {
          // Buscar paciente grave esperando cerca
          const severePatient = this.spawner.activePatients.find(
            (p) => p.isSevere && (p.state === 'Esperando' || p.state === 'Triado')
          );
          if (severePatient) {
            const completed = this.stretcher.transferTimer.advance(deltaSec);
            this.stretcher.renderTransferProgress(this.stretcher.transferTimer.progress);
            if (completed) {
              this.stretcher.transferTimer.reset();
              this.stretcher.clearTransferProgress();
              this.stretcher.loadPatient(severePatient);
              this.events.emit('hud:message', { text: '¡Paciente cargado en camilla!', color: '#2ec4b6' });
            }
          }
        } else {
          // Camilla ocupada: buscar cama limpia adyacente para transferir
          const adjacentBed = this.beds.find(
            (b) => this.stretcher.isAdjacentToCell(b.cell) && b.isClean
          );
          if (adjacentBed) {
            const completed = this.stretcher.transferTimer.advance(deltaSec);
            this.stretcher.renderTransferProgress(this.stretcher.transferTimer.progress);
            if (completed) {
              this.stretcher.transferTimer.reset();
              this.stretcher.clearTransferProgress();
              this.stretcher.unloadToBed(adjacentBed);
              this.events.emit('hud:message', {
                text: `¡Paciente transferido a cama (${adjacentBed.cell.col}, ${adjacentBed.cell.row})!`,
                color: '#2ecc71',
              });
            }
          }
        }
      }

      if (frame.useReleased && isNearStretcher) {
        this.stretcher.transferTimer.reset();
        this.stretcher.clearTransferProgress();
      }
    }

    // 4. Actualización física y arrastre de la camilla cooperativa (T-21)
    this.stretcher.updateStretcher(
      inputFrames,
      this.players,
      getRoster(this).players.length,
      deltaSec
    );
  }

  private finishLevel(): void {
    this.isLevelFinished = true;
    this.scene.stop(SCENE_KEYS.Hud);
    const stars = this.scoreTracker.getStars(this.parsedLevel.data.stars);
    this.scene.start(SCENE_KEYS.Results ?? 'ResultsScene', {
      levelId: this.levelId,
      score: this.scoreTracker.score,
      stars,
      dischargedCount: this.scoreTracker.dischargedCount,
      lostCount: this.scoreTracker.lostCount,
    });
  }
}
