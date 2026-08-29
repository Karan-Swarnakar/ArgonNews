import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';

/**
 * Vite Dev Server API Plugin
 * Emulates Cloudflare Worker endpoints (/api/articles, /api/status, /api/latest-check, /api/ingest)
 * during local development so the app works seamlessly without a separate backend.
 */
function argonDevApiPlugin(): Plugin {
  return {
    name: 'argonnews-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost:3000'}`);

        // 1. GET /api/articles or /articles
        if (url.pathname === '/api/articles' || url.pathname === '/articles') {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Access-Control-Allow-Origin', '*');

          try {
            const mockPath = path.resolve(__dirname, 'src/data/mockArticles.ts');
            let articles = [];
            if (fs.existsSync(mockPath)) {
              const content = fs.readFileSync(mockPath, 'utf-8');
              const match = content.match(/export const MOCK_ARTICLES: Article\[\] = ([\s\S]*?);/);
              if (match) {
                articles = JSON.parse(match[1]);
              }
            }

            const category = url.searchParams.get('category');
            const source = url.searchParams.get('source');
            const limit = parseInt(url.searchParams.get('limit') || '120', 10);
            const offset = parseInt(url.searchParams.get('offset') || '0', 10);

            let filtered = [...articles];
            if (category && category !== 'All' && category !== 'Today') {
              filtered = filtered.filter((a: any) =>
                (a.category || '').toLowerCase().includes(category.toLowerCase())
              );
            }
            if (source && source !== 'all') {
              filtered = filtered.filter((a: any) => a.source === source);
            }

            // Sort newest first
            filtered.sort((a: any, b: any) => {
              const tA = a.published_at ? new Date(a.published_at).getTime() : 0;
              const tB = b.published_at ? new Date(b.published_at).getTime() : 0;
              return tB - tA;
            });

            res.statusCode = 200;
            res.end(
              JSON.stringify({
                articles: filtered.slice(offset, offset + limit),
                total: filtered.length,
                isLive: true,
                source: 'ArgonNews Local Engine (Dev Server)',
                lastUpdated: new Date().toISOString(),
              })
            );
            return;
          } catch (e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
            return;
          }
        }

        // 2. GET /api/latest-check
        if (url.pathname === '/api/latest-check') {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.statusCode = 200;
          res.end(
            JSON.stringify({
              latestPublishedAt: new Date().toISOString(),
              totalCount: 156,
              hasNew: false,
              newCount: 0,
              checkedAt: new Date().toISOString(),
            })
          );
          return;
        }

        // 3. GET /api/status or /api/health
        if (url.pathname === '/api/status' || url.pathname === '/api/health') {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.statusCode = 200;
          res.end(
            JSON.stringify({
              status: 'ok',
              service: 'ArgonNews Autonomous Engine (Local Dev)',
              version: '3.0.0',
              cronSchedule: '*/30 * * * * (Every 30 minutes)',
              database: {
                connected: true,
                articleCount: 156,
                sourcesCount: 36,
                mode: 'local_development',
              },
              timestamp: new Date().toISOString(),
            })
          );
          return;
        }

        // 4. POST /api/ingest
        if (url.pathname === '/api/ingest') {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.statusCode = 200;
          res.end(
            JSON.stringify({
              message: 'Local ingestion simulation complete.',
              result: {
                sourcesAttempted: 36,
                sourcesSucceeded: 36,
                articlesInserted: 0,
              },
            })
          );
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), argonDevApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  };
});
