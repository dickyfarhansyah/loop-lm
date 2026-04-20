# Open WebUI Backend (JavaScript/TypeScript)

Backend JavaScript/TypeScript yang meniru **Open WebUI** menggunakan **Hono**, **Drizzle ORM**, **SQLite**, dan **Socket.IO**.

## 🚀 Features

### Core Features
- ✅ **Authentication** - Signup, signin, JWT tokens, API keys
- ✅ **User Management** - CRUD users, profiles, settings
- ✅ **Chat System** - Create, update, delete chats dengan full message history
- ✅ **File Management** - Upload, download, delete files
- ✅ **Real-time Updates** - WebSocket dengan Socket.IO

### Additional Features
- ✅ **Folders** - Organize chats dalam folders
- ✅ **Prompts** - Prompt library untuk reusable templates
- ✅ **Models** - Model registry dan configuration
- ✅ **Tags** - Tagging system untuk chat categorization

## 📋 Requirements

- **Node.js** >= 18
- **npm** atau **yarn**

## 🛠️ Installation

```bash
# Clone atau copy project
cd /Users/wiratekdeveloper/Documents/open-webui-js

# Install dependencies
npm install

# Copy .env.example ke .env
cp .env.example .env

# Edit .env dan set JWT_SECRET
# nano .env

# Push database schema
npm run db:push
# (Pilih "Yes" saat ditanya)
```

## 🏃 Running the Server

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

Server akan berjalan di: **http://localhost:8080**

## 📡 API Endpoints

### Authentication (`/api/v1/auths`)

```bash
# Signup (user pertama akan jadi admin)
POST /api/v1/auths/signup
Body: {
  "email": "admin@example.com",
  "password": "password123",
  "name": "Admin User"
}

# Signin
POST /api/v1/auths/signin
Body: {
  "email": "admin@example.com",
  "password": "password123"
}

# Get session
GET /api/v1/auths/session
Header: Authorization: Bearer <token>

# Signout
POST /api/v1/auths/signout
```

### Users (`/api/v1/users`)

```bash
# Get current user
GET /api/v1/users/me

# Update current user
PUT /api/v1/users/me
Body: {
  "name": "New Name",
  "bio": "My bio"
}

# Generate API key
POST /api/v1/users/me/api-key

# Get API key
GET /api/v1/users/me/api-key

# Delete API key
DELETE /api/v1/users/me/api-key

# List all users (admin only)
GET /api/v1/users

# Get user by ID (admin only)
GET /api/v1/users/:id
```

### Chats (`/api/v1/chats`)

```bash
# Create chat
POST /api/v1/chats
Body: {
  "title": "My Chat"
}

# List chats
GET /api/v1/chats
Query: ?folderId=xxx&archived=false&pinned=true

# Get chat by ID
GET /api/v1/chats/:id

# Update chat
PUT /api/v1/chats/:id
Body: {
  "title": "Updated Title",
  "folderId": "folder-id"
}

# Delete chat
DELETE /api/v1/chats/:id

# Add message to chat
POST /api/v1/chats/:id/messages
Body: {
  "content": "Hello!",
  "role": "user",
  "model": "gpt-4"
}

# Update message
PUT /api/v1/chats/:id/messages/:messageId
Body: {
  "content": "Updated message"
}

# Archive/unarchive chat
PUT /api/v1/chats/:id/archive
Body: { "archived": true }

# Pin/unpin chat
PUT /api/v1/chats/:id/pin
Body: { "pinned": true }

# Share chat
POST /api/v1/chats/:id/share

# Unshare chat
DELETE /api/v1/chats/:id/share

# Get shared chat (public)
GET /api/v1/chats/shared/:shareId
```

### Files (`/api/v1/files`)

```bash
# Upload file
POST /api/v1/files
Body: multipart/form-data with 'file' field

# List files
GET /api/v1/files

# Get file metadata
GET /api/v1/files/:id

# Download file
GET /api/v1/files/:id/download

# Delete file
DELETE /api/v1/files/:id

# Attach file to chat
POST /api/v1/files/attach
Body: {
  "chatId": "chat-id",
  "fileId": "file-id",
  "messageId": "message-id"
}
```

### Folders (`/api/v1/folders`)

```bash
# Create folder
POST /api/v1/folders
Body: {
  "name": "Work",
  "parentId": null
}

# List folders
GET /api/v1/folders

# Get folder by ID
GET /api/v1/folders/:id

# Update folder
PUT /api/v1/folders/:id
Body: {
  "name": "Updated Name",
  "isExpanded": true
}

# Delete folder
DELETE /api/v1/folders/:id
```

### Prompts (`/api/v1/prompts`)

```bash
# Create prompt
POST /api/v1/prompts
Body: {
  "command": "/summarize",
  "title": "Summarize Text",
  "content": "Please summarize the following text..."
}

# List prompts
GET /api/v1/prompts

# Get prompt by command
GET /api/v1/prompts/command/:command

# Get prompt by ID
GET /api/v1/prompts/:id

# Update prompt
PUT /api/v1/prompts/:id

# Delete prompt
DELETE /api/v1/prompts/:id
```

### Models (`/api/v1/models`)

```bash
# Create model
POST /api/v1/models
Body: {
  "name": "GPT-4 Custom",
  "baseModelId": "gpt-4",
  "params": { "temperature": 0.7 }
}

# List models
GET /api/v1/models

# Get model by ID
GET /api/v1/models/:id

# Update model
PUT /api/v1/models/:id

# Delete model
DELETE /api/v1/models/:id
```

### Tags (`/api/v1/tags`)

```bash
# Create tag
POST /api/v1/tags
Body: {
  "name": "Important",
  "data": { "color": "red" }
}

# List tags
GET /api/v1/tags

# Get tag by ID
GET /api/v1/tags/:id

# Delete tag
DELETE /api/v1/tags/:id
```

## 🔌 WebSocket Events

### Connection
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:8080', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Chat Events
```javascript
// Join chat room
socket.emit('join:chat', chatId);

// Leave chat room
socket.emit('leave:chat', chatId);

// Send message
socket.emit('chat:message', {
  chatId: 'chat-id',
  message: {
    content: 'Hello!',
    role: 'user'
  }
});

// Listen for messages
socket.on('chat:message', (data) => {
  console.log('New message:', data);
});

// Typing indicator
socket.emit('chat:typing', {
  chatId: 'chat-id',
  isTyping: true
});

socket.on('chat:typing', (data) => {
  console.log('User typing:', data.userId);
});

// Chat updated
socket.on('chat:updated', (data) => {
  console.log('Chat updated:', data.chatId);
});

// User presence
socket.emit('user:presence', 'online');

socket.on('user:presence', (data) => {
  console.log('User status:', data.userId, data.status);
});
```

## 🔐 Authentication

Backend ini mendukung 2 metode autentikasi:

### 1. JWT Token
```bash
# Gunakan di header
Authorization: Bearer <your-jwt-token>

# Atau di cookie (otomatis di-set saat signup/signin)
Cookie: token=<your-jwt-token>
```

### 2. API Key
```bash
# Generate API key terlebih dahulu
POST /api/v1/users/me/api-key

# Gunakan sebagai Bearer token
Authorization: Bearer sk-xxxxxxxxxxxxxxxx
```

## 📂 Project Structure

```
open-webui-js/
├── src/
│   ├── index.ts                    # Main entry point
│   ├── config/
│   │   ├── env.ts                  # Environment config
│   │   └── database.ts             # Drizzle client
│   ├── db/
│   │   ├── schema/                 # Database schemas
│   │   │   ├── users.ts            # User, Auth, ApiKey
│   │   │   ├── chats.ts            # Chat, ChatFile
│   │   │   ├── files.ts            # Files
│   │   │   ├── folders.ts          # Folders
│   │   │   ├── prompts.ts          # Prompts
│   │   │   ├── models.ts           # Models
│   │   │   ├── tags.ts             # Tags
│   │   │   └── index.ts            # Export all
│   │   └── migrations/             # Drizzle migrations
│   ├── middleware/
│   │   └── auth.ts                 # JWT & API Key auth
│   ├── routes/api/v1/
│   │   ├── auths.ts                # Auth routes
│   │   ├── users.ts                # User routes
│   │   ├── chats.ts                # Chat routes
│   │   ├── files.ts                # File routes
│   │   ├── folders.ts              # Folder routes
│   │   ├── prompts.ts              # Prompt routes
│   │   ├── models.ts               # Model routes
│   │   ├── tags.ts                 # Tag routes
│   │   └── index.ts                # Route aggregator
│   ├── services/
│   │   ├── auth.service.ts         # Auth logic
│   │   ├── user.service.ts         # User operations
│   │   ├── chat.service.ts         # Chat operations
│   │   ├── file.service.ts         # File operations
│   │   ├── folder.service.ts       # Folder operations
│   │   ├── prompt.service.ts       # Prompt operations
│   │   ├── model.service.ts        # Model operations
│   │   └── tag.service.ts          # Tag operations
│   ├── utils/
│   │   ├── jwt.ts                  # JWT utilities
│   │   ├── hash.ts                 # Password hashing
│   │   ├── validators.ts           # Input validation
│   │   ├── validators-extended.ts  # Extended validators
│   │   └── errors.ts               # Custom errors
│   ├── types/
│   │   └── chat.types.ts           # Chat types
│   └── socket/
│       └── index.ts                # Socket.IO setup
├── data/                           # SQLite database
├── uploads/                        # Uploaded files
├── package.json
├── tsconfig.json
├── drizzle.config.ts
└── .env
```

## 🗄️ Database

### SQLite dengan Drizzle ORM

Database disimpan di: `./data/webui.db`

### Tabel:
- **user** - User profiles
- **auth** - Authentication (passwords)
- **api_key** - API keys
- **chat** - Chat conversations
- **chat_file** - Chat file attachments
- **file** - Uploaded files
- **folder** - Folder organization
- **prompt** - Prompt templates
- **model** - Model configurations
- **tag** - Tags

### Database Commands

```bash
# Generate migration file dari schema changes
npm run db:generate
# atau: pnpm db:generate

# Cara 1: Push schema langsung ke database (Development)
npm run db:push
# atau: pnpm db:push
# ✅ Otomatis apply changes tanpa manual SQL

# Cara 2: Run migration files (Production)
npm run db:migrate
# atau: pnpm db:migrate
# ✅ Jalankan migration files yang sudah di-generate

# Open Drizzle Studio (GUI)
npm run db:studio
# atau: pnpm db:studio
```

**Workflow untuk schema changes:**
1. Edit schema di `src/db/schema/*.ts`
2. Generate migration: `pnpm db:generate`
3. Development: `pnpm db:push` (auto-apply)
4. Production: `pnpm db:migrate` (tracked migrations)

## 🔧 Environment Variables

Edit `.env`:

```bash
# Database
DATABASE_URL=./data/webui.db

# Server
PORT=8080
NODE_ENV=development

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# CORS
CORS_ALLOW_ORIGIN=*

# File Upload

UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Application
WEBUI_NAME=Open WebUI
```

## 🧪 Testing API with cURL

```bash
# Signup
curl -X POST http://localhost:8080/api/v1/auths/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Signin
curl -X POST http://localhost:8080/api/v1/auths/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Create chat (dengan token)
curl -X POST http://localhost:8080/api/v1/chats \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"title":"My First Chat"}'

# List chats
curl -X GET http://localhost:8080/api/v1/chats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📝 Tech Stack

- **Hono** - Fast web framework
- **Drizzle ORM** - TypeScript ORM
- **Better-SQLite3** - SQLite driver
- **Socket.IO** - WebSocket library
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT authentication
- **Zod** - Schema validation
- **TypeScript** - Type safety

## 🎯 Next Steps

Backend sudah **production-ready** dengan fitur lengkap! Anda bisa:

1. **Integrate dengan Frontend** - Connect ke Open WebUI frontend
2. **Add More Features** - Channels, groups, evaluations, dll
3. **Deploy** - Deploy ke VPS, Cloud, atau Docker
4. **Add Tests** - Unit tests dan integration tests
5. **Add Logging** - Winston atau Pino untuk logging
6. **Add Rate Limiting** - Protect API dari abuse

## 📄 License

MIT License

## 🙏 Credits

Backend ini terinspirasi dari [Open WebUI](https://github.com/open-webui/open-webui) yang dibuat dengan Python FastAPI.
