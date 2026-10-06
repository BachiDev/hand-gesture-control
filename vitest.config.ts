import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['__tests__/**/*.test.ts', '__tests__/**/*.test.tsx'],
    // 'forks' (default) fails to spawn workers on GitHub runners
    // ([vitest-pool]: Failed to start forks worker); threads are portable
    // and our suites need no process isolation.
    pool: 'threads',
  },
});
