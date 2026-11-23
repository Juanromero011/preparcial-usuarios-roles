import type { DataSourceOptions } from 'typeorm';
import { Role } from '../roles/role.entity.js';
import { User } from '../users/user.entity.js';
import { CreateUsersAndRoles1764000000000 } from '../database/migrations/1764000000000-CreateUsersAndRoles.js';
import { SeedAdmin1764000000001 } from '../database/migrations/1764000000001-SeedAdmin.js';

/**
 * Conexión a Postgres con las variables DB_*. La usan la app (TypeOrmModule)
 * y el CLI de TypeORM (src/database/data-source.ts).
 *
 * synchronize: false → el esquema lo crean SOLO las migraciones.
 * migrationsRun: true → al arrancar corre las que falten (quedan anotadas
 * en la tabla `migrations`, así que no se repiten).
 */
export function buildDataSourceOptions(env: NodeJS.ProcessEnv = process.env): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.DB_HOST ?? 'localhost',
    port: Number(env.DB_PORT ?? 5432),
    username: env.DB_USER,
    password: env.DB_PASS,
    database: env.DB_NAME,
    entities: [User, Role],
    migrations: [CreateUsersAndRoles1764000000000, SeedAdmin1764000000001],
    synchronize: false,
    migrationsRun: true,
  };
}
