# Руководство разработчика: Продакшен-развёртывание (Docker Compose prod)

## Обзор

Задача **B-034** выбрала и доработала подход A — **Docker Compose prod** — для продакшен-развёртывания приложения СНТ «Берёзки-НТ» на VPS. Полная пошаговая эксплуатационная инструкция находится в [`docs/docs/deployment/docker-prod-ops.md`](../docs/deployment/docker-prod-ops.md) — здесь дан краткий обзор и ключевые понятия.

> **WebSocket не входит в состав B-034** — реальный WS-процесс и `NEXT_PUBLIC_WS_URL` вынесены на отдельный этап.

Подробное сравнение подходов (A vs B) — [`docs/plans/deployment-approach-comparison.md`](../plans/deployment-approach-comparison.md).

---

## Стек (Docker Compose prod)

`docker-compose.prod.yml` поднимает стек:

| Сервис | Назначение |
|--------|------------|
| `db` | PostgreSQL 15 (`postgres:15-alpine`), named volume `postgres_data`, healthcheck |
| `app` | Next.js (standalone, `Dockerfile`), healthcheck по `/api/health`, миграции `prisma migrate deploy` при старте |
| `nginx` | Reverse-proxy HTTP→HTTPS, сертификаты из `./ssl/live/${DOMAIN}/`, webroot для ACME |
| `certbot` | Let's Encrypt выпуск/продление сертификатов |
| `backup` | `pg_dump` -> gzip в `./backups/`, ротация старше 7 дней |

Отличия от dev-окружения: прод использует standalone-сборку и `prisma migrate deploy` вместо `db:push`.

---

## Запуск

Первичный запуск стека (см. раздел 3 ops-инструкции):

```bash
cd /path/to/snt-app
docker compose -f docker-compose.prod.yml up -d --build
```

Затем выпустить сертификат (раздел 4.2):

```bash
docker compose -f docker-compose.prod.yml run --rm certbot
docker compose -f docker-compose.prod.yml exec -T nginx nginx -s reload
```

Полные шаги — в [`docker-prod-ops.md`](../docs/deployment/docker-prod-ops.md#3-первичный-запуск) и [`#4-ssl--lets-encrypt-t4`](../docs/deployment/docker-prod-ops.md#4-ssl--lets-encrypt-t4).

---

## Переменные окружения (.env)

Создать `.env` из [`.env.example`](../../.env.example) на сервере и заполнить:

| Переменная | Назначение |
|------------|------------|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Учётка и имя БД |
| `DOMAIN` | Домен (для nginx-маунта, certbot, `NEXTAUTH_URL`) |
| `ACME_EMAIL` | Email для Let's Encrypt (выпуск сертификатов) |
| `NEXTAUTH_URL` | Публичный HTTPS-адрес приложения |
| `NEXTAUTH_SECRET` | Секрет сессий (`openssl rand -base64 32`) |
| `WS_INTERNAL_SECRET` | Внутренний секрет WS (резерв) |
| `NEXT_PUBLIC_*` | Встраиваются в bundle на этапе `next build` — изменение требует пересборки образа (R5) |
| `MAX_FILE_SIZE` | Лимит загружаемых файлов |

> ⚠️ `NEXT_PUBLIC_*` встраиваются в bundle на этапе `next build`, поэтому их изменение требует пересборки: `docker compose -f docker-compose.prod.yml up -d --build app`.

---

## Выпуск сертификатов

Автопродление — хост-level cron каждый день в 03:00 (см. раздел 5 ops-инструкции):

```bash
crontab -e
# 0 3 * * * cd /path/to/snt-app && docker compose -f docker-compose.prod.yml run --rm certbot ... && docker compose -f docker-compose.prod.yml exec -T nginx nginx -s reload
```

Для локальной проверки HTTPS без реального домена — self-signed сертификаты в `./ssl/live/${DOMAIN}/` (раздел 6 ops-инструкции).

---

## Бэкапы и восстановление

- **Бэкап:** хост-level cron ежедневно в 02:00 (`docker compose -f docker-compose.prod.yml run --rm backup`) → `./backups/backup_YYYYMMDD_HHMMSS.sql.gz`, ротация старше 7 дней.
- **Ручной запуск:**
  ```bash
  cd /path/to/snt-app && docker compose -f docker-compose.prod.yml run --rm backup
  ```
- **Восстановление** (раздел 7.3):
  ```bash
  gunzip -c backups/backup_20260807_020000.sql.gz | docker compose -f docker-compose.prod.yml exec -T db \
    psql -U snt_user -d snt_db
  ```

---

## Связанные артефакты

| Тип | ID | Ссылка |
|-----|-----|--------|
| Оps-инструкция | B-034 | [docker-prod-ops.md](../docs/deployment/docker-prod-ops.md) |
| План | B-034 | [B-034-docker-prod-plan.md](../plans/B-034-docker-prod-plan.md) |
| Сравнение | B-034 | [deployment-approach-comparison.md](../plans/deployment-approach-comparison.md) |
| Code Review | B-034 | [B-034-review.md](../reviews/B-034-review.md) |
| QA-отчёт | B-034 | [B-034-qa-report.md](../tests/B-034-qa-report.md) |
| Compose | — | [`docker-compose.prod.yml`](../../docker-compose.prod.yml) |
| Dockerfile | — | [`Dockerfile`](../../Dockerfile) |
