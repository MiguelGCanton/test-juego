# Código Caos 🏥

Party game cooperativo 2D estilo *Overcooked*, ambientado en un hospital de urgencias. Soporta de **1 a 4 jugadores locales** simultáneos (hasta 2 jugadores en el mismo teclado y mandos vía Gamepad API). Construido con **Phaser 4**, **TypeScript** y **Vite**.

```bash
npm install
npm run dev        # Servidor de desarrollo en http://localhost:5173
npm run typecheck  # Verificación estricta de tipos TypeScript
npm test           # Tests unitarios con Vitest
npm run build      # Compilación para producción
```

---

## 🎮 Cómo Jugar

### Controles
| Acción | Teclado 1 (WASD) | Teclado 2 (Flechas) | Mando (Gamepad) |
|---|---|---|---|
| **Moverse** | <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> | <kbd>↑</kbd> <kbd>←</kbd> <kbd>↓</kbd> <kbd>→</kbd> | D-Pad / Stick Izquierdo |
| **Agarrar / Soltar / Enganchar** | <kbd>E</kbd> | <kbd>.</kbd> | Botón Sur (<kbd>A</kbd> / <kbd>✕</kbd>) |
| **Usar / Procesar / Atender** (mantener) | <kbd>Q</kbd> | <kbd>,</kbd> | Botón Oeste (<kbd>X</kbd> / <kbd>□</kbd>) |
| **Dash (Impulso)** | <kbd>Espacio</kbd> | <kbd>M</kbd> | Botón Este (<kbd>B</kbd> / <kbd>○</kbd>) / Gatillo R |
| **Pausa** | <kbd>Escape</kbd> | <kbd>Escape</kbd> | Botón <kbd>Start</kbd> |

---

### Flujo de Trabajo Hospitalario
1. **Llegada de Pacientes:** Los pacientes entran por la puerta de urgencias (`D`). Presentan una barra de paciencia con tres colores (verde, ámbar y rojo).
2. **Triaje (`R`):** Mantén <kbd>Usar</kbd> (1.5 s) frente al mostrador de triaje para examinar al paciente y asignarle una cama limpia libre (`B`).
3. **Pacientes Leves vs. Graves:**
   - **Pacientes Leves (Herida / Fiebre):** Caminan solos a su cama asignada tras ser triados.
   - **Pacientes Graves (Fractura / Cirugía):** No pueden caminar solos y requieren una **Camilla (`T`)**.
4. **Camilla Cooperativa (`T`):**
   - Pulsa <kbd>Agarrar</kbd> junto a la camilla para engancharte (admite hasta 2 jugadores).
   - En multijugador, la camilla se mueve según el **promedio de vectores** de los jugadores enganchados (¡coordinación obligatoria!).
   - Lleva la camilla junto al paciente grave en la entrada y mantén <kbd>Usar</kbd> (1 s) para subirlo a la camilla.
5. **Rayos X (`X`):**
   - Para pacientes con **Fractura**, trasládalos en la camilla hasta la estación de Rayos X (`X`) y mantén <kbd>Usar</kbd> durante 4 segundos para completar el escaneo.
   - Tras el escaneo, lleva al paciente en la camilla a su cama asignada y mantén <kbd>Usar</kbd> (1 s) para transferirlo.
6. **Preparación de Suministros:**
   - **Heridas / Fracturas:** Toma gasas en el dispensador `G`, dóblalas en la estación de curación `K` (<kbd>Usar</kbd> 3 s) para obtener **Vendas**.
   - **Fiebre:** Toma un vial en la farmacia `P`, cárgalo en la mesa de preparación `J` (<kbd>Usar</kbd> 2 s) para obtener una **Jeringa**.
   - **Encimeras (`C`):** Almacena y transfiere ítems rápidamente entre compañeros.
7. **Tratamiento y Alta en Cama (`B`):**
   - Acércate a la cama con el ítem requerido y mantén <kbd>Usar</kbd> (1.5 s).
   - El paciente recibe el alta, camina hacia la salida (`E`) y otorga puntos según la paciencia restante.
   - La cama queda en estado `sucia`.
8. **Puntuación y Estrellas:** Obtén 1, 2 o 3 estrellas superando los umbrales de puntuación del nivel antes de que se agote el tiempo. Si la paciencia de un paciente llega a 0, se pierde y penaliza con −50 puntos.

---

## 🚀 Funcionalidades Disponibles

### ✅ Fase 0 — Fundación
- Motor Phaser 4 con renderizado de cuadrícula 20×10 y física Arcade sin gravedad.
- Sistema de Roster multijugador local dinámico (1 a 4 jugadores).
- Movimiento en 4 direcciones cardinales con indicadores visuales y avatar P1..P4.
- Mecánica de **Dash** (impulso de velocidad con tiempo de recarga visible).
- Celdas interactivas con resaltado dinámico de objetivo frontal.
- Sistema de ítems: transporte en manos, soltado e icono flotante.
- Selector de niveles y carga de niveles basados en layouts ASCII declarativos.

### ✅ Fase 1 — Ítems y Estaciones de Proceso (MEC-02)
- Dispensadores infinitos (`G` gasas, `P` viales, `N` anestesia y armario `M` con selector interactivo).
- Encimeras (`C`) para almacenamiento e intercambio de suministros.
- Estaciones de proceso sostenido con temporizadores de progreso (`K` curación, `J` preparación, `L` lavado).

### ✅ Fase 2 — Triaje y Pacientes (MEC-01)
- Modelo FSM de pacientes con dolencias leves y graves, y consumo de paciencia en tiempo real.
- Generador de pacientes (`PatientSpawner`) con cadencia e intervalos configurables por nivel.
- Vistas de pacientes con avatares según severidad, barras de paciencia dinámicas y desplazamiento autónomo.
- Mostrador de Triaje (`R`) con asignación de camas y aviso de saturación.
- Camas de hospital (`B`) con ciclo de tratamiento, consumo de suministros, cambio a cama sucia y alta.
- Sistema de puntuación (`Scoring`) con bonificación por rapidez y penalizaciones por pacientes perdidos.
- Interfaz paralela `HudScene` con reloj regresivo, marcador, estrellas, tickets de pedido y notificaciones flotantes.
- Pantalla de resultados `ResultsScene` con resumen de estrellas, puntuación y estadísticas.
- Menú de pausa interactivo por botón o pérdida de foco de la ventana.

### ✅ Fase 3 — Camilla Cooperativa y Rayos X (MEC-03)
- Entidad física `Stretcher` (2×1 celdas) con enganche/desenganche mediante <kbd>Agarrar</kbd>.
- Empuje cooperativo con cálculo de vector promedio y escalado de velocidad (1P: 70%, 2P: 100% / 40% con 1 jugador).
- Carga y descarga de pacientes graves entre entrada, camilla y camas mediante <kbd>Usar</kbd> (1 s).
- Estación de Rayos X (`X`) con escaneo de 4 segundos para pacientes con fractura en camilla.
- Bloqueo de Dash al empujar la camilla y arrastre coordinado de jugadores.

---

## 📂 Estructura y Documentación

| Documento | Descripción |
|---|---|
| [docs/MECANICAS.md](docs/MECANICAS.md) | Especificación detallada de las 5 mecánicas del juego |
| [docs/NIVELES.md](docs/NIVELES.md) | Layouts ASCII, parámetros y escalado de dificultad por nivel |
| [docs/MULTIJUGADOR.md](docs/MULTIJUGADOR.md) | Mapeo de controles por teclado y mandos Gamepad API |
| [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) | Arquitectura modular del proyecto y convenciones de código |
| [docs/TAREAS.md](docs/TAREAS.md) | Lista de tareas y progreso de las fases de desarrollo |
| [docs/DECISIONES.md](docs/DECISIONES.md) | Registro cronológico de decisiones arquitectónicas y técnicas |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | Registro de cambios implementados |
