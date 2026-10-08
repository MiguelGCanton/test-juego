# Niveles — Código Caos

> **Solo diseño.** Los datos están listos para ser convertidos a `LevelData` (ver [src/levels/types.ts](../src/levels/types.ts)). Rejilla 20×10 celdas de 64 px (1280×640). El HUD ocupa los 80 px superiores. Coordenadas `(col, fila)` desde 0 arriba-izquierda.

## Leyenda del layout
| Char | Elemento | Mecánica |
|---|---|---|
| `#` | Pared | — |
| `.` | Suelo libre | — |
| `1`-`4` | Spawn de jugador P1..P4 (suelo) | Base |
| `D` | Puerta de ingreso de pacientes (spawn) | MEC-01 |
| `R` | Mostrador de triaje | MEC-01 |
| `B` | Cama | MEC-01/04 |
| `E` | Salida de altas | MEC-01 |
| `C` | Encimera (almacena 1 ítem) | MEC-02 |
| `G` | Dispensador de gasas | MEC-02 |
| `P` | Farmacia (dispensador de viales) | MEC-02 |
| `K` | Estación de curación (gasas→venda) | MEC-02 |
| `J` | Mesa de preparación (vial→jeringa) | MEC-02 |
| `T` | Posición inicial de la camilla | MEC-03 |
| `X` | Rayos X | MEC-01/03 |
| `M` | Armario de limpieza (sábanas / mopa) | MEC-04/05 |
| `L` | Lavabo de instrumental | MEC-04 |
| `A` | Autoclave | MEC-04 |
| `Q` | Mesa quirúrgica (ocupa 2 celdas contiguas `QQ`) | MEC-04 |
| `N` | Dispensador de anestesia | MEC-02 |
| `F` | Desfibrilador | MEC-05 |
| `U` | Cuadro eléctrico | MEC-05 |

Reglas de validez (validar en el `LevelLoader`): 10 filas × 20 columnas exactas; perímetro `#` salvo `D`; exactamente 4 spawns; al menos 1 `D`, `R`, `E`, `T`; todas las celdas transitables alcanzables desde un spawn; puertas/pasillos de la camilla ≥ 2 celdas de ancho.

---

## Nivel 1 — "Urgencias: Turno de Noche" (`nivel-1`)
**Propósito:** tutorial jugable. Introduce MEC-01, MEC-02, MEC-03 (solo con Rayos X) y la limpieza de camas de MEC-04. **Sin eventos de caos.** Pensado para 1–4 jugadores.

```
col  01234567890123456789
r0   ####################
r1   #B.B.B.....G.G.P.P.#
r2   #..................#
r3   #...C.C.........K..#
r4   D..R...12.......J..#
r5   D..R...34.......J..#
r6   #...C.C.........K..#
r7   #..................#
r8   #M..T......X......E#
r9   ####################
```

- **Flujo espacial:** entrada (izquierda) → triaje (`R`) → camas arriba (`B` ×3) → suministros arriba a la derecha (`G`,`P`) → estaciones `K`/`J` en columna central-derecha → Rayos X abajo → salida abajo a la derecha.
- **Camas:** (1,1), (3,1), (5,1). Solo 3 camas ⇒ presión de limpieza.
- **Dolencias:** `herida` (peso 5), `fiebre` (peso 4), `fractura` (peso 2).
- **Parámetros:** duración **180 s**, `maxPatients` 4, intervalo de pedidos **[14, 22] s**, estrellas **[300, 700, 1100]**, eventos `[]`.
- **Onboarding sugerido:** primeros 2 pacientes fijos (`herida`, luego `fiebre`) con textos de ayuda; `fractura` no aparece antes de los 45 s.
- **Diseño intencional:** `G`/`P` lejos de `R` → recorrer el mapa; `K` y `J` agrupadas → roles naturales (cocinero de gasas / de jeringas); camilla lejos de las camas obliga a coordinarse.

```json
{
  "id": "nivel-1", "name": "Urgencias: Turno de Noche",
  "durationSec": 180, "stars": [300, 700, 1100],
  "orders": [ {"recipeId":"herida","weight":5}, {"recipeId":"fiebre","weight":4}, {"recipeId":"fractura","weight":2} ],
  "orderIntervalSec": [14, 22], "maxPatients": 4, "events": []
}
```

---

## Nivel 2 — "Planta Quirúrgica: Código Azul" (`nivel-2`)
**Propósito:** desafío completo. Usa las 5 mecánicas. El mapa está dividido en **sala general** (izquierda) y **quirófano** (derecha), conectados por una puerta de 2 celdas en la columna 12 (filas 4–5) — cuello de botella natural para la camilla.

```
col  01234567890123456789
r0   ####################
r1   #B.B.B.B.GP.#.N.QQ##
r2   #...........#.....F#
r3   #..C.C..K.J.#......#
r4   D..R..............L#
r5   D..R...12.........A#
r6   #..C.C..34...#.....#
r7   #...........#.U....#
r8   #M..T..X...E#......#
r9   ####################
```

- **Camas:** (1,1), (3,1), (5,1), (7,1) — 4 camas.
- **Quirófano:** `Q` en (16,1)-(17,1), anestesia `N` (14,1), desfibrilador `F` (18,2), cuadro eléctrico `U` (14,7), lavabo `L` (18,4), autoclave `A` (18,5).
- **Dolencias:** `herida` (peso 3), `fiebre` (3), `fractura` (2), `cirugia` (3).
- **Parámetros:** duración **240 s**, `maxPatients` 5, intervalo **[12, 18] s**, estrellas **[500, 1100, 1700]**.
- **Eventos:**
  - `spill`: primero a los 30 s, cada [35, 50] s.
  - `blackout`: primero a los 90 s, cada [60, 80] s.
  - `codeBlue`: primero a los 120 s, cada [70, 90] s (nunca si no hay paciente en cama).
- **Diseño intencional:** el ciclo de instrumental (`Q`→`L`→`A`→`Q`) queda en el quirófano, lejos de las camas; el desfibrilador está en la esquina opuesta a las camas (carrera con el reloj del Código Azul); el apagón desactiva las estaciones justo cuando hay presión de instrumental.
- **Spawns** (7,5), (8,5), (8,6), (9,6): el equipo arranca en el centro de la sala general.

```json
{
  "id": "nivel-2", "name": "Planta Quirúrgica: Código Azul",
  "durationSec": 240, "stars": [500, 1100, 1700],
  "orders": [ {"recipeId":"herida","weight":3}, {"recipeId":"fiebre","weight":3}, {"recipeId":"fractura","weight":2}, {"recipeId":"cirugia","weight":3} ],
  "orderIntervalSec": [12, 18], "maxPatients": 5,
  "events": [
    {"type":"spill","firstAtSec":30,"everySec":[35,50]},
    {"type":"blackout","firstAtSec":90,"everySec":[60,80]},
    {"type":"codeBlue","firstAtSec":120,"everySec":[70,90]}
  ]
}
```

> En el nivel 2 los ítems `G`/`P`/`K`/`J` están en la sala general; `M`, `X` y `T` también. `E` está en (11,8), al fondo de la sala general.

## Escalado por jugadores
| Jugadores | Ajuste |
|---|---|
| 1 | Camilla al 70 % de velocidad sola; `maxPatients` −1; Código Azul exige solo 1 jugador (compresiones automáticas tras 2 s). |
| 2 | Valores base. |
| 3-4 | Intervalo de pedidos × 0.85. |
