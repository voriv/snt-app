# Вариант B: TypeScript + Fastify + SQLite + Prisma

## Стек

```
Frontend:  Next.js (static export) + TailwindCSS
Backend:   Node.js + Fastify
DB:        SQLite + Prisma ORM
Runtime:   pnpm
```

## Плюсы

1. Все плюсы Варианта A, плюс:
2. Минимальное потребление RAM — SQLite встроенная, нет отдельного процесса, ~0 MB дополнительно
3. Минимальное потребление диска — один файл БД, нет отдельного движка
4. Простой бэкап — копирование файла или sqlite3 db .backup
5. Простой деплой — один процесс Node.js, нет нужды настраивать PostgreSQL
6. Дешёвый VPS — достаточно 200-300 руб/мес за 512 MB RAM
7. Миграция на PostgreSQL — Prisma позволяет переключиться заменой провайдера в schema.prisma

## Минусы

1. Ограничение конкурентных записей — SQLite блокирует БД при записи, при 10+ одновременных записях задержки. Для СНТ редко проблема
2. Нет полнотекстового поиска — FTS5 ограничен vs tsvector в PostgreSQL
3. Нет JSON-операторов — нет мощных jsonb запросов как в PostgreSQL
4. Ограничения SQL — нет ALTER TABLE для некоторых операций, сложнее менять схему
5. Нет репликации — нельзя сделать read-replica. Для СНТ не актуально
6. Резервное копирование — нужен WAL-режим и PRAGMA wal_checkpoint перед бэкапом
7. Размер БД — ограничен диском 10 GB

## Требования к ресурсам

| Ресурс | Минимум | Рекомендация |
|--------|---------|-------------|
| RAM | **256 MB** — возможно | **512 MB** — комфортно |
| Диск runtime | ~200-300 MB | ~500 MB с запасом |
| Диск данные | Зависит от данных | 1-3 GB |
| CPU | 1 ядро | 1 ядро |

## Бэкап

Копирование файла БД с предварительным WAL-чекпойнтом:
```bash
sqlite3 /data/db.sqlite "PRAGMA wal_checkpoint;"
cp /data/db.sqlite /backup/db-$(date +%Y%m%d).sqlite
```
Или через .backup — создаёт целостную копию без блокировки:
```bash
sqlite3 /data/db.sqlite ".backup /backup/db-$(date +%Y%m%d).sqlite"
```

## Архитектура

```mermaid
graph TB
    subgraph Клиент
        FE[Next.js Static Build]
    end
    subgraph VPS - 512MB RAM / 10GB Disk
        Nginx[Nginx - static + reverse proxy]
        API[Fastify API - 60-80MB]
        WS[WebSocket - чаты]
        DB[(SQLite - файл на диске)]
        PM2[pm2 - process manager]
    end
    FE -->|static files| Nginx
    Nginx -->|/api/*| API
    Nginx -->|/ws| WS
    API --> DB
    WS --> DB
    PM2 --> API