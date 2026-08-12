import { defineConfig } from 'vitest/config';

/**
 * Domain tests are pure Node. No simulator, no jsdom, no React — if a test in
 * here ever needs any of those, something has leaked across the package
 * boundary and the fix is in the source, not in this file.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
