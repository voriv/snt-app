# Архитектура системы

> 📌 Контекстный сегмент. Полная версия: [`ARCHITECTURE.md`](../architecture/ARCHITECTURE.md)

---

## Технологический стек

| Компонент | Технология | Обоснование |
|-----------|------------|-------------|
| Frontend + Backend | Next.js 15 (standalone) | SSR + REST API (API Routes) |
| База данных | PostgreSQL 16 | Полнотекстовый поиск, jsonb |
| ORM | Prisma 6 | Типобезопасность, миграции |
| UI | TailwindCSS 4 | Быстрый прототипинг |
| WebSocket | ws (Node.js) | Чаты и уведомления |
| Аутентификация | NextAuth.js v5 (JWT) | Email/password + bcrypt |
| Process Manager | PM2 | Управление процессами |
| Reverse Proxy | Nginx | HTTPS, кэширование |

---

## Архитектурная диаграмма

```
Браузер → Nginx (:443) ─┬→ Next.js (:3000) → PostgreSQL (:5432)
                        └→ WS Server (:3001) → PostgreSQL (:5432)

PM2 управляет: snt-app (Next.js) + snt-ws (WebSocket)
```

---

## Структура проекта

```
snt-app/
├── prisma/                    # Схема БД, миграции, сиды
├── src/
│   ├── app/                   # Next.js Pages + API Routes
│   │   ├── (public)/          # Публичные страницы
│   │   ├── (auth)/            # Страницы авторизованных пользователей
│   │   ├── (admin)/           # Страницы администратора
│   │   └── api/               # REST API endpoints
│   ├── components/
│   │   ├── ui/                # 18+ UI компонентов
│   │   ├── layout/            # Header, Sidebar, Footer
│   │   ├── forms/             # 8+ форм
│   │   ├── features/          # 11+ компонент
│   │   └── providers/         # Session, Theme, WS providers
│   ├── lib/                   # prisma.ts, auth.ts, validators.ts, utils.ts, constants.ts
│   ├── types/                 # TypeScript типы по доменам
│   └── hooks/                 # useSession, useWebSocket, usePagination, useToast
├── ws-server/                 # Отдельный WebSocket-сервер
│   └── src/                   # index.ts, connectionManager.ts, handlers/, utils/
└── docs/                      # Документация
```

---

## Конфигурация

### next.config.ts
- `output: 'standalone'` — оптимизированный билд
- `poweredByHeader: false`
- `serverExternalPackages: ['bcryptjs']`

### Порты
| Сервис | Порт |
|--------|------|
| Nginx | 80/443 |
| Next.js | 3000 |
| WS Server | 3001 |
| PostgreSQL | 5432 |

### Переменные окружения (.env)
```env
DATABASE_URL=postgresql://snt_user:password@localhost:5432/snt_db
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<openssl-rand-base64-32>
WS_PORT=3001
WS_INTERNAL_SECRET=<openssl-rand-base64-32>
MAX_FILE_SIZE=10485760
```

---

## Ресурсы VPS (1 GB RAM / 10 GB диск)

| Компонент | RAM (min) | RAM (max) | Диск |
|-----------|-----------|-----------|------|
| Next.js | 80 MB | 150 MB | 400 MB |
| WS Server | 30 MB | 50 MB | 20 MB |
| PostgreSQL | 150 MB | 250 MB | 2-5 GB |
| Nginx | 5 MB | 10 MB | 5 MB |
| PM2 | 20 MB | 30 MB | 5 MB |
| OS | 100 MB | 150 MB | 1-2 GB |
| **Итого** | **385 MB** | **640 MB** | **3.5-8 GB** |

---

## Развёртывание

```bash
# Локальная разработка
docker-compose up -d              # PostgreSQL
pnpm dev                          # Next.js
pnpm dev:ws                       # WebSocket

# Production
pnpm install --frozen-lockfile
pnpm db:generate && pnpm db:migrate && pnpm db:seed
pnpm build && pnpm build:ws
pm2 start ecosystem.config.js
```

---

📄 Полная архитектура: [`ARCHITECTURE.md`](../architecture/ARCHITECTURE.md)
📄 Структура директорий: [`02-directories.md`](../architecture/structure/02-directories.md)