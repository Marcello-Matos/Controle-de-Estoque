import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const VARIAVEIS_FIREBASE = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

// Impede publicar um site em branco quando a configuração do Firebase não foi informada.
function verificarConfiguracao(mode) {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  if (env.VITE_USAR_EMULADORES === 'true') return;
  const faltando = VARIAVEIS_FIREBASE.filter((nome) => !env[nome]);
  if (faltando.length) {
    throw new Error(
      `Configuração do Firebase ausente: ${faltando.join(', ')}.\n`
      + 'Defina essas variáveis em .env.local (local) ou em Settings > Environment Variables (Vercel) e gere o build novamente.',
    );
  }
}

export default defineConfig(({ command, mode }) => {
  if (command === 'build') verificarConfiguracao(mode);
  return {
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
  };
});
