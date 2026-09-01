import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import dotenv from 'dotenv';
import { handleChatApi, handleSchedulesApi, handleMythCheckApi, handleStatsApi } from './src/server/apiRouter';

dotenv.config();

function apiServerPlugin(): Plugin {
  return {
    name: 'api-server-plugin',
    configureServer(server) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const url = new URL(req.url, `http://${req.headers.host}`);
        const pathname = url.pathname;

        // Parse query params
        req.query = Object.fromEntries(url.searchParams.entries());

        // Helper to parse JSON body
        if (req.method === 'POST' || req.method === 'PUT') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              req.body = body ? JSON.parse(body) : {};
            } catch (e) {
              req.body = {};
            }
            routeApi(pathname, req, res, next);
          });
        } else {
          routeApi(pathname, req, res, next);
        }
      });
    }
  };
}

function routeApi(pathname: string, req: any, res: any, next: any) {
  // Add Express-like json helper
  res.json = (data: any) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  };
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };

  if (pathname === '/api/chat' && req.method === 'POST') {
    handleChatApi(req, res);
  } else if (pathname === '/api/schedules') {
    handleSchedulesApi(req, res);
  } else if (pathname === '/api/myth-check' && req.method === 'POST') {
    handleMythCheckApi(req, res);
  } else if (pathname === '/api/stats') {
    handleStatsApi(req, res);
  } else if (pathname === '/api/health') {
    res.json({ status: 'ok', service: 'CensusMitra AI Vite Dev API' });
  } else {
    next();
  }
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiServerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
