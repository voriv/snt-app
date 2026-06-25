# Архитектура СНТ-приложения

## 1. Общее описание

Система для автоматизации деятельности СНТ с минимизацией требований к ресурсам (1 GB RAM, 10 GB диск).

### Принципы архитектуры

| Принцип | Описание |
|---------|----------|
| **Минимизация ресурсов** | Подписка на 500 MB–1 GB RAM, 10 GB диск |
| **Clean Architecture** | Разделение на презентацию, бизнес-логику, доступ к данным |
| **Типобезопасность** | TypeScript strict mode, Prisma Types |
| **Производительность** | SSR, кэширование, оптимизированные запросы |
| **Масштабируемость** | Возможность горизонтального масштабирования по компонентам |

### Технологический стек

| Компонент | Технология | Обоснование |
|-----------|------------|-------------|
| Frontend + Backend | Next.js 15 (standalone) | SSR + REST API (API Routes) |
| База данных | PostgreSQL 16 | Полнотекстовый поиск, jsonb, надёжность |
| ORM | Prisma 6 | Типобезопасность, миграции |
| UI | TailwindCSS 4 | Быстрый прототипинг, минимальный CSS |
| WebSocket | ws (Node.js) | Чаты и уведомления |
| Рендеринг | pnpm | Экономия диска, быстрый install |
| Process Manager | PM2 | Управление процессами |
| Reverse Proxy | Nginx | HTTPS, кэширование, балансировка |

---

## 2. Архитектурная диаграмма

```mermaid
graph TB
    subgraph "Клиент"
        Browser[Браузер]
    end

    subgraph "VPS - 1 GB RAM / 10 GB Disk"
        direction TB
        
        Nginx[Nginx<br/>Reverse Proxy<br/>~5-10 MB RAM]
        
        subgraph "Main Process (PM2)"
            Next[Next.js Standalone<br/>SSR + API Routes<br/>80-150 MB RAM]
            dir[Next.js Directory<br/>~200-400 MB Disk]
        end
        
        subgraph "WS Process (PM2)"
            WS[WebSocket Server<br/>~30-50 MB RAM]
            wsdir[WS Directory<br/>~10-20 MB Disk]
        end
        
        DB[(PostgreSQL<br/>150-250 MB RAM<br/>1-5 GB Data)]
    end
    
    Browser -->|HTTPS :443| Nginx
    Nginx -->|HTTP :3000| Next
    Nginx -->|WSS :3001| WS
    Next -->|TCP 5432| DB
    WS -->|TCP 5432| DB
    PM2[PM2 Process Manager<br/>~20-30 MB RAM] --> Next
    PM2 --> WS
    
    classDef process fill:#e3f2fd,stroke:#2196f3
    classDef db fill:#c8e6c9,stroke:#4caf50
    classDef infra fill:#fff3e0,stroke:#ff9800
    class Next,WS process
    class DB db
    class Nginx,PM2 infra
```

---

## 3. Детальная архитекра компонентов

### 3.1 Next.js Standalone

**Конфигурация**: `output: 'standalone'` в `next.config.ts`

**Процессы**:
- SSR при запросах статических/динамических страниц
- API Routes для REST API (CRUD операции)

```mermaid
graph LR
    subgraph "Next.js Process"
        SSR[SSR Renderer]
        API[API Routes]
        Prisma[Prisma Client]
    end
    
    Prisma -->|SQL| DB[(PostgreSQL)]
    DB -.->|Data| Prisma
    API --> Prisma
    SSR --> Prisma
```

### 3.2 WebSocket-сервер

**Порт**: 3001

**Назначение**:
- Long-lived WebSocket-соединения для чатов
- Push-уведомления
- Индикаторы набора текста (typing)

```mermaid
graph TB
    subgraph "WS Process"
        Server[ws - HTTP Server]
        CM[ConnectionManager]
        Auth[Auth Middleware]
        
        subgraph "Handlers"
            ChatH[Chat Handler]
            NotifH[Notification Handler]
        end
        
        subgraph "Rooms"
            R1[Chat:general]
            R2[Chat:admin]
            R3[Chat:123-user]
        end
    end
    
    Clients[Клиенты] -->|WSS | Server
    Server --> Auth
    Auth --> CM
    CM --> ChatH
    CM --> NotifH
    ChatH --> R1
    ChatH --> R2
    ChatH --> R3
    
    NotifH -->|Internal API| DB[(PostgreSQL)]
    
    R1 -->|Broadcast| Clients
```

### 3.3 База данных PostgreSQL

**Модели** (19 сущностей):

#### Core (ядро СНТ)

| Модель | Описание | Связи |
|--------|----------|-------|
| `User` | Пользователь системы | 1:1 Member, 1:N Notifications |
| `Member` | Садовод | N:N Plot (через PlotMembership) |
| `Plot` | Садовый участок | N:N Member (через PlotMembership) |
| `PlotMembership` | Долевая собственность | - |

#### Бухгалтерия

| Модель | Описание | Связи |
|--------|----------|-------|
| `Charge` | Начисление | N:1 Plot, 1:N Payment |
| `Payment` | Платёж | N:1 Member, N:1 Charge (опционально) |

#### Публикации

| Модель | Описание | Связи |
|--------|----------|-------|
| `Document` | Документ | N:1 User (author), N:1 File |
| `File` | Файл (binary) | 1:N Document |
| `Announcement` | Объявление | N:1 User (author) |
| `InfoPage` | Статическая страница | - |

#### Голосования

| Модель | Описание | Связи |
|--------|----------|-------|
| `Vote` | Голосование | 1:N VoteOption, 1:N VoteResponse |
| `VoteOption` | Вариант ответа | N:1 Vote |
| `VoteResponse` | Ответ пользователя | N:1 Vote, N:1 Option, N:1 User |

#### Общение

| Модель | Описание | Связи |
|--------|----------|-------|
| `ForumTopic` | Тема форума | 1:N ForumPost |
| `ForumPost` | Сообщение | N:1 Topic, N:1 Author, N:1 ParentReply |
| `Chat` | Чат (приватный/групповой) | 1:N ChatMessage, N:M User |
| `ChatParticipant` | Участник чата | N:1 Chat, N:1 User |
| `ChatMessage` | Сообщение | N:1 Chat, N:1 Sender |
| `Notification` | Уведомление | N:1 User |

#### Информационные страницы

| Модель | Описание | Связи |
|--------|----------|-------|
| `InfoPage` | Статическая страница | - |

#### Индексация (индексы БД)

```sql
-- Частые запросы
CREATE INDEX idx_charges_plot_period ON charges(plot_id, period);
CREATE INDEX idx_charges_status ON charges(status);
CREATE INDEX idx_payments_member ON payments(member_id);
CREATE INDEX idx_payments_charge ON payments(charge_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_chat_messages_chat_time ON chat_messages(chat_id, created_at);
CREATE INDEX idx_forum_posts_topic ON forum_posts(topic_id);
```

---

## 4. Структура проекта

```
snt-app/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── public/
│   └── images/
├── ws-server/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── connectionManager.ts
│       ├── handlers/
│       │   ├── chat.ts
│       │   └── notifications.ts
│       └── utils/
│           └── auth.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── not-found.tsx
│   │   ├── error.tsx
│   │   │
│   │   ├── (public)/
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── info/
│   │   │       ├── page.tsx
│   │   │       └── [slug]/page.tsx
│   │   │
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── plots/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── members/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── documents/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── announcements/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── votes/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── accounting/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── charges/page.tsx
│   │   │   │   └── payments/page.tsx
│   │   │   ├── forum/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── chat/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── notifications/page.tsx
│   │   │   └── profile/
│   │   │       ├── page.tsx
│   │   │       └── settings/page.tsx
│   │   │
│   │   └── (admin)/
│   │       ├── layout.tsx
│   │       └── admin/
│   │           ├── page.tsx
│   │           ├── plots/
│   │           │   ├── page.tsx
│   │           │   ├── new/page.tsx
│   │           │   └── [id]/edit/page.tsx
│   │           ├── members/
│   │           │   ├── page.tsx
│   │           │   ├── new/page.tsx
│   │           │   └── [id]/edit/page.tsx
│   │           ├── documents/
│   │           │   ├── page.tsx
│   │           │   ├── new/page.tsx
│   │           │   └── [id]/edit/page.tsx
│   │           ├── announcements/
│   │           │   ├── page.tsx
│   │           │   ├── new/page.tsx
│   │           │   └── [id]/edit/page.tsx
│   │           ├── votes/
│   │           │   ├── page.tsx
│   │           │   ├── new/page.tsx
│   │           │   └── [id]/edit/page.tsx
│   │           └── accounting/
│   │               ├── page.tsx
│   │               ├── charges/
│   │               │   ├── page.tsx
│   │               │   └── new/page.tsx
│   │               ├── payments/
│   │               │   ├── page.tsx
│   │               │   └── new/page.tsx
│   │               └── reports/page.tsx
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── table.tsx
│   │   │   └── ... (18 компонентов)
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── admin-sidebar.tsx
│   │   │   ├── footer.tsx
│   │   │   └── mobile-nav.tsx
│   │   ├── forms/
│   │   │   ├── login-form.tsx
│   │   │   ├── plot-form.tsx
│   │   │   ├── member-form.tsx
│   │   │   └── ... (8 форм)
│   │   ├── features/
│   │   │   ├── plot-card.tsx
│   │   │   ├── charge-row.tsx
│   │   │   ├── chat-message.tsx
│   │   │   └── ... (11 компонентов)
│   │   └── providers/
│   │       ├── session-provider.tsx
│   │       ├── theme-provider.tsx
│   │       └── ws-provider.tsx
│   │
│   ├── lib/
│   │   ├── prisma.ts           # Singleton
│   │   ├── auth.ts             # NextAuth config
│   │   ├── logger.ts           # Pino logger
│   │   ├── validators.ts       # Zod schemas
│   │   ├── utils.ts            # cn(), formatDate()
│   │   └── constants.ts        # Roles, statuses
│   │
│   ├── types/
│   │   ├── index.ts
│   │   ├── user.ts
│   │   ├── plot.ts
│   │   ├── member.ts
│   │   ├── accounting.ts
│   │   ├── vote.ts
│   │   ├── chat.ts
│   │   └── notification.ts
│   │
│   └── hooks/
│       ├── useSession.ts
│       ├── useWebSocket.ts
│       ├── usePagination.ts
│       └── useToast.ts
├── .env
├── .env.example
├── .gitignore
├── package.json
├── pnpm-lock.yaml
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── docker-compose.yml
├── ecosystem.config.js
└── README.md
```

---

## 5. Конфигурация

### 5.1 next.config.ts

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  images: {
    remotePatterns: [],
  },
  serverExternalPackages: ['bcryptjs'],
}

export default nextConfig
```

### 5.2 .env.example

```env
# База данных
DATABASE_URL=postgresql://snt_user:password@localhost:5432/snt_db

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<openssl-rand-base64-32>

# WebSocket
WS_PORT=3001
WS_INTERNAL_SECRET=<openssl-rand-base64-32>

# Загрузка файлов (хранение в PostgreSQL bytea)
MAX_FILE_SIZE=10485760
```

### 5.3 ecosystem.config.js (PM2)

```javascript
module.exports = {
  apps: [
    {
      name: 'snt-app',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/snt-app',
      max_memory_restart: '200M',
      instances: 1,
    },
    {
      name: 'snt-ws',
      script: 'ws-server/dist/index.js',
      cwd: '/var/www/snt-app',
      max_memory_restart: '100M',
      instances: 1,
    },
  ],
}
```

### 5.4 nginx.conf

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
```

---

## 6. Безопасность

### 6.1 Авторизация

**NextAuth.js** (JWT strategy):

- Email/password через bcrypt (rounds = 12)
- JWT Access Token: 1 час (HS256)
- Refresh Token: 7 дней, хранится в БД для отзыва
- Refresh token rotation при каждом использовании
- RBAC: роли и права определяются в FR-спецификациях доменов

### 6.2 Авторизация WebSocket

**JWT в connectionParams**:

```javascript
const ws = new WebSocket('wss://example.com/ws', {
  headers: {
    Authorization: `Bearer ${token}`
  }
})
```

### 6.3 Валидация

**Zod** для всех входных данных на всех уровнях:

```typescript
// API Router level
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

// Service level — бизнес-валидация
// Repository level — валидация параметров запроса
```

### 6.4 Обработка ошибок

**Единая стратегия обработки ошибок:**

| Уровень | Типы ошибок | Формат ответа |
|---------|-------------|---------------|
| API Router | ValidationError, UnauthorizedError | `{ error: { code, message } }` |
| Service | DomainError (ValidationError, NotFoundError, ConflictError, BusinessRuleError) | Throw typed error |
| Repository | DatabaseError | Translate to domain error |

**Запрещено:** использование generic `Error`, игнорирование ошибок, `catch (any)`

### 6.5 Защита от XSS/Injection

- Prisma ORM (parameterized queries)
- React (escaping by default)
- Sanitize HTML при загрузке документов

---

## 7. Производительность

### 7.1 Оптимизация ресурсов

| Компонент | RAM (min) | RAM (max) | Диск |
|-----------|-----------|-----------|------|
| Next.js | 80 MB | 150 MB | 400 MB |
| WS Server | 30 MB | 50 MB | 20 MB |
| PostgreSQL | 150 MB | 250 MB | 2-5 GB |
| Nginx | 5 MB | 10 MB | 5 MB |
| PM2 | 20 MB | 30 MB | 5 MB |
| OS | 100 MB | 150 MB | 1-2 GB |
| **Итого** | **385 MB** | **640 MB** | **3.5-8 GB** |

### 7.2 Стратегии кэширования

| Уровень | Метод | TTL |
|---------|-------|-----|
| Static assets | HTTP cache (nginx) | 1 год |
| API responses | Next.js `revalidate` | 60 сек |
| SSR pages | ISR (`getStaticProps`) | 300 сек |
| Database | PostgreSQL buffer pool | - |

### 7.3 Оптимизация базы данных

- Индексы на часто запрашиваемых полях
- Партиционирование `charges` по `period` (при >100K записей)
- Полнотекстовый поиск через `tsvector`

---

## 8. Бэкап

### 8.1 PostgreSQL

**pg_dump по cron**:

```bash
0 2 * * * pg_dump -U snt_user snt_db | gzip > /backup/db-$(date +\%Y\%m\%d).sql.gz
```

**Retention**: 7 дней, затем удаление старых

### 8.2 Файлы

Файлы хранятся в PostgreSQL (bytea), бэкап осуществляется вместе с базой данных (см. 8.1).

---

## 9. Развёртывание

### 9.1 Локальная разработка

```bash
# Docker для PostgreSQL
docker-compose up -d

# Frontend + Backend
pnpm dev

# WebSocket (в другом терминале)
pnpm dev:ws
```

### 9.2 Production

```bash
# Cloning
git clone <repo> /var/www/snt-app
cd /var/www/snt-app

# Dependencies
pnpm install --frozen-lockfile

# Database
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# Build
pnpm build
pnpm build:ws

# Start PM2
pm2 start ecosystem.config.js

# Nginx
systemctl restart nginx
```

---

## 10. Приложения

### A. Prisma Schema

> 📄 Полный Prisma Schema вынесен в отдельный файл для уменьшения дублирования контекста.
> См. [`prisma/schema.prisma`](../../prisma/schema.prisma) — актуальная версия схемы.
>
> Детальное описание моделей: [`04-database-core.md`](structure/04-database-core.md), [`05-database-social.md`](structure/05-database-social.md)

### B. WebSocket Protocol

> 📄 См. детальное описание протокола: [`06-websocket-config.md`](structure/06-websocket-config.md:47)
>
> | От клиента | От сервера |
> |------------|-----------|
> | `chat.join` / `chat.leave` / `chat.message` / `chat.typing` | `chat.message` / `chat.typing` / `notification` |

### C. Обработка ошибок

**Единая стратегия обработки ошибок по уровням:**

| Уровень | Типы ошибок | Формат ответа |
|---------|-------------|---------------|
| API Router | ValidationError, UnauthorizedError | `{ error: { code, message } }` |
| Service | DomainError (ValidationError, NotFoundError, ConflictError, BusinessRuleError) | Throw typed error |
| Repository | DatabaseError | Translate to domain error |

**Запрещено:** использование generic `Error`, игнорирование ошибок, `catch (any)`

### D. WebSocket Client

Клиентская часть WebSocket-соединения реализуется через React hooks:

- `useWebSocket` — подключение, переподключение, отправка сообщений
- `useChat` — подключение к конкретному чату, получение сообщений
- `useNotifications` — подписка на уведомления
- Обработка разрывов соединения с экспоненциальной задержкой (exponential backoff)

---

## 11. Ссылки на детальные планы

| Документ | Путь |
|----------|------|
| Архитектура | [`plans/structure/01-architecture.md`](plans/structure/01-architecture.md) |
| Директории | [`plans/structure/02-directories.md`](plans/structure/02-directories.md) |
| Компоненты | [`plans/structure/03-components-lib.md`](plans/structure/03-components-lib.md) |
| БД Core | [`plans/structure/04-database-core.md`](plans/structure/04-database-core.md) |
| БД Social | [`plans/structure/05-database-social.md`](plans/structure/05-database-social.md) |
| WS + Config | [`plans/structure/06-websocket-config.md`](plans/structure/06-websocket-config.md) |
