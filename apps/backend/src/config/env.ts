import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: Number(process.env.PORT) || 8080,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || './data/webui.db',
  JWT_SECRET: process.env.JWT_SECRET || 'change-this-secret-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CORS_ALLOW_ORIGIN: process.env.CORS_ALLOW_ORIGIN || '*',
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  MAX_FILE_SIZE: Number(process.env.MAX_FILE_SIZE) || 10485760, 
  WEBUI_NAME: process.env.WEBUI_NAME || 'LoopLM',
  
  CHROMA_URL: process.env.CHROMA_URL || 'http://localhost:8000',
  CHUNK_SIZE: Number(process.env.CHUNK_SIZE) || 1000,
  CHUNK_OVERLAP: Number(process.env.CHUNK_OVERLAP) || 200,
};
