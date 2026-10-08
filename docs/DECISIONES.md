# Registro de decisiones

Formato: **DEC-###** · fecha · decisión · motivo. Añade las nuevas al final.

| ID | Decisión | Motivo |
|---|---|---|
| DEC-001 | Stack: **Phaser 4.2.1**, **Vite 8.3**, **TypeScript 7.0**, **Vitest 5**. | Pedido "últimas versiones" (verificado con `npm view` el 2026-10-07). |
| DEC-002 | Resolución lógica 1280×720, `Scale.FIT` centrado; rejilla 20×10 de 64 px (1280×640) + HUD de 80 px arriba. | Mismo tamaño en cualquier pantalla; rejilla suficiente para 2 niveles con distintas zonas. |
| DEC-003 | Multijugador **local** 1–4 (teclado ×2 y mandos), sin online. | Es un party game de sofá; el online multiplica el alcance. |
| DEC-004 | Física **Arcade** sin gravedad. | Suficiente para top-down, simple para agentes de menor capacidad; incluida en Phaser. |
| DEC-005 | Tema "hospital": pedidos = pacientes; 5 mecánicas: MEC-01 Triaje, MEC-02 Ítems/estaciones, MEC-03 Camilla cooperativa, MEC-04 Limpieza/esterilización, MEC-05 Emergencias. | Mapea 1:1 los pilares de Overcooked (pedidos, ingredientes, fregar, obstáculos) y añade una mecánica propia (camilla a 2). |
| DEC-006 | Esquemas de teclado: A = WASD+E/Q/Espacio, B = flechas+./,/M. | Dos jugadores en un teclado sin solaparse. |
| DEC-007 | Teclado leído con listeners nativos de `window` usando `KeyboardEvent.code`, no con el plugin de teclado de Phaser (`input.keyboard: false`). | Independiente del layout (AZERTY…), permite mapear varios esquemas sin crear teclas por jugador, y el estado se consulta por frame de forma uniforme con los mandos. |
| DEC-008 | `.npmrc` con `legacy-peer-deps=true`. | `npm install` con npm 10.9 falla con `Cannot read properties of null (reading 'edgesOut')` al resolver peers de vite/vitest. |
| DEC-009 | Niveles como **datos** (layout ASCII + parámetros) validados por un loader. | Los agentes pueden crear/editar niveles sin tocar código de escenas. |
| DEC-010 | Sin assets artísticos: placeholders generados por código (T-01). | Evita bloquear el desarrollo; el arte se sustituye por clave de textura. |
| DEC-011 | Identificadores en inglés; documentación y textos de UI en español. | Convención común de código + público hispanohablante. |
| DEC-012 | Camilla: `pushersRequired = min(2, jugadores)`; promedio de vectores de movimiento. | Cooperación forzada (y caos divertido) sin bloquear partidas de 1 jugador. |
| DEC-013 | Un solo ítem por jugador; interacción frontal con `facing` en 4 direcciones. | Reglas simples de aprender como en Overcooked; simplifica la detección. |
| DEC-014 | `GameScene` incluye avatares movibles provisionales. | Validar el soporte multijugador sin implementar mecánicas; se reemplazan en T-05. |
| DEC-015 | Aviso `EBADENGINE` de Vitest 5 en Node 23: se ignora (los tests pasan). | Vitest pide Node ^22.12/^24; recomendado actualizar Node a 24 LTS. |
| DEC-016 | Dash inmune a charcos; camilla bloquea dash. | Da utilidad táctica al dash y evita saltarse la cooperación. |
| DEC-017 | Escalado de dificultad por nº de jugadores definido en NIVELES.md. | Mantener el reto razonable de 1 a 4 jugadores. |
| DEC-018 | Celda (18, 1) en Nivel 2 fijada como pared (`#`) en vez de suelo (`.`). | Estaba atrapada entre la pared superior, la mesa `Q` y el desfibrilador `F`, haciéndola inalcanzable para los jugadores. |
