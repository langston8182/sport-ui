import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      proxy: {
        '/api-proxy': {
          target: env.VITE_API_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api-proxy/, ''),
        },
        '/auth-proxy': {
          target: env.VITE_AUTH_BASE_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/auth-proxy/, ''),
          cookieDomainRewrite: 'localhost',
        },
      },
    },
  };
});
