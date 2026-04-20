import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { db } from '../config/database';
import { files, chatFiles } from '../db/schema';
import { NotFoundError } from '../utils/errors';
import { env } from '../config/env';
import * as fs from 'fs/promises';
import * as path from 'path';
import { documentParserService, type ParsedDocument } from './document-parser.service';
import { chunkingService } from './chunking.service';
import { chromaService } from './chroma.service';

export class FileService {
  async uploadFile(file: { filename: string; data: Buffer; mimetype: string }, userId: string) {
    const fileId = nanoid();
    const now = new Date();

    
    const userDir = path.join(env.UPLOAD_DIR, userId);
    await fs.mkdir(userDir, { recursive: true });

    
    const ext = path.extname(file.filename);
    const filename = `${nanoid()}${ext}`;
    const filePath = path.join(userDir, filename);

    await fs.writeFile(filePath, file.data);

    
    await db.insert(files).values({
      id: fileId,
      userId,
      filename: file.filename,
      path: filePath,
      meta: {
        mimetype: file.mimetype,
        size: file.data.length,
      },
      createdAt: now,
      updatedAt: now,
    });

    return this.getFileById(fileId, userId);
  }

  async getFiles(userId: string) {
    return db.select().from(files).where(eq(files.userId, userId));
  }

  async getFileById(id: string, userId: string) {
    const file = await db.select().from(files)
      .where(eq(files.id, id))
      .limit(1);

    if (file.length === 0) {
      throw new NotFoundError('File not found');
    }

    
    if (file[0].userId !== userId) {
      throw new NotFoundError('File not found');
    }

    return file[0];
  }

  async downloadFile(id: string, userId: string) {
    const file = await this.getFileById(id, userId);

    try {
      const data = await fs.readFile(file.path);
      return { data, filename: file.filename, meta: file.meta as any };
    } catch (error) {
      throw new NotFoundError('File not found on disk');
    }
  }

  async deleteFile(id: string, userId: string) {
    const file = await this.getFileById(id, userId);

    
    try {
      await fs.unlink(file.path);
    } catch (error) {
      
    }

    
    await db.delete(files).where(eq(files.id, id));

    
    try {
      await chromaService.deleteFileChunks(id);
    } catch (err) {
      console.warn('[FileService] Failed to delete ChromaDB chunks for file', id, err);
    }
  }

  async attachFileToChat(chatId: string, fileId: string, userId: string, messageId?: string) {
    const linkId = nanoid();
    const now = new Date();

    await db.insert(chatFiles).values({
      id: linkId,
      userId,
      chatId,
      fileId,
      messageId: messageId || null,
      createdAt: now,
      updatedAt: now,
    });

    return { id: linkId };
  }

  async uploadAndParseDocument(
    file: { filename: string; data: Buffer; mimetype: string },
    userId: string
  ): Promise<{ file: any; parsed: ParsedDocument; chunksStored: number }> {
    
    const uploadedFile = await this.uploadFile(file, userId);

    
    if (!documentParserService.isSupported(file.mimetype)) {
      throw new Error(
        `Unsupported document format: ${file.mimetype}. Supported formats: PDF, DOCX, XLSX, TXT`
      );
    }

    
    const parsed = await documentParserService.parseDocument(uploadedFile.path, file.mimetype);

    
    let chunksStored = 0;
    try {
      const chunks = chunkingService.splitText(
        parsed.text,
        env.CHUNK_SIZE,
        env.CHUNK_OVERLAP,
      );

      if (chunks.length > 0) {
        await chromaService.storeChunks(
          uploadedFile.id,
          userId,
          file.filename,
          parsed.metadata.format,
          chunks,
        );
        chunksStored = chunks.length;
        console.log(
          `[FileService] Stored ${chunksStored} chunks in ChromaDB for file ${uploadedFile.id}`,
        );
      }
    } catch (err) {
      console.warn(
        '[FileService] ChromaDB chunking failed (service may be unavailable):',
        (err as Error).message,
      );
    }

    return {
      file: uploadedFile,
      parsed,
      chunksStored,
    };
  }

  isSupportedDocument(mimetype: string): boolean {
    return documentParserService.isSupported(mimetype);
  }
}

export const fileService = new FileService();
