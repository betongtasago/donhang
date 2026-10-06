import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  app.use(express.json());

  // Supabase lưu dữ liệu bền vững; Express chỉ relay sự kiện realtime giữa các phiên.
  const syncClients = new Set<import('express').Response>();
  let latestSyncMessage: Record<string, unknown> | null = null;

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', database: 'supabase' });
  });

  app.get('/api/sync/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED' })}\n\n`);
    if (latestSyncMessage) res.write(`data: ${JSON.stringify(latestSyncMessage)}\n\n`);
    syncClients.add(res);

    const heartbeat = setInterval(() => {
      if (!res.writableEnded) res.write(': heartbeat\n\n');
    }, 15000);
    req.on('close', () => {
      clearInterval(heartbeat);
      syncClients.delete(res);
    });
  });

  app.post('/api/sync/events', (req, res) => {
    const message = req.body && typeof req.body === 'object' ? req.body : {};
    latestSyncMessage = message;
    const serialized = JSON.stringify(message);
    for (const client of syncClients) {
      if (!client.writableEnded) client.write(`data: ${serialized}\n\n`);
    }
    res.status(202).json({ deliveredTo: syncClients.size });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT, hmr: false },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TSG TNT Concrete Operations server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
