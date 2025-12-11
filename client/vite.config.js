
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.js'
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: [
        'localhost',
        '.replit.dev',
        '.replit.com',
        /\.spock\.replit\.dev$/,
        /\.riker\.replit\.dev$/,
        /\.kirk\.replit\.dev$/
      ],
      hmr: {
        port: 3000,
        host: '0.0.0.0',
        overlay: false,
        timeout: 60000,
        protocol: 'wss',
        clientPort: 3000
      },
      watch: {
        usePolling: true
      }
    },
    preview: {
      port: 3000,
      host: true,
      cors: true
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
          },
        },
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'axios', '@heroicons/react/24/outline'],
    },
    define: {
      global: 'globalThis',
    }
  };
});
