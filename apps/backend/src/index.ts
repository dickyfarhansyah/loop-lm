import { Hono } from 'hono';
import { getRequestListener } from '@hono/node-server';
import { createServer } from 'node:http';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { compress } from 'hono/compress';
import { env } from './config/env';
import apiV1 from './routes/api/v1';
import { AppError } from './utils/errors';
import { setupSocketIO } from './socket';

const app = new Hono();

app.use('*', compress());
app.use('*', secureHeaders());
app.use('*', cors({
  origin: (origin) => origin || '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400,
}));
app.use('*', logger());

app.route('/api/v1', apiV1);

app.get('/health', (c) => c.json({
  status: 'ok',
  name: env.WEBUI_NAME,
  timestamp: new Date().toISOString(),
}));

app.get('/', (c) => c.json({
  message: `${env.WEBUI_NAME} API`,
  version: '1.0.0',
  endpoints: {
    health: '/health',
    api: '/api/v1',
    websocket: '/socket.io',
  },
}));

app.onError((err, c) => {
  console.error(err);

  if (err instanceof AppError) {
    return c.json({ error: err.message }, err.statusCode as 400 | 401 | 403 | 404 | 500);
  }

  return c.json({ error: 'Internal server error' }, 500 as const);
});

app.notFound((c) => c.json({ error: 'Not found' }, 404));

const port = env.PORT;
const httpServer = createServer({
  maxHeaderSize: 65536, 
}, getRequestListener(app.fetch));

setupSocketIO(httpServer);

httpServer.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server is running on http:
  console.log(`📚 API: http://localhost:${port}/api/v1`);
  console.log(`💚 Health: http:
  console.log(`🔌 WebSocket: http:
});
