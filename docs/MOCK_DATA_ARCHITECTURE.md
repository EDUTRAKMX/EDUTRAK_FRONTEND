# Arquitectura de datos mock

Objetivo: pantallas funcionales con datos ficticios y coherentes, y poder sustituir los mocks por HTTP real
**sin tocar la lógica visual**. Todos los datos son inventados; ningún nombre, matrícula o correo corresponde a
personas reales (correos con dominio `.invalid`).

## Capas

```
Pantalla / componente  ──inyecta──▶  InjectionToken<Repositorio>     (core/data/*.repository.ts)
                                         │ provideDataSources() elige según environment.dataSource
                       ┌─────────────────┴──────────────────┐
              MockXxxRepository (core/mock)        HttpXxxRepository (futuro, core/http)
                       │                                      │
              fixtures tipadas (core/mock/fixtures)    HttpClient + interceptores → API Go
```

- **Modelos** (`shared/models`): reflejan los schemas de `api/openapi.yaml` con los mismos nombres de campo (snake_case), de modo que
  un repositorio HTTP devuelve el JSON sin mapeo. Hoy: `User`, `Term`, `Group`, `ApiList<T>`, `Paginated<T>`, `ApiErrorBody`.
- **Repositorios** (`core/data`): una interfaz + un `InjectionToken` por agregado. Hoy: `TermRepository` / `TERM_REPOSITORY`
  (referencia del patrón). Devuelven `Observable` (igual que `HttpClient`) para que el cambio sea transparente.
- **Mocks** (`core/mock`): implementan la interfaz leyendo de fixtures y respondiendo con `mockResponse()` (latencia 250 ms
  para poder ver estados de carga). Los fixtures nunca se importan desde componentes.
- **Registro** (`core/data/provide-data-sources.ts`): `useFactory` según `APP_ENV.dataSource`. Para conectar el backend se añade
  la implementación HTTP en el `else` de cada token y se elimina el `throw` "no implementado".

## Estado actual (Fase 1)

| Archivo | Contenido |
|---|---|
| `core/mock/fixtures/terms.fixture.ts` | 3 periodos: `Ene–Abr 2026` (closed), `Sep–Dic 2026` (**active**), `Ene–Abr 2027` (draft) |
| `core/mock/fixtures/users.fixture.ts` | `MOCK_ACCOUNTS`: 5 cuentas ficticias (usuario + contraseña de demo): Alumno, Docente, Tutor, Director y un Alumno con cambio obligatorio de contraseña |
| `core/mock/mock-auth.api.ts` | `MockAuthApi` (implementa `AuthApi`): login, refresh, logout, me, changePassword, restore |
| `core/mock/mock-term.repository.ts` | `list()`, `getActive()` |
| `core/mock/simulate-latency.ts` | `mockResponse(value, ms)` |

El topbar muestra "Sep–Dic 2026 · Activo" leyendo `TERM_REPOSITORY.getActive()`.

## Plan de crecimiento (fases 3–6)

Se añadirán, siguiendo el mismo patrón, fixtures y repositorios para: alumnos, profesores, tutores, grupos, materias,
horarios, inscripciones, calificaciones (0–100 con ≤2 decimales y `category` NA/SA/DE/AU provista por el "backend"),
sesiones y registros de asistencia (`PRESENT|LATE|ABSENT|JUSTIFIED`), justificantes (`PENDING_TUTOR|PENDING_TEACHER|
TUTOR_REJECTED|TEACHER_REJECTED|JUSTIFIED`), seguimientos tutoriales, alertas (`OPEN|ACKNOWLEDGED|RESOLVED`,
reglas `GRADE_NA_UNIT|UNJUSTIFIED_ABSENCES|ATTENDANCE_DROP|PENDING_JUSTIFICATIONS`) e indicadores.

Reglas de coherencia: los UUID de fixtures son fijos y se referencian por id (un alumno de un grupo conserva nombre,
matrícula y grupo en calificaciones, asistencias y justificantes). Las mutaciones simuladas (crear, aprobar, rechazar,
capturar) viven en un **store en memoria** dentro del repositorio mock, para que se reflejen en todas las pantallas.
Reglas del backend a respetar en mock: seguimientos inmutables; calificación existente → 409 `grade_exists` (usar PATCH);
rechazos con comentario obligatorio; el cliente no calcula promedios ni recategoriza.

## Autenticación simulada (Fase 2)

```
LoginPage / ChangePasswordPage / topbar / guards
        │ usan                                   (nunca importan fixtures ni el mock)
   AuthService (core/auth)  ──── SessionStore (Signals, tokens SOLO en memoria)
        │                  └──── SESSION_PERSISTENCE (pista de sesión demo en sessionStorage)
        │ inyecta
   AUTH_API: InjectionToken<AuthApi>    ← provideAuth() según environment.mockAuth
        ├── MockAuthApi (core/mock)      mockAuth = true  (development / demo)
        └── HttpAuthApi (futuro)         mockAuth = false (production: hoy lanza un error explícito)
```

`AuthApi` replica `/api/auth/{login,refresh,logout,me,password}` con los mismos DTO (snake_case) y errores (`AuthError`: estado + código
del backend). Para conectar el backend: crear `HttpAuthApi` (HttpClient + interceptor de `Authorization` y manejo de 401/403
`password_change_required`) y sustituir el `throw` de `provideAuth()`. Nada más debe cambiar.

### Cuentas ficticias de demostración

| Rol (lo decide la respuesta del servicio, no la UI) | Número institucional | Contraseña | Entra en |
|---|---|---|---|
| Alumno | `22170001` | `demo-alumno-2026` | `/alumno/inicio` |
| Profesor (TEACHER) | `10000002` | `demo-docente-2026` | `/profesor/inicio` |
| Tutor | `10000003` | `demo-tutor-2026` | `/tutor/inicio` |
| Director | `10000004` | `demo-director-2026` | `/director/inicio` |
| Alumno con cambio obligatorio | `22170099` | `demo-temporal-2026` | `/cambiar-contrasena` → `/alumno/inicio` |

Son datos inventados (correos `@demo.edutrak.invalid`); no corresponden a personas reales. En `development` y `demo` el login muestra un
panel plegable "Cuentas de demostración" (rellena los campos; no elige rol). Lo alimenta el token `DEMO_ACCOUNT_HINTS`, vacío en producción.

### Comportamiento del mock (documentado para no confundirlo con el backend)

- Todo el estado vive en memoria: **recargar la página reinicia contraseñas cambiadas y bloqueos**.
- Tokens opacos (`mock-access.<uuid>`, `mock-refresh.<uuid>`); el refresh es de un solo uso, como en el contrato.
- Access token de 15 min con renovación silenciosa 30 s antes; **vida máxima de la sesión demo: 30 min** (el refresh no la extiende), para poder probar la expiración.
- Rate limit simulado: 5 fallos por número institucional → 429 `rate_limited` con `Retry-After` de 30 s (los umbrales reales del backend no están en el contrato).
- 401 idéntico para contraseña incorrecta y cuenta inexistente. Cambio de contraseña: 401 si la actual es incorrecta; 422 `weak_password` (<10 caracteres o >128 bytes) y `same_password`.
- Persistencia demo: solo `{userId, mustChangePassword, refreshExpiresAt}` en `sessionStorage` (clave `edutrak.demo.session-hint`). **Nunca contraseñas ni tokens.**
  Tras recargar, `AuthApi.restore()` vuelve a resolver usuario y roles desde el mock; la pista no concede roles. No es un mecanismo de seguridad.
- El bundle de producción sigue incluyendo los fixtures ficticios (código inerte: `provideAuth` no los usa con `mockAuth=false`). Pendiente
  decidir si se excluyen con `fileReplacements` cuando exista la capa HTTP.

## Qué podrá probarse (para el responsable de testing)

**Fase 1.** Funciones/servicios puros y sin DOM: `assertSafeEnvironment`, `greetingFor`/`longDayLabel`, `buildProfile`/`initialsOf`,
`isUiRole`, `navPathsFor`/`ROLE_NAVIGATION`, `ToastService`, `MockTermRepository.getActive()`.
Componentes: `StatCardComponent`, `BadgeComponent`, `SidebarComponent` (activo/colapsado), `MobileMenuComponent` (abrir/cerrar/ESC),
`ShellLayout` (rol inválido → alumno).

**Fase 2 — para la suite de Ernesto** (no se escribieron pruebas; solo se verificó con Playwright, ver FRONTEND_PROGRESS.md):

| Pieza | Qué conviene probar |
|---|---|
| `core/auth/auth.validators.ts` | `passwordRuleViolation` (9/10 caracteres, 128 vs 129 bytes con caracteres multibyte), `institutionalNumberValidator` (7/8/9 dígitos, letras, espacios), `newPasswordValidator`, `passwordChangeGroupValidator` (`mismatch`, `samePassword`) |
| `core/auth/role-routing.ts` | `uiRolesOf`/`primaryUiRole` (prioridad con varios roles; ADMIN solo → `null`), `homePathFor`, `sanitizeReturnUrl` (`//host`, `https://`, `\`, vacío), `postLoginUrl` (cambio pendiente, returnUrl de otro rol, sin interfaz) |
| `core/auth/session.store.ts` | `set`/`updateUser`/`clear`, computados `mustChangePassword`, `uiRoles`, `primaryRole` |
| `core/auth/auth.service.ts` | login → store + pista; `signOut` limpia aunque falle el servidor; `sessionStatus` (`none`/`active`/`expired`); renovación silenciosa y expiración con temporizadores falsos (`vi.useFakeTimers`); `restore` con pista caducada/corrupta; `changePassword` refresca el usuario |
| `core/auth/auth.guards.ts` | `authGuard` (sin sesión, vencida, cambio pendiente), `roleGuard`/`roleChildGuard` (rol de ancestro), `guestGuard`, `passwordChangeGuard`, `homeRedirectGuard` |
| `core/auth/session-persistence.ts` | `DemoSessionPersistence` con `sessionStorage` no disponible, JSON corrupto o forma inválida |
| `core/auth/provide-auth.ts` | con `mockAuth=false` falla al resolver `AUTH_API` y `DEMO_ACCOUNT_HINTS` queda vacío |
| `core/mock/mock-auth.api.ts` | 401 idéntico, 429 tras 5 fallos y desbloqueo a los 30 s, refresh de un solo uso, tope de 30 min, `restore` sin conceder roles |
| `features/identity/*` | `LoginPage` (validaciones, no duplicar envíos, mensajes por error, foco), `ChangePasswordPage` (mapeo de 401/422), `AccessDeniedPage` (variantes de `motivo`), `InputFieldComponent` (aria-*, mostrar/ocultar) |
| `layouts/shell` | `TopbarComponent` (abrir/Escape/clic fuera/emitir `signOut`), `MobileMenuComponent` (emitir `signOut`) |
