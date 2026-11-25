# Plan de implementación del frontend — EDUTRAK

Fuente de diseño: Figma `6XQ9NdLBIaU6ncl1KT32LF` (ver [FIGMA_INVENTORY.md](./FIGMA_INVENTORY.md)).
Contrato de referencia (solo lectura): `api/openapi.yaml` y `docs/FRONTEND_INTEGRATION.md` del backend
(`EDUTRAK BACK`, carpeta local hermana; repositorio `EDUTRAKMX/EDUTRAK_BACKEND`).
Seguimiento: [FRONTEND_PROGRESS.md](./FRONTEND_PROGRESS.md). Datos: [MOCK_DATA_ARCHITECTURE.md](./MOCK_DATA_ARCHITECTURE.md).

## Stack aprobado y versiones fijadas

| Pieza | Versión | Nota |
|---|---|---|
| Node.js / npm | 24.15.0 / 11.12.1 | Angular 22 exige Node `^22.22.3 \|\| ^24.15.0 \|\| >=26` |
| Angular (core, router, forms, common) | 22.3.0 | standalone, Signals, zoneless-ready |
| Angular CLI / `@angular/build` | 22.3.0 | builder `application` |
| TypeScript | 6.0.3 | el que fija el CLI (no se adoptó TS 7) |
| RxJS | 7.8.2 | |
| Tailwind CSS + `@tailwindcss/postcss` | 4.3.5 (exacta) | tokens en `@theme` de `src/styles.css` |
| `@lucide/angular` | 1.79.0 (exacta) | **ver desviación** |
| `@fontsource-variable/inter` | exacta en `package.json` | Inter autoalojada (sin CDN) |
| `@playwright/test` | 1.65.1 (exacta) | solo verificación visual |
| Vitest / jsdom | 5.1.1 / 31 | runner que Angular CLI genera por defecto; **no se tocó** |

`package-lock.json` se conserva. Sin ESLint: Angular 22 no lo genera por defecto (decisión pendiente, ver abajo).

**Desviación de dependencias:** se pidió "Lucide Angular". `lucide-angular@1.0.0` declara peer `@angular/core 13–21` y
`npm install` falla con Angular 22. Se usa el paquete oficial sucesor **`@lucide/angular`** (mismo repositorio
`lucide-icons/lucide`, peer `>=17`), en lugar de forzar con `--force`/`--legacy-peer-deps`.

## Arquitectura (README) y cómo se materializa

```
src/app/
  core/
    auth/        role.model, role-routing, session.store, profile, auth.api (puerto AuthApi), auth.service,
                 auth.guards, auth.validators, session-persistence, provide-auth
    config/      app-config (APP_ENV, assertSafeEnvironment)
    data/        interfaces de repositorio + tokens + provideDataSources()
    http/        (vacío: interceptores y cliente API cuando se conecte el backend)
    mock/        fixtures + repositorios mock + latencia simulada
    navigation/  nav.config (menús por rol, escritorio y móvil)
  shared/
    components/  icon, badge, button, avatar, stat-card, section-card, state, toast
    models/      DTO alineados con OpenAPI (User, Term, Group, ApiList, ApiErrorBody…)
    utils/       date-format
  layouts/shell/ ShellLayout, Sidebar, Topbar (+ menú de usuario), MobileHeader, MobileMenu (+ cerrar sesión)
  layouts/auth/  AuthLayoutComponent (marco de login / cambio de contraseña / acceso denegado)
  features/      identity (login, cambiar contraseña, acceso denegado: Fase 2); academic, attendance, grades,
                 justifications, tutoring, analytics (vacías)
                 demo/ (pantalla y marcador temporales de la Fase 1)
src/environments/  environment(.development|.demo).ts
```

Principios: interfaces de repositorio + `InjectionToken` (las pantallas nunca importan un mock); lógica fuera de
los componentes (servicios, utilidades puras); Tailwind con tokens de Figma; sin posicionamiento absoluto salvo
indicadores (barra activa, tirador del sidebar); breakpoint de layout **`lg` = 1024 px** (por debajo, shell móvil).

### Entornos y autenticación simulada

| Configuración | `production` | `dataSource` | `mockAuth` | Uso |
|---|---|---|---|---|
| `development` (`ng serve`) | false | mock | true | desarrollo local |
| `demo` (`ng build -c demo`) | true | mock | true | demostración **explícita** (`demoMode: true`) |
| `production` (por defecto) | true | http | false | producción |

`assertSafeEnvironment()` lanza un error al arrancar si `production && !demoMode` y hay mock/mockAuth: el mock no puede
habilitarse por accidente en producción. Hasta que existan los repositorios HTTP, el build `production` compila pero falla
al resolver `TERM_REPOSITORY` (mensaje explícito).

## Fases

| Fase | Contenido | Estado |
|---|---|---|
| 0 | Análisis, inventario, plan | ☑ |
| **1** | **Fundamentos** (este documento) | ☑ ver progreso |
| **2** | **Login (sin diseño en Figma), cambio obligatorio de contraseña, acceso denegado, sesión mock, guards por rol, cierre de sesión, menú de usuario** | ☑ ver progreso |
| 3 | Director: 11 frames Desktop + 14 mobile; modales y bottom sheets | ☐ |
| 4 | Profesor: asistencia (QR y NFC simulados, manual), calificaciones, horario, justificantes | ☐ |
| 5 | Tutor: alumnos, seguimientos, alertas, estadísticas, justificantes | ☐ |
| 6 | Alumno: inicio, horario, calificaciones, asistencia, justificaciones + modales | ☐ |
| 7 | Revisión: rutas, interacciones, comparación Figma, Desktop/Mobile, consola, build, documentación | ☐ |

Cada fase consulta Figma solo para sus frames y registra Node IDs. **Desde la Fase 1 el MCP oficial de Figma no se usa** (límite de consultas): las referencias se obtienen con claude-in-chrome (URL con `node-id`, capas, panel Diseño, capturas) y se guardan en `.design-reference/`.

## Autenticación y sesión (Fase 2)

Detalle de la arquitectura mock y cuentas de prueba: [MOCK_DATA_ARCHITECTURE.md](./MOCK_DATA_ARCHITECTURE.md#autenticación-simulada-fase-2).

**Decisiones**
- Puerto `AuthApi` + `AUTH_API` (mismo patrón que los repositorios). `AuthService` orquesta; las pantallas no conocen el mock.
- Identificador de acceso = `institutional_number` (8 dígitos, `^[0-9]{8}$`), tal como `LoginRequest`. No se usa correo.
- El rol sale de `user.roles` de la respuesta (`ApiRole` → `UiRole`). No hay selector de rol. Con varios roles, el inicio es el de mayor
  jerarquía (director > profesor > tutor > alumno) y se puede entrar a cualquiera que se posea.
- Tokens solo en memoria. `sessionStorage` guarda únicamente una pista de demo (sin tokens ni contraseñas) y solo con `mockAuth`.
- Expiración: renovación silenciosa 30 s antes de que venza el access token; al llegar a la vida máxima → `/login?motivo=expirada`.
  Los guards también detectan una sesión vencida (equipo suspendido) al navegar.
- Los guards son solo UX: la autorización real sigue siendo del backend (rol y relación; 401/403 por petición).

**Rutas y guards**

| Ruta | Guards | Comportamiento |
|---|---|---|
| `/` y `**` | `homeRedirectGuard` | con sesión → destino del rol (o cambio de contraseña); sin sesión → `/login` |
| `/login` | `guestGuard` | con sesión activa redirige a su destino |
| `/cambiar-contrasena` | `passwordChangeGuard` | solo con sesión y mientras `must_change_password` sea true |
| `/acceso-denegado` | — | pública; `?motivo=sin-interfaz` para cuentas sin interfaz (p. ej. solo ADMIN) |
| `/{director\|profesor\|tutor\|alumno}/…` | `authGuard` + `roleGuard` en el shell y las versiones `Child` en cada hija | sin sesión → `/login?returnUrl=…`; cambio pendiente → `/cambiar-contrasena`; rol ajeno → `/acceso-denegado` |

`canActivateChild` es necesario: Angular no reevalúa el `canActivate` del padre al navegar entre hijas (el test de expiración lo detectó).
`returnUrl` solo se respeta si es una ruta interna de un rol que la persona posee (evita redirecciones abiertas).

**Diferencias y puntos a vigilar frente al backend**
1. Contraseña nueva: mínimo 10 (OpenAPI) y **máximo 128 bytes y distinta de la actual** (reglas del código del backend, `identity/domain`, no
   del OpenAPI → pedir que se documenten en el contrato). La confirmación es solo UX del cliente.
2. No existe recuperación de contraseña ni autorregistro: el login solo indica pedir a un administrador que restablezca la contraseña.
   Registrado como pendiente (no se inventó "¿Olvidaste tu contraseña?").
3. Cuenta solo ADMIN: inicia sesión pero no tiene interfaz → "acceso denegado (sin interfaz)". Sin cuenta demo (su UI está pospuesta).
4. Varios roles en una persona: no hay selector de rol/contexto en la UI (sin diseño). Pendiente decidir.
5. El cliente real necesitará un interceptor HTTP (cabecera `Authorization`, 401 → `refresh` → reintento, 403 `password_change_required` →
   `/cambiar-contrasena`, 429 con `Retry-After`). No existe todavía (no hay peticiones en esta fase).
6. El refresh token real no se persiste en el navegador: recargar exigirá volver a iniciar sesión (la restauración demo no es equivalente).
7. Umbrales del mock (15 min de access, 30 min de sesión, 5 intentos/30 s) son propios de la demo; los reales del backend no están en el contrato.

**Producción:** `mockAuth=false` → `provideAuth()` no registra el mock y la app falla al arrancar con un mensaje explícito hasta que exista
`HttpAuthApi`. Verificado en ejecución con el build `production` (sin pantalla de login ni cuentas demo).

## Decisiones aprobadas para funcionalidades sin diseño/contrato

Login, cambio de contraseña y acceso denegado: construir con el sistema visual. Rol Administrador: pospuesto (soporte del
contrato intacto). NFC: simulación identificada (el backend no lo soporta). QR dinámico: simulado. Reglas reales del backend
para calificaciones (NA/SA/DE/AU, sin promedios calculados en cliente), asistencia, tutoría y justificantes
(Alumno → Tutor → Profesor).

## Discrepancias con el backend (a vigilar en cada fase)

1. Auditoría del Director: ítem de sidebar sin pantalla en Figma y **sin endpoint** en OpenAPI.
2. NFC: diseño sin contrato.
3. "Añadir Clase" / "Ventana nuevo horario" (mobile Director): confirmar contra `schedules` en la Fase 3.
4. Promedios mostrados en Figma ("84.6"): el backend **no** calcula promedios; en mock se trata como dato ficticio y se
   documentará cómo sustituirlo.
5. Alertas/Analytics: solo TUTOR del grupo y DIRECTOR; no hay vista para Alumno ni Profesor.
6. Justificantes: la solicitud nace de una ausencia concreta (`attendance_record_id`).

## Decisiones pendientes para el equipo

- **Pruebas (Ernesto):** Angular CLI generó **Vitest + jsdom** (`ng test`, `tsconfig.spec.json`, tipos `vitest/globals`). Decidir si
  se mantiene, cobertura (`--coverage`), y si habrá e2e (Playwright ya está instalado solo para verificación visual).
- **Lint:** no hay ESLint configurado. Decidir si se añade (`ng add angular-eslint`) y con qué reglas.
- **CI:** `.github/workflows/frontend-ci.yml` propuesto en el README, aún no creado.
- **Prettier** viene configurado por el CLI (`.prettierrc`); el código de la Fase 1 no se formateó con él.
