import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { noteService } from '../../../services/note.service';
import { authMiddleware } from '../../../middleware/auth';

const noteRouter = new Hono();

const createNoteSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  visibility: z.enum(['private', 'public', 'shared']).optional(),
  tags: z.array(z.string()).optional(),
  folderId: z.string().nullable().optional(),
});

const updateNoteSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  visibility: z.enum(['private', 'public', 'shared']).optional(),
  tags: z.array(z.string()).optional(),
  folderId: z.string().nullable().optional(),
});

noteRouter.get('/shared/:shareId', async (c) => {
  const shareId = c.req.param('shareId');
  const note = await noteService.getNoteByShareId(shareId);
  return c.json(note);
});

noteRouter.get('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const archived = c.req.query('archived');
  const pinned = c.req.query('pinned');
  const folderId = c.req.query('folderId');
  const search = c.req.query('search');

  const filters: any = {};
  if (archived !== undefined) filters.archived = archived === 'true';
  if (pinned !== undefined) filters.pinned = pinned === 'true';
  if (folderId !== undefined) filters.folderId = folderId || null;
  if (search) filters.search = search;

  const notes = await noteService.getNotes(user.id, filters);
  return c.json(notes);
});

noteRouter.post('/', authMiddleware, zValidator('json', createNoteSchema), async (c) => {
  const user = c.get('user');
  const data = c.req.valid('json');

  const note = await noteService.createNote(user.id, data);
  return c.json(note);
});

noteRouter.get('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const note = await noteService.getNoteById(id, user.id);
  return c.json(note);
});

noteRouter.put('/:id', authMiddleware, zValidator('json', updateNoteSchema), async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const data = c.req.valid('json');

  const note = await noteService.updateNote(id, user.id, data);
  return c.json(note);
});

noteRouter.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  await noteService.deleteNote(id, user.id);
  return c.json({ message: 'Note deleted' });
});

noteRouter.put('/:id/archive', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json();
  const archived = body.archived ?? true;

  const note = await noteService.archiveNote(id, user.id, archived);
  return c.json(note);
});

noteRouter.put('/:id/pin', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json();
  const pinned = body.pinned ?? true;

  const note = await noteService.pinNote(id, user.id, pinned);
  return c.json(note);
});

noteRouter.post('/:id/share', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const result = await noteService.shareNote(id, user.id);
  return c.json(result);
});

noteRouter.delete('/:id/share', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  await noteService.unshareNote(id, user.id);
  return c.json({ message: 'Note unshared' });
});

export default noteRouter;
