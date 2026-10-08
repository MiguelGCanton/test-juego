# Soporte multijugador local

Hasta **4 jugadores** (`MAX_PLAYERS`) en el mismo equipo, con cualquier mezcla de **teclado** y **mandos**.

## Dispositivos
| ID | Dispositivo | Mover | Agarrar | Usar | Dash | Pausa |
|---|---|---|---|---|---|---|
| `kb-a` | Teclado A | WASD | E | Q | Espacio | Esc |
| `kb-b` | Teclado B | Flechas | . | , | M | Enter |
| `pad-N` | Mando N (hasta 4) | Stick izq. / cruceta | A | X | B / RB | Start |

Los mandos se detectan automáticamente (`navigator.getGamepads()`); deadzone 0.25.

## Flujo
1. En el **Lobby** cada jugador pulsa `grab` en su dispositivo para unirse (slot P1..P4, con color) y `use` para salir.
2. Cualquier jugador unido pulsa `dash` para continuar a la selección de nivel.
3. El `Roster` (registry de Phaser) conserva los jugadores durante la partida.

## Reglas para el código de juego
- **Nunca** leer teclado/gamepad directamente en gameplay: usar `getInput(scene).read(deviceId)` → `InputFrame` (con `grabPressed`, `usePressed`, `useReleased`, `dashPressed`, `pausePressed`).
- `InputManager.update()` se llama **una vez por frame** (la escena activa lo hace al inicio de `update`).
- Un jugador = un `PlayerSlot` (`index`, `deviceId`, `color`, `name`). Un dispositivo controla como máximo un jugador.
- Pérdida de mando durante la partida: tarea pendiente (T-31) — pausar y mostrar "Reconecta el mando".
- Colores accesibles: además del color, cada jugador lleva su etiqueta `P1..P4` sobre la cabeza.

## Limitaciones conocidas
- Los teclados no soportan "ghosting": 2 teclados A+B simultáneamente funcionan bien, pero 3+ teclas distintas por teclado físico pueden fallar según el hardware. Recomendado: mandos a partir de 3 jugadores.
- Los mandos necesitan una pulsación inicial para ser detectados por el navegador.
