import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { chatService } from '../../../services/chat.service';
import { authMiddleware } from '../../../middleware/auth';
import {
  createChatSchema,
  updateChatSchema,
  addMessageSchema,
  updateMessageSchema,
} from '../../../utils/validators-extended';

const chatRouter = new Hono();

chatRouter.post('/', authMiddleware, zValidator('json', createChatSchema), async (c) => {
  const user = c.get('user');
  const { title } = c.req.valid('json');

  const chat = await chatService.createChat(user.id, title);
  return c.json(chat);
});

chatRouter.get('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const folderId = c.req.query('folderId');
  const archived = c.req.query('archived');
  const pinned = c.req.query('pinned');

  const filters: any = {};
  if (folderId !== undefined) filters.folderId = folderId || null;
  if (archived !== undefined) filters.archived = archived === 'true';
  if (pinned !== undefined) filters.pinned = pinned === 'true';

  const chats = await chatService.getChats(user.id, filters);
  return c.json(chats);
});

chatRouter.get('/shared/:shareId', async (c) => {
  const shareId = c.req.param('shareId');
  const chat = await chatService.getChatByShareId(shareId);
  return c.json(chat);
});

chatRouter.get('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const chat = await chatService.getChatById(id, user.id);
  return c.json(chat);
});

chatRouter.put('/:id', authMiddleware, zValidator('json', updateChatSchema), async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const data = c.req.valid('json');

  const chat = await chatService.updateChat(id, user.id, data);
  return c.json(chat);
});

chatRouter.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  await chatService.deleteChat(id, user.id);
  return c.json({ message: 'Chat deleted' });
});

chatRouter.post('/:id/messages', authMiddleware, zValidator('json', addMessageSchema), async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const messageData = c.req.valid('json');

  const message = await chatService.addMessage(id, user.id, messageData);
  return c.json(message);
});

chatRouter.put('/:id/messages/:messageId', authMiddleware, zValidator('json', updateMessageSchema), async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const messageId = c.req.param('messageId');
  const { content } = c.req.valid('json');

  const message = await chatService.updateMessage(id, user.id, messageId, content);
  return c.json(message);
});

chatRouter.put('/:id/archive', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json();
  const archived = body.archived ?? true;

  const chat = await chatService.archiveChat(id, user.id, archived);
  return c.json(chat);
});

chatRouter.put('/:id/pin', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json();
  const pinned = body.pinned ?? true;

  const chat = await chatService.pinChat(id, user.id, pinned);
  return c.json(chat);
});

chatRouter.post('/:id/share', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const result = await chatService.shareChat(id, user.id);
  return c.json(result);
});

chatRouter.delete('/:id/share', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  await chatService.unshareChat(id, user.id);
  return c.json({ message: 'Chat unshared' });
});

export default chatRouter;
