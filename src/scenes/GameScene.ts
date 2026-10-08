import Phaser from 'phaser';
import {
  GAME_HEIGHT, GAME_WIDTH, SCENE_KEYS, TILE_SIZE, UI_COLORS,
} from '../config/constants';
import { getInput, getRoster, getSound } from '../core/services';
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
import { Autoclave } from '../world/Autoclave';
import { SurgeryTable } from '../world/SurgeryTable';
import { ElectricPanel } from '../world/ElectricPanel';
import { DefibrillatorStation } from '../world/DefibrillatorStation';
import { Spill } from '../world/Spill';
import { EventDirector, type EventType } from '../events/EventDirector';
import { CodeBlueManager } from '../events/CodeBlueManager';
import { PatientSpawner } from '../patients/PatientSpawner';
import { PatientView } from '../patients/PatientView';
import { ScoreTracker } from '../core/Scoring';
import { addText } from '../core/ui';

/**
 * ESCENA DE JUEGO.
 * Orquesta la física, el mapa, los jugadores, estaciones interactivas, camilla, rayos X, autoclave, cirugía, emergencias, triaje, pacientes, pausa y HUD.
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
  public autoclaves: Autoclave[] = [];
  public surgeryTables: SurgeryTable[] = [];
  public electricPanels: ElectricPanel[] = [];
  public defibrillators: DefibrillatorStation[] = [];
  public stretcher!: Stretcher;

  public eventDirector!: EventDirector;
  public spills = new Map<string, { spill: Spill; sprite: Phaser.GameObjects.Image }>();
  public codeBlueManager = new CodeBlueManager();
  private blackoutGraphics!: Phaser.GameObjects.Graphics;

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
  private disconnectBannerText!: Phaser.GameObjects.Text;
  private tutorialContainer!: Phaser.GameObjects.Container;
  private tutorialText!: Phaser.GameObjects.Text;
  private unsubDisconnect?: () => void;

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
    const rosterCount = Math.max(1, getRoster(this).players.length);
    this.spawner = new PatientSpawner(levelData, rosterCount);

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
        const proc = new ProcessStation({ col: st.col, row: st.row }, st.char, undefined, () => {
          getSound(this)?.playProcessComplete();
        });
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
            getSound(this)?.playProcessComplete();
            this.events.emit('hud:message', {
              text: `¡Rayos X completado para ${patient.ailment.name}!`,
              color: '#3498db',
            });
          }
        );
        this.xRayStations.push(xRay);
        this.interactables.set(key, xRay);
      } else if (st.char === 'A') {
        const auto = new Autoclave(
          { col: st.col, row: st.row },
          () => {
            getSound(this)?.playProcessComplete();
            this.events.emit('hud:message', {
              text: '¡Autoclave: instrumental esterilizado!',
              color: '#58d68d',
            });
          },
          () => {
            getSound(this)?.playPatientLost();
            this.events.emit('hud:message', {
              text: '¡Atención! Instrumental contaminado en autoclave',
              color: '#e74c3c',
            });
          }
        );
        this.autoclaves.push(auto);
        this.interactables.set(key, auto);
      } else if (st.char === 'Q') {
        const isFirstQ = this.surgeryTables.length === 0;
        const surgery = new SurgeryTable(
          { col: st.col, row: st.row },
          () => this.stretcher,
          () => getRoster(this).players.length,
          isFirstQ, // Nivel 2 arranca con 1 instrumental limpio
          (patient) => {
            this.handlePatientDischarge(patient);
          }
        );
        this.surgeryTables.push(surgery);
        this.interactables.set(key, surgery);
      } else if (st.char === 'U') {
        const panel = new ElectricPanel({ col: st.col, row: st.row }, () => {
          this.eventDirector.endEvent('blackout', true);
          this.blackoutGraphics.setVisible(false);
          getSound(this)?.playProcessComplete();
          this.events.emit('hud:message', {
            text: '¡Energía restablecida en el hospital!',
            color: '#2ecc71',
          });
        });
        this.electricPanels.push(panel);
        this.interactables.set(key, panel);
      } else if (st.char === 'F') {
        const defib = new DefibrillatorStation({ col: st.col, row: st.row }, () => {
          getSound(this)?.playDefibShock();
          this.events.emit('hud:message', {
            text: '¡Desfibrilador cargado! Llévalo a la cama',
            color: '#e74c3c',
          });
        });
        this.defibrillators.push(defib);
        this.interactables.set(key, defib);
      } else if (st.char === 'R') {
        const desk = new TriageDesk(
          { col: st.col, row: st.row },
          () => this.spawner.activePatients,
          () => this.beds,
          (res) => {
            getSound(this)?.playTriage();
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

    // 9. Crear capa visual para Apagón (T-29)
    this.blackoutGraphics = this.add.graphics().setDepth(25).setVisible(false);

    // 10. Gestor de emergencias Código Azul (T-30)
    this.codeBlueManager = new CodeBlueManager((success, pointsDelta) => {
      this.eventDirector.endEvent('codeBlue', success);
      this.scoreTracker.addPoints(pointsDelta);
      const stars = this.scoreTracker.getStars(this.parsedLevel.data.stars);
      this.events.emit('hud:score', { score: this.scoreTracker.score, stars });

      if (success) {
        this.events.emit('hud:message', {
          text: `¡Código Azul resuelto! +${pointsDelta} pts`,
          color: '#2ecc71',
        });
      } else {
        this.events.emit('hud:message', {
          text: `¡Código Azul fallido! ${pointsDelta} pts y paciente perdido`,
          color: '#e74c3c',
        });
      }
    });

    // 11. Planificador de Eventos de Emergencia (T-27 / MEC-05)
    this.eventDirector = new EventDirector(
      levelData.events,
      (type: EventType) => {
        getSound(this)?.playEmergencyAlarm();
        this.handleEventStart(type);
      }
    );

    // 12. Crear overlay de pausa y desconexión (T-20, T-31)
    this.createPauseOverlay();

    // Listener de desconexión de mandos (T-31)
    const input = getInput(this);
    this.unsubDisconnect = input.onDisconnect((deviceId, label) => {
      const isPlayerDevice = getRoster(this).has(deviceId);
      if (isPlayerDevice && !this.isLevelFinished) {
        this.togglePause(true);
        this.disconnectBannerText
          .setText(`⚠️ ¡${label.toUpperCase()} DESCONECTADO!\nPor favor, reconéctalo para continuar.`)
          .setVisible(true);
      }
    });

    // 13. Pausar al perder foco de ventana
    this.game.events.on('blur', () => {
      if (!this.isPaused && !this.isLevelFinished) {
        this.togglePause(true);
      }
    });

    // 14. Crear banner de Onboarding Tutorial si es Nivel 1 (T-34)
    if (this.levelId === 'nivel-1') {
      this.createTutorialOverlay();
    }

    // 15. Iniciar escena paralela de HUD
    this.scene.launch(SCENE_KEYS.Hud, { levelData });
  }

  private createTutorialOverlay(): void {
    this.tutorialContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 32).setDepth(20);
    const bg = this.add.graphics();
    bg.fillStyle(0x16243a, 0.9);
    bg.fillRoundedRect(-500, -22, 1000, 44, 8);
    bg.lineStyle(2, 0x2ec4b6, 0.8);
    bg.strokeRoundedRect(-500, -22, 1000, 44, 8);
    this.tutorialContainer.add(bg);

    this.tutorialText = this.add.text(0, 0, '① ¡Llegó un paciente! Ve a Triaje [R] y mantén USAR para asignarle cama.', {
      fontFamily: '"Fredoka", "Trebuchet MS", sans-serif',
      fontSize: '16px',
      color: '#e8f1ff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.tutorialContainer.add(this.tutorialText);
  }

  private updateTutorial(): void {
    if (!this.tutorialContainer || !this.tutorialText) return;

    // Determinar paso de tutorial
    const active = this.spawner.activePatients;
    const hasDirtyBed = this.beds.some((b) => !b.isClean);
    const waitingTriage = active.some((p) => p.state === 'Esperando');
    const patientInBed = active.find((p) => p.state === 'EnTratamiento' || p.state === 'Triado');

    if (waitingTriage) {
      this.tutorialText.setText('① ¡Llegó un paciente! Ve a Triaje [R] y mantén USAR (X / Espacio) para asignarle cama.');
    } else if (patientInBed && patientInBed.ailment.id === 'herida') {
      this.tutorialText.setText('② HERIDA: Toma Gasas [G] (Z/J), procésalas en [K] para obtener Venda, y aplícala en su Cama [B].');
    } else if (hasDirtyBed) {
      this.tutorialText.setText('③ ¡CAMA SUCIA! Ve al Armario [M] por Sábanas y mantén USAR en la cama para limpiarla.');
    } else if (patientInBed && patientInBed.ailment.id === 'fiebre') {
      this.tutorialText.setText('④ FIEBRE: Toma un Vial en [P], prepáralo en [J] para obtener Jeringa y aplícala en su Cama.');
    } else if (patientInBed && patientInBed.ailment.id === 'fractura') {
      this.tutorialText.setText('⑤ FRACTURA: ¡Usa la Camilla [T] (Agarrar Z) para llevar al paciente a Rayos X [X]!');
    } else {
      this.tutorialText.setText('★ ¡Onboarding completado! Cura pacientes antes de que se agote su paciencia.');
    }
  }

  private handleEventStart(type: EventType): void {
    if (type === 'spill') {
      this.spawnRandomSpill();
    } else if (type === 'blackout') {
      this.electricPanels.forEach((p) => p.triggerBlackout());
      this.blackoutGraphics.setVisible(true);
      this.events.emit('hud:message', {
        text: '¡APAGÓN! Máquinas apagadas. Repara el cuadro (U)',
        color: '#f39c12',
      });
    } else if (type === 'codeBlue') {
      const occupiedBed = this.beds.find((b) => b.isOccupied);
      if (occupiedBed) {
        this.codeBlueManager.start(occupiedBed);
        this.events.emit('hud:message', {
          text: '¡CÓDIGO AZUL! Paciente en paro. ¡Trae el desfibrilador (F)!',
          color: '#e74c3c',
        });
      } else {
        this.eventDirector.endEvent('codeBlue', false);
      }
    }
  }

  private spawnRandomSpill(): void {
    // Buscar celdas de suelo libres sin estaciones ni charcos
    const availableFloors = this.parsedLevel.floors.filter((f) => {
      const key = getCellKey(f.col, f.row);
      return !this.spills.has(key) && !this.interactables.has(key);
    });

    if (availableFloors.length === 0) return;

    const floor = availableFloors[Math.floor(Math.random() * availableFloors.length)]!;
    const key = getCellKey(floor.col, floor.row);
    const { x, y } = cellToWorld(floor.col, floor.row);

    const sprite = this.add.image(x, y, 'spill-puddle').setDepth(0.8);
    const spill = new Spill(floor, () => {
      sprite.destroy();
      this.spills.delete(key);
      this.interactables.delete(key);
      this.eventDirector.endEvent('spill', true);
      this.events.emit('hud:message', {
        text: '¡Derrame limpiado con mopa!',
        color: '#2ecc71',
      });
    });

    this.spills.set(key, { spill, sprite });
    this.interactables.set(key, spill);

    this.events.emit('hud:message', {
      text: '¡Derrame en el suelo! Cuidado con resbalar, usa la mopa (M)',
      color: '#3498db',
    });
  }

  private createPauseOverlay(): void {
    this.pauseContainer = this.add.container(0, 0).setDepth(50).setVisible(false);

    // Telón translúcido
    const bg = this.add.graphics();
    bg.fillStyle(0x0e1726, 0.85);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.pauseContainer.add(bg);

    // Título
    const title = this.add.text(GAME_WIDTH / 2, 170, 'PAUSA', {
      fontFamily: '"Fredoka", "Trebuchet MS", sans-serif',
      fontSize: '56px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.pauseContainer.add(title);

    // Banner de desconexión (T-31)
    this.disconnectBannerText = this.add.text(GAME_WIDTH / 2, 250, '', {
      fontFamily: '"Fredoka", "Trebuchet MS", sans-serif',
      fontSize: '22px',
      color: '#ff5a5f',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5).setVisible(false);
    this.pauseContainer.add(this.disconnectBannerText);

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
    const input = getInput(this);
    const hasDisconnectedDevice = getRoster(this).players.some((p) => !input.isDeviceConnected(p.deviceId));

    // Si hay un mando desconectado y se intenta reanudar, mantener la pausa con el aviso
    if (forceState === false && hasDisconnectedDevice) {
      this.disconnectBannerText
        .setText('⚠️ MANDO DESCONECTADO\nPor favor, reconecta el mando para reanudar.')
        .setVisible(true);
      return;
    }

    this.isPaused = forceState ?? !this.isPaused;

    if (this.isPaused) {
      this.physics.pause();
      this.pauseContainer.setVisible(true);
      this.pauseSelectedIndex = 0;
      this.updatePauseLabels();
      if (!hasDisconnectedDevice) {
        this.disconnectBannerText.setVisible(false);
      }
    } else {
      this.physics.resume();
      this.pauseContainer.setVisible(false);
      this.disconnectBannerText.setVisible(false);
    }
  }

  private updatePauseLabels(): void {
    this.pauseOptionLabels.forEach((lbl, i) => {
      lbl.setColor(i === this.pauseSelectedIndex ? UI_COLORS.textAccent : UI_COLORS.text);
    });
  }

  private handlePatientDischarge(patient: import('../patients/Patient').Patient, _bed?: Bed): void {
    if (this.stretcher && this.stretcher.patient?.id === patient.id) {
      this.stretcher.releasePatient();
    }

    const points = this.scoreTracker.addDischarge(patient);
    const stars = this.scoreTracker.getStars(this.parsedLevel.data.stars);

    getSound(this)?.playDischarge();
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

    // Actualizar autoclaves (MEC-04 / T-25)
    this.autoclaves.forEach((a) => a.update(deltaSec));

    // Actualizar emergencias (MEC-05 / T-27 / T-29 / T-30)
    this.eventDirector.update(deltaSec);
    this.electricPanels.forEach((p) => p.update(deltaSec));
    this.codeBlueManager.update(deltaSec, getRoster(this).players.length);

    // Actualizar Onboarding Tutorial en Nivel 1 (T-34)
    this.updateTutorial();

    // Comprobar si algún jugador resbala en un charco de derrame (T-28)
    for (const player of this.players.values()) {
      for (const { spill } of this.spills.values()) {
        const spillPos = cellToWorld(spill.cell.col, spill.cell.row);
        if (Math.hypot(player.x - spillPos.x, player.y - spillPos.y) < 28) {
          spill.checkPlayerSlip(player);
        }
      }
    }

    // Comprobar asistencia en Código Azul junto a la cama (T-30)
    if (this.codeBlueManager.isCodeBlueActive && this.codeBlueManager.targetBed) {
      const targetBed = this.codeBlueManager.targetBed;
      const targetPos = cellToWorld(targetBed.cell.col, targetBed.cell.row);
      let hasDefib = false;

      for (const player of this.players.values()) {
        const dist = Math.hypot(player.x - targetPos.x, player.y - targetPos.y);
        if (dist < 80 && player.carriedItem?.type === 'desfibrilador') {
          hasDefib = true;
        }
      }
      this.codeBlueManager.setDefibrillatorPresent(hasDefib);

      for (const slot of getRoster(this).players) {
        const frame = input.read(slot.deviceId);
        const player = this.players.get(slot.deviceId);
        if (player) {
          const dist = Math.hypot(player.x - targetPos.x, player.y - targetPos.y);
          if (dist < 80 && frame.use) {
            this.codeBlueManager.addParticipant(slot.deviceId);
          } else {
            this.codeBlueManager.removeParticipant(slot.deviceId);
          }
        }
      }
    }

    // Renderizar oscuridad de apagón si está activo (T-29)
    const isBlackout = this.electricPanels.some((p) => p.isBlackoutActive);
    if (isBlackout) {
      this.blackoutGraphics.setVisible(true);
      this.blackoutGraphics.clear();
      this.blackoutGraphics.fillStyle(0x050a14, 0.94);
      this.blackoutGraphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    } else {
      this.blackoutGraphics.setVisible(false);
    }

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
        getSound(this)?.playMenuMove();
      }

      if (toggle) {
        this.togglePause(false);
        return;
      }

      if (confirm) {
        getSound(this)?.playMenuSelect();
        if (this.pauseSelectedIndex === 0) {
          this.togglePause(false);
        } else if (this.pauseSelectedIndex === 1) {
          this.unsubDisconnect?.();
          this.scene.stop(SCENE_KEYS.Hud);
          this.scene.restart({ levelId: this.levelId });
        } else {
          this.unsubDisconnect?.();
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
        getSound(this)?.playPatientLost();
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
