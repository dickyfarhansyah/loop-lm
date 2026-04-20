import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { tagService } from '../../../services/tag.service';
import { authMiddleware } from '../../../middleware/auth';
import { createTagSchema } from '../../../utils/validators-extended';

const tagRouter = new Hono();

tagRouter.post('/', authMiddleware, zValidator('json', createTagSchema), async (c) => {
  const user = c.get('user');
  const { name, data } = c.req.valid('json');

  const tag = await tagService.createTag(user.id, name, data);
  return c.json(tag);
});

tagRouter.get('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const tags = await tagService.getTags(user.id);
  return c.json(tags);
});

tagRouter.get('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const tag = await tagService.getTagById(id, user.id);
  return c.json(tag);
});

tagRouter.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  await tagService.deleteTag(id, user.id);
  return c.json({ message: 'Tag deleted' });
});

export default tagRouter;
