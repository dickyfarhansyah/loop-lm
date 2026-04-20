export interface AuthSettings {
  default_user_role: "pending" | "user" | "admin"
  default_group: string
  enable_signup: boolean
  show_admin_details: boolean
  admin_email: string
  pending_user_overlay_title: string
  pending_user_overlay_content: string
  enable_api_keys: boolean
  jwt_expiry: string
  enable_ldap: boolean
}

export interface GeneralSettings {
  version: string
  webui_name: string
  logo_url: string
  logo_icon_url: string
  default_system_prompt: string
}

export interface TasksSettings {
  local_task_model: string
  external_task_model: string
  title_generation: boolean
  title_generation_prompt: string
  voice_mode_custom_prompt: boolean
  voice_mode_prompt: string
  follow_up_generation: boolean
  follow_up_generation_prompt: string
  tags_generation: boolean
  tags_generation_prompt: string
  retrieval_query_generation: boolean
  web_search_query_generation: boolean
  query_generation_prompt: string
  autocomplete_generation: boolean
  image_prompt_generation_prompt: string
  tools_function_calling_prompt: string
}

export interface Banner {
  id: string
  text: string
  type: "info" | "warning" | "error"
  dismissible: boolean
}

export interface PromptSuggestion {
  id: string
  title: string
  subtitle: string
  content: string
}

export interface UISettings {
  default_theme: "light" | "dark" | "system"
  default_locale: string
  banners: Banner[]
  default_prompt_suggestions: PromptSuggestion[]
  primary_color: string
}

export interface InterfaceSettings {
  tasks: TasksSettings
  ui: UISettings
}

export interface AudioSettings {
  stt_engine: string
  stt_model: string
  supported_mime_types: string
  tts_engine: string
  tts_voice: string
  response_splitting: "punctuation" | "paragraph" | "none"
}
