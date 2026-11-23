import { defineConfig } from 'vitest/config';

// Pruebas unitarias (*.spec.ts junto al código).
export default defineConfig({
  test: { globals: true, root: './', include: ['src/**/*.spec.ts'], passWithNoTests: true },
});
