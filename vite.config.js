import { defineConfig } from 'vite';

export default defineConfig({
  base: '/game-of-life-ts',
  test: { environment: 'jsdom' },
});
