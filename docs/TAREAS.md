# Lista de tareas para agentes

Tareas **cortas e independientes** (cada una ≈ 1 sesión, ≤ ~150 líneas de código). Diseño de referencia: [MECANICAS.md](MECANICAS.md), [NIVELES.md](NIVELES.md). Convenciones: [ARQUITECTURA.md](ARQUITECTURA.md).

## Protocolo (obligatorio)
1. Elige una tarea `[ ]` cuyas dependencias estén `[x]`. Marca `[~]` con tu nombre/fecha al empezar.
2. Lee solo los docs enlazados en la tarea. Respeta ARQUITECTURA (sin números mágicos, input solo vía `InputManager`).
3. Antes de terminar: `npm run typecheck && npm test && npm run build` deben pasar.
4. Marca `[x]`, añade una entrada en [CHANGELOG.md](CHANGELOG.md) y, si tomaste una decisión no trivial, en [DECISIONES.md](DECISIONES.md).
5. No implementes cosas de otras tareas. Si el diseño es ambiguo, decide lo más simple y regístralo en DECISIONES.

Leyenda: **S** < 1 h · **M** 1–2 h. Estado: `[ ]` libre · `[~]` en curso · `[x]` hecha.

---

## Fase 0 — Fundación (bloquea al resto)
- [x] **T-01 · Texturas placeholder** (S) — [2026-10-07 · Antigravity] `src/core/TextureFactory.ts`: genera con `Phaser.GameObjects.Graphics` + `generateTexture` las texturas `wall`, `floor`, `station-<char>` (un color/letra por tipo de la leyenda de NIVELES.md) e iconos de ítems (`item-<tipo>`). Llamar desde `PreloadScene`. *Aceptación:* cada clave existe en `this.textures`. Dep: —
- [x] **T-02 · LevelLoader + validación** (M) — [2026-10-07 · Antigravity] `src/levels/LevelLoader.ts`: `parseLayout(level): ParsedLevel` (celdas por tipo, spawns, posiciones de `D/R/E/T`, camas…) y helpers `cellToWorld`/`worldToCell`. `validateLevel()` aplica las reglas de NIVELES.md §Reglas de validez. Tests vitest con layouts válidos e inválidos. Dep: —
- [x] **T-03 · Datos de nivel 1 y 2** (S) — [2026-10-07 · Antigravity] `src/levels/nivel1.ts`, `nivel2.ts` con los `LevelData` exactos de NIVELES.md; registrar en `LEVELS`. `LevelSelectScene` debe leer de `LEVELS` (borrar la lista local). Test: ambos pasan `validateLevel`. Dep: T-02
- [x] **T-04 · GameScene renderiza el nivel** (M) — [2026-10-07 · Antigravity] En `GameScene`, dibujar suelo, paredes y estaciones del nivel (`levelId`) con texturas de T-01; paredes/estaciones como cuerpos estáticos Arcade (`StaticGroup`). Sin lógica de estaciones. Dep: T-01, T-02, T-03
- [x] **T-05 · Entidad `Player`** (M) — [2026-10-07 · Antigravity] `src/players/Player.ts`: sprite Arcade por `PlayerSlot` (color + etiqueta P1..P4), movimiento con `InputFrame`, `facing` (último vector no nulo, 4 direcciones), colisión con el grid. Spawn en las celdas `1-4` según `slot.index`. Reemplaza los avatares provisionales de `GameScene`. Dep: T-04
- [x] **T-06 · Dash** (S) — [2026-10-07 · Antigravity] En `Player`: impulso ×2.5, 0.18 s, cooldown 1.5 s (`DASH_*` en constants). Indicador visual de cooldown. Dep: T-05
- [x] **T-07 · Interactuable frontal** (S) — [2026-10-07 · Antigravity] Interfaz `Interactable` (`src/world/Interactable.ts`) y utilidad `getFacingCell(player)` + resaltado de la celda objetivo. `GameScene` mantiene un registro `cell → Interactable`. Dep: T-05
- [x] **T-08 · Ítems y carry** (M) — [2026-10-07 · Antigravity] `src/items/ItemType.ts` (tipos de MEC-02), clase `Item`, `Player.carry` (1 ítem) con icono sobre la cabeza. Sin estaciones aún. Dep: T-05, T-01

## Fase 1 — MEC-02 Ítems y estaciones
- [x] **T-09 · Dispenser** (S) — [2026-10-07 · Antigravity] `G` gasas, `P` vial, `N` anestesia, `M` sábanas/mopa (con selector por `use`). `grab` entrega el ítem si las manos están vacías. Dep: T-07, T-08
- [x] **T-10 · Encimera `C`** (S) — [2026-10-07 · Antigravity] Almacena 1 ítem (`grab` deja/toma). También sirve de base para dejar ítems en estaciones. Dep: T-07, T-08
- [x] **T-11 · ProcessStation** (M) — [2026-10-07 · Antigravity] Clase genérica con config `{input, output, durationSec}`; hold-`use`, barra de progreso, pausa al soltar. Instanciar `K` (gasas→venda 3 s), `J` (vial→jeringa 2 s), `L` (sucio→mojado 3 s). Test unitario de la lógica de progreso (clase pura `ProgressTimer`). Dep: T-09, T-10

## Fase 2 — MEC-01 Triaje y pacientes
- [x] **T-12 · Modelo de paciente y FSM** (M) — [2026-10-07 · Antigravity] `src/patients/Patient.ts` (lógica pura, sin Phaser): estados, paciencia, severidad. Tests: transiciones, congelado de paciencia en tratamiento, `Perdido` a 0. Dep: —
- [x] **T-13 · Recetas y spawner** (M) — [2026-10-07 · Antigravity] `src/config/recipes.ts` (data de `herida|fiebre|fractura|cirugia` según MECANICAS) y `PatientSpawner` (lógica pura + test de pesos/intervalos/`maxPatients`). Dep: T-12, T-03
- [x] **T-14 · Sprite de paciente y movimiento a cama** (M) — [2026-10-07 · Antigravity] Paciente visible con barra de paciencia; leves caminan a su cama asignada; graves esperan con icono de camilla. Dep: T-13, T-04
- [x] **T-15 · Mostrador de triaje `R`** (S) — [2026-10-07 · Antigravity] `use` 1.5 s asigna cama limpia libre; mensaje "Sin camas". Dep: T-14, T-07
- [x] **T-16 · Cama, tratamiento y alta** (M) — [2026-10-07 · Antigravity] `B` como `Interactable`: aplicar `venda`/`jeringa` (`use` 1.5 s) cuando el paciente lo requiera; alta → paciente va a `E` y desaparece; cama pasa a sucia (estado, sin limpieza aún). Dep: T-15, T-11
- [x] **T-17 · Puntuación** (S) — [2026-10-07 · Antigravity] `src/core/Scoring.ts` puro (fórmula de MEC-01, penalizaciones, estrellas por umbral) + tests. Dep: T-12
- [x] **T-18 · HudScene** (M) — [2026-10-07 · Antigravity] Escena paralela: temporizador, puntos, tickets de pedido (icono, cama, barra de paciencia, pasos). Se comunica por eventos de `GameScene`. Dep: T-16, T-17
- [x] **T-19 · Fin de nivel y ResultsScene** (S) — [2026-10-07 · Antigravity] Al llegar el tiempo a 0: `ResultsScene` con puntos, estrellas, `grab` para reintentar/menú. Registrar en `SCENE_KEYS`/`main.ts`. Dep: T-18
- [x] **T-20 · Pausa** (S) — [2026-10-07 · Antigravity] `pause` abre overlay (reanudar / menú). Pausa también al perder foco. Dep: T-05

## Fase 3 — MEC-03 Camilla
- [x] **T-21 · Camilla y empuje cooperativo** (M) — [2026-10-07 · Antigravity] `Stretcher` 2×1 (Arcade), engancharse con `grab`, movimiento = promedio de vectores de los enganchados (reglas de MEC-03, incluyendo modo 1 jugador). Dep: T-05, T-04
- [x] **T-22 · Cargar/descargar pacientes graves** (M) — [2026-10-07 · Antigravity] `use` 1 s con camilla adyacente (paciente ↔ camilla ↔ cama/`X`/`Q`). Dep: T-21, T-14, T-16
- [x] **T-23 · Rayos X `X`** (S) — [2026-10-07 · Antigravity] Receta `fractura`: escaneo 4 s con paciente en camilla adyacente. Dep: T-22, T-11

## Fase 4 — MEC-04 Limpieza y esterilización
- [x] **T-24 · Limpieza de camas** (S) — [2026-10-07 · Antigravity] Cama sucia bloquea triaje; `sabanas` + `use` 2 s la limpian. Dep: T-16, T-09
- [x] **T-25 · Ciclo de instrumental** (M) — [2026-10-07 · Antigravity] `A` autoclave (8 s automáticos, campana, contaminación a los 20 s), integración con `L` (T-11). Item `instrumental_*`. Dep: T-11
- [x] **T-26 · Mesa quirúrgica `Q` y cirugía** (M) — [2026-10-07 · Antigravity] Requiere `instrumental_limpio` + `anestesia` + paciente en camilla; operar 6 s con **2 jugadores** a la vez (1 jugador: ver NIVELES §Escalado). Produce `instrumental_sucio`. Dep: T-25, T-22

## Fase 5 — MEC-05 Emergencias
- [x] **T-27 · EventDirector** (M) — [2026-10-07 · Antigravity] Planificador de `LevelData.events` (lógica pura + tests con reloj simulado: `firstAtSec`, intervalos, un evento activo por tipo). Emite eventos `event:start/end`. Dep: T-03
- [x] **T-28 · Derrame, resbalón y mopa** (M) — [2026-10-07 · Antigravity] Charco en celda libre; resbalar 0.6 s (inmune con dash); `mopa` + `use` 2 s limpia. Dep: T-27, T-06, T-09
- [x] **T-29 · Apagón y cuadro eléctrico `U`** (M) — [2026-10-07 · Antigravity] Desactiva `ProcessStation`; oscurecer con máscara de visión 160 px por jugador; `use` 3 s en `U` lo resuelve (auto en 25 s). Dep: T-27, T-11
- [x] **T-30 · Código Azul y desfibrilador `F`** (M) — [2026-10-07 · Antigravity] Cuenta atrás 25 s; cargar `F` (3 s), ítem pesado −30 % velocidad; 2 jugadores `use` 2 s en cama; éxito/fallo con puntos. Dep: T-27, T-16, T-17

## Fase 6 — Pulido y robustez
- [x] **T-31 · Mando desconectado** (S) — [2026-10-07 · Antigravity] Si el dispositivo de un jugador se desconecta: pausar y mostrar "Reconecta el mando de P#". Dep: T-20
- [x] **T-32 · Escalado por jugadores** (S) — [2026-10-07 · Antigravity] Aplicar tabla de NIVELES.md §Escalado por jugadores (1P, 2P, 3-4P). Dep: T-13, T-21, T-30
- [x] **T-33 · Audio placeholder** (S) — [2026-10-07 · Antigravity] SFX sintetizados con WebAudio procedural (pickup, drop, proceso, alta, pérdida, alarma, dash, slip, desfibrilador, menú). Dep: T-16
- [x] **T-34 · Onboarding del nivel 1** (M) — [2026-10-07 · Antigravity] Textos contextuales dinámicos y primeros 2 pacientes fijos (NIVELES §Nivel 1). Dep: T-19
- [x] **T-35 · Balance y checklist QA** (M) — [2026-10-07 · Antigravity] Jugar ambos niveles con 1, 2 y 4 jugadores; matriz de pruebas `docs/QA.md` completada al 100% y cambios en CHANGELOG. Dep: T-30, T-32

## Fase 7 — MEC-06 Estado visual de objetos
- [ ] **T-36 · Contrato `VisualState` e interfaz** (S) — `src/world/VisualState.ts`: tipos `VisualActivity`, `ProgressKind`, interfaz `VisualState` y tipo `VisualStateProvider` (método `getVisualState(): VisualState`). Lógica pura sin Phaser. Test unitario que valide los tipos. Dep: —
- [ ] **T-37 · `getVisualState()` en `Counter` y `ProcessStation`** (M) — Implementar `VisualStateProvider` en `Counter` (variante `base`, ítem apoyado) y `ProcessStation` (variantes `base`/`activa`, progreso de proceso, pausa). Tests unitarios: verificar que el estado refleja cada situación. Dep: T-36
- [ ] **T-38 · `getVisualState()` en `Bed`** (M) — Implementar en `Bed`: variantes `base`/`asignada`/`ocupada`/`sucia`, progreso de tratamiento y limpieza, badge de código azul, workers para cirugía, campo `stain`. Tests unitarios para cada combinación de estado. Dep: T-36
- [ ] **T-39 · `getVisualState()` en `Autoclave`, `SurgeryTable`, `XRayStation`** (M) — Implementar en las 3 estaciones: autoclave con variantes `vacio`/`esterilizando`/`listo`/`contaminado` y doble barra (proceso + contaminación); mesa quirúrgica con ranuras (slots), workers y progreso de cirugía; rayos X con progreso de escaneo. Tests unitarios. Dep: T-36
- [ ] **T-40 · `getVisualState()` en el resto de estaciones** (M) — Implementar en `Dispenser` (M con selección visible), `TriageDesk` (progreso de triaje, badge "sin camas"), `ElectricPanel` (normal/avería/reparando), `DefibrillatorStation` (descargado/cargando/cargado), `Spill` (progreso de fregado). Tests unitarios. Dep: T-36
- [ ] **T-41 · Texturas variantes procedimentales** (M) — En `TextureFactory`: generar variantes de textura para cada estación (`station-K-activa`, `station-B-sucia`, `station-A-esterilizando`, `station-A-listo`, `station-A-contaminado`, `station-U-averia`, `station-F-cargando`, etc.). Texturas desaturadas para estado deshabilitado (`station-*-disabled`). Dep: T-36
- [ ] **T-42 · `WorldProgressBar` (componente Phaser)** (M) — `src/core/WorldProgressBar.ts`: barra de 48×6 px posicionable sobre cualquier celda, color por `ProgressKind` (proceso naranja, limpieza azul, tratamiento verde, carga amarillo, alerta rojo), modo atenuado (alpha 0.5 + icono pausa), ocultable. Se prueba visualmente. Dep: —
- [ ] **T-43 · `StationView` (renderizador Phaser)** (M) — `src/world/StationView.ts`: componente genérico que lee `VisualState` de un `VisualStateProvider` cada frame y actualiza: textura de la estación según `variant`, icono de ítem apoyado (36 px con sombra), `WorldProgressBar`, badge (✔/⚠/⚡/💀), workers overlay. Un `StationView` por interactuable, creados en `GameScene` junto a cada estación. Dep: T-37, T-38, T-39, T-40, T-41, T-42
- [ ] **T-44 · Animaciones de feedback — soltar/tomar ítem** (S) — En `StationView`: al detectar cambio de ítem en `VisualState`, animar *pop* de escala (1.2→1 en 0.12 s) al soltar, y vuelo del icono de estación a cabeza del jugador (0.1 s) al tomar. Integrar SFX `drop` y `pickup` existentes. Dep: T-43
- [ ] **T-45 · Animaciones de feedback — procesando y pausa** (S) — En `StationView`: vibración ±1 px cuando `activity === 'working'`, barra atenuada con icono de pausa cuando `activity === 'paused'`, destello blanco 0.15 s + badge ✔ temporal al completar (`activity` pasa de `working` a `done`). Dep: T-43
- [ ] **T-46 · Animaciones de feedback — alertas e invalidez** (S) — En `StationView`: parpadeo rojo 2 Hz del borde + badge ⚠ cuando `badge === 'warning'`, tinte gris + badge ⚡ cuando `activity === 'disabled'`, contorno rojo 0.25 s + sacudida ±3 px + SFX `error` (nuevo en `SoundManager`) para acción inválida. El contorno resaltado pasa de cian a gris cuando `canInteract` es falso. Dep: T-43, T-33
- [ ] **T-47 · Integración visual de camas y charcos** (M) — Cama: sábana blanca en `limpia`, contorno del color del ticket en `asignada`, manchas que se desvanecen con progreso de limpieza (`stain = 1 − progress`). Charco: se encoge (`scale = 1 − 0.7·progress`) y se aclara al fregar. Dep: T-43, T-38
- [ ] **T-48 · Test de integración visual y QA de Fase 7** (M) — Verificar que: todos los ítems apoyados son visibles, toda acción con duración muestra barra en el mundo, cada estación con proceso tiene aspecto distinto en reposo/trabajando/terminada, la limpieza de camas y charcos es progresiva. Actualizar `docs/QA.md` con sección de Fase 7. Dep: T-44, T-45, T-46, T-47

## Fase 8 — MEC-07 Mapa dinámico (pendiente de diseño detallado de tareas)
> Nivel 3 con fases temporales de mapa (`MapPhaseSpec`), celdas nuevas (`W` mampara, `~` inundación), `GridPathfinder` BFS, transiciones en caliente con avisos. Tareas T-49…T-55 se detallarán en la rama correspondiente.

## Fase 9 — MEC-08 NPCs torpes (pendiente de diseño detallado de tareas)
> NPCs `becario` y `visitante` con FSM pura `NpcBrain`, acciones avisadas, interrumpibles, supervisables. Requiere pathfinding de Fase 8. Tareas T-56…T-60 se detallarán en la rama correspondiente.

## Fase 10 — MEC-09 Deterioro con el tiempo (pendiente de diseño detallado de tareas)
> Ítems perecederos con frescura visual continua, `residuo`, camas que empeoran, charcos que se extienden, nevera `H` y contenedor `Z`. Tareas T-61…T-67 se detallarán en la rama correspondiente.

---

## Camino crítico sugerido (para repartir en paralelo)

### Fases 0–6 (completadas)
- **Equipo A (mundo):** T-01 → T-04 → T-05 → T-06/T-07/T-08 → T-09/T-10 → T-11
- **Equipo B (lógica pura):** T-02 → T-03 · T-12 → T-13 · T-17 · T-27 (todas testeables sin escena)
- **Equipo C (cooperativo):** T-21 → T-22 → T-23/T-26

### Fase 7
- **Equipo A (contratos puros):** T-36 → T-37/T-38/T-39/T-40 (paralelo)
- **Equipo B (rendering):** T-41, T-42 → T-43 → T-44/T-45/T-46/T-47 (paralelo) → T-48
