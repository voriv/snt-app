# Структура проекта СНТ-приложения — Сводный план

## Документы плана

| Файл | Содержание |
|------|-----------|
| [01-architecture.md](01-architecture.md) | Архитектурные решения, диаграмма, потребление ресурсов, поток данных |
| [02-directories.md](02-directories.md) | Полная структура директорий: prisma, ws-server, src/app, src/components |
| [03-components-lib.md](03-components-lib.md) | Компоненты React, утилиты, REST API Routes, типы, хуки |
| [04-database-core.md](04-database-core.md) | Схема БД: User, Member, Plot, PlotMembership, Charge, Payment |
| [05-database-social.md](05-database-social.md) | Схема БД: Document, Announcement, Vote, Forum, Chat, Notification |
| [06-websocket-config.md](06-websocket-config.md) | WebSocket-сервер, протокол, package.json, next.config, .env, pm2, nginx |

## Ключевые решения

1. **Next.js standalone** — один процесс для SSR + REST API (API Routes)
2. **Отдельный WS-сервер** — чаты и уведомления на порту 3001
3. **PostgreSQL + Prisma** — 19 моделей, полнотекстовый поиск, jsonb, bytea
4. **Route Groups** — `(public)` без авторизации, `(auth)` для садоводов, `(admin)` для администрации
5. **REST API** — CRUD операции через API Routes
6. **pnpm workspace** — ws-server как отдельный пакет в монорепо

## Следующие шаги

1. Создать проект: `pnpm create next-app`
2. Настроить Prisma и создать схему
3. Реализовать аутентификацию (NextAuth.js)
4. Создать базовые UI-компоненты
5. Реализовать CRUD для участков и садоводов
6. Реализовать бухгалтерию (начисления, платежи)
7. Реализовать документы и объявления
8. Реализовать голосования
9. Реализовать форум и чаты (WS-сервер)
10. Реализовать уведомления
11. Настроить деплой (nginx + pm2)