# Анализ технологического стека для СНТ-приложения

## Исходные данные

| Параметр | Значение |
|----------|---------|
| Назначение | Автоматизация СНТ |
| Функционал | Учёт участков/садоводов, публикация документов, бухгалтерия, голосования, форумы/чаты |
| Опыт команды | C++, JS/TS, PostgreSQL |
| Инфраструктура | Слабый VPS |
| Бэкап | Регулярный — критичен |
| RAM | 500 MB — 1 GB |
| Диск | 10 GB |

---

## Вариант A: TypeScript + Fastify + PostgreSQL + Prisma

### Стек

```
Frontend:  Next.js (static export) + TailwindCSS
Backend:   Node.js + Fastify
DB:        PostgreSQL + Prisma ORM
Runtime:   pnpm
```

### Плюсы

1. Один язык — TypeScript на фронтенде и бэкенде, общий код типов и валидации
2. Опыт команды — JS/TS и PostgreSQL уже знакомы
3. Prisma ORM — типобезопасные запросы, автогенерация миграций, Prisma Studio
4. Fastify — самый быстрый Node.js-фреймворк, плагинная архитектура
5. Экосистема npm — JWT, WebSocket, email, PDF/Excel
6. Бэкап — pg_dump по cron, инкрементальные через WAL-archiving
7. Масштабируемость — PostgreSQL, полнотекстовый поиск
8. WebSocket из коробки — @fastify/websocket или socket.io
9. Деплой — pm2 + nginx
10. Разделение фронт/бэк — static через nginx, API на Fastify

### Минусы

1. Требования к RAM — Node.js ~60-80 MB + PostgreSQL ~150-250 MB = 210-330 MB, при 500 MB впритык
2. Требования к диску — runtime ~400-650 MB без данных
3. Холодный старт PostgreSQL ~2-5 сек
4. Однопоточность Node.js — для СНТ не проблема
5. Версионирование npm-зависимостей — нужен lockfile

### Требования к ресурсам

| Ресурс | Минимум | Рекомендация |
|--------|---------|-------------|
| RAM | 512 MB — впритык | **1 GB** — комфортно |
| Диск runtime | ~400-650 MB | ~1 GB с запасом |
| Диск данные | Зависит от данных | 2-5 GB |
| CPU | 1 ядро | 2 ядра для PostgreSQL |

### Бэкап

pg_dump по cron + загрузка в S3 или локальное хранилище. Скрипт на 10 строк. Инкрементальные бэкапы через WAL-archiving при необходимости.

### Архитектура

```mermaid
graph TB
    subgraph Клиент
        FE[Next.js Static Build]
    end
    subgraph VPS - 1GB RAM / 10GB Disk
        Nginx[Nginx - static + reverse proxy]
        API[Fastify API - 60-80MB]
        WS[WebSocket - чаты]
        PG[(PostgreSQL - 150-250MB)]
        PM2[pm2 - process manager]
    end
    FE -->|static files| Nginx
    Nginx -->|/api/*| API
    Nginx -->|/ws| WS
    API --> PG
    WS --> PG
    PM2 --> API