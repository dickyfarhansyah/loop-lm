
export interface Setting {
  id: string;
  category: string;
  key: string;
  value?: string | null;
  type: 'string' | 'boolean' | 'number' | 'json';
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeneralSettings {
  version: string;
  webui_name: string;
}

export interface AuthSettings {
  default_user_role: 'pending' | 'user' | 'admin';
  default_group: string;
  enable_signup: boolean;
  show_admin_details: boolean;
  admin_email: string;
  pending_user_overlay_title: string;
  pending_user_overlay_content: string;
  enable_api_keys: boolean;
  jwt_expiry: string;
  enable_ldap: boolean;
}

export interface FeatureSettings {
  enable_community_sharing: boolean;
  enable_message_rating: boolean;
  enable_folders: boolean;
  folder_max_file_count: number;
}

export interface UISettings {
  default_theme: 'light' | 'dark' | 'system';
  default_locale: string;
  banners: unknown[];
  default_prompt_suggestions: unknown[];
}

export interface TaskSettings {
  local_task_model: string;
  external_task_model: string;
  title_generation: boolean;
  title_generation_prompt: string;
  voice_mode_custom_prompt: boolean;
  voice_mode_prompt: string;
  follow_up_generation: boolean;
  follow_up_generation_prompt: string;
  tags_generation: boolean;
  tags_generation_prompt: string;
  retrieval_query_generation: boolean;
  web_search_query_generation: boolean;
  query_generation_prompt: string;
  autocomplete_generation: boolean;
  image_prompt_generation_prompt: string;
  tools_function_calling_prompt: string;
}

export interface AudioSettings {
  stt_enabled: boolean;
  stt_engine: 'whisper' | 'web';
  tts_enabled: boolean;
  tts_engine: 'openai' | 'elevenlabs' | 'web';
}

export interface ImageSettings {
  enabled: boolean;
  engine: 'automatic1111' | 'comfyui' | 'openai';
  steps: number;
}

export interface WebSearchSettings {
  enabled: boolean;
  engine: 'searxng' | 'google' | 'bing' | 'duckduckgo';
  url: string;
}

export interface AppSettings {
  general: GeneralSettings;
  auth: AuthSettings;
  features: FeatureSettings;
  ui: UISettings;
  tasks: TaskSettings;
  audio: AudioSettings;
  images: ImageSettings;
  web_search: WebSearchSettings;
}
