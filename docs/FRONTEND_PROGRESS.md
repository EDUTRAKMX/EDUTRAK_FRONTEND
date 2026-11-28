# Progreso del frontend

> Documento de continuidad: permite retomar el trabajo tras una compactación de contexto o fin de créditos.
> Git: todas las operaciones de escritura las hace el equipo (rama `feat/frontend-foundation`). Nada está commiteado por Claude.

## Cómo ejecutar

```bash
npm ci                      # o npm install
npm start                   # ng serve → http://localhost:4200  (configuración development: mock + mockAuth)
npm run build               # build de producción (aún sin repositorios HTTP)
npx ng build -c demo        # build de demostración explícito con datos mock
npm test                    # ng test (Vitest + jsdom; pruebas existentes)
```

Rutas disponibles: `/login`, `/cambiar-contrasena`, `/acceso-denegado` y, tras iniciar sesión, `/{alumno|profesor|tutor|director}/inicio`
(demo temporal) y el resto de destinos del menú de cada rol (marcador "Pantalla pendiente"). `/` y rutas desconocidas → destino según la sesión
(o `/login`). Cuentas de prueba: ver [MOCK_DATA_ARCHITECTURE.md](./MOCK_DATA_ARCHITECTURE.md#cuentas-ficticias-de-demostración).

## Fase 1 — Fundamentos · ☑ completada (con limitaciones)

### Entregado
- Proyecto Angular 22.3 standalone (CLI), Tailwind 4.3.5 con tokens de Figma, Inter autoalojada, `@lucide/angular`.
- Entornos `development` / `demo` / `production` con guard anti-mock en producción.
- Capa de datos: interfaz + token + mock + `provideDataSources()` (referencia: `TermRepository`).
- Modelos base (`User`, `Term`, `Group`, `ApiList`, `Paginated`, `ApiErrorBody`), roles (`ApiRole`/`UiRole`), `SessionStore`.
- Navegación por rol (`nav.config.ts`) con variantes de escritorio y móvil.
- Componentes: `edu-icon`, `edu-badge`, `button[eduButton]`, `edu-avatar`, `edu-stat-card`, `edu-section-card`,
  `edu-empty-state`, `edu-loading-state`, `edu-toast-host` + `ToastService`.
- Layouts: `ShellLayout` con `Sidebar` (252 px, colapsable), `Topbar` (65 px), `MobileHeader` (64 px) y `MobileMenu`
  (312/352 px según rol; ESC, scrim, foco, `inert`).
- Rutas lazy por rol; pantalla demo temporal y marcador de pantallas pendientes.
- `app.spec.ts` (generada por CLI) adaptada: la plantilla "Hello, edutrak" fue reemplazada por `<router-outlet>`.

### Node IDs de Figma consultados (Fase 1)
Variables y contexto: `134:5465` (Alumno · Inicio Desktop, incl. Sidebar `134:5466` y Topbar `134:5649`).
Menús móviles: `225:5196`, `225:4956` (contexto); `225:4739`, `225:5381` (capturas).
Inicios: `183:11040` (+ metadata completa de `183:11041` Topbar), `176:2`, `127:829`, `66:3`, `161:2153` (capturas).
Sidebars por metadata: `127:830` (Profesor), `66:4` (Director). Sidebar del Tutor `161:2154`: consultado después con Chrome (iconos corregidos).

### Verificación realizada (Playwright + Chromium, servidor `ng serve`)
- **Consola del navegador:** 0 errores y 0 advertencias en 4 roles × 9 anchos y en las interacciones.
- **Desbordamiento horizontal:** ninguno en 320, 375, 390, 430, 440, 768, 1024, 1440 y 1920 px para los 4 roles.
- **Geometría vs Figma (1440):** sidebar 252×897 ✔, topbar 1188×65 ✔, tarjeta de indicador 279.5×177 ✔ (Figma 177).
- **Geometría vs Figma (390/440):** cabecera 64 px ✔; tarjetas 174 px ancho ✔ (Figma 174), 208 px alto (Figma 209); rejilla 2 columnas, gap 10 ✔.
- **Menú móvil:** ancho del panel 312/352/352/312 (Alumno/Profesor/Director/Tutor) ✔.
- **Interacciones:** navegación de escritorio (título de pestaña actualizado), colapso del sidebar (72 px), menú móvil (abrir, ESC, navegar y cerrar), ruta inválida, toast.
- **Comparación visual con capturas de Figma** (Alumno desktop y mobile, menús, sidebars de Profesor/Director/Tutor): coinciden en estructura, medidas, colores y tipografía.
- **Build:** `development`, `production` y `demo` correctos (inicial 408 kB / 84 kB transferidos). **Pruebas existentes:** 2/2.

### Correcciones hechas durante la verificación
Ancho fijo del sidebar (colapsado medía 65 px, ahora 72); desborde de 2 px a 1024 px por título de tarjeta (ahora container query
según ancho de tarjeta); padding de tarjetas medido desde el borde exterior (−1 px por borde); título del saludo 24 px en móvil y
28 px en escritorio; sombra del menú móvil visible con el panel cerrado.

### Cierre de la Fase 1 con claude-in-chrome (sin MCP de Figma)
Desde el límite de consultas del MCP oficial, **toda referencia nueva se obtiene con claude-in-chrome** (pestaña de Figma y pestaña de la app local).
- **Capacidades comprobadas en Chrome:** abrir el archivo y navegar por `node-id` en la URL; cambiar de página/sección; seleccionar frames y capas
  (clic, ctrl+clic para selección profunda, panel de capas con nombres `lucide/*`); zoom a la selección (`shift+2`) y `zoom` por región;
  capturas del viewport (`save_to_disk`); panel Diseño: posición, dimensiones, auto layout, relleno/trazo (con nombre de variable), tipografía
  (familia, peso, tamaño, interlineado, espaciado entre letras en %), radio.
- **Sidebar del Tutor (`161:2154`) consultado y corregido:** iconos de escritorio = `user-round-group` (Mis alumnos), `file-text`, **`spotlight`**
  (Seguimientos; antes `clipboard-list`), `triangle-alert` (Alertas), **`chart-column`** (Estadísticas; antes `chart-no-axes-column`).
  Comparado en Chrome contra la app local: coincide. El menú móvil del Tutor usa `clipboard-list` para Seguimientos y `chart-column` para Estadísticas.
- **Propiedad contrastada:** "Promedio" = Inter Bold 18, espaciado 4 % (0.72 px), interlineado automático → coincide con `stat-card`.
- **Playwright:** funciona con el Chromium recién instalado (`chromium-1255`, headless shell 159.0.8154.6) **sin `executablePath`**; mismos resultados
  que antes (0 errores de consola, 0 desbordes, medidas idénticas).
- **Referencias locales:** `.design-reference/` (excluida en `.gitignore`) con las capturas del MCP y de Chrome y un README con Node IDs.
- Tras las correcciones: `ng test` 2/2, `ng build` y `ng build -c demo` correctos (412 kB iniciales / 84.8 kB transferidos).

### Propiedades de Figma que NO se consultaron desde Chrome
No se usó Dev Mode / panel "Código" (CSS generado), por lo que **no** se obtuvieron: valores numéricos de sombras/efectos (se conservan los obtenidos con
el MCP: `0 4px 10px rgba(8,121,93,.08)` etc.), listado completo de variables y modos, exportación de assets/SVG (los iconos son Lucide), estados de
prototipo/interacciones y variantes ocultas de componentes (p. ej. sidebar colapsado). Las capturas de Chrome son del viewport (JPEG a la escala de zoom
del canvas), no exportaciones 1:1 de Figma; la comparación pixel a pixel se hizo con medidas del DOM (Playwright) frente a las dimensiones de Figma.

### Limitaciones y pendientes de la Fase 1
1. ~~Iconos del sidebar del Tutor pendientes~~ → **resuelto** (ver arriba).
2. **Sin componentes de modal / bottom sheet ni variantes de botón secundarias**: se implementarán en la Fase 3 al consultar sus frames
   (`72:886`, `183:11926`…). Solo existe el botón primario (Figma 134:5627).
3. **Estado colapsado del sidebar y scrim del menú móvil** no están en los frames consultados: valores provisorios
   (iconos centrados / `ink` al 40 %).
4. **Fotos de perfil:** un único placeholder (`public/images/avatar-placeholder.jpg`, tomado de Figma). Profesor/Director/Tutor usan fotos
   distintas en el diseño (no descargadas).
5. **Campana y chevron del perfil** sin comportamiento (no hay diseño del panel/menú; el menú de usuario con "Cerrar sesión" va en la Fase 2).
6. La altura de tarjeta móvil sale 1 px menor que en Figma (208 vs 209) por redondeo de interlineado.
7. **Build `production`** compila, pero fallará en ejecución al resolver `TERM_REPOSITORY` hasta que exista la implementación HTTP (a propósito).
8. Playwright ya funciona con `chromium-1255` (el instalador terminó en segundo plano). Quedan `chromium-1243` y `chromium_headless_shell-1243` sin usar en `%LOCALAPPDATA%\ms-playwright` (se pueden borrar).
9. Sin ESLint ni CI (ver plan).

## Fase 2 — Autenticación y sesión · ☑ completada (con limitaciones)

Arquitectura, decisiones, rutas/guards y diferencias con el backend: [FRONTEND_IMPLEMENTATION_PLAN.md](./FRONTEND_IMPLEMENTATION_PLAN.md#autenticación-y-sesión-fase-2).
Cuentas ficticias y comportamiento del mock: [MOCK_DATA_ARCHITECTURE.md](./MOCK_DATA_ARCHITECTURE.md#autenticación-simulada-fase-2).
Interfaces sin referencia de Figma: [FIGMA_INVENTORY.md](./FIGMA_INVENTORY.md#interfaces-creadas-sin-referencia-directa-de-figma-fase-2).

### Entregado
- Puerto `AuthApi`/`AUTH_API`, `MockAuthApi`, `AuthService`, `SessionStore` (Signals), persistencia demo, `provideAuth()`, validadores del contrato.
- Guards: `authGuard`, `roleGuard` (+ versiones `Child`), `guestGuard`, `passwordChangeGuard`, `homeRedirectGuard`. Raíz y `**` ya no apuntan a `/alumno/inicio`.
- Pantallas: Login, Cambio obligatorio de contraseña, Acceso denegado (+ `AuthLayoutComponent`, `InputFieldComponent`, botón secundario).
- Layouts: perfil real de la sesión (se eliminó el perfil demo del shell), menú de usuario con "Cerrar sesión" en el topbar y en el menú móvil.
- Expiración simulada y renovación silenciosa; restauración de sesión demo tras recargar.

### Verificación (Playwright + Chromium 1255, `ng serve`) — 191 comprobaciones, 191 correctas, 0 problemas de consola
- **Login:** 4 roles → su inicio; saludo y topbar con el usuario de la sesión; campos vacíos; formato inválido; credenciales incorrectas
  (mensaje genérico, también con cuenta inexistente); 5 fallos → 429 aun con la contraseña correcta; mostrar/ocultar contraseña (`aria-pressed`).
- **Redirecciones:** sin sesión → `/login` (raíz, ruta protegida con `returnUrl`, ruta desconocida, `/cambiar-contrasena`); `returnUrl` del mismo rol se respeta,
  de otro rol o externo (`//host`) se ignora; `/login` con sesión → inicio del rol.
- **Permisos:** cada rol que abre la ruta de otro (`/director/…`, `/alumno/…`) → `/acceso-denegado`, con enlace a su inicio.
- **Cierre de sesión:** escritorio (menú, Escape y foco de vuelta) y móvil (menú lateral); la ruta vuelve a estar protegida y la recarga no restaura.
- **Cambio obligatorio:** `22170099` solo ve `/cambiar-contrasena` (incluso con otras URLs y tras recargar); errores de vacío, corta, confirmación,
  igual a la actual y contraseña actual incorrecta; éxito → inicio + toast; ya no se vuelve a exigir tras recargar.
- **Expiración:** con reloj simulado, a los 20 min sigue activa (renovación), a los 31 min → `/login?motivo=expirada` con aviso, y la recarga no restaura;
  el guard detecta una sesión vencida al navegar dentro del shell.
- **Teclado:** orden número → contraseña → mostrar → enviar; Enter envía; el botón mostrar funciona con Enter; reenvío bloqueado (`disabled` + `aria-busy`).
- **Recarga:** la sesión demo sobrevive y se restaura; tras cerrar sesión o expirar, no.
- **Layout:** sin desbordamiento horizontal en 320, 375, 390, 430, 440, 768, 1024, 1440 y 1920 px en login (vacío, con errores, con cuentas demo),
  cambio de contraseña (con y sin errores), acceso denegado y los 4 shells (con el menú de usuario abierto en escritorio).
- **Builds / pruebas:** `ng build` y `ng build -c demo` correctos (inicial 463.23 kB / 91.7 kB). `ng test`: 2/2 (las existentes; no se añadieron pruebas).
  Build `production` en ejecución: falla al arrancar con el mensaje explícito, sin mock ni login; `demo` muestra el login con las cuentas.
- Capturas locales: `.design-reference/phase2/` (login, cambio de contraseña y acceso denegado en 1440 y 390; shell con menú de usuario; menú móvil con cierre de sesión).

### Errores encontrados y corregidos durante la verificación
Contador de intentos del mock que se reiniciaba en cada fallo (nunca llegaba al 429); foco al primer campo inválido aplicado antes de pintar
`aria-invalid`; **`canActivate` del shell no se reevaluaba al navegar entre pantallas hijas** (una sesión vencida no se detectaba) → `canActivateChild`.

### Limitaciones y pendientes de la Fase 2
1. Login, cambio de contraseña, acceso denegado, menú de usuario y botón secundario **no tienen diseño en Figma**: requieren revisión de diseño.
2. Sin recuperación de contraseña, autorregistro ni selector de rol para personas con varios roles (el contrato no cubre los dos primeros).
3. Sin `HttpAuthApi`, interceptor HTTP ni integración con el backend (a propósito). La ejecución real en producción sigue pendiente.
4. Los fixtures ficticios (incluidas sus contraseñas de demo) siguen empaquetados en el build de producción aunque inertes.
5. Campana de notificaciones y perfil completo siguen sin implementar (fuera de alcance).
6. Sin ESLint ni CI. Las pruebas unitarias de la Fase 2 quedan para Ernesto (lista en MOCK_DATA_ARCHITECTURE.md).
7. `angular.json` aparecía modificado antes de empezar la fase (el CLI añadió `cli.analytics`); no es parte de la Fase 2 y queda a criterio del equipo.

## Fase 3 — Módulo Director · ☑ completada (con limitaciones)

> Rama `feat/frontend-director` (parte de `origin/master` = `47a24ca`). **Nada está commiteado.** Validado el 2026-11-27/28.

Bloques: 3.1 Modelos y repositorios mock ☑ · 3.2 Inicio ☑ · 3.3 Periodos ☑ · 3.4 Grupos ☑ · 3.5 Detalle del grupo ☑ · 3.6 Horarios ☑ · 3.7 Validación integral ☑.

### 3.1 Modelos y repositorios mock · ☑
- Rama `feat/frontend-director` (parte de `origin/master`, sin commits propios al inicio; verificado con `merge-base --is-ancestor`).
- Modelos nuevos: `Career`, `Subject`, `CurriculumEntry`, `Person`, `Enrollment`, `TeachingAssignment`, `Schedule`, `ScheduleDetail` y solicitudes de creación (`academic.model.ts`); `analytics.model.ts` (`Alert`, `GroupOverview`, `GroupAnalytics`, resúmenes de calificaciones y asistencia).
- Repositorios (interfaz + `InjectionToken`): `TERM_REPOSITORY` (ampliado), `GROUP_REPOSITORY`, `SCHEDULE_REPOSITORY`, `CATALOG_REPOSITORY`, `DIRECTORY_REPOSITORY` (solo mock), `ANALYTICS_REPOSITORY`. `ApiError` con códigos del backend.
- Una sola `MockDatabase` en memoria alimentada por `academic.seed.ts` (semilla determinista): 4 periodos, 20 grupos (12 en el periodo activo), ~325 alumnos activos, 18 docentes, 120 asignaciones, ~160 franjas sin choques de grupo ni docente, hechos de calificaciones/asistencia y alertas derivadas con las reglas del backend.
- Los indicadores se calculan desde los hechos (`analytics-calc.ts`); los que el backend no calcula (promedio, variaciones) se aíslan en `UncontractedIndicators`.

### 3.2 Inicio · ☑ (Desktop `66:3`, Mobile `183:7804`)
`features/director/home/` (`director-home.page.ts`, `dashboard.vm.ts`, `director-home.service.ts`). Todos los indicadores se derivan de repositorios. Mobile: "Analítica general", "Promedio General", alertas sin tabla de grupos. Componentes nuevos: `edu-progress-bar`, `edu-count-pill`, token `--color-progress-warning`, `Avatar.textSize`, `loadable()`. Decisiones: "Faltas consecutivas" (Figma) → "Faltas sin justificar" (la regla del backend cuenta, no es consecutiva); "Asistencia global" muestra % (el "12" de Figma es un placeholder); promedio y variaciones **sin contrato** (`UncontractedIndicators`, solo mock); la fila expandida de alertas en móvil se trató como residuo de Figma.

### 3.3 Periodos · ☑ (Desktop `69:960`, modal `72:886`, dropdown `72:3765`; Mobile `183:6517`, sheet `183:11926`, dropdown `183:12084`)
`features/director/periods/` (`periods.page.ts`, `new-term-dialog.component.ts`, `term-utils.ts`). Componentes compartidos nuevos: `edu-dialog` (modal/bottom sheet con foco atrapado, Escape y retorno de foco), `edu-confirm-dialog`, `edu-action-menu` (desplegable 236 px / bottom sheet), `edu-select`, `edu-search-input`, `edu-segmented`, `edu-pagination`, `edu-page-header`, `edu-callout`, `edu-range-calendar`, `BreakpointService`, utilidades de fecha. Móvil sin calendario (tarjetas INICIO/FIN con selector de fecha nativo); el sheet móvil trae FIN antes de INICIO (se usa INICIO→FIN). Nombre del periodo generado del rango ("Ene - Abr 2027"). "Editar" deshabilitada (el backend no edita periodos); "Activar" añadido para planeados. **Discrepancia:** Figma "solo un periodo activo" — el backend lo permite; se aplica solo en la UI.

### 3.4 Grupos · ☑ (Desktop `72:3849`, modales `83:5148`, `83:5427`; Mobile `183:6738`, sheets `183:12006`, `183:12054`)
`features/director/groups/` (`groups.page.ts`, `groups.vm.ts`, `new-group-dialog.component.ts`, `assign-tutor-dialog.component.ts`). Compartidos: `edu-field`, `edu-switch`. Filtros: búsqueda, periodo (por defecto el activo), sección, cuatrimestre, solo con alertas; paginación. **Discrepancias:** "Tutor inicial *" es opcional en el backend; el sheet móvil de Figma trae campos de otro flujo (Lista de alumnos, Horario, Sección) que se omiten; la carrera no se pide (única activa); el contrato no lista usuarios (directorio solo mock).

### 3.5 Detalle del grupo · ☑ (Desktop `78:4528`, `83:5496`; Mobile `183:7164`, `183:7336`)
`group-detail.page.ts` + `group-detail.service.ts` (datos compartidos), `group-summary.page.ts`, `group-students.page.ts`, `enroll-student-dialog.component.ts` (sin frame), `group-tab-placeholder.page.ts`. Desktop con 8 pestañas (solo Resumen y Alumnos tienen frame; "Horario" enlaza a `/director/horarios/:id`; el resto es marcador). Móvil sin pestañas, con flecha de regreso y "Hoy". Chips de estado: Todos/Activo/Baja (**"Baja temporal" no existe en el backend y no se simula**). "Descargar lista" = CSV generado en el navegador (`shared/utils/csv.ts`). Acción de fila "Dar de baja" deshabilitada (sin endpoint).

### 3.6 Horarios · ☑ (Desktop `83:6248`, `83:6588`; Mobile `183:6975`, `183:7136`, `304:508`, `325:239`)
`features/director/schedules/`: `schedules.page.ts` (lista), `group-schedule.page.ts` (editor), `add-class-dialog.component.ts`, `add-subject-dialog.component.ts`, `schedule-grid.ts` (lógica pura: jornada, módulos, validación de colocación), `schedule-utils.ts`. Compartido: `edu-stepper`. Tokens `purple-bg/fg`.
- **Lista:** tarjetas de grupo (código, nivel/sección, tutor o "Sin asignar tutor" + "Asignar"), búsqueda y periodo, paginación; badge "Sin horario"; "Crear horario" abre una ventana que elige el grupo y abre su editor.
- **Editor (desktop):** "Jornada e intervalos" (inicio, fin, duración de clase, descanso, descanso por día, "Igualar todos al lunes"; estado de interfaz por grupo durante la sesión), "Materias del grupo" (color por materia, minutos colocados, duración de sesión −/+ en módulos de clase, arrastrables), calendario por tiempo (CSS grid de filas de 5 min, sin posicionamiento absoluto) con colocación **por clic** (materia seleccionada + celda) y **por arrastre** (HTML5). Alternativa por teclado: "Añadir clase con horas exactas". "Agregar materia" crea una asignación docente.
- **Móvil:** lista por día, resumen de jornada y botón "Añadir clase" (modal 325:239 con campo Día añadido).
- **Validaciones de colocación** (`validatePlacement`): backend → `schedule_overlap` (misma asignación). Interfaz (más estrictas): dentro de la jornada, sin pisar el descanso, sin choque de grupo y **sin choque de docente entre grupos** (probado: el docente del 5A no puede dar clase a otro grupo en el mismo horario).
- **Discrepancias:** el backend solo lista y **añade** franjas (no mover ni eliminar; se avisa en pantalla); jornada y descansos no existen en el contrato; "Receso" no es dato; título/siglas/turno/"Carrera"/"Turno" de Figma no se implementan (sin equivalente). La lista usa el endpoint de todas las franjas (DIRECTOR).

### 3.7 Validación integral · ☑
Ver "Validaciones" abajo. Documentos actualizados: FIGMA_INVENTORY, FRONTEND_IMPLEMENTATION_PLAN, MOCK_DATA_ARCHITECTURE.

### Archivos de la Fase 3 (todos sin commitear)
- **Modificados:** `angular.json` (aviso de presupuesto inicial 600 kB), `src/styles.css` (tokens `progress-warning`, `shadow-modal`, `purple`), `app.routes.ts`, `core/data/{term.repository,provide-data-sources}.ts`, `core/mock/{mock-term.repository,simulate-latency}.ts`, `layouts/shell/shell.layout.ts` (nombre de periodo compacto), `shared/components/avatar`, `shared/models/academic.model.ts`, `shared/utils/date-format.ts`.
- **Eliminado:** `core/mock/fixtures/terms.fixture.ts` (sustituido por `academic.seed.ts`).
- **Nuevos:** `core/data/{api-error,analytics,catalog,directory,group,schedule}.repository.ts`, `core/data/lazy-repository.ts`; `core/mock/{mock-database,analytics-calc,mock-group,mock-analytics,mock-schedule}.repository…`, `mock-catalog-directory.repositories.ts`, `fixtures/academic.seed.ts`; `shared/models/analytics.model.ts`; `shared/services/breakpoint.service.ts`; `shared/utils/{loadable,attendance,date-utils,csv}.ts`; `shared/components/{progress-bar,callout,dialog,menu,page-header,pagination}/…`, `badge/count-pill`, `form/{field,range-calendar,search-input,segmented,select-field,stepper,switch}`; `features/director/**` (rutas, home, periods, groups, schedules).

### Validaciones (Fase 3)
- **Git:** rama `feat/frontend-director` = `origin/master` al inicio, sin merge/rebase.
- **Playwright del módulo Director** (`director-verify.mjs`, ~155 comprobaciones, todas correctas, 0 problemas de consola): rutas y sidebar; acceso denegado de Alumno/Profesor/Tutor a 6 rutas del Director; consistencia de datos (grupos del inicio = grupos de la lista, suma de alumnos por tarjeta = alumnos del inicio, alumnos del detalle = tarjeta, el grupo creado aparece en Inicio y Horarios); periodos (validaciones, crear con calendario, nombre generado, duplicado 409, Planeado, activar bloqueado con otro activo, cerrar con confirmación, activar, Ver, filtros y búsqueda, foco y Escape en el modal); móvil (bottom sheet anclado abajo, fechas nativas); grupos (asignar tutor, nuevo grupo, 409, mayúsculas, búsqueda, solo con alertas, inscribir alumno, CSV, acción de baja deshabilitada); horarios (fuera de jornada, colocar por clic, choque de grupo, de docente y de asignación, agregar materia, añadir clase, "Sin horario"); **sin desbordes en 320, 375, 390, 430, 440, 768, 1024, 1440 y 1920 px** en las 7 pantallas y los modales.
- **Regresión Fases 1–2:** verificación de autenticación original: 191/191.
- **Builds:** `npm run build` y `ng build -c demo` correctos (inicial 534.95 kB; transferido ≈95 kB; aviso de presupuesto en 600 kB). **`ng test`: 2/2** (las existentes; no se añadieron pruebas). Sin lint (no configurado).
- Los datos mock viven en memoria: **recargar la página los reinicia** (las pruebas navegan por la SPA para conservar el estado).
- Hallazgos corregidos al verificar: error previo del servidor tapaba el de validación local en "Añadir clase"; ancho del stepper de duración; espaciado vertical del Resumen; selector de periodo truncado.

### Limitaciones y pendientes de la Fase 3
1. Fidelidad visual comprobada por comparación visual con capturas, no píxel a píxel; fuente de la lista de grupos del Inicio: orden por nivel (Figma no define criterio).
2. Sin diseño en Figma (construido con el sistema visual): detalle de periodo ("Ver"), confirmaciones, inscribir alumno, agregar materia, ventana "Nuevo horario" adaptada, estados vacíos/errores.
3. Pestañas Materias, Profesores, Asistencia, Calificaciones y Alertas del detalle del grupo y los ítems Analytics, Alertas, Asignaciones de tutores y Auditoría del sidebar siguen como marcador (sin frames en el alcance).
4. Discrepancias backend: ver IMPLEMENTATION_PLAN (varios periodos activos; sin edición de periodos; sin baja de alumnos; sin listado de usuarios; sin mover/eliminar franjas; analytics por regla/alumno requiere paginar alertas; indicadores sin contrato).
5. Cifras de alertas por grupo altas respecto a Figma (datos sintéticos deterministas).
6. Los repositorios mock se cargan de forma diferida (chunk aparte); en producción la app seguirá fallando de forma explícita hasta existir la capa HTTP.
7. Mock: el bundle de la demo incluye los fixtures ficticios.
8. Pruebas unitarias de la Fase 3 pendientes para Ernesto (lista en MOCK_DATA_ARCHITECTURE.md).

### Referencias visuales locales (`.design-reference/phase3/`, ignorada por Git)
Figma (Chrome): `d-*` (11 frames de escritorio), `m-*` (inicio, periodos, sheets, dropdown, grupos, grupo resumen/alumnos, horario del grupo, nuevo horario, añadir clase). Capturas de la app: `app/*.png` y `app/final-*.png`.

### Node IDs consultados (Fase 3, vía Chrome)
Desktop: `66:3`, `69:960`, `72:3849`, `83:6248`, `83:6588`, `78:4528`, `83:5496`, `72:886`, `83:5148`, `83:5427`, `72:3765` (11/11). Mobile: `183:7804`, `183:6517`, `183:6738`, `183:6975`, `183:7136`, `183:7164`, `183:7336`, `183:11926`, `304:508`, `183:12006`, `183:12054`, `183:12084`, `325:239` y menú `225:4956` (Fase 1) (14/14). Todos corresponden a los elementos originales; no se encontraron frames nuevos del Director.

## Fase 4 Profesor · ☐  ·  Fase 5 Tutor · ☐  ·  Fase 6 Alumno · ☐  ·  Fase 7 Revisión · ☐
