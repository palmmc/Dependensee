import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    outDir: 'assets/js',
    lib: {
      entry: path.resolve(__dirname, 'src/main.ts'),
      name: 'Dependensee',
      fileName: () => 'main.js',
      formats: ['es']
    },
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    },
    emptyOutDir: false
  },
  server: {
    open: true
  }
});
