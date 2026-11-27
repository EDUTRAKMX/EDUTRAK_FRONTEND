# Inventario de Figma — EDUTRAK

- Archivo: <https://www.figma.com/design/6XQ9NdLBIaU6ncl1KT32LF/EDUTRAK>
- File key: `6XQ9NdLBIaU6ncl1KT32LF`
- Páginas: **Desktop** `0:1` (34 frames, 1440 px de ancho) · **mobile** `22:2` (45 frames, 390/440 px)
- Fuente de nuevas consultas: **claude-in-chrome** (el MCP oficial de Figma alcanzó su límite en el plan Starter). Referencias locales en `.design-reference/` (ignorada por Git).
- Estado: inventario obtenido con `get_metadata` (solo frames de primer nivel de cada sección). El contexto
  detallado (`get_design_context`) se consulta **por rol, en su fase**, para no saturar el contexto.

> Estado de implementación: ☐ pendiente · ◐ parcial/temporal · ☑ implementado y verificado

## Hallazgos de diseño (aplican a todas las fases)

1. **No existe diseño de Login, perfil, cambio obligatorio de contraseña ni acceso denegado.** Se construirán con el sistema visual existente (Fase 2).
2. **Anchos móviles distintos:** Profesor y Director a 440 px; Alumno y Tutor a 390 px. Se trata como diseño fluido 320–440.
3. **Menú móvil por rol** con ancho propio: 312 px (Alumno, Tutor) y 352 px (Profesor, Director).
4. **Etiquetas e iconos del menú móvil difieren del sidebar de escritorio** (p. ej. "Calificaciones" ↔ "Mis calificaciones", `clipboard-list` ↔ `graduation-cap`). Ambas variantes están en `core/navigation/nav.config.ts`.
5. **El sidebar del Director (escritorio) tiene ítems sin pantalla en Figma:** Asignaciones de tutores, Analytics, Alertas, Auditoría. El menú móvil del Director solo trae Inicio, Periodos, Grupos y Horarios.
6. **Foto de perfil:** el Alumno en escritorio usa la inicial; Profesor, Director y Tutor usan foto. El menú móvil siempre usa foto. Solo se descargó un placeholder (`public/images/avatar-placeholder.jpg`).
7. **Estado colapsado del sidebar** (tirador `Sidebar Toggle`, 134:5667): no se consultó su frame colapsado; la versión de solo iconos es provisoria.
8. El logo del sidebar es un cuadrado `secondary` de 32 px (sin marca vectorial en los frames consultados).

## Tokens (Figma `get_variable_defs` sobre 134:5465)

| Variable Figma | Valor | Token CSS (`src/styles.css`) |
|---|---|---|
| Primary | `#029a7b` | `--color-primary` |
| Primary Light | `#6cc8b4` | `--color-primary-light` |
| Secondary | `#8a2d40` | `--color-secondary` |
| Text | `#17201f` | `--color-ink` |
| Secondary Text | `#646b72` | `--color-muted` |
| Bg color | `#f6f8f8` | `--color-canvas` |
| Surface | `#ffffff` | `--color-surface` |
| Border | `#d9e3e0` | `--color-border` |
| Transparent/Secondry Transparent | `#e6eaed` | `--color-divider` |
| Light/Light 500 | `#f7f7f7` | `--color-chip` |
| success / text badge success | `#e3f3ee` / `#065c46` | `--color-success-bg` / `-fg` |
| Warning badge / text badge warning | `#fbefd9` / `#8a5300` | `--color-warning-bg` / `-fg` |
| info badge / text badge info | `#e6eefc` / `#2457c5` | `--color-info-bg` / `-fg` |
| danger badge / text badge danger | `#fbe7e5` / `#b3261e` | `--color-danger-bg` / `-fg` |
| default badge | `#e6ecea` | `--color-neutral-bg` |
| Success/success-500 | `#22c55e` | `--color-online` |
| Radius/Rounded Medium | 6 | `--radius-control` |
| Padding X/px-4, Y/py-2 | 16, 8 | (utilidades Tailwind) |
| Shadows/Base/1 | 0 1 2 `#8080801a` | `--shadow-dot` |

Valores no variabilizados en Figma, tomados del código de diseño: tarjetas `rounded-[20px]` con sombra
`0 4px 10px rgba(8,121,93,.08)` (indicadores) y `0 6px 10px …` (paneles); drawer `8px 0 30px rgba(19,33,29,.18)`;
píldora de periodo `rgba(32,138,99,.12)` / `#208a63`. Tipografía: **Inter** (300–700). Iconos: **Lucide**.

## Layouts base consultados en la Fase 1

| Elemento | Node ID | Notas |
|---|---|---|
| Alumno · Inicio (Desktop) | `134:5465` | referencia visual del shell, tarjetas y paneles |
| Alumno · Sidebar | `134:5466` | 252 px; título 65 px; ítems 36 px |
| Alumno · Topbar | `134:5649` | 65 px; píldora periodo, campana, perfil, tirador |
| Alumno · Inicio (mobile) | `183:11040` (Topbar `183:11041`) | cabecera 64 px; tarjetas 174×209, rejilla 2 columnas gap 10 |
| Menú modal Alumno / Profesor / Director / Tutor | `225:5196` / `225:4739` / `225:4956` / `225:5381` | 312 / 352 / 352 / 312 px |
| Profesor · Inicio mobile / Desktop | `176:2` / `127:829` (Sidebar `127:830`) | capturas para comparación |
| Director · Inicio Desktop (Sidebar `66:4`) | `66:3` | sidebar con 4 grupos |
| Tutor · Inicio Desktop / mobile | `161:2153` / `201:2709` (Sidebar `161:2154`) | sidebar consultado con Chrome: iconos `user-round-group`, `file-text`, `spotlight`, `triangle-alert`, `chart-column` |

## Alumno (Student · Justifications)

| Pantalla | Desktop | Mobile | Ruta propuesta | Interacciones | Estado |
|---|---|---|---|---|---|
| Inicio | `134:5465` | `183:11040` | `/alumno/inicio` | indicadores, horario de hoy, avisos | ◐ (demo temporal) |
| Horario | `159:1648` | `183:11189` | `/alumno/horario` | semana/día | ☐ |
| Mis calificaciones | `133:5148` | `183:11207` | `/alumno/calificaciones` | consulta por unidad/categoría | ☐ |
| Mi asistencia | `151:2` | `183:11535` | `/alumno/asistencia` | historial, QR check-in (simulado) | ☐ |
| Mis justificaciones | `159:1871` | `183:11391` | `/alumno/justificantes` | lista, filtros, abrir detalle | ☐ |
| Modal solicitar justificante | `156:59` (587 px) | `183:11724` (bottom sheet) | modal | formulario, adjuntos ≤10 MB | ☐ |
| Modal ver justificante | `158:1381` (587 px) | `183:11770` (bottom sheet) | modal | detalle, estado | ☐ |
| Menú móvil | — | `225:5196` | shell | navegación | ☑ |

## Profesor (Professor · Attendance · Grades)

| Pantalla | Desktop | Mobile | Ruta propuesta | Interacciones | Estado |
|---|---|---|---|---|---|
| Inicio | `127:829` | `176:2` | `/profesor/inicio` | clases de hoy, pendientes | ◐ (demo temporal) |
| Mis grupos y materias | `122:3` | `176:258` | `/profesor/grupos` | lista/filtro | ☐ |
| Asistencia | `131:3286` | `22:3` | `/profesor/asistencia` | iniciar sesión de asistencia | ☐ |
| Asistencia activa | `127:1723` | QR `27:9838` · MANUAL `27:10017` · NFC `27:7495` | `/profesor/asistencia/activa` | QR rotativo (simulado), manual, **NFC simulado**, cerrar | ☐ |
| Calificaciones | `128:2163` | `176:687` | `/profesor/calificaciones` | por grupo | ☐ |
| Calificaciones · grupo específico | `131:4330` | `176:904` | `/profesor/calificaciones/:grupo` | captura/edición por unidad | ☐ |
| Horario | `131:4809` | `176:583` | `/profesor/horario` | consulta | ☐ |
| Justificantes | `131:3877` | `41:11418` (Solicitud de justificantes) | `/profesor/justificantes` | aprobar/rechazar | ☐ |
| Status Sheet / Container | — | `41:11360` / `41:11358` | componentes móviles | hoja de estado | ☐ |
| Menú móvil | — | `225:4739` | shell | navegación | ☑ |

## Director (Director & Academic)

| Pantalla | Desktop | Mobile | Ruta propuesta | Interacciones | Estado |
|---|---|---|---|---|---|
| Inicio | `66:3` | `183:7804` | `/director/inicio` | indicadores, alertas, tabla de grupos | ◐ (demo temporal) |
| Periodos académicos | `69:960` | `183:6517` | `/director/periodos` | crear, activar, cerrar | ☐ |
| Grupos | `72:3849` | `183:6738` | `/director/grupos` | crear, asignar tutor, acciones | ☐ |
| Horarios | `83:6248` | `183:6975` | `/director/horarios` | consulta/gestión | ☐ |
| Horario del grupo | `83:6588` | `183:7136` | `/director/horarios/:grupo` | consulta/edición | ☐ |
| Información del grupo · Resumen | `78:4528` | `183:7164` | `/director/grupos/:id` | pestaña Resumen | ☐ |
| Información del grupo · Alumnos | `83:5496` | `183:7336` | `/director/grupos/:id/alumnos` | pestaña Alumnos | ☐ |
| Modal nuevo periodo | `72:886` (587 px) | `183:11926` | modal | formulario | ☐ |
| Modal nuevo grupo | `83:5148` (587 px) | `183:12006` | modal | formulario | ☐ |
| Modal asignar tutor | `83:5427` (587 px) | `183:12054` | modal | selector | ☐ |
| Dropdown actions | `72:3765` (236 px) | `183:12084` (bottom sheet) | menú | acciones de fila | ☐ |
| Ventana nuevo horario | — | `304:508` | modal móvil | formulario | ☐ |
| Modal Añadir Clase | — | `325:239` | modal móvil | formulario | ☐ |
| Menú móvil | — | `225:4956` | shell | navegación | ☑ |

## Tutor (Tutor · Analytics · Alerts · Audit)

| Pantalla | Desktop | Mobile | Ruta propuesta | Interacciones | Estado |
|---|---|---|---|---|---|
| Inicio | `161:2153` | `201:2709` | `/tutor/inicio` | casos a revisar, seguimientos | ◐ (demo temporal) |
| Mis alumnos | `183:12840` | `201:2825` | `/tutor/alumnos` | búsqueda/filtro | ☐ |
| Mis alumnos · Alumno detalle | `183:13221` | `201:3565` | `/tutor/alumnos/:id` | resumen académico, nuevo seguimiento | ☐ |
| Justificantes | `183:13667` | `201:3761` (Solicitud de justificantes) | `/tutor/justificantes` | aprobar/rechazar con comentario | ☐ |
| Seguimientos | `183:14062` | `201:3161` | `/tutor/seguimientos` | historial, crear (no editable) | ☐ |
| Alertas | `186:14270` | `201:3256` | `/tutor/alertas` | reconocer/resolver, recalcular | ☐ |
| Alertas · Detalle | `187:19220` | `201:3411` | `/tutor/alertas/:id` | detalle | ☐ |
| Estadísticas | `186:14358` | `201:3503` | `/tutor/estadisticas` | gráficas (datos simulados) | ☐ |
| Status Sheet | — | `201:3952` | componente móvil | hoja de estado | ☐ |
| Menú móvil | — | `225:5381` | shell | navegación | ☑ |

## Funcionalidades sin diseño o sin contrato (registro)

| Funcionalidad | Diseño | Contrato backend | Decisión |
|---|---|---|---|
| Login | ✘ | `POST /api/auth/login` | **Hecho en la Fase 2** con el sistema visual |
| Cambio obligatorio de contraseña | ✘ | `PATCH /api/auth/password` | **Hecho en la Fase 2** |
| Acceso denegado (403/404) | ✘ | códigos 403/404 | **Hecho en la Fase 2** (solo 403 por rol / sin interfaz) |
| Interfaz de Administrador | ✘ | `/api/admin/users…` | **Pospuesta**, soporte de rol conservado |
| Asistencia NFC | ✔ (mobile) | ✘ (no hay endpoint) | Simulación identificada |
| Auditoría / Analytics / Alertas / Asignaciones de tutores del Director | ítems de sidebar sin frame | Alertas/analytics sí; auditoría **no** | Registrar al llegar a la Fase 3 |
| Estado colapsado del sidebar | ✘ (no consultado) | — | Provisorio, verificar con Figma |
| Panel de notificaciones (campana) | ✘ | ✘ | Sin comportamiento hasta tener diseño |
| Menú de usuario / cerrar sesión (chevron del perfil) | ✘ | `POST /api/auth/logout` | **Hecho en la Fase 2** (escritorio: desplegable; móvil: pie del menú) |


## Interfaces creadas SIN referencia directa de Figma (Fase 2)

Figma no contiene ninguna pantalla de autenticación ni menú de usuario (confirmado en la Fase 0 y por Chrome). Se diseñaron con los
tokens, tipografía (Inter), iconos Lucide, radios y sombras existentes, sin rediseñar ninguna pantalla de los cuatro roles.
Capturas locales en `.design-reference/phase2/` (ignorada por Git).

| Interfaz | Archivo | Qué se reutilizó de Figma | Qué es nuevo |
|---|---|---|---|
| Marco de autenticación | `layouts/auth/auth-layout.component.ts` | Logotipo del sidebar (cuadro `secondary` + "EDUTRAK" + institución), colores `success-bg`/`primary`/`ink` | Composición: panel de marca (≥1024 px) + tarjeta de formulario; en móvil solo la tarjeta |
| Login | `features/identity/login/` | Tarjeta (radio 20, borde, `shadow-card`), botón primario 134:5627, avisos con pares `info`/`danger` | Campos, avisos, panel plegable de cuentas demo |
| Cambio de contraseña | `features/identity/change-password/` | Ídem | Tres campos, textos de ayuda |
| Acceso denegado | `features/identity/access-denied/` | Ídem + par `danger` | Icono `shield-alert` en círculo |
| Campo de formulario | `shared/components/form/input-field.component.ts` | Radio 8, borde `border`, texto `ink`/`muted` | Alto 44 px, icono inicial, mostrar/ocultar contraseña, estados de error |
| Botón secundario | `shared/components/button/` (`variant="secondary"`) | Mismas métricas del botón primario | Fondo `surface` + borde `border`. **Revisar al llegar a los modales (Fase 3)** |
| Menú de usuario (escritorio) | `layouts/shell/topbar.component.ts` | Bloque de perfil del topbar 134:5649 (intacto), `shadow-card-lg`, radio 12 | Desplegable con nombre, rol y "Cerrar sesión" |
| Cerrar sesión (móvil) | `layouts/shell/mobile-menu.component.ts` | Ítems de 56 px y tokens del menú 225:5196 | Pie del panel con una acción |

Decisiones sujetas a revisión por diseño: panel de marca del login, textos de apoyo, botón secundario y ubicación de "Cerrar sesión".
