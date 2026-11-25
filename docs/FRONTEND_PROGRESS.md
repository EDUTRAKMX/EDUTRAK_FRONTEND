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

Rutas disponibles (Fase 1): `/` → `/alumno/inicio`; `/{alumno|profesor|tutor|director}/inicio` (demo temporal) y el resto de
destinos del menú de cada rol (marcador "Pantalla pendiente"). Rutas desconocidas → `/alumno/inicio`.

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

## Fase 2 — Autenticación · ☐  ·  Fase 3 Director · ☐  ·  Fase 4 Profesor · ☐  ·  Fase 5 Tutor · ☐  ·  Fase 6 Alumno · ☐  ·  Fase 7 Revisión · ☐
