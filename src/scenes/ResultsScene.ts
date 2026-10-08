import Phaser from 'phaser';
import { GAME_WIDTH, SCENE_KEYS, UI_COLORS } from '../config/constants';
import { getInput, getSound } from '../core/services';
import { addText, addTitle } from '../core/ui';

export interface ResultsData {
  levelId: string;
  score: number;
  stars: number;
  dischargedCount: number;
  lostCount: number;
}

/**
 * Escena de fin de partida que muestra el resumen de resultados, estrellas y opciones de reinicio.
 */
export class ResultsScene extends Phaser.Scene {
  private dataPayload: ResultsData = {
    levelId: 'nivel-1',
    score: 0,
    stars: 0,
    dischargedCount: 0,
    lostCount: 0,
  };

  private selected = 0;
  private options = ['REINTENTAR', 'SELECCIÓN DE NIVEL', 'MENÚ PRINCIPAL'];
  private optionLabels: Phaser.GameObjects.Text[] = [];
  private prevY = new Map<string, number>();

  constructor() {
    super(SCENE_KEYS.Results);
  }

  init(data: Partial<ResultsData>): void {
    this.dataPayload = {
      levelId: data.levelId ?? 'nivel-1',
      score: data.score ?? 0,
      stars: data.stars ?? 0,
      dischargedCount: data.dischargedCount ?? 0,
      lostCount: data.lostCount ?? 0,
    };
  }

  create(): void {
    this.cameras.main.setBackgroundColor(UI_COLORS.background);
    this.selected = 0;
    this.optionLabels = [];
    this.prevY.clear();

    addTitle(this, 'TURNO FINALIZADO', 80);

    // 1. Estrellas
    const starsStr = '★'.repeat(this.dataPayload.stars) + '☆'.repeat(3 - this.dataPayload.stars);
    const starColor = this.dataPayload.stars > 0 ? '#ffc857' : '#8aa0bf';
    addText(this, GAME_WIDTH / 2, 170, starsStr, 64, starColor);

    // 2. Puntuación obtenida
    addText(
      this,
      GAME_WIDTH / 2,
      250,
      `Puntuación final: ${this.dataPayload.score} pts`,
      32,
      '#ffffff'
    );

    // 3. Desglose de estadísticas
    addText(
      this,
      GAME_WIDTH / 2,
      310,
      `Altas completadas: ${this.dataPayload.dischargedCount}  ·  Pacientes perdidos: ${this.dataPayload.lostCount}`,
      20,
      UI_COLORS.textMuted
    );

    // 4. Opciones del menú de resultados
    this.options.forEach((opt, idx) => {
      const label = addText(this, GAME_WIDTH / 2, 430 + idx * 60, opt, 28);
      this.optionLabels.push(label);
    });

    addText(this, GAME_WIDTH / 2, 630, 'Arriba/Abajo para elegir · AGARRAR para confirmar', 18, UI_COLORS.textMuted);
  }

  update(): void {
    const input = getInput(this);
    input.update();

    let dy = 0;
    let confirm = false;

    for (const d of input.getDevices()) {
      const f = input.read(d.id);
      const prev = this.prevY.get(d.id) ?? 0;
      if (Math.abs(f.moveY) > 0.5 && Math.abs(prev) <= 0.5) {
        dy = Math.sign(f.moveY);
      }
      this.prevY.set(d.id, f.moveY);

      if (f.grabPressed) confirm = true;
    }

    if (dy) {
      this.selected = Phaser.Math.Wrap(this.selected + dy, 0, this.options.length);
      getSound(this)?.playMenuMove();
    }

    this.optionLabels.forEach((label, i) => {
      label.setColor(i === this.selected ? UI_COLORS.textAccent : UI_COLORS.text);
    });

    if (confirm) {
      getSound(this)?.playMenuSelect();
      if (this.selected === 0) {
        this.scene.start(SCENE_KEYS.Game, { levelId: this.dataPayload.levelId });
      } else if (this.selected === 1) {
        this.scene.start(SCENE_KEYS.LevelSelect);
      } else {
        this.scene.start(SCENE_KEYS.Menu);
      }
    }
  }
}
