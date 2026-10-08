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
 * Muestra el temporizador, puntuación con estrellas, tickets de pedidos activos
 * y la barra de recetas y ayuda rápida.
 */
export class HudScene extends Phaser.Scene {
  private timerText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private starsText!: Phaser.GameObjects.Text;
  private ticketContainer!: Phaser.GameObjects.Container;
  private notificationText!: Phaser.GameObjects.Text;
  private recipeBarContainer!: Phaser.GameObjects.Container;

  constructor() {
    super(SCENE_KEYS.Hud);
  }

  create(): void {
    // 1. Fondo del panel superior de HUD (80 px)
    const g = this.add.graphics();
    g.fillStyle(UI_COLORS.panel, 0.96);
    g.fillRect(0, 0, GAME_WIDTH, HUD_HEIGHT);
    g.lineStyle(2, UI_COLORS.panelLight, 1);
    g.lineBetween(0, HUD_HEIGHT, GAME_WIDTH, HUD_HEIGHT);

    // 2. Temporizador (izquierda)
    this.timerText = this.add.text(25, HUD_HEIGHT / 2, '⏱ 03:00', {
      fontFamily: '"Fredoka", "Trebuchet MS", sans-serif',
      fontSize: '26px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    // 3. Puntuación y Estrellas (derecha)
    this.scoreText = this.add.text(GAME_WIDTH - 210, 24, '🏆 0 pts', {
      fontFamily: '"Fredoka", "Trebuchet MS", sans-serif',
      fontSize: '22px',
      color: '#ffc857',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    this.starsText = this.add.text(GAME_WIDTH - 210, 54, '☆☆☆', {
      fontFamily: '"Fredoka", "Trebuchet MS", sans-serif',
      fontSize: '20px',
      color: '#ffc857',
    }).setOrigin(0, 0.5);

    // 4. Contenedor para tickets de pedidos (centro)
    this.ticketContainer = this.add.container(170, 8);

    // 5. Notificaciones contextuales ("¡Sin camas!", "¡Alta!", etc.)
    this.notificationText = this.add.text(GAME_WIDTH / 2, HUD_HEIGHT + 24, '', {
      fontFamily: '"Fredoka", "Trebuchet MS", sans-serif',
      fontSize: '18px',
      color: '#e74c3c',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setAlpha(0);

    // 6. Guía Rápida de Recetas (Franja de referencia compacta)
    this.createRecipeGuide();

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

  private createRecipeGuide(): void {
    this.recipeBarContainer = this.add.container(GAME_WIDTH / 2, 695).setDepth(20);

    const bg = this.add.graphics();
    bg.fillStyle(0x0e1726, 0.9);
    bg.fillRoundedRect(-590, -18, 1180, 26, 6);
    bg.lineStyle(1.5, 0x2ec4b6, 0.7);
    bg.strokeRoundedRect(-590, -18, 1180, 26, 6);
    this.recipeBarContainer.add(bg);

    const guideText = this.add.text(
      0,
      -5,
      '📖 GUÍA: 🩹 Herida (Gasas [G]➔[K]➔Cama) │ 🌡️ Fiebre (Vial [P]➔[J]➔Cama) │ 🦴 Fractura (Camilla➔[X]➔Cama➔[K]) │ 🧹 Limpiar (Sábanas [M]➔Cama)',
      {
        fontFamily: '"Fredoka", "Trebuchet MS", sans-serif',
        fontSize: '12px',
        color: '#e8f1ff',
        fontStyle: 'bold',
      }
    ).setOrigin(0.5);
    this.recipeBarContainer.add(guideText);
  }

  private renderTickets(tickets: OrderTicketData[]): void {
    this.ticketContainer.removeAll(true);
    const cardWidth = 165;

    tickets.slice(0, 5).forEach((ticket, i) => {
      const x = i * (cardWidth + 10);
      const card = this.add.container(x, 0);

      // Fondo tarjeta
      const bg = this.add.graphics();
      bg.fillStyle(UI_COLORS.panelLight, 0.95);
      bg.fillRoundedRect(0, 0, cardWidth, 62, 6);
      bg.lineStyle(1.5, ticket.isSevere ? 0xe74c3c : 0x2ec4b6, 0.9);
      bg.strokeRoundedRect(0, 0, cardWidth, 62, 6);
      card.add(bg);

      // Nombre dolencia con icono
      const icon = ticket.ailmentName.includes('Herida')
        ? '🩹'
        : ticket.ailmentName.includes('Fiebre')
        ? '🌡️'
        : ticket.ailmentName.includes('Fractura')
        ? '🦴'
        : '🏥';

      const title = this.add.text(8, 6, `${icon} ${ticket.ailmentName}`, {
        fontFamily: '"Fredoka", "Trebuchet MS", sans-serif',
        fontSize: '12px',
        color: '#ffffff',
        fontStyle: 'bold',
      });
      card.add(title);

      // Estado cama
      const bed = this.add.text(8, 23, ticket.bedText, {
        fontFamily: '"Fredoka", "Trebuchet MS", sans-serif',
        fontSize: '11px',
        color: ticket.bedText.includes('Cama') ? '#2ec4b6' : '#f39c12',
        fontStyle: 'bold',
      });
      card.add(bed);

      // Barra de paciencia del ticket
      const bar = this.add.graphics();
      const ratio = Math.max(0, Math.min(1, ticket.patienceRatio));
      const barColor = ratio > 0.5 ? 0x2ecc71 : ratio > 0.25 ? 0xf39c12 : 0xe74c3c;
      bar.fillStyle(0x000000, 0.7);
      bar.fillRect(8, 44, cardWidth - 16, 8);
      bar.fillStyle(barColor, 1);
      bar.fillRect(8, 44, (cardWidth - 16) * ratio, 8);
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
      duration: 2000,
      delay: 500,
      ease: 'Power2',
    });
  }
}
