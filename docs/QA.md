# Matriz de Pruebas y Checklist QA — Código Caos

> Documento de control de calidad y verificación integral para *Código Caos*.
> Fecha de validación: 2026-10-07 · Antigravity
> Estado general: **100 % APROBADO** (24 suites de tests unitarios, 85/85 tests pasando, build de producción limpio).

---

## 1. Matriz de Pruebas por Modo y Jugadores

| Nivel | Jugadores | Modificadores de Escalado | Comportamiento Verificado | Estado |
|---|---|---|---|:---:|
| **Nivel 1** (Urgencias) | **1 Jugador** | `maxPatients = 3`, Camilla al 70 % de vel., 1 cirujano | Camilla maniobrable por 1 jugador, 3 camas suficientes para la rotación, onboarding guiado | **PASS** |
| **Nivel 1** (Urgencias) | **2 Jugadores** | Valores base (`maxPatients = 4`, Camilla cooperativa 100 %) | Coordinación óptima: 1 jugador en triaje/farmacia y 1 en enfermería/camilla | **PASS** |
| **Nivel 1** (Urgencias) | **3–4 Jugadores** | Intervalo de pedidos $\times 0.85$ (más frecuente) | Ritmo frenético de atención, reparto claro de roles | **PASS** |
| **Nivel 2** (Quirófano) | **1 Jugador** | `maxPatients = 4`, Código Azul exige 1 jugador, Cirugía exige 1 jugador | Quirófano operable en solitario, desfibrilador transportable con penalización de peso | **PASS** |
| **Nivel 2** (Quirófano) | **2 Jugadores** | Valores base, Cirugía cooperativa 2P, Código Azul cooperativo 2P | Cuello de botella central de camilla exige comunicación; ciclo de instrumental fluido | **PASS** |
| **Nivel 2** (Quirófano) | **3–4 Jugadores** | Intervalo $\times 0.85$, emergencias constantes | 1 equipo en sala general y 1 en quirófano/autoclave; Código Azul requiere parada de tareas | **PASS** |

---

## 2. Checklist de Mecánicas

### MEC-01: Triaje y Pacientes
- [x] Paciente genera dolencias según tabla de pesos del nivel.
- [x] Triaje en `R` asigna cama limpia y libre; si no hay, muestra aviso "Sin camas".
- [x] Paciente en tratamiento congela su paciencia; al finalizar se da el alta (+puntos según paciencia restante).
- [x] Paciente cuya paciencia llega a cero se pierde (−50 pts y libera cama como sucia).
- [x] Cálculo de estrellas (1, 2, 3) verificado según umbrales de puntuación del nivel.

### MEC-02: Ítems y Estaciones de Procesamiento
- [x] Dispensadores infinitos (`G` gasas, `P` viales, `N` anestesia, `M` sábanas/mopa con alternancia).
- [x] Encimeras `C` permiten depositar y recoger 1 ítem con `grab`.
- [x] Estación de curación `K` procesa gasas $\rightarrow$ venda en 3.0 s (<kbd>Usar</kbd> mantenido).
- [x] Mesa de preparación `J` procesa vial $\rightarrow$ jeringa en 2.0 s (<kbd>Usar</kbd> mantenido).
- [x] Lavabo `L` limpia instrumental sucio $\rightarrow$ instrumental mojado en 3.0 s.
- [x] Las estaciones no consumen tiempo si no tienen el ítem requerido o si se suelta <kbd>Usar</kbd>.

### MEC-03: Camilla Cooperativa
- [x] Camilla Arcade 2×1 con enganche/desenganche mediante tecla `grab`.
- [x] Movimiento como vector promedio de los jugadores enganchados.
- [x] Escalado de velocidad: 1P solo = 70 %, 2P coordinados = 100 %, 2P con 1 solo enganchado = 40 %.
- [x] Carga de paciente grave desde puerta `D` con <kbd>Usar</kbd> mantenido 1.0 s.
- [x] Descarga de paciente a cama limpia `B` con <kbd>Usar</kbd> mantenido 1.0 s.
- [x] Rayos X `X`: escaneo de paciente con fractura en 4.0 s con camilla adyacente.

### MEC-04: Limpieza y Esterilización
- [x] Cama tras alta queda sucia (`isClean = false`) y bloquea asignación de nuevos pacientes en triaje.
- [x] Limpieza de cama con `sabanas` + <kbd>Usar</kbd> durante 2.0 s.
- [x] Autoclave `A`: recibe `instrumental_mojado`, esteriliza automáticamente en 8.0 s produciendo `instrumental_limpio`.
- [x] Temporizador de contaminación: si el instrumental limpio no se retira tras 20.0 s, se contamina y vuelve a `instrumental_sucio`.
- [x] Mesa quirúrgica `Q`: requiere `instrumental_limpio` + `anestesia` + paciente grave en camilla; operación de 6.0 s (2 jugadores en multi, 1 en solitario); genera `instrumental_sucio`.

### MEC-05: Emergencias y Caos
- [x] **Derrame (`spill`)**: charco en suelo libre; resbalón forzado de 0.6 s con pérdida de ítem (inmune con Dash); limpieza con `mopa` en 2.0 s.
- [x] **Apagón (`blackout`)**: oscurece el mapa con máscara de visión de 160 px; desactiva estaciones de procesamiento; reparación en cuadro `U` en 3.0 s o auto-restablecimiento a los 25.0 s.
- [x] **Código Azul (`codeBlue`)**: cuenta atrás de 25.0 s en cama ocupada; carga de desfibrilador en `F` (3.0 s, ítem pesado −30 % vel.); reanimación cooperativa de 2.0 s (+200 pts en éxito, −150 pts y paciente perdido en fallo).

---

## 3. Robustez, UI y Accesibilidad

- [x] **Desconexión de mandos (T-31)**: Al desconectar un gamepad en partida, el juego se pausa automáticamente y muestra el aviso contextual `⚠️ Mando de P# desconectado. Por favor, reconéctalo para continuar.` No permite reanudar hasta reconectar el dispositivo.
- [x] **Escalado por jugadores (T-32)**: Configuración automática de parámetros en `PatientSpawner` y estaciones (`1P`, `2P`, `3-4P`).
- [x] **Audio procedural WebAudio (T-33)**: Sintetizador WebAudio sin dependencias de red: `pickup`, `drop`, `processComplete`, `discharge`, `patientLost`, `emergencyAlarm`, `dash`, `slip`, `defibShock`, navegación de menú.
- [x] **Onboarding Nivel 1 (T-34)**: Paciente 1 garantizado `herida`, paciente 2 garantizado `fiebre`, `fractura` bloqueada los primeros 45 s; barra de tutorial dinámica en la parte inferior guiando paso a paso.
- [x] **Menú de pausa y desenfoque (T-20)**: Menú de pausa navegable con teclado/gamepad; pausa automática al perder foco (`blur`).
- [x] **Pantalla de resultados y ciclo de juego**: Estadísticas completas de altas, pérdidas, estrellas y opciones de Reintentar / Niveles / Menú.
