// Convierte los DATOS actuales de la base en una migración ("foto" de la base).
//
//   npm run migration:snapshot -- NombreMigracion
//
// Sirve para entregar lo que creaste a mano (un rol desde Swagger, usuarios,
// registros de tus tablas nuevas): quien arranque el proyecto con una base
// vacía los tendrá, porque la API corre las migraciones al iniciar.
//
// Cómo funciona: pg_dump --data-only (todas las tablas menos "migrations"),
// cada fila como INSERT ... ON CONFLICT DO NOTHING (lo que ya existe se salta),
// y deja la migración registrada en src/config/typeorm.config.ts.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const name = process.argv[2];
if (!name || !/^[A-Za-z][A-Za-z0-9]*$/.test(name)) {
  console.error('Uso: npm run migration:snapshot -- NombreMigracion   (solo letras y números, ej. SnapshotRoles)');
  process.exit(1);
}

const MIGRATIONS_DIR = 'src/database/migrations';
const CONFIG = 'src/config/typeorm.config.ts';

const dump = execFileSync(
  'docker',
  [
    'compose', 'exec', '-T', 'db', 'pg_dump',
    '-U', process.env.DB_USER, '-d', process.env.DB_NAME,
    '--data-only', '--column-inserts', '--on-conflict-do-nothing',
    '--exclude-table=public.migrations',
  ],
  { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
);

// Solo los INSERT y el ajuste de las secuencias de ids numéricos (setval).
const statements = dump
  .split(/;\n/)
  .map((s) => s.split('\n').filter((l) => !l.startsWith('--')).join('\n').trim())
  .filter((s) => s.startsWith('INSERT INTO') || s.startsWith('SELECT pg_catalog.setval'))
  // El contador de la tabla migrations lo maneja TypeORM: no se copia.
  .filter((s) => !s.includes('migrations_id_seq'));

if (statements.length === 0) {
  console.error('La base no tiene datos para copiar.');
  process.exit(1);
}

const timestamp = Date.now();
const className = `${name}${timestamp}`;
const file = `${timestamp}-${name}.ts`;
const body = statements.map((s) => `    await queryRunner.query(${JSON.stringify(s)});`).join('\n');

writeFileSync(
  `${MIGRATIONS_DIR}/${file}`,
  `import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Datos de la base al ${new Date().toLocaleString('es-CO')} (npm run migration:snapshot). */
export class ${className} implements MigrationInterface {
  name = '${className}';

  async up(queryRunner: QueryRunner): Promise<void> {
${body}
  }

  // No borra nada al revertir: estos datos pueden haber cambiado después.
  async down(): Promise<void> {}
}
`,
);

// Registrar la migración en typeorm.config.ts (igual que migration:generate).
let config = readFileSync(CONFIG, 'utf8');
const lastImport = [...config.matchAll(/^import .* from '\.\.\/database\/migrations\/.*';$/gm)].at(-1);
const at = lastImport.index + lastImport[0].length;
config = `${config.slice(0, at)}\nimport { ${className} } from '../database/migrations/${file.replace(/\.ts$/, '.js')}';${config.slice(at)}`;
config = config.replace(/migrations: \[([^\]]*)\]/, (_, list) => `migrations: [${list.trim().replace(/,$/, '')}, ${className}]`);
writeFileSync(CONFIG, config);

execFileSync('npx', ['prettier', '--write', `${MIGRATIONS_DIR}/${file}`, CONFIG], { stdio: 'ignore' });

const inserts = statements.filter((s) => s.startsWith('INSERT')).length;
console.log(`✓ Migración creada: ${MIGRATIONS_DIR}/${file} (${inserts} filas)`);
console.log(`✓ Registrada en ${CONFIG} (${className})`);
console.log('  En tu base no cambia nada (todo ya existe). En una base nueva, crea esos datos al arrancar.');
