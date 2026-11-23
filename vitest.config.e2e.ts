import { defineConfig } from 'vitest/config';

// Pruebas e2e contra el Postgres de docker compose (lee el .env).
export default defineConfig({
  test: { globals: true, root: './', include: ['test/**/*.e2e-spec.ts'] },
});
