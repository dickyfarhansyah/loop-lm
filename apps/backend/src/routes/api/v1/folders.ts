import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { folderService } from '../../../services/folder.service';
import { authMiddleware } from '../../../middleware/auth';
import { createFolderSchema } from '../../../utils/validators-extended';

const folderRouter = new Hono();

folderRouter.post('/', authMiddleware, zValidator('json', createFolderSchema), async (c) => {
  const user = c.get('user');
  const { name, parentId } = c.req.valid('json');

  const folder = await folderService.createFolder(user.id, name, parentId);
  return c.json(folder);
});

folderRouter.get('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const folders = await folderService.getFolders(user.id);
  return c.json(folders);
});

folderRouter.get('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const folder = await folderService.getFolderById(id, user.id);
  return c.json(folder);
});

folderRouter.put('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const data = await c.req.json();

  const folder = await folderService.updateFolder(id, user.id, data);
  return c.json(folder);
});

folderRouter.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  await folderService.deleteFolder(id, user.id);
  return c.json({ message: 'Folder deleted' });
});

export default folderRouter;
