import { z } from 'zod';

export const createChatSchema = z.object({
  title: z.string().min(1),
});

export const updateChatSchema = z.object({
  title: z.string().min(1).optional(),
  folderId: z.string().nullable().optional(),
});

export const addMessageSchema = z.object({
  content: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  model: z.string().optional(),
  images: z.array(z.string()).optional(),
  files: z.array(z.string()).optional(),
});

export const updateMessageSchema = z.object({
  content: z.string().min(1),
});

export const createFolderSchema = z.object({
  name: z.string().min(1),
  parentId: z.string().nullable().optional(),
});

export const createPromptSchema = z.object({
  command: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
});

export const createModelSchema = z.object({
  name: z.string().min(1),
  baseModelId: z.string().optional(),
  meta: z.any().optional(),
  params: z.any().optional(),
});

export const createTagSchema = z.object({
  name: z.string().min(1),
  data: z.any().optional(),
});
