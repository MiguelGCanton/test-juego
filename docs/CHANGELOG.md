# Changelog

Formato: `fecha · autor · cambio`. Más reciente arriba.

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
