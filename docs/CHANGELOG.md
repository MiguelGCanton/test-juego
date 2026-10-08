# Changelog

Formato: `fecha · autor · cambio`. Más reciente arriba.

## 2026-10-07 · Antigravity (T-20)
- Implementada T-20: Menú de pausa interactivo en `GameScene` activable por botón de pausa o pérdida de foco (`blur`), con opciones de Reanudar, Reintentar y Salir al menú. Completada la **Fase 2 (MEC-01 Triaje y pacientes)**.

## 2026-10-07 · Antigravity (T-19)
- Implementada T-19: Escena de resultados `ResultsScene` (`src/scenes/ResultsScene.ts`) con resumen de puntuación, estrellas doradas, estadísticas de altas y pacientes perdidos, y opciones de reintento / menú con soporte multijugador. Registrada en `main.ts`.

## 2026-10-07 · Antigravity (T-18)
- Implementada T-18: `HudScene` (`src/scenes/HudScene.ts`) ejecutada en paralelo a `GameScene`, con temporizador regresivo de nivel, marcador de puntuación y estrellas, tickets de órdenes activas con barras de paciencia y notificaciones contextuales animadas.

## 2026-10-07 · Antigravity (T-17)
- Implementada T-17: Sistema de puntuación `Scoring` (`src/core/Scoring.ts`) con cálculo de puntos por alta con multiplicador de paciencia restante, penalización de -50 por paciente perdido y cálculo de estrellas por umbrales de nivel. Tests unitarios en `Scoring.test.ts`.

## 2026-10-07 · Antigravity (T-16)
- Implementada T-16: Sistema de tratamiento en cama `Bed` con verificación de ítem requerido (`venda` / `jeringa`), temporizador de curación de 1.5 s, consumo del ítem, paso de la cama a estado `sucia` y alta del paciente. Tests unitarios en `Bed.test.ts`.

## 2026-10-07 · Antigravity (T-15)
- Implementada T-15: Clase `Bed` (`src/world/Bed.ts`) y `TriageDesk` (`src/world/TriageDesk.ts`) para mostrador `R` con acción mantenida de 1.5 s, asignación de camas limpias libres y aviso de "Sin camas". Tests unitarios en `TriageDesk.test.ts`.

## 2026-10-07 · Antigravity (T-14)
- Implementada T-14: `PatientView` (`src/patients/PatientView.ts`) con renderizado de avatar según severidad (`patient-leve` / `patient-grave`), barra dinámica de paciencia en 3 colores, movimiento autónomo fluido a cama asignada para pacientes leves e icono de camilla para pacientes graves.

## 2026-10-07 · Antigravity (T-13)
- Implementada T-13: Recetas de tratamiento médico (`src/config/recipes.ts`) para las 4 dolencias y generador `PatientSpawner` (`src/patients/PatientSpawner.ts`) con selección aleatoria ponderada, intervalos de pedido y límite de pacientes simultáneos. Tests unitarios en `PatientSpawner.test.ts`.

## 2026-10-07 · Antigravity (T-12)
- Implementada T-12: Modelo de paciente `Patient` (`src/patients/Patient.ts`) con máquina de estados finitos (Esperando, Triado, EnCama, EnTratamiento, Alta, Perdido), control de severidad y temporizador de paciencia que se congela durante tratamiento. Tests unitarios en `Patient.test.ts`.

## 2026-10-07 · Antigravity (T-11)
- Implementada T-11: `ProgressTimer` puro (`src/core/ProgressTimer.ts`) y `ProcessStation` (`src/world/ProcessStation.ts`) con procesamiento progresivo por pulsación mantenida de Usar para `K` (vendas), `J` (jeringas) y `L` (lavado). Tests unitarios en `ProgressTimer.test.ts` y `ProcessStation.test.ts`. Completada la **Fase 1 (MEC-02)**.

## 2026-10-07 · Antigravity (T-10)
- Implementada T-10: Encimera `Counter` (`src/world/Counter.ts`) para almacenamiento y recogida de ítems individuales en celdas de tipo `C`. Tests unitarios en `Counter.test.ts`.

## 2026-10-07 · Antigravity (T-09)
- Implementada T-09: Estación `Dispenser` (`src/world/Dispenser.ts`) para suministros infinitos (`G`, `P`, `N` y armario `M` con conmutación interactiva sábanas/mopa). Tests unitarios en `Dispenser.test.ts`.

## 2026-10-07 · Antigravity (T-08)
- Implementada T-08: Tipos de ítems (`src/items/ItemType.ts`), clase `Item` (`src/items/Item.ts`), soporte de transporte en `Player` (`pickUp`, `drop`, `hasItem`, reducción de velocidad con ítems pesados) e icono flotante sobre la cabeza. Tests unitarios en `Item.test.ts`. Completada la **Fase 0 (Fundación)**.

## 2026-10-07 · Antigravity (T-07)
- Implementada T-07: Interfaz `Interactable` y helper `getFacingCell()` (`src/world/Interactable.ts`). Registro de interactuables y resaltado visual dinámico de la celda frontal del jugador en `GameScene`. Tests unitarios en `Interactable.test.ts`.

## 2026-10-07 · Antigravity (T-06)
- Implementada T-06: Mecánica de Dash en `Player` (impulso ×2.5, 0.18 s, 1.5 s de cooldown) con constantes en `constants.ts`, efecto visual translúcido y barra gráfica de recarga bajo el personaje.

## 2026-10-07 · Antigravity (T-05)
- Implementada T-05: Entidad `Player` (`src/players/Player.ts`) con física Arcade, soporte de 4 direcciones cardinales (`facing`), etiqueta visual P1..P4, indicador de puntero frontal y colisiones contra paredes/estaciones del grid.

## 2026-10-07 · Antigravity (T-04)
- Implementada T-04: `GameScene` ahora renderiza el nivel completo (suelo base, paredes estáticas, estaciones con texturas e identificadores de texto, puertas de acceso y salidas) utilizando el grupo de física Arcade `obstacles` para colisiones sólidas.

## 2026-10-07 · Antigravity (T-03)
- Implementada T-03: `src/levels/nivel1.ts` y `nivel2.ts` con los datos exactos de NIVELES.md registrados en `LEVELS`. `LevelSelectScene` actualizado para consumir `LEVELS`. Tests de validación en `levels.test.ts`. DEC-018: fijada esquina bloqueada de Nivel 2.

## 2026-10-07 · Antigravity (T-02)
- Implementada T-02: `src/levels/LevelLoader.ts` con `parseLayout()`, helpers de coordenadas `cellToWorld()` / `worldToCell()`, y `validateLevel()` con chequeos de dimensiones, perímetro, spawns, accesibilidad BFS. Suite de tests unitarios en `LevelLoader.test.ts`.

## 2026-10-07 · Antigravity (T-01)
- Implementada T-01: `src/core/TextureFactory.ts` con generación procedimental de texturas para suelos, paredes, estaciones (`station-<char>`), iconos de ítems (`item-<tipo>`) y avatares de jugadores (`player-1..4`). Integrado en `PreloadScene`.

## 2026-10-07 · Antigravity (sesión de continuación)
- Retomado el trabajo tras agotarse los créditos de la sesión anterior (existían: `package.json`, `config/constants.ts`, `input/types.ts`, `input/keyBindings.ts`).
- Dependencias instaladas y actualizadas: TypeScript 6→7.0.2, Vite →8.3.3 (DEC-001, DEC-008).
- Eliminada la plantilla de Vite (`counter.ts`, assets, estilos de demo).
- Añadido: `input/devices.ts`, `input/InputManager.ts`, `players/Roster.ts` (+ test), `core/services.ts`, `core/ui.ts`.
- `keyBindings.ts` ahora usa `KeyboardEvent.code` (DEC-007); añadidos botones de cruceta.
- Escenas: `Boot`, `Preload`, `Menu`, `Lobby` (unión 1–4 jugadores), `LevelSelect`, `Game` (esqueleto).
- `levels/types.ts`: esquema `LevelData` con eventos y `maxPatients`.
- Configuración: física Arcade, scripts `typecheck` y `test`, `.npmrc`.
- Documentación: README, ARQUITECTURA, DECISIONES, MECANICAS (5), NIVELES (2), MULTIJUGADOR, TAREAS (35 tareas).
- Verificado: `tsc --noEmit`, `vitest run` (2 tests), `vite build` OK.

## 2026-10-07 · Sesión anterior (créditos agotados)
- Creado proyecto Vite + TS con Phaser 4.2.1, constantes globales y contratos de entrada.
