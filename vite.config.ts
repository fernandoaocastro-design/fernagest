import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (!id.includes('node_modules')) return undefined;
              const modulePath = id.split('node_modules/')[1];
              const parts = modulePath.split('/');
              const packageName =
                parts[0].startsWith('@') && parts[1]
                  ? `${parts[0]}/${parts[1]}`
                  : parts[0];

              if (
                packageName === 'recharts' ||
                packageName.startsWith('d3') ||
                packageName === 'internmap' ||
                packageName === 'victory-vendor' ||
                packageName === 'react-smooth'
              ) {
                return 'vendor-recharts';
              }

              if (
                packageName === 'react' ||
                packageName === 'react-dom' ||
                packageName === 'scheduler'
              ) {
                return 'vendor-react';
              }

              if (
                packageName === 'react-router' ||
                packageName === 'react-router-dom' ||
                packageName === '@remix-run/router'
              ) {
                return 'vendor-router';
              }

              if (packageName.startsWith('@supabase')) return 'vendor-supabase';
              if (packageName === 'lucide-react') return 'vendor-icons';
              return 'vendor-core';
            }
          }
        }
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
