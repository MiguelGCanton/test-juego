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

---

# Expansión — Fases 7 a 10 (solo diseño)

> Diseño de las mecánicas MEC-06…MEC-09. Tareas en [TAREAS.md](TAREAS.md) (T-36…T-48 Fase 7; T-49+ futuras). Decisiones DEC-019…DEC-023 en [DECISIONES.md](DECISIONES.md).
> Principio común: **lógica pura sin Phaser** (testeable) + **vista Phaser** que solo dibuja el estado.

## MEC-06 · Estado visual de objetos (Fase 7)
**Objetivo de diseño:** que el jugador entienda de un vistazo qué hay en cada estación y qué está pasando, sin leer el HUD. Hoy las estaciones son imágenes estáticas: los ítems dejados encima no se ven y no hay barra de progreso en el mundo.

### Contrato
Cada `Interactable` expone `getVisualState(): VisualState` (puro, sin Phaser). Un `StationView` genérico (Phaser) lo dibuja cada frame.

```ts
type VisualActivity = 'idle' | 'loaded' | 'working' | 'paused' | 'done' | 'alert' | 'disabled';
type ProgressKind = 'proceso' | 'limpieza' | 'tratamiento' | 'carga' | 'alerta';
interface VisualState {
  variant: string;                 // sufijo de textura: 'base' | 'activa' | 'sucia' | ...
  activity: VisualActivity;
  item?: { type: ItemType; freshness?: number } | null;   // ítem apoyado (freshness: Fase 10)
  slots?: readonly ({ type: ItemType } | null)[];         // estaciones multi-ítem (Q)
  progress?: { value: number; kind: ProgressKind } | null; // 0..1
  workers?: { current: number; required: number } | null; // p. ej. cirugía 1/2
  badge?: 'check' | 'warning' | 'bolt' | 'skull' | null;
  stain?: number;                  // 0..1 intensidad de suciedad (camas, Fase 10)
}
```

### Reglas visuales comunes
| Situación | Feedback |
|---|---|
| Dejar un ítem (`grab`) | El icono aparece sobre la estación (36 px, sombra) con *pop* (escala 1.2→1 en 0.12 s) + SFX `drop`. |
| Tomar un ítem | El icono vuela de la estación a la cabeza del jugador (0.1 s) + SFX `pickup`. |
| Acción inválida (ítem no aceptado) | Contorno rojo 0.25 s + sacudida horizontal ±3 px + SFX `error` nuevo. |
| Procesando (`use` mantenido) | Textura variante `activa`, vibración ±1 px, partículas propias de la estación, barra de progreso sobre la celda. |
| Pausado (soltó `use` con progreso > 0) | Barra atenuada (alpha 0.5) con icono de pausa; textura vuelve a `base`. |
| Terminado | Destello blanco 0.15 s, icono del ítem de salida, insignia ✔ durante 1 s. |
| Alerta (contaminación, código azul, apagón) | Parpadeo rojo 2 Hz del borde + insignia ⚠. |
| Desactivada (apagón) | Textura desaturada (tinte gris) + insignia ⚡. |
| Objetivo frontal | Contorno cian si `canInteract` es verdadero; gris si no. |

Barra de progreso en el mundo (`WorldProgressBar`): 48×6 px, encima de la celda, color por `ProgressKind` (proceso naranja, limpieza azul, tratamiento verde, carga amarillo, alerta rojo).

### Estados por estación
| Estación | Estados visibles |
|---|---|
| `C` Encimera | vacía · con ítem (icono encima) |
| `K` Curación | vacía · gasas encima · **doblando** (manos/venda animándose, vibración) · venda lista ✔ |
| `J` Preparación | vacía · vial encima · **cargando** (émbolo que sube, líquido que se llena con el progreso) · jeringa lista ✔ |
| `L` Lavabo | vacío · instrumental sucio · **lavando** (burbujas/salpicaduras) · mojado ✔ |
| `G` `P` `N` | pulso al dispensar; `M` muestra el ítem seleccionado (sábanas/mopa) sobre el armario |
| `R` Triaje | barra de triaje; insignia ⚠ "Sin camas" 1 s si no hay cama |
| `B` Cama | limpia (sábana blanca) · asignada (contorno con el color del ticket) · ocupada · **tratando** (barra verde + icono del ítem aplicado) · sucia (manchas) · **limpiando** (las manchas se desvanecen: `stain = 1 − progreso`) · código azul (parpadeo rojo) |
| `A` Autoclave | vacío · **esterilizando** (luz ámbar, vapor, barra) · listo (luz verde + barra roja de contaminación creciente) · contaminado (luz roja, icono sucio) |
| `Q` Mesa quirúrgica | ranuras de instrumental y anestesia (vacía/llena) · **operando** (foco quirúrgico, barra, `workers` 1/2) · instrumental sucio encima |
| `X` Rayos X | **escaneando** (línea de barrido verde que recorre al paciente) + barra |
| `U` Cuadro eléctrico | normal · avería (chispas, parpadeo) · reparando (barra) |
| `F` Desfibrilador | descargado · **cargando** (barra amarilla, rayos) · cargado (luz verde) |
| Charco | al fregar el charco se encoge (escala `1 − 0.7·progreso`) y se aclara |

**Criterios:** todos los ítems apoyados son visibles; toda acción con duración muestra barra en el mundo; cada estación con proceso tiene un aspecto distinto en reposo, trabajando y terminada; la limpieza de camas y charcos se ve progresiva.

## MEC-07 · Mapa dinámico (Fase 8, Nivel 3)
**Objetivo de diseño:** como las cocinas cambiantes de Overcooked: el hospital se transforma durante la partida y obliga a reorganizar rutas y roles.

### Datos
```ts
interface CellChange { col: number; row: number; to: TileChar }
interface MapPhaseSpec {
  id: string;
  atSec: number;      // momento en que se aplica
  warnSec: number;    // aviso previo (celdas parpadeando + banner con cuenta atrás)
  message: string;    // texto del banner, p. ej. "¡Fin de las obras! Se abre el ala este"
  changes: readonly CellChange[];
}
// LevelData.mapPhases?: readonly MapPhaseSpec[]
// LevelOrderSpec.availableFromSec?: number  (la receta no aparece antes)
```

### Nuevas celdas
| Char | Elemento | Regla |
|---|---|---|
| `W` | Mampara de obra | Bloquea como pared. Textura rayada amarilla/negra. |
| `~` | Suelo inundado | Transitable. Jugadores y camilla a ×0.6 de velocidad (`WATER_SPEED_MULTIPLIER`). No admite charcos. Ondas animadas. |

### Transiciones permitidas (lista blanca)
- `W` ↔ `.` · `.` ↔ `~` · `.` → estación (aparece una estación nueva).
- **No** se eliminan estaciones ni se mueven puertas `D` (evita perder estado: ítems, pacientes en cama, progreso).

### Aplicación en caliente
1. `warnSec` antes: las celdas afectadas parpadean (rayas amarillas si van a bloquear, ondas azules si se inundan, contorno verde si aparece estación) y el HUD muestra el banner con cuenta atrás + SFX de aviso.
2. En `atSec` se aplican los cambios:
   - Celda que pasa a bloquear con un **jugador** encima → se le empuja a la celda transitable libre más cercana (BFS).
   - Celda que pasa a bloquear con la **camilla** encima → ese cambio se aplaza y se reintenta cada 0.25 s hasta que quede libre.
   - Charco en una celda que se bloquea o inunda → desaparece.
   - Estación nueva → se crea con `StationFactory` (el mismo código que al cargar el nivel).
3. Los pacientes y NPC calculan rutas con `GridPathfinder` (BFS en 4 direcciones), así que nunca atraviesan las paredes nuevas.

### Validación
`validateLevel` valida el layout base y **cada layout acumulado** tras cada fase: lista blanca de transiciones; los spawns `1-4` cuentan como `.` después del inicio; se permite suelo inalcanzable solo si está encerrado por `W` y no contiene estaciones (zona en obras); las recetas con `availableFromSec` deben tener su estación (`X`, `Q`) presente en ese momento.

**Criterios:** el aviso se ve antes de cada cambio; nadie queda atrapado dentro de una pared; las estaciones nuevas funcionan igual que las originales; los pacientes rodean las mamparas.

## MEC-08 · NPC torpes (Fase 9)
**Objetivo de diseño:** personajes no jugadores que hacen cosas *a medias* o *estropean* cosas, para generar caos que se puede leer y reaccionar a tiempo.

### Arquetipos
| NPC | Personalidad | Acciones (peso) | Cómo lo manejan los jugadores |
|---|---|---|---|
| **Becario** (`becario`) "Dr. Novato" — bata verde, "?" sobre la cabeza, 150 px/s | Quiere ayudar pero **deja todo a medias** | `procesar_a_medias` (4): toma gasas/vial, lo deja en `K`/`J` libre, procesa hasta un 40–70 % y se va. · `limpiar_a_medias` (3): toma sábanas y limpia una cama sucia hasta el 50 %. · `reordenar` (2): mueve un ítem de una encimera a otra encimera libre. | **Supervisar:** `use` 1 s frente a él mientras actúa → termina la tarea al 100 % (+20 pts, "¡Bien hecho, novato!"). Con las manos vacías, `grab` frente a él le quita el ítem que lleva. |
| **Visitante** (`visitante`) "Sr. Despistado" — abrigo gris, vaso de café, 120 px/s | Pasea y **estropea cosas** | `derramar_cafe` (4): crea un charco (MEC-05) en su celda; máx. 2 charcos suyos a la vez. · `sentarse_en_cama` (3): se sienta 4 s en una cama limpia sin asignar → queda **sucia**. · `toquetear` (3): toca el ítem de una encimera → `instrumental_limpio` pasa a `sucio`; `venda`/`jeringa` desaparecen (desde la Fase 10 pasan a `residuo`). | **Acompañar a la salida:** `use` 1 s frente a él → camina a `E` y no vuelve en 30 s. Un **dash** contra él interrumpe su acción (tropieza 1 s). |

### Comportamiento (FSM pura `NpcBrain`)
`Entrando → Eligiendo → Avisando (1.5 s) → Caminando → Actuando → (Eligiendo | Saliendo)`
- **Aviso legible:** 1.5 s antes de ir, burbuja con el icono de la acción (☕ 🛏 ✋ 🔧) y un "!" parpadeante sobre la estación objetivo, para que los jugadores puedan reaccionar.
- **Interrumpible siempre:** si un jugador ocupa o usa la estación objetivo, el NPC cancela y elige otra acción.
- **Límites:** nunca toca pacientes, la camilla, ítems que llevan los jugadores, ni estaciones en uso. Durante un apagón se queda quieto.
- **Movimiento:** `GridPathfinder` (de la Fase 8). Colisión suave con los jugadores; la camilla lo aparta.
- Su progreso en estaciones usa las mismas barras de MEC-06 (barra con contorno punteado para distinguirla).

### Datos
```ts
type NpcKind = 'becario' | 'visitante';
interface NpcSpec { kind: NpcKind; enterAtSec: number; actionEverySec: readonly [number, number] }
// LevelData.npcs?: readonly NpcSpec[]
```
Escalado: 1 jugador → solo el primer NPC de la lista e intervalos ×1.3; 3–4 jugadores → intervalos ×0.85.

**Criterios:** cada acción se avisa antes de ejecutarse; todas se pueden interrumpir; supervisar y acompañar funcionan; un NPC nunca bloquea el nivel (si se atasca 5 s, vuelve a elegir acción o sale).

## MEC-09 · Deterioro con el tiempo (Fase 10)
**Objetivo de diseño:** presión de "lo preparado caduca", como la comida que se quema en Overcooked, mostrando **de forma continua** cómo se estropea cada cosa.

### Ítems perecederos
Solo los **preparados** caducan; los materiales en bruto (gasas, vial, sábanas, mopa) no.

| Ítem | Vida útil | Al estropearse |
|---|---|---|
| `venda` | 45 s | `residuo` |
| `jeringa` | 35 s | `residuo` |
| `instrumental_limpio` (fuera del autoclave) | 40 s | `instrumental_sucio` |

- Multiplicador de velocidad de deterioro: encima de una encimera o en las manos ×1 · en la **Nevera** `H` ×0 (se pausa) · el autoclave conserva su regla propia (MEC-04).
- Etapas por frescura: **Fresco** (100–60 %) → **Pasándose** (60–30 %) → **Crítico** (30–0 %) → **Estropeado**.
- Un `residuo` no sirve para tratar (la cama lo rechaza: contorno rojo + "¡Material caducado!") y se tira en el **Contenedor** `Z`.

### Cómo se ve que se estropea
| Etapa | Visual en el icono (encimera y sobre la cabeza del jugador) |
|---|---|
| Fresco | Icono normal + anillo de frescura verde que se va vaciando. |
| Pasándose | Tinte que pasa poco a poco a amarillo; anillo ámbar; líneas de "olor" ondulantes cada 1.5 s. |
| Crítico | Tinte marrón; anillo rojo; 2 moscas orbitando; parpadeo a 4 Hz los últimos 5 s; SFX de aviso suave al entrar en la etapa. |
| Estropeado | Nube de humo gris, el icono cambia a `item-residuo` (bolsa gris con moscas), SFX "blerg". |

### Entorno que se deteriora
- **Camas muy sucias:** la mancha crece de forma continua (`stain` de 0.5 a 1.0) mientras la cama siga sucia; a los 40 s pasa a `muy_sucia` (manchas grandes + moscas) y limpiarla tarda 3.5 s en vez de 2.
- **Charcos que se extienden:** un charco sin fregar crece (escala 0.6→1.0) y a los 25 s se extiende a una celda vecina libre (máx. 3 celdas por foco). Fregar el original no limpia los derivados.

### Nuevas estaciones
| Char | Elemento | Regla |
|---|---|---|
| `Z` | Contenedor de residuos | `grab` con cualquier ítem → lo destruye (tapa que se abre). |
| `H` | Nevera | Encimera de 1 ítem con deterioro ×0; el icono se ve escarchado. |

### Datos
```ts
interface DecaySpec { items: boolean; dirtyBeds: boolean; spillSpread: boolean }
// LevelData.decay?: DecaySpec   (ausente = sin deterioro)
// config/decay.ts: vidas útiles, umbrales de etapa y multiplicadores
```

**Criterios:** cada ítem perecedero muestra su frescura de forma continua; al caducar cambia de ítem; la cama rechaza residuos; la nevera pausa el deterioro; camas y charcos empeoran de forma visible.
