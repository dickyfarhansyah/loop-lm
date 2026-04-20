import { lazy } from "react"

const lazyLoad = (importFn: () => Promise<unknown>, name: string) =>
  lazy(() => importFn().then((m) => ({ default: (m as Record<string, React.ComponentType>)[name] })))

const RootLayout = lazyLoad(() => import("@/layouts/root-layout"), "RootLayout")
const AuthLayout = lazyLoad(() => import("@/layouts/auth-layout"), "AuthLayout")
const HomePage = lazyLoad(() => import("@/features/chat/home-page"), "HomePage")
const ChatPage = lazyLoad(() => import("@/features/chat/chat-page"), "ChatPage")
const SharedChatPage = lazyLoad(() => import("@/features/chat/shared-chat-page"), "SharedChatPage")
const LoginPage = lazyLoad(() => import("@/features/auth/login-page"), "LoginPage")
const SignupPage = lazyLoad(() => import("@/features/auth/signup-page"), "SignupPage")
const AdminLayout = lazyLoad(() => import("@/features/admin/admin-layout"), "AdminLayout")
const UsersPage = lazyLoad(() => import("@/features/admin/pages/users-page"), "UsersPage")
const EvaluationsPage = lazyLoad(() => import("@/features/admin/pages/evaluations-page"), "EvaluationsPage")
const FunctionsPage = lazyLoad(() => import("@/features/admin/pages/functions-page"), "FunctionsPage")
const NotesPage = lazyLoad(() => import("@/features/notes/notes-page"), "NotesPage")
const NoteEditorPage = lazyLoad(() => import("@/features/notes/note-editor-page"), "NoteEditorPage")
const NotFoundPage = lazyLoad(() => import("@/features/error/not-found-page"), "NotFoundPage")

const SetupPage = lazyLoad(() => import("@/features/setup"), "SetupPage")

const SettingsLayout = lazyLoad(() => import("@/features/settings"), "SettingsLayout")
const GeneralSettingsLayout = lazyLoad(() => import("@/features/settings"), "GeneralSettingsLayout")
const GeneralSettingsPage = lazyLoad(() => import("@/features/settings"), "GeneralSettingsPage")
const AuthenticationSettingsPage = lazyLoad(() => import("@/features/settings"), "AuthenticationSettingsPage")
const FeaturesSettingsPage = lazyLoad(() => import("@/features/settings"), "FeaturesSettingsPage")
const ConnectionsSettingsPage = lazyLoad(() => import("@/features/settings"), "ConnectionsSettingsPage")
const ModelsSettingsPage = lazyLoad(() => import("@/features/settings"), "ModelsSettingsPage")
const ModelDetailPage = lazyLoad(() => import("@/features/settings"), "ModelDetailPage")
const SystemPromptsSettingsPage = lazyLoad(() => import("@/features/settings"), "SystemPromptsSettingsPage")
const SystemPromptListPage = lazyLoad(() => import("@/features/settings"), "SystemPromptListPage")
const SystemPromptEditFormPage = lazyLoad(() => import("@/features/settings"), "SystemPromptEditFormPage")
const InterfaceSettingsPage = lazyLoad(() => import("@/features/settings"), "InterfaceSettingsPage")
const TasksSettingsPage = lazyLoad(() => import("@/features/settings"), "TasksSettingsPage")
const AudioSettingsPage = lazyLoad(() => import("@/features/settings"), "AudioSettingsPage")
const DatabaseSettingsPage = lazyLoad(() => import("@/features/settings"), "DatabaseSettingsPage")

const WorkspacePage = lazyLoad(() => import("@/features/workspace"), "WorkspacePage")
const KnowledgeDetailPage = lazyLoad(() => import("@/features/workspace"), "KnowledgeDetailPage")

const UserSettingsLayout = lazyLoad(() => import("@/features/user-settings"), "UserSettingsLayout")
const UserGeneralSettingsPage = lazyLoad(() => import("@/features/user-settings"), "GeneralSettingsPage")
const UserInterfaceSettingsPage = lazyLoad(() => import("@/features/user-settings"), "InterfaceSettingsPage")
const UserExternalToolsSettingsPage = lazyLoad(() => import("@/features/user-settings"), "ExternalToolsSettingsPage")
const UserPersonalizationSettingsPage = lazyLoad(() => import("@/features/user-settings"), "PersonalizationSettingsPage")
const UserAudioSettingsPage = lazyLoad(() => import("@/features/user-settings"), "AudioSettingsPage")
const UserDataControlsSettingsPage = lazyLoad(() => import("@/features/user-settings"), "DataControlsSettingsPage")
const UserAccountSettingsPage = lazyLoad(() => import("@/features/user-settings"), "AccountSettingsPage")
const UserAboutSettingsPage = lazyLoad(() => import("@/features/user-settings"), "AboutSettingsPage")

export interface RouteConfig {
  path?: string
  index?: boolean
  title: string
  element: React.LazyExoticComponent<React.ComponentType>
  children?: RouteConfig[]
}

export const routes: RouteConfig[] = [
  {
    path: "/",
    title: "",
    element: RootLayout,
    children: [
      { index: true, title: "Home", element: HomePage },
      { path: "chat/:chatId", title: "Chat", element: ChatPage },
      { path: "notes", title: "Notes", element: NotesPage },
      { path: "notes/:noteId", title: "Note", element: NoteEditorPage },
      { path: "workspace", title: "Ruang Kerja", element: WorkspacePage },
      { path: "workspace/knowledge/:knowledgeId", title: "Knowledge Detail", element: KnowledgeDetailPage },
      {
        path: "user-settings",
        title: "User Settings",
        element: UserSettingsLayout,
        children: [
          { index: true, title: "Umum", element: UserGeneralSettingsPage },
          { path: "interface", title: "Antarmuka", element: UserInterfaceSettingsPage },
          { path: "external-tools", title: "External Tools", element: UserExternalToolsSettingsPage },
          { path: "personalization", title: "Personalisasi", element: UserPersonalizationSettingsPage },
          { path: "audio", title: "Audio", element: UserAudioSettingsPage },
          { path: "data-controls", title: "Data Controls", element: UserDataControlsSettingsPage },
          { path: "account", title: "Akun", element: UserAccountSettingsPage },
          { path: "about", title: "Tentang", element: UserAboutSettingsPage },
        ],
      },
      {
        path: "admin",
        title: "Admin",
        element: AdminLayout,
        children: [
          { index: true, title: "Users", element: UsersPage },
          { path: "evaluations", title: "Evaluations", element: EvaluationsPage },
          { path: "functions", title: "Functions", element: FunctionsPage },
          {
            path: "settings",
            title: "Settings",
            element: SettingsLayout,
            children: [
              {
                path: "general",
                title: "General",
                element: GeneralSettingsLayout,
                children: [
                  { index: true, title: "Umum", element: GeneralSettingsPage },
                  { path: "authentication", title: "Authentication", element: AuthenticationSettingsPage },
                  { path: "features", title: "Features", element: FeaturesSettingsPage },
                ],
              },
              { path: "connections", title: "Connections", element: ConnectionsSettingsPage },
              { path: "models", title: "Models", element: ModelsSettingsPage },
              { path: "models/:modelId", title: "Model Detail", element: ModelDetailPage },
              { path: "system-prompts", title: "System Prompts", element: SystemPromptsSettingsPage },
              { path: "system-prompts/:modelId", title: "System Prompt List", element: SystemPromptListPage },
              { path: "system-prompts/:modelId/new", title: "Create System Prompt", element: SystemPromptEditFormPage },
              { path: "system-prompts/:modelId/edit/:promptId", title: "Edit System Prompt", element: SystemPromptEditFormPage },
              { path: "tasks", title: "Tasks", element: TasksSettingsPage },
              { path: "interface", title: "Interface", element: InterfaceSettingsPage },
              { path: "audio", title: "Audio", element: AudioSettingsPage },
              { path: "database", title: "Basis data", element: DatabaseSettingsPage },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "/auth",
    title: "",
    element: AuthLayout,
    children: [
      { path: "login", title: "Login", element: LoginPage },
      { path: "signup", title: "Signup", element: SignupPage },
    ],
  },
  {
    path: "/share/:shareId",
    title: "Shared Chat",
    element: SharedChatPage,
  },
  {
    path: "/setup",
    title: "Setup",
    element: SetupPage,
  },
  {
    path: "*",
    title: "Not Found",
    element: NotFoundPage,
  },
]
