import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: '.',
  resolve: {
    alias: {
      '@models': resolve(__dirname, 'src/models'),
      '@services': resolve(__dirname, 'src/services'),
      '@components': resolve(__dirname, 'src/components'),
      '@ui': resolve(__dirname, 'src/ui'),
      '@styles': resolve(__dirname, 'src/styles')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  base: '/Contact-book/'

});
