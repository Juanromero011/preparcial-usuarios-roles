# Preparcial: sistema de usuarios y roles (NestJS)

API con NestJS 12, TypeORM y PostgreSQL:

- **Autenticación** con JWT (access token de 2 min y refresh token con rotación), usando `@nestjs/authentication`.
- **Autorización** por roles con policies de `@nestjs/authorization`.
- **Relación muchos a muchos** entre `users` y `roles` (tabla `user_roles`).

## Cómo correrlo

Requisitos: Node 22+ y Docker.

```bash
npm install
cp .env.example .env              # y cambia JWT_SECRET: openssl rand -base64 48
docker compose up -d              # Postgres en localhost:5436 + pgweb en http://localhost:8081
npm run start:dev                 # API en http://localhost:3000
```

La documentación interactiva (Swagger) queda en http://localhost:3000/api. Para las rutas con candado, haz login y pega el `accessToken` en **Authorize**.

Al arrancar, la API corre las migraciones pendientes (`migrationsRun: true`). Esas migraciones crean las tablas, el rol `admin` y el usuario admin.

| Usuario | Contraseña | Roles |
|---|---|---|
| `admin@preparcial.com` | `Admin123!` | admin |

Para cargar los usuarios de prueba (contraseña `Password1`), corre este script:

```bash
docker exec -i preparcial_db psql -U preparcial -d preparcial_db < sql/03_usuarios_y_roles_de_prueba.sql
```

Para borrar la base y empezar de cero: `docker compose down -v && docker compose up -d`.

### Variables de entorno

| Variable | Ejemplo | Uso |
|---|---|---|
| `PORT` | `3000` | Puerto de la API |
| `DB_HOST` / `DB_PORT` | `localhost` / `5436` | Conexión a Postgres |
| `DB_USER` / `DB_PASS` / `DB_NAME` | `preparcial` / `preparcial123` / `preparcial_db` | Credenciales de Postgres |
| `JWT_SECRET` | 32+ caracteres aleatorios | Firma los access tokens (HS256). Si es más corto, la app no arranca |
| `JWT_EXPIRES_IN` | `2m` | Vida del access token (`expiresIn: 120` en segundos) |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Vida del refresh token |

## Endpoints

Para las rutas protegidas se envía el header `Authorization: Bearer <accessToken>`.

| Método y ruta | Acceso | Éxito | Errores |
|---|---|---|---|
| `POST /auth/register` | público | 201 `{ message, userId }` | 400 Email inválido · 409 Email ya registrado |
| `POST /auth/login` | público | 200 `{ accessToken, refreshToken, expiresIn }` | 401 Credenciales incorrectas · 423 Usuario desactivado |
| `POST /auth/refresh` | público | 200 par nuevo (el refresh usado deja de servir) | 400 refreshToken es requerido · 401 inválido, ya usado o revocado |
| `POST /auth/logout` | público | 204 | 400 refreshToken es requerido |
| `POST /roles` | admin | 201 `{ message, roleId }` | 400 role_name es requerido · 401 · 403 · 409 role_name ya existe |
| `GET /roles` | admin | 200 `[{ id, role_name, description }]` | 401 · 403 · 500 |
| `DELETE /roles/:id` | admin | 200 `{ message: "Rol eliminado" }` | 400 no se puede eliminar el rol admin · 401 · 403 · 404 Rol no encontrado · 409 el rol está asignado a usuarios |
| `PATCH /users/:id/roles` | admin | 200 `{ message: "Roles asignados" }` | 400 roles inválidos · 401 · 403 · 404 Usuario no encontrado |
| `GET /users/me` | autenticado | 200 `{ id, email, name, phone, roles }` | 401 · 404 |
| `GET /users` | admin | 200 `[{ id, email, name, roles }]` | 401 · 403 · 500 |
| `DELETE /users/:id` | admin | 200 `{ message: "Usuario eliminado" }` | 400 no puedes eliminar tu propio usuario · 401 · 403 · 404 Usuario no encontrado |

El 401 responde "Token inválido o faltante" y el 403 responde "No autorizado".

`PATCH /users/:id/roles` **reemplaza** los roles del usuario por los que vienen en `roles`. Cada nombre debe existir.

## Cómo funciona una petición

```
Petición ──► AuthenticationGuard ──► AuthorizationGuard ──► ValidationPipe ──► Controller ──► Service ──► TypeORM
             (¿token válido?)        (¿la policy lo deja?)  (¿body válido?)
             no → 401                no → 403
```

1. **AuthenticationGuard** (global, viene de `AuthenticationModule`): toda ruta sin `@Public()` exige un token. `JwtAuthProvider` verifica la firma y la expiración, y carga el usuario **con sus roles**. Si el usuario no existe o está desactivado, rechaza el token con 401.
2. **AuthorizationGuard** (global, viene de `AuthorizationModule`) lee el `@Can(Policy, 'regla')` de la ruta:
   - Primero llama a `policy.before(user)`. Si el usuario es admin, devuelve `true` y la petición pasa.
   - Si no, decide la regla, por ejemplo `UsersPolicy.list(user)`.
   - Una ruta sin `@Can()`, `@Can.Anyone()` ni `@Public()` **se niega siempre** (deny by default).
3. **ValidationPipe** valida el body con los DTOs (`class-validator`). Responde 400 con el primer mensaje de error.
4. `AuthErrorsFilter` (en los controladores protegidos) traduce los 401 y 403 del paquete a los mensajes del enunciado.

| Decorador | Significa |
|---|---|
| `@Public()` | No pide token (rutas `/auth/*`) |
| `@Can.Anyone()` | Basta con estar autenticado (`GET /users/me`) |
| `@Can(UsersPolicy, 'list')` | Lo decide la regla `list` de `UsersPolicy` (o `before()`) |

### Refresh tokens

- `TokenService.issue(userId)` firma el access token (JWT con `sub` = id del usuario) y crea un refresh token opaco de un solo uso.
- `refresh()` gasta el token y entrega un par nuevo (**rotación**). Si alguien vuelve a presentar un token ya rotado, el paquete asume que lo robaron y revoca toda la familia: los dos clientes tienen que volver a iniciar sesión.
- `logout` llama a `revoke()`.
- Los refresh tokens viven **en memoria** (`allowInMemoryStorage: true`), así que al reiniciar la API se pierden y hay que volver a iniciar sesión.

### Seguridad

- Las contraseñas se guardan con `PasswordHasher` (scrypt).
- El login compara contra un hash falso cuando el email no existe, para que la respuesta tarde lo mismo y no revele qué emails están registrados.
- La columna `password` tiene `select: false`: ningún `find()` la trae. Solo el login la pide explícitamente.
- El estado desactivado (423) se revisa **después** de la contraseña, para no revelar qué cuentas están desactivadas.
- Los emails se guardan en minúsculas.

## Receta: agregar un endpoint protegido

Ejemplo: "un supervisor puede listar usuarios".

1. **Regla en la policy** (`src/users/users.policy.ts`). El parámetro del usuario debe aceptar `null`. `hasRole` (de `user.entity.ts`) dice si tiene al menos uno de esos roles; el admin ya pasa por `before()`:
   ```ts
   list(user: User | null): boolean {
     return hasRole(user, 'supervisor');            // o hasRole(user, 'supervisor', 'operador')
   }
   ```
2. **Ruta** en el controlador con `@Can(UsersPolicy, 'list')`. Si la ruta recibe un id, la regla puede tomarlo:
   ```ts
   @Can(UsersPolicy, 'view', (ctx) => [ctx.switchToHttp().getRequest().params.id])
   ```
3. **Para una entidad nueva**, sigue estos pasos:
   - Crea la entidad en `src/<modulo>/`.
   - Agrégala a `entities` en `src/config/typeorm.config.ts` y genera la migración con `npm run migration:generate -- CreateAlgo`.
   - Crea el DTO, el service y el controller con `@UseFilters(AuthErrorsFilter)`.
   - Crea la policy con `@Policy()` y `before()` para el admin.
   - Registra la policy en los `providers` del módulo e importa el módulo en `AppModule`.
4. **Prueba** con un caso en `test/app.e2e-spec.ts`.

## Estructura

```
src/
  auth/          register, login, refresh, logout + JwtAuthProvider
  users/         entidad User (dueña del @JoinTable), UsersPolicy, /users
  roles/         entidad Role, RolesPolicy, /roles
  common/        AuthErrorsFilter, detección de UNIQUE violado (23505 → 409)
  config/        conexión a Postgres (DB_*)
  database/      migraciones + data-source para el CLI de TypeORM
sql/             01 esquema · 02 admin · 03 usuarios y roles de prueba
test/            pruebas e2e contra Postgres
```

## Scripts

| Script | Qué hace |
|---|---|
| `npm run start:dev` | API con recarga automática |
| `npm run test:e2e` | 33 pruebas e2e contra el Postgres de Docker |
| `npm run lint` | oxlint |
| `npm run build && npm run migration:run` | Corre las migraciones a mano (`migration:revert` revierte la última) |
