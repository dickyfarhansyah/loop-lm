import { Hono } from 'hono';
import { authMiddleware } from '../../../middleware/auth';
import { fileService } from '../../../services/file.service';
import { chromaService } from '../../../services/chroma.service';

const fileRouter = new Hono();

fileRouter.post('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.parseBody();
  const file = body['file'] as File;

  if (!file) {
    return c.json({ error: 'No file provided' }, 400);
  }

  const buffer = await file.arrayBuffer();
  const data = Buffer.from(buffer);

  const uploadedFile = await fileService.uploadFile(
    {
      filename: file.name,
      data,
      mimetype: file.type,
    },
    user.id
  );

  return c.json(uploadedFile);
});

fileRouter.get('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const files = await fileService.getFiles(user.id);
  return c.json(files);
});

fileRouter.get('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const file = await fileService.getFileById(id, user.id);
  return c.json(file);
});

fileRouter.get('/:id/download', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const { data, filename, meta } = await fileService.downloadFile(id, user.id);

  return c.body(data, 200, {
    'Content-Type': meta.mimetype || 'application/octet-stream',
    'Content-Disposition': `attachment; filename="${filename}"`,
  });
});

fileRouter.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  await fileService.deleteFile(id, user.id);
  return c.json({ message: 'File deleted' });
});

fileRouter.post('/attach', authMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const { chatId, fileId, messageId } = body;

  const result = await fileService.attachFileToChat(chatId, fileId, user.id, messageId);
  return c.json(result);
});

fileRouter.post('/parse', authMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.parseBody();
  const file = body['file'] as File;

  console.log('[files/parse] Starting file parse request');
  console.log('[files/parse] User:', user.id);

  if (!file) {
    console.log('[files/parse] No file provided');
    return c.json({ error: 'No file provided' }, 400);
  }

  console.log('[files/parse] File received:', {
    name: file.name,
    type: file.type,
    size: file.size,
  });

  const buffer = await file.arrayBuffer();
  const data = Buffer.from(buffer);

  
  if (!fileService.isSupportedDocument(file.type)) {
    console.log('[files/parse] Unsupported format:', file.type);
    return c.json(
      {
        error: `Unsupported document format: ${file.type}. Supported formats: PDF, DOCX, XLSX, TXT`,
      },
      400
    );
  }

  try {
    console.log('[files/parse] Starting uploadAndParseDocument...');
    const result = await fileService.uploadAndParseDocument(
      {
        filename: file.name,
        data,
        mimetype: file.type,
      },
      user.id
    );

    console.log('[files/parse] Parse successful');
    return c.json(result);
  } catch (error: any) {
    console.error('[files/parse] Error:', error);
    console.error('[files/parse] Error stack:', error.stack);
    return c.json({ error: error.message || 'Failed to parse document' }, 500);
  }
});

fileRouter.post('/search', authMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const { query, fileIds, nResults = 5 } = body;

  if (!query || typeof query !== 'string') {
    return c.json({ error: 'query is required' }, 400);
  }

  try {
    const results = await chromaService.queryChunks(query, user.id, fileIds, nResults);
    return c.json({ results });
  } catch (error: any) {
    console.error('[files/search] ChromaDB error:', error);
    return c.json({ error: 'Vector search unavailable', details: error.message }, 503);
  }
});

fileRouter.post('/:id/search', authMiddleware, async (c) => {
  const user = c.get('user');
  const fileId = c.req.param('id');
  const body = await c.req.json();
  const { query, nResults = 5 } = body;

  if (!query || typeof query !== 'string') {
    return c.json({ error: 'query is required' }, 400);
  }

  
  await fileService.getFileById(fileId, user.id);

  try {
    const results = await chromaService.queryChunks(query, user.id, [fileId], nResults);
    return c.json({ results });
  } catch (error: any) {
    console.error('[files/:id/search] ChromaDB error:', error);
    return c.json({ error: 'Vector search unavailable', details: error.message }, 503);
  }
});

fileRouter.get('/chroma/health', authMiddleware, async (c) => {
  const ok = await chromaService.healthCheck();
  return c.json({ chromadb: ok ? 'ok' : 'unavailable' }, ok ? 200 : 503);
});

export default fileRouter;
