import Phaser from 'phaser';
import { GAME_WIDTH, MAX_PLAYERS, SCENE_KEYS, UI_COLORS } from '../config/constants';
import { getInput, getRoster, getSound } from '../core/services';
import { addText, addTitle } from '../core/ui';
import { CONTROL_HINTS } from '../input/keyBindings';

/**
 * Lobby: cada dispositivo pulsa AGARRAR para unirse, USAR para salir.
 * Con ≥1 jugador, DASH inicia. Ver docs/MULTIJUGADOR.md.
 */
export class LobbyScene extends Phaser.Scene {
  private cards: Phaser.GameObjects.Container[] = [];
  private hint!: Phaser.GameObjects.Text;

  constructor() {
    super(SCENE_KEYS.Lobby);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(UI_COLORS.background);
    addTitle(this, 'LOBBY', 80);
    addText(this, GAME_WIDTH / 2, 150, 'AGARRAR = unirse · USAR = salir · DASH = empezar', 22, UI_COLORS.textMuted);
    getRoster(this).clear();
    this.cards = [];
    for (let i = 0; i < MAX_PLAYERS; i++) {
      const x = 160 + i * 320;
      const bg = this.add.rectangle(0, 0, 280, 360, UI_COLORS.panel).setStrokeStyle(3, UI_COLORS.panelLight);
      const label = this.add
        .text(0, -150, `P${i + 1}`, { fontSize: '40px', color: UI_COLORS.textMuted })
        .setOrigin(0.5);
      const status = this.add
        .text(0, 0, 'Esperando…', { fontSize: '22px', color: UI_COLORS.textMuted, align: 'center', wordWrap: { width: 250 } })
        .setOrigin(0.5);
      this.cards.push(this.add.container(x + 0, 400, [bg, label, status]));
    }
    this.hint = addText(this, GAME_WIDTH / 2, 640, '', 24, UI_COLORS.textWarning);
  }

  update(): void {
    const input = getInput(this);
    const roster = getRoster(this);
    input.update();
    let startRequested = false;
    for (const d of input.getDevices()) {
      const f = input.read(d.id);
      if (f.grabPressed) {
        const joined = roster.join(d.id);
        if (joined) getSound(this)?.playMenuSelect();
      }
      if (f.usePressed) {
        if (roster.has(d.id)) {
          roster.leave(d.id);
          getSound(this)?.playMenuMove();
        }
      }
      if (f.dashPressed && roster.has(d.id)) startRequested = true;
    }
    this.cards.forEach((card, i) => {
      const p = roster.players[i];
      const [bg, label, status] = card.list as [Phaser.GameObjects.Rectangle, Phaser.GameObjects.Text, Phaser.GameObjects.Text];
      bg.setFillStyle(p ? p.color : UI_COLORS.panel, p ? 0.35 : 1);
      label.setText(p ? p.name : `P${i + 1}`).setColor(p ? '#ffffff' : UI_COLORS.textMuted);
      const dev = p ? input.getDevice(p.deviceId) : undefined;
      status.setText(dev ? `${dev.label}\n\n${CONTROL_HINTS[dev.kind === 'gamepad' ? 'gamepad' : dev.id]}` : 'Esperando…');
    });
    this.hint.setText(roster.players.length === 0 ? 'Se necesita al menos 1 jugador' : '');
    if (startRequested && roster.players.length > 0) {
      getSound(this)?.playMenuSelect();
      this.scene.start(SCENE_KEYS.LevelSelect);
    }
  }
}
