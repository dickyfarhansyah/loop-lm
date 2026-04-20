import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { connectionService } from '../../../services/connection.service';
import { authMiddleware, adminMiddleware } from '../../../middleware/auth';

const connectionRouter = new Hono();

const createConnectionSchema = z.object({
  name: z.string().min(1),
  providerType: z.enum(['openai', 'ollama', 'anthropic', 'azure', 'google', 'custom']),
  url: z.string().url(),
  type: z.enum(['internal', 'external']).optional(),
  authType: z.enum(['bearer', 'api_key', 'basic', 'none']).optional(),
  authValue: z.string().optional(),
  headers: z.record(z.string()).optional(),
  prefixId: z.string().optional(),
  modelIds: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  isDefault: z.boolean().optional(),
});

const updateConnectionSchema = createConnectionSchema.partial().extend({
  isEnabled: z.boolean().optional(),
  priority: z.number().optional(),
});

connectionRouter.post('/', authMiddleware, zValidator('json', createConnectionSchema), async (c) => {
  const user = c.get('user');
  const data = c.req.valid('json');
  const connection = await connectionService.createConnection(user.id, data);
  return c.json(connection, 201);
});

connectionRouter.get('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const connections = await connectionService.getConnections(user.id);

  
  const safeConnections = connections.map(conn => ({
    ...conn,
    authValue: conn.authValue ? '********' : null,
  }));

  return c.json(safeConnections);
});

connectionRouter.get('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const connection = await connectionService.getConnectionById(id, user.id);

  return c.json({
    ...connection,
    authValue: connection.authValue ? '********' : null,
  });
});

connectionRouter.put('/:id', authMiddleware, zValidator('json', updateConnectionSchema), async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const data = c.req.valid('json');
  const updated = await connectionService.updateConnection(id, user.id, data);

  return c.json({
    ...updated,
    authValue: updated.authValue ? '********' : null,
  });
});

connectionRouter.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  await connectionService.deleteConnection(id, user.id);
  return c.json({ message: 'Connection deleted' });
});

connectionRouter.post('/:id/verify', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const result = await connectionService.verifyConnection(id, user.id);
  return c.json(result);
});

connectionRouter.get('/:id/models', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const models = await connectionService.getModelsFromConnection(id, user.id);
  return c.json({ models });
});

connectionRouter.get('/status/check', authMiddleware, async (c) => {
  const user = c.get('user');
  const hasConnections = await connectionService.hasConnections(user.id);
  return c.json({
    configured: hasConnections,
    message: hasConnections ? 'Connections configured' : 'No connections configured. Please add an AI provider connection in Settings > Connections.',
  });
});

export default connectionRouter;
