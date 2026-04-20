import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { proxyService } from '../../../services/proxy.service';
import { authMiddleware } from '../../../middleware/auth';

const openaiRouter = new Hono();

openaiRouter.get('/models', authMiddleware, async (c) => {
  const user = c.get('user');
  const data = await proxyService.getModels(user.id);
  return c.json(data);
});

openaiRouter.post('/chat/completions', authMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();

  
  if (body.stream) {
    const response = await proxyService.chatCompletionsStream(user.id, body);

    
    c.header('Content-Type', 'text/event-stream; charset=utf-8');
    c.header('Cache-Control', 'no-cache, no-transform');
    c.header('X-Accel-Buffering', 'no');
    c.header('Connection', 'keep-alive');

    return stream(c, async (stream) => {
      const reader = response.body?.getReader();
      if (!reader) return;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          await stream.write(value);
        }
      } finally {
        reader.releaseLock();
      }
    });
  }

  const data = await proxyService.chatCompletions(user.id, body);
  return c.json(data);
});

openaiRouter.post('/completions', authMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const data = await proxyService.completions(user.id, body);
  return c.json(data);
});

openaiRouter.post('/embeddings', authMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const data = await proxyService.embeddings(user.id, body);
  return c.json(data);
});

export default openaiRouter;
