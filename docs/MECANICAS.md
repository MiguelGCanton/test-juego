# Mecánicas — Código Caos

> **Solo diseño.** Ninguna de estas mecánicas está implementada. Las tareas para implementarlas están en [TAREAS.md](TAREAS.md).
> Convenciones: los botones son lógicos (`grab`, `use`, `dash`, `pause`), ver [MULTIJUGADOR.md](MULTIJUGADOR.md). Todos los tiempos en segundos. Las constantes numéricas deben vivir en `src/config/` (ver ARQUITECTURA).

## Concepto
Cooperativo local (1–4 jugadores) estilo Overcooked. Los "pedidos" son **pacientes** que llegan a urgencias con una dolencia. Los jugadores, como personal sanitario, deben triarlos, trasladarlos, tratarlos y darlos de alta antes de que se agote su paciencia, mientras mantienen el hospital limpio y sobreviven a emergencias.

Equivalencias con Overcooked: pedido = paciente · ingredientes = gasas/viales/etc. · tabla de cortar = estaciones de proceso · fregar platos = esterilizar instrumental · fuego/obstáculos = derrames, apagones, código azul.

## Bucle de juego
1. Llega un paciente por la puerta (`D`) con una dolencia y barra de paciencia.
2. Un jugador lo **tría** en el mostrador (`R`) → se le asigna una cama limpia libre.
3. Se lleva a la cama (a pie si es leve/moderado; en **camilla** si es grave).
4. Se prepara el tratamiento (recoger ítems → procesarlos en estaciones).
5. Se aplica el tratamiento en la cama → **alta** → el paciente sale por `E` → la cama queda **sucia**.
6. Limpiar la cama (sábanas) para reutilizarla.

## Verbos de jugador (base común, MEC-00)
| Verbo | Descripción |
|---|---|
| Mover | 8 direcciones, `PLAYER_SPEED` = 240 px/s, colisión con paredes y estaciones. |
| Agarrar/Soltar (`grab`) | Lleva **1 ítem** a la vez. Sobre dispensador: toma ítem. Sobre encimera `C` o estación vacía: deja el ítem. Con las manos vacías sobre un ítem en el suelo/encimera: lo toma. |
| Usar (`use`, mantener) | Interactúa con la estación/cama/paciente frente al jugador. Si la acción tiene duración, muestra barra de progreso y **solo avanza mientras se mantiene** el botón y el jugador esté a distancia. Soltar pausa (no reinicia). |
| Dash (`dash`) | Impulso ×2.5 durante 0.18 s, cooldown 1.5 s. No atraviesa paredes. Sirve para llegar más rápido o cruzar un charco sin resbalar (inmune durante el dash). |

"Frente al jugador" = la celda adyacente en la dirección del último movimiento (`facing`), resaltada con un contorno.

---

## MEC-01 · Triaje y flujo de pacientes (sistema de pedidos)
**Objetivo de diseño:** generar la presión de tiempo y la lista de pedidos.

- **Generación:** `PatientSpawner` crea pacientes según `LevelData.orders` (pesos) e intervalo `orderIntervalSec`, respetando `maxPatients`. Aparecen en la celda `D`.
- **Estados:** `Esperando → Triado → EnCama → EnTratamiento → Alta` (o `Perdido` si la paciencia llega a 0).
- **Severidad y dolencia:**

| Dolencia (`recipeId`) | Severidad | Paciencia | Se mueve solo | Puntos |
|---|---|---|---|---|
| `herida` | Leve | 90 s | Sí | 100 |
| `fiebre` | Leve | 90 s | Sí | 100 |
| `fractura` | Grave | 75 s | **No** (camilla) | 250 |
| `cirugia` | Grave | 90 s | **No** (camilla) | 400 |

- **Triaje:** en `R`, `use` mantenido 1.5 s. Asigna la cama limpia libre más cercana; si no hay camas libres no se puede triar (el HUD avisa "Sin camas"). Paciente leve camina a su cama; grave espera en el suelo con un icono de camilla.
- **Paciencia:** barra sobre la cabeza (verde >50 %, amarilla >25 %, roja). Se congela mientras el paciente está en `EnTratamiento`. Si llega a 0: `Perdido` → −50 pts, sale enfadado, la cama asignada se libera.
- **Puntuación por alta:** `puntosBase × (1 + 0.5 × pacienciaRestante%)` redondeado a decenas.
- **Ticket de pedido (HUD):** icono de dolencia, nombre de cama asignada, barra de paciencia, y la secuencia de pasos con el paso actual resaltado.

**Recetas (pasos):**
- `herida`: tomar Gasas (`G`) → en Estación de Curación (`K`) *procesar* 3 s → **Venda** → aplicar en cama (`use` 1.5 s).
- `fiebre`: tomar Vial (`P`) → en Mesa de Preparación (`J`) *procesar* 2 s → **Jeringa** → aplicar en cama (`use` 1.5 s).
- `fractura`: camilla lleva al paciente a Rayos X (`X`) → *escaneo* 4 s (un jugador mantiene `use`) → camilla lleva a cama → aplicar **Venda** como `herida` (la Venda se prepara aparte).
- `cirugia` (solo nivel 2): camilla lleva al paciente a la Mesa Quirúrgica (`Q`) → ver MEC-04 (instrumental limpio) + anestesia (`N`) → *operar* 6 s con **2 jugadores** → camilla lleva a cama (recuperación 0 s) → alta directa.

**Criterios de aceptación:** un paciente completa el ciclo completo; el puntaje y la paciencia funcionan; paciente grave no camina; no se puede triar sin cama.

## MEC-02 · Ítems y estaciones de proceso
**Objetivo de diseño:** el "pasar ingredientes" de Overcooked.

- **Ítems:** `gasas`, `venda`, `vial`, `jeringa`, `anestesia`, `instrumental_sucio`, `instrumental_mojado`, `instrumental_limpio`, `sabanas`, `mopa`.
- **Tipos de estación:**
  - **Dispensador** (`G` gasas, `P` vial, `M` sábanas+mopa, `N` anestesia): da el ítem infinito al `grab`. `M` ofrece sábanas y mopa: un toque corto de `use` alterna el ítem seleccionado (icono visible sobre el armario) y `grab` toma el seleccionado.
  - **Encimera** (`C`): almacena 1 ítem.
  - **Estación de proceso** (`K`: gasas→venda 3 s; `J`: vial→jeringa 2 s; `L`: instrumental_sucio→mojado 3 s): acepta 1 ítem de entrada válido, procesa mientras se mantiene `use`, produce el ítem de salida que se recoge con `grab`.
  - **Automática** (`A` autoclave, ver MEC-04).
- Los ítems llevados se dibujan sobre la cabeza del jugador (icono + color).

**Criterios:** no se puede dejar un ítem inválido en una estación; progreso persiste al soltar `use`; barra de progreso visible.

## MEC-03 · Camilla cooperativa
**Objetivo de diseño:** el momento "party game" — dos jugadores coordinándose (y estorbándose).

- Una camilla (`T` es su posición inicial; ocupa 2×1 celdas) que se mueve en píxeles libres. Hay **1 por nivel**.
- **Empujar:** jugadores cerca de la camilla mantienen `grab` para engancharse (hasta 2, uno a cada extremo). La camilla se mueve según el **promedio de los vectores de movimiento** de los enganchados × `STRETCHER_SPEED` (180 px/s). Si empujan en direcciones opuestas, se cancelan (comedia).
- **Requisito de jugadores:** `pushersRequired = min(2, jugadoresEnPartida)`. Con 1 solo jugador, la camilla funciona con él (a 70 % de velocidad). Con ≥2 se necesitan 2 enganchados; con 1 enganchado solo avanza al 40 %.
- **Cargar/descargar paciente grave:** camilla adyacente al paciente + `use` 1 s → el paciente se sube. Descargar: camilla adyacente a cama/`X`/`Q` libres + `use` 1 s.
- **Colisión:** la camilla choca con paredes y estaciones; las puertas son de 2 celdas de ancho para que quepa. Un jugador no enganchado hace de obstáculo (se le empuja suavemente).
- **Dash:** un jugador enganchado no puede hacer dash.

**Criterios:** dos jugadores mueven la camilla; un paciente grave se sube y baja; no atraviesa paredes; funciona con 1 jugador.

## MEC-04 · Esterilización y limpieza
**Objetivo de diseño:** el equivalente a "fregar platos": tarea de mantenimiento que condiciona la capacidad.

- **Cama sucia:** tras el alta la cama pasa a `Sucia` (icono de mancha). No admite pacientes. Limpiar: tomar `sabanas` (`M`) y `use` sobre la cama 2 s → `Limpia`.
- **Instrumental (nivel 2):** `Q` (mesa quirúrgica) necesita **1 `instrumental_limpio`** colocado antes de operar. Tras cada cirugía, `Q` produce 1 `instrumental_sucio` que debe recogerse. Ciclo: `Q` → `grab` `instrumental_sucio` → `L` lavabo (`use` 3 s → `instrumental_mojado`) → `A` autoclave (dejar el ítem, 8 s automáticos, suena campana y emite `instrumental_limpio`) → llevar a `Q`.
- **Autoclave:** capacidad 1 ítem. Si el instrumental limpio queda >20 s sin recogerse, vuelve a `sucio` (contaminación).
- Al inicio del nivel 2, `Q` tiene 1 instrumental limpio.

**Criterios:** camas sucias bloquean triaje; ciclo completo de instrumental; temporizador de autoclave visible.

## MEC-05 · Emergencias y caos
**Objetivo de diseño:** romper la rutina y forzar reasignación de roles, como los obstáculos de Overcooked. Un `EventDirector` dispara eventos según `LevelData.events`.

| Evento | Efecto | Resolución |
|---|---|---|
| **Derrame** (`spill`) | Aparece un charco en una celda libre aleatoria. Quien lo pise (sin dash) **resbala**: pierde control 0.6 s deslizando en su dirección y suelta su ítem. | Tomar `mopa` (`M`) y `use` 2 s sobre el charco. |
| **Apagón** (`blackout`, nivel 2) | Las estaciones de proceso se desactivan y la pantalla se oscurece (radio de visión 160 px alrededor de cada jugador). | `use` 3 s en el Cuadro Eléctrico (`U`) — dura máximo 25 s si nadie lo arregla. |
| **Código Azul** (`codeBlue`, nivel 2) | Un paciente en cama sufre un paro. Cuenta atrás de 25 s. | 1) cargar el Desfibrilador (`F`, `use` 3 s) y llevarlo (`desfibrilador` es ítem pesado: −30 % velocidad); 2) junto a la cama, **dos jugadores** mantienen `use` simultáneamente 2 s (compresiones + descarga). Éxito: +200 pts. Fallo: −150 pts y se pierde el paciente. |

**Criterios:** cada evento se dispara, se resuelve y se puede fallar; un solo evento activo de cada tipo a la vez; los eventos no se disparan antes de `firstAtSec`.

---

## Resumen de controles por mecánica
| Mecánica | `grab` | `use` | `dash` |
|---|---|---|---|
| MEC-01 Triaje | — | Triar (R), aplicar tratamiento | — |
| MEC-02 Estaciones | Tomar/dejar | Procesar | Esquivar/velocidad |
| MEC-03 Camilla | Engancharse | Cargar/descargar | Bloqueado enganchado |
| MEC-04 Limpieza | Tomar sábanas/instrumental | Limpiar cama, lavar | — |
| MEC-05 Emergencias | Tomar mopa/desfibrilador | Fregar, reiniciar, compresiones | Evitar resbalar |
