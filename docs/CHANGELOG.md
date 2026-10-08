# Changelog

Formato: `fecha · autor · cambio`. Más reciente arriba.

## 2026-10-07 · Antigravity (T-35)
- Implementada T-35: Balance final y matriz de control de calidad `docs/QA.md` con checklist de verificación para 1, 2 y 4 jugadores en ambos niveles, validando las 5 mecánicas principales, escalado dinámico, desconexión de mandos, síntesis de audio, onboarding y menú de pausa. **100% de tareas del proyecto completadas (Fases 0 a 6).**

## 2026-10-07 · Antigravity (T-34)
- Implementada T-34: Sistema de Onboarding en Nivel 1 con generación inicial fija (1º herida, 2º fiebre, fractura bloqueada < 45 s) y banner dinámico guiado paso a paso con instrucciones contextuales en la parte inferior de la pantalla. Tests en `PatientSpawner.test.ts`.

## 2026-10-07 · Antigravity (T-33)
- Implementada T-33: Gestor de efectos de sonido procedurales `SoundManager` (`src/core/SoundManager.ts`) mediante WebAudio API (osciladores y envolventes), cubriendo tomar/soltar ítems, procesos completados, alta de pacientes, pérdida de pacientes, alarmas de emergencia, dash, resbalón, descargas de desfibrilador y navegación de menús con soporte headless. Tests en `SoundManager.test.ts`.

## 2026-10-07 · Antigravity (T-32)
- Implementada T-32: Escalado de dificultad según número de jugadores en `PatientSpawner` y estaciones de trabajo (1P: `maxPatients` -1, camilla 70% vel., 1 cirujano / 1 reanimador; 3-4P: intervalo de pedidos × 0.85). Tests unitarios en `PatientSpawner.test.ts`.

## 2026-10-07 · Antigravity (T-31)
- Implementada T-31: Detección y notificación de mandos/gamepads desconectados en `InputManager` (`src/input/InputManager.ts`) y `GameScene`, pausando el juego automáticamente y mostrando el banner `⚠️ Mando de P# desconectado. Por favor, reconéctalo para continuar` impidiendo reanudar hasta reconectar. Tests unitarios en `InputManager.test.ts`.

## 2026-10-07 · Antigravity (T-30)
- Implementada T-30: Estación de Desfibrilador `DefibrillatorStation` (`src/world/DefibrillatorStation.ts`) y gestor `CodeBlueManager` (`src/events/CodeBlueManager.ts`) para emergencias de Código Azul, requiriendo carga en `F` (3 s), ítem pesado `desfibrilador` (-30% velocidad), reanimación conjunta en cama (2 s con 2 jugadores en multijugador o 1 en solitario) con bonificación de +200 pts en éxito o -150 pts y paciente perdido en fallo tras 25 s. Tests unitarios en `CodeBlue.test.ts`. Completada la **Fase 5 (MEC-05 Emergencias)**.

## 2026-10-07 · Antigravity (T-29)
- Implementada T-29: Cuadro Eléctrico `ElectricPanel` (`src/world/ElectricPanel.ts`) para resolver apagones (`blackout`), desactivando temporalmente estaciones de proceso y oscureciendo la pantalla con foco visual, con reparación manual de 3.0 s en `U` o auto-resolución tras 25 s. Tests unitarios en `ElectricPanel.test.ts`.

## 2026-10-07 · Antigravity (T-28)
- Implementada T-28: Charco de derrame `Spill` (`src/world/Spill.ts`) con resbalón forzado de 0.6 s y soltado de ítem en `Player` (inmune durante el dash según DEC-016), y limpieza sostenida con `mopa` durante 2.0 s. Tests unitarios en `Spill.test.ts`.

## 2026-10-07 · Antigravity (T-27)
- Implementada T-27: Planificador de eventos `EventDirector` (`src/events/EventDirector.ts`) con lógica pura para temporización y disparo de emergencias según `LevelData.events` (`firstAtSec`, intervalos `everySec` y límite de 1 evento simultáneo por tipo). Tests unitarios en `EventDirector.test.ts`.

## 2026-10-07 · Antigravity (T-26)
- Implementada T-26: Mesa Quirúrgica `SurgeryTable` (`src/world/SurgeryTable.ts`) para la dolencia `cirugia`, requiriendo `instrumental_limpio` + `anestesia` + paciente en camilla adyacente, operación sostenida de 6 segundos coordinada (2 jugadores simultáneos en multijugador, 1 en solitario) y producción de `instrumental_sucio` tras la intervención. Tests unitarios en `SurgeryTable.test.ts`. Completada la **Fase 4 (MEC-04 Limpieza y esterilización)**.

## 2026-10-07 · Antigravity (T-25)
- Implementada T-25: Autoclave `Autoclave` (`src/world/Autoclave.ts`) para esterilización automática de `instrumental_mojado` durante 8 segundos a `instrumental_limpio`, con temporizador de contaminación que revierte a `instrumental_sucio` a los 20 segundos de abandono e integración con lavabo `L`. Tests unitarios en `Autoclave.test.ts`.

## 2026-10-07 · Antigravity (T-24)
- Implementada T-24: Limpieza de camas sucias en `Bed` (`src/world/Bed.ts`) requiriendo `sabanas` (del dispensador `M`) y 2.0 segundos de uso continuo para rehabilitar camas a estado `limpia`. Tests unitarios en `Bed.test.ts`.

## 2026-10-07 · Antigravity (T-23)
- Implementada T-23: Estación de Rayos X `XRayStation` (`src/world/XRayStation.ts`) para la receta `fractura`, con escaneo sostenido de 4 segundos sobre pacientes en camilla adyacente, completado de diagnóstico y habilitación de vendaje en cama. Tests unitarios en `XRayStation.test.ts`. Completada la **Fase 3 (MEC-03 Camilla)**.

## 2026-10-07 · Antigravity (T-22)
- Implementada T-22: Transferencia y carga/descarga de pacientes graves (`use` 1.0 s) entre puerta de entrada/triaje, camilla y camas limpias con barra visual de progreso de transferencia. Lógica pura en `StretcherLogic.ts` y tests unitarios en `Stretcher.test.ts`.

## 2026-10-07 · Antigravity (T-21)
- Implementada T-21: Entidad física `Stretcher` (`src/world/Stretcher.ts`) y física pura `StretcherLogic` (`src/world/StretcherLogic.ts`) con empuje cooperativo de hasta 2 jugadores, vector promedio de movimiento, escalado por número de jugadores (1P: 70%, 2P 1 enganchado: 40%, 2P 2 enganchados: 100%), arrastre físico y bloqueo de dash al empujar. Tests unitarios en `Stretcher.test.ts`.

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
