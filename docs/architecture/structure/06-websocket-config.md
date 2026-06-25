# WebSocket-сервер и конфигурация

## WebSocket-сервер

### Зачем отдельный процесс

Next.js не поддерживает долгоживущие WebSocket-соединения внутри собственного сервера. Отдельный минисервер решает эту проблему и не нагружает SSR-процесс.

### Архитектура WS-сервера

```mermaid
graph TB
    subgraph ws-server
        Index[index.ts - порт 3001]
        CM[connectionManager.ts]
        Auth[auth.ts - JWT проверка]
        ChatH[handlers/chat.ts]
        NotifH[handlers/notifications.ts]
    end
    subgraph PostgreSQL
        DB[(БД)]
    end

    Client1[Клиент 1] -->|WSS| Index
    Client2[Клиент 2] -->|WSS| Index
    Index --> Auth
    Index --> CM
    Index --> ChatH
    Index --> NotifH
    ChatH --> DB
    NotifH --> DB
    CM -->|broadcast| Client1
    CM -->|broadcast| Client2
```

### Протокол сообщений

Все сообщения — JSON. Формат:

```json
{
  "type": "chat.message",
  "payload": { ... }
}
```

#### Типы сообщений клиента → сервер

| type | payload | Описание |
|------|---------|---------|
| `chat.join` | `{ chatId }` | Войти в чат |
| `chat.leave` | `{ chatId }` | Покинуть чат |
| `chat.message` | `{ chatId, content }` | Отправить сообщение |
| `chat.typing` | `{ chatId }` | Индикатор набора |

#### Типы сообщений сервер → клиент

| type | payload | Описание |
|------|---------|---------|
| `chat.message` | `{ id, chatId, sender, content, createdAt }` | Новое сообщение |
| `chat.typing` | `{ chatId, userId, name }` | Кто-то печатает |
| `notification` | `{ id, type, title, content, link }` | Push-уведомление |

### connectionManager.ts

Управляет комнатами. Каждый чат — отдельная комната.

```typescript
// Концепция
class ConnectionManager {
  // userId -> Set<WebSocket>
  private userConnections: Map<string, Set<WebSocket>>
  // chatId -> Set<userId>
  private rooms: Map<string, Set<string>>

  join(userId, chatId): void
  leave(userId, chatId): void
  broadcast(chatId, message, excludeUserId?): void
  sendToUser(userId, message): void
  onDisconnect(ws): void
}
```

### Интеграция с Next.js

Когда Server Action создаёт начисление, документ или голосование — нужно отправить уведомление:

1. Server Action пишет в БД через Prisma
2. Server Action отправляет HTTP-запрос на WS-сервер: `POST http://localhost:3001/internal/notify`
3. WS-сервер рассылает push-уведомления подключённым клиентам

Это простой внутренний API на WS-сервере с проверкой по общему секрету.

---

## Конфигурационные файлы

### package.json — корневой

```json
{
  "name": "snt-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "dev:ws": "pnpm --filter ws-server dev",
    "dev:all": "concurrently \"pnpm dev\" \"pnpm dev:ws\"",
    "build": "next build",
    "build:ws": "pnpm --filter ws-server build",
    "start": "next start",
    "start:ws": "pnpm --filter ws-server start",
    "lint": "next lint",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio",
    "db:generate": "prisma generate"
  },
  "dependencies": {
    "next": "^15",
    "react": "^19",
    "react-dom": "^19",
    "@prisma/client": "^6",
    "next-auth": "^4",
    "bcryptjs": "^2",
    "zod": "^3",
    "clsx": "^2",
    "tailwind-merge": "^2",
    "date-fns": "^3",
    "concurrently": "^9"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^22",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@types/bcryptjs": "^2",
    "prisma": "^6",
    "tailwindcss": "^4",
    "eslint": "^9",
    "eslint-config-next": "^15"
  },
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

### ws-server/package.json

```json
{
  "name": "ws-server",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "ws": "^8",
    "jsonwebtoken": "^9",
    "@prisma/client": "^6"
  },
  "devDependencies": {
    "@types/ws": "^8",
    "@types/jsonwebtoken": "^9",
    "tsx": "^4",
    "typescript": "^5"
  }
}
```

### next.config.ts

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',        // Оптимизированный билд для деплоя
  poweredByHeader: false,      // Без X-Powered-By
  images: {
    remotePatterns: [],         // Только локальные изображения
  },
  serverExternalPackages: ['bcryptjs'],  // Нативные пакеты
}

export default nextConfig
```

### .env.example

```env
# База данных
DATABASE_URL=postgresql://snt_user:password@localhost:5432/snt_db

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# WebSocket
WS_PORT=3001
WS_INTERNAL_SECRET=generate-with-openssl-rand-base64-32

# Файлы (хранение в PostgreSQL bytea)
MAX_FILE_SIZE=10485760
```

### ecosystem.config.js — pm2

```javascript
module.exports = {
  apps: [
    {
      name: 'snt-app',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/snt-app',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      max_memory_restart: '200M',
      instances: 1,
    },
    {
      name: 'snt-ws',
      script: 'ws-server/dist/index.js',
      cwd: '/var/www/snt-app',
      env: {
        NODE_ENV: 'production',
        WS_PORT: 3001,
      },
      max_memory_restart: '100M',
      instances: 1,
    },
  ],
}
```

### docker-compose.yml — для локальной разработки

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: snt_user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: snt_db
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

### nginx — пример конфигурации

```nginx
server {
    listen 80;
    server_name snt.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    client_max_body_size 10M;
}