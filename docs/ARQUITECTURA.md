# Arquitectura

**Stack:** Phaser 4.2.1 · TypeScript 7 · Vite 8 · Vitest 5. Ver DECISIONES.md (DEC-001).

## Comandos
`npm run dev` · `npm run build` · `npm run typecheck` · `npm test`

## Estructura
```
src/
  main.ts                 Config de Phaser y registro de escenas
  config/constants.ts     TODAS las constantes compartidas (tamaños, colores, claves)
  core/
    services.ts           initServices(): Roster e InputManager en el registry global
    ui.ts                 helpers de texto/títulos
  input/                  Entrada multijugador (ver MULTIJUGADOR.md)
    types.ts  keyBindings.ts  devices.ts  InputManager.ts
  players/Roster.ts       Jugadores unidos (slots P1..P4)
  levels/types.ts         Esquema LevelData (niveles = datos)
  scenes/                 Boot, Preload, Menu, Lobby, LevelSelect, Game (esqueleto)
docs/                     Documentación viva
```
Carpetas previstas por las tareas: `items/`, `patients/`, `world/`, `config/recipes.ts`.

## Flujo de escenas
`Boot` (servicios) → `Preload` → `Menu` → `Lobby` (unirse) → `LevelSelect` → `Game` (+ `Hud` paralela, T-18) → `Results` (T-19).

## Convenciones
- **Sin números mágicos:** valores compartidos en `config/constants.ts`; datos de juego (recetas, niveles) en `config/` y `levels/`.
- **Lógica pura separada de Phaser:** FSM de pacientes, puntuación, spawner, EventDirector, ProgressTimer se escriben sin importar Phaser, para poder testearlos con Vitest.
- **Entrada:** solo vía `getInput(scene).read(deviceId)`. Un `Player` se vincula a un `PlayerSlot`.
- **Comunicación entre sistemas:** `scene.events` (EventEmitter de Phaser) con nombres `dominio:accion` (p. ej. `patient:discharged`, `event:start`).
- **Rejilla:** origen en `(0, HUD_HEIGHT)`; celda = `TILE_SIZE` 64 px; helpers `cellToWorld`/`worldToCell` (a crear en T-02).
- **Física:** Arcade, sin gravedad; paredes/estaciones como `StaticGroup`.
- **Estilo:** `erasableSyntaxOnly` activo (sin `enum`, sin parameter properties; usar uniones de strings). Identificadores en inglés, textos de UI y docs en español.
- **Ids de escena:** siempre `SCENE_KEYS.*`.

## Qué hace hoy el esqueleto
Menú → lobby con unión de 1–4 dispositivos → selección de nivel → `GameScene` con la rejilla vacía donde cada jugador mueve un círculo (valida el soporte multijugador). No hay mecánicas ni niveles.
