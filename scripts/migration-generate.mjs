// Genera una migración comparando las entidades con la base, y la registra sola.
//
//   npm run migration:generate -- NombreMigracion
//
// Pasos: compila → corre las migraciones pendientes (para comparar contra la
// base al día) → typeorm migration:generate → agrega el import y la clase a
// src/config/typeorm.config.ts → formatea el archivo con Prettier.
//
// Requisito: la entidad nueva ya debe estar en `entities` de typeorm.config.ts.
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const name = process.argv[2];
if (!name || !/^[A-Za-z][A-Za-z0-9]*$/.test(name)) {
  console.error('Uso: npm run migration:generate -- NombreMigracion   (solo letras y números, ej. CreateItems)');
  process.exit(1);
}

const MIGRATIONS_DIR = 'src/database/migrations';
const CONFIG = 'src/config/typeorm.config.ts';
const typeorm = (...args) =>
  execFileSync(
    'node',
    ['--env-file=.env', 'node_modules/typeorm/cli.js', ...args, '-d', 'dist/database/data-source.js'],
    { stdio: 'inherit' },
  );

const before = new Set(readdirSync(MIGRATIONS_DIR));

execFileSync('npx', ['nest', 'build'], { stdio: 'inherit' });
typeorm('migration:run');
try {
  typeorm('migration:generate', `${MIGRATIONS_DIR}/${name}`, '--pretty');
} catch {
  // TypeORM sale con error cuando no hay cambios ("No changes in database schema were found").
  process.exit(1);
}

const file = readdirSync(MIGRATIONS_DIR).find((f) => !before.has(f));
if (!file) process.exit(1);
const path = `${MIGRATIONS_DIR}/${file}`;

// El proyecto usa `import type` para tipos (isolatedModules).
const source = readFileSync(path, 'utf8').replace(
  'import { MigrationInterface, QueryRunner } from "typeorm";',
  "import type { MigrationInterface, QueryRunner } from 'typeorm';",
);
writeFileSync(path, source);

// Registrar la migración en typeorm.config.ts.
const className = source.match(/export class (\w+)/)[1];
const importPath = `../database/migrations/${file.replace(/\.ts$/, '.js')}`;
let config = readFileSync(CONFIG, 'utf8');
const lastMigrationImport = [...config.matchAll(/^import .* from '\.\.\/database\/migrations\/.*';$/gm)].at(-1);
config =
  config.slice(0, lastMigrationImport.index + lastMigrationImport[0].length) +
  `\nimport { ${className} } from '${importPath}';` +
  config.slice(lastMigrationImport.index + lastMigrationImport[0].length);
config = config.replace(/migrations: \[([^\]]*)\]/, (_, list) => `migrations: [${list.trim()}, ${className}]`);
writeFileSync(CONFIG, config);

execFileSync('npx', ['prettier', '--write', path, CONFIG], { stdio: 'ignore' });

console.log(`\n✓ Migración creada: ${path}`);
console.log(`✓ Registrada en ${CONFIG} (${className})`);
console.log('  Revísala y aplícala con: npm run migration:run   (o reinicia la API: la corre sola)');
