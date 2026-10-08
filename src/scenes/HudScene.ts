import Phaser from 'phaser';
import { GAME_WIDTH, HUD_HEIGHT, SCENE_KEYS, UI_COLORS } from '../config/constants';

export interface OrderTicketData {
  id: string;
  ailmentName: string;
  patienceRatio: number;
  bedText: string;
  isSevere: boolean;
}

/**
 * Escena de interfaz (HUD) que se ejecuta en paralelo a GameScene.
 * Muestra el temporizador, puntuación con estrellas y los tickets de pedidos activos.
 */
export class HudScene extends Phaser.Scene {
  private timerText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private starsText!: Phaser.GameObjects.Text;
  private ticketContainer!: Phaser.GameObjects.Container;
  private notificationText!: Phaser.GameObjects.Text;

  constructor() {
    super(SCENE_KEYS.Hud);
  }

  create(): void {
    // 1. Fondo del panel de HUD
    const g = this.add.graphics();
    g.fillStyle(UI_COLORS.panel, 0.95);
    g.fillRect(0, 0, GAME_WIDTH, HUD_HEIGHT);
    g.lineStyle(2, UI_COLORS.panelLight, 1);
    g.lineBetween(0, HUD_HEIGHT, GAME_WIDTH, HUD_HEIGHT);

    // 2. Temporizador (izquierda)
    this.timerText = this.add.text(30, HUD_HEIGHT / 2, '⏱ 03:00', {
      fontFamily: '"Fredoka", "Trebuchet MS", sans-serif',
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    // 3. Puntuación y Estrellas (derecha)
    this.scoreText = this.add.text(GAME_WIDTH - 200, 24, '🏆 0 pts', {
      fontFamily: '"Fredoka", "Trebuchet MS", sans-serif',
      fontSize: '24px',
      color: UI_COLORS.warning ? '#ffc857' : '#f1c40f',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    this.starsText = this.add.text(GAME_WIDTH - 200, 56, '☆☆☆', {
      fontFamily: '"Fredoka", "Trebuchet MS", sans-serif',
      fontSize: '20px',
      color: '#f1c40f',
    }).setOrigin(0, 0.5);

    // 4. Contenedor para tickets de pedidos (centro)
    this.ticketContainer = this.add.container(200, 10);

    // 5. Notificaciones contextuales ("¡Sin camas!", "¡Alta!", etc.)
    this.notificationText = this.add.text(GAME_WIDTH / 2, HUD_HEIGHT + 24, '', {
      fontFamily: '"Fredoka", "Trebuchet MS", sans-serif',
      fontSize: '20px',
      color: '#e74c3c',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setAlpha(0);

    // Escuchar eventos de GameScene
    const gameScene = this.scene.get(SCENE_KEYS.Game);
    if (gameScene) {
      gameScene.events.on('hud:time', (data: { remainingSec: number }) => {
        const mins = Math.floor(data.remainingSec / 60);
        const secs = Math.floor(data.remainingSec % 60);
        this.timerText.setText(`⏱ ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        if (data.remainingSec <= 30) {
          this.timerText.setColor('#ff5a5f');
        }
      });

      gameScene.events.on('hud:score', (data: { score: number; stars: number }) => {
        this.scoreText.setText(`🏆 ${data.score} pts`);
        const starsStr = '★'.repeat(data.stars) + '☆'.repeat(3 - data.stars);
        this.starsText.setText(starsStr);
      });

      gameScene.events.on('hud:orders', (data: { tickets: OrderTicketData[] }) => {
        this.renderTickets(data.tickets);
      });

      gameScene.events.on('hud:message', (data: { text: string; color?: string }) => {
        this.showMessage(data.text, data.color ?? '#e74c3c');
      });
    }
  }

  private renderTickets(tickets: OrderTicketData[]): void {
    this.ticketContainer.removeAll(true);
    const cardWidth = 160;

    tickets.slice(0, 5).forEach((ticket, i) => {
      const x = i * (cardWidth + 10);
      const card = this.add.container(x, 0);

      // Fondo tarjeta
      const bg = this.add.graphics();
      bg.fillStyle(UI_COLORS.panelLight, 0.9);
      bg.fillRoundedRect(0, 0, cardWidth, 60, 6);
      bg.lineStyle(1.5, ticket.isSevere ? 0xe74c3c : 0x2ec4b6, 0.8);
      bg.strokeRoundedRect(0, 0, cardWidth, 60, 6);
      card.add(bg);

      // Nombre dolencia
      const title = this.add.text(8, 8, ticket.ailmentName, {
        fontFamily: '"Fredoka", "Trebuchet MS", sans-serif',
        fontSize: '12px',
        color: '#ffffff',
        fontStyle: 'bold',
      });
      card.add(title);

      // Estado cama
      const bed = this.add.text(8, 24, ticket.bedText, {
        fontFamily: '"Fredoka", "Trebuchet MS", sans-serif',
        fontSize: '11px',
        color: UI_COLORS.textMuted,
      });
      card.add(bed);

      // Barra de paciencia del ticket
      const bar = this.add.graphics();
      const ratio = Math.max(0, Math.min(1, ticket.patienceRatio));
      const barColor = ratio > 0.5 ? 0x2ecc71 : ratio > 0.25 ? 0xf39c12 : 0xe74c3c;
      bar.fillStyle(0x000000, 0.6);
      bar.fillRect(8, 44, cardWidth - 16, 6);
      bar.fillStyle(barColor, 1);
      bar.fillRect(8, 44, (cardWidth - 16) * ratio, 6);
      card.add(bar);

      this.ticketContainer.add(card);
    });
  }

  private showMessage(text: string, color: string): void {
    this.notificationText.setText(text).setColor(color).setAlpha(1);
    this.tweens.killTweensOf(this.notificationText);
    this.tweens.add({
      targets: this.notificationText,
      alpha: 0,
      duration: 1800,
      delay: 400,
      ease: 'Power2',
    });
  }
}
