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
| `core/mock/fixtures/users.fixture.ts` | 1 persona ficticia por rol con interfaz (`DEMO_USERS`): Alumno, Docente, Tutor, Director Demo |
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

Aislada en `core/auth` y condicionada a `APP_ENV.mockAuth`. Hoy solo existe `SessionStore` y el perfil de demostración
(`DEMO_USERS`) que `ShellLayout` usa **únicamente si `mockAuth` es true**. `assertSafeEnvironment()` impide mock en producción.
Cuentas de prueba (se documentarán completas en la Fase 2): números institucionales ficticios de `DEMO_USERS`.

## Qué podrá probarse (para el responsable de testing)

Funciones/servicios puros y sin DOM: `assertSafeEnvironment`, `greetingFor`/`longDayLabel`, `buildProfile`/`initialsOf`,
`isUiRole`, `navPathsFor`/`ROLE_NAVIGATION`, `ToastService`, `MockTermRepository.getActive()`, `SessionStore`.
Componentes: `StatCardComponent`, `BadgeComponent`, `SidebarComponent` (activo/colapsado), `MobileMenuComponent` (abrir/cerrar/ESC),
`ShellLayout` (rol inválido → alumno).
