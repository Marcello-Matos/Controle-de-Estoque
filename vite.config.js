import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  test: {
    env: { VITE_USAR_EMULADORES: 'true', VITE_FIREBASE_PROJECT_ID: 'demo-estoque' },
    fileParallelism: false,
    testTimeout: 20000,
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: { firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'] },
      },
    },
  },
});
