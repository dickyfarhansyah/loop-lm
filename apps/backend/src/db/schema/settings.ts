import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const settings = sqliteTable('settings', {
  id: text('id').primaryKey(),
  category: text('category').notNull(),
  key: text('key').notNull(),
  value: text('value'),
  type: text('type').default('string'),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;

export const defaultSettings = {
  general: {
    version: '1.0.0',
    webui_name: 'LoopLM',
  },
  auth: {
    default_user_role: 'pending',
    default_group: '',
    enable_signup: false,
    show_admin_details: true,
    admin_email: '',
    pending_user_overlay_title: '',
    pending_user_overlay_content: '',
    enable_api_keys: false,
    jwt_expiry: '4w',
    enable_ldap: false,
  },
  features: {
    enable_community_sharing: true,
    enable_message_rating: true,
    enable_folders: true,
    folder_max_file_count: 0,
  },
  ui: {
    default_theme: 'system',
    default_locale: 'en',
    banners: [],
    default_prompt_suggestions: [],
    primary_color: '',
  },
  tasks: {
    local_task_model: '',
    external_task_model: '',
    title_generation: true,
    title_generation_prompt: '',
    voice_mode_custom_prompt: true,
    voice_mode_prompt: '',
    follow_up_generation: true,
    follow_up_generation_prompt: '',
    tags_generation: true,
    tags_generation_prompt: '',
    retrieval_query_generation: true,
    web_search_query_generation: true,
    query_generation_prompt: '',
    autocomplete_generation: false,
    image_prompt_generation_prompt: '',
    tools_function_calling_prompt: '',
  },
  audio: {
    stt_enabled: false,
    stt_engine: 'whisper',
    tts_enabled: false,
    tts_engine: 'openai',
  },
  images: {
    enabled: false,
    engine: 'automatic1111',
    steps: 50,
  },
  web_search: {
    enabled: false,
    engine: 'searxng',
    url: '',
  },
  code_execution: {
    enabled: false,
    engine: 'jupyter',
  },
  external_tools: {
    enabled: false,
  },
  documents: {
    enabled: false,
    chunk_size: 1000,
    chunk_overlap: 100,
  },
  pipelines: {
    enabled: false,
    url: '',
  },
  database: {
    auto_backup: false,
    backup_interval: '24h',
  },
};
