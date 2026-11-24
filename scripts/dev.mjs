// Comandos de desarrollo para probar rápido, sin token de admin ni Postman.
// Escriben directo en la base (la de .env) usando el código compilado en dist/.
//
//   npm run role  -- <rol> [descripción] [--to <email>]
//   npm run user  -- <email> [rol1,rol2] [contraseña]
//   npm run token -- <email>
//
// Ver COMANDOS.md.
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { PasswordHasher, TokenService } from '@nestjs/authentication';
import { DataSource } from 'typeorm';

const DEFAULT_PASSWORD = 'Password1';

const [command, ...rawArgs] = process.argv.slice(2);

/** Separa los argumentos sueltos de las opciones --nombre valor. */
function parseArgs(args) {
  const positional = [];
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) options[args[i].slice(2)] = args[++i];
    else positional.push(args[i]);
  }
  return { positional, options };
}

function fail(message) {
  console.error(`✗ ${message}`);
  process.exitCode = 1;
}

/** Crea el rol si no existe. Devuelve su id. */
async function ensureRole(db, name, description = null) {
  const [row] = await db.query(
    `INSERT INTO "roles" ("role_name", "description") VALUES ($1, $2)
     ON CONFLICT ("role_name") DO UPDATE SET "role_name" = EXCLUDED."role_name"
     RETURNING "id", (xmax = 0) AS created`,
    [name, description],
  );
  console.log(row.created ? `✓ Rol "${name}" creado` : `• Rol "${name}" ya existía`);
  return row.id;
}

async function findUserId(db, email) {
  const [row] = await db.query(`SELECT "id" FROM "users" WHERE "email" = $1`, [email.trim().toLowerCase()]);
  return row?.id;
}

async function giveRole(db, userId, roleId) {
  await db.query(
    `INSERT INTO "user_roles" ("user_id", "role_id") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [userId, roleId],
  );
}

const commands = {
  async role(app, { positional: [name, description], options }) {
    if (!name) return fail('Uso: npm run role -- <rol> [descripción] [--to <email>]');
    const db = app.get(DataSource);
    const roleId = await ensureRole(db, name, description ?? null);
    if (options.to) {
      const userId = await findUserId(db, options.to);
      if (!userId) return fail(`No existe el usuario ${options.to}`);
      await giveRole(db, userId, roleId);
      console.log(`✓ Rol "${name}" asignado a ${options.to}`);
    }
  },

  async user(app, { positional: [email, roles = '', password = DEFAULT_PASSWORD] }) {
    if (!email) return fail('Uso: npm run user -- <email> [rol1,rol2] [contraseña]');
    const db = app.get(DataSource);
    const normalized = email.trim().toLowerCase();

    let userId = await findUserId(db, normalized);
    if (userId) {
      console.log(`• Usuario ${normalized} ya existía (no se cambió la contraseña)`);
    } else {
      const hash = await app.get(PasswordHasher).hash(password);
      const name = normalized.split('@')[0];
      [{ id: userId }] = await db.query(
        `INSERT INTO "users" ("email", "password", "name") VALUES ($1, $2, $3) RETURNING "id"`,
        [normalized, hash, name],
      );
      console.log(`✓ Usuario ${normalized} creado (contraseña: ${password})`);
    }

    for (const role of roles.split(',').map((r) => r.trim()).filter(Boolean)) {
      await giveRole(db, userId, await ensureRole(db, role));
      console.log(`✓ Rol "${role}" asignado`);
    }
    console.log(`  id: ${userId}`);
  },

  async token(app, { positional: [email] }) {
    if (!email) return fail('Uso: npm run token -- <email>');
    const userId = await findUserId(app.get(DataSource), email);
    if (!userId) return fail(`No existe el usuario ${email}`);
    // Mismo access token que da POST /auth/login (vence según JWT_EXPIRES_IN).
    const { accessToken, expiresIn } = await app.get(TokenService).issue(userId, { method: 'password' });
    console.error(`✓ Token de ${email} (vence en ${expiresIn} s). Header:`);
    console.log(`Authorization: Bearer ${accessToken}`);
  },
};

if (!commands[command]) {
  fail(`Comando desconocido "${command ?? ''}". Usa: role | user | token`);
} else {
  const { AppModule } = await import('../dist/app.module.js');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
  try {
    await commands[command](app, parseArgs(rawArgs));
  } catch (error) {
    fail(error.message);
  } finally {
    await app.close();
  }
}
