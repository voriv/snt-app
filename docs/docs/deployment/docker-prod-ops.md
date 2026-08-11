# Продакшен-развёртывание СНТ «Берёзки-НТ» (Docker Compose prod)

> Инфраструктурная документация по настройке и эксплуатации подхода A — Docker Compose prod (план **B-034**).
> WebSocket **не** входит в скоуп — см. план.
>
> ⚠️ Для **двухсерверной архитектуры** (VPS-A + VPS-DB, сборка на CI, бэкапы в Object Storage) используйте **`docker-prod-2vps.md`** — актуальную инструкцию.

---

## 1. Требования

- Docker Engine c поддержкой Compose v2
- Публичный домен с A-записью на IP сервера
- Порты `80` и `443` открыты наружу
- Для Let's Encrypt нужен реальный домен (staging — см. раздел 6)

---

## 2. Переменные окружения (`.env` на сервере)

Создать файл `.env` из [`.env.example`](../../../.env.example) на сервере и заполнить:

```bash
POSTGRES_USER=snt_user
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=snt_db

NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<openssl rand -base64 32>
WS_INTERNAL_SECRET=<openssl rand -base64 32>

DOMAIN=your-domain.com
ACME_EMAIL=you@example.com

NEXT_PUBLIC_APP_NAME="СНТ Берёнки-НТ"
NEXT_PUBLIC_APP_DESCRIPTION="Управление садоводческим товариществом"
MAX_FILE_SIZE=10485760
```

> ⚠️ `NEXT_PUBLIC_*` встраиваются в bundle на этапе `next build`.
> **Изменение NEXT_PUBLIC_* требует пересборки образа** (R5).

---

## 3. Первичный запуск

```bash
cd /path/to/snt-app

# 1. Собрать и запустить стек (без nginx 443 до получения сертификата)
docker compose -f docker-compose.prod.yml up -d --build

# 2. Проверить, что app и db поднялись
docker compose -f docker-compose.prod.yml ps
curl http://localhost:3000/api/health
```

Миграции применяются автоматически в `CMD` app-контейнера:
`npx prisma migrate deploy && node server.js` (лог содержит `prisma:migrate`).

---

## 4. SSL / Let's Encrypt (T4)

### 4.1 Тома

- `./ssl` → `/etc/nginx/ssl` (nginx, certbot) — сертификаты
- `acme_data` (named volume) → `/var/www/certbot` (nginx + certbot webroot)

### 4.2 Первичный выпуск сертификата

Запустить certbot один раз `run`:

```bash
cd /path/to/snt-app && docker compose -f docker-compose.prod.yml run --rm certbot
```

Для рекурсивной проверки, что выпустилось:

```bash
docker compose -f docker-compose.prod.yml exec -T nginx nginx -t
docker compose -f docker-compose.prod.yml exec -T nginx nginx -s reload
```

Проверка HTTPS:

```bash
curl -kI https://localhost/   # → 200 OK
curl -I  http://localhost/    # → 301 (редирект на HTTPS)
```

---

## 5. Автопродление сертификатов — хост-level cron (T5)

Выбран хост-level cron (надёжнее и проще контейнерного cron-сервиса).

### 5.1 crontab

```bash
crontab -e
```

Добавить строку (замените `/path/to/snt-app` на реальный путь):

```bash
# Ежедневно в 03:00 — продление сертификатов + перезагрузка nginx
0 3 * * * cd /path/to/snt-app && docker compose -f docker-compose.prod.yml run --rm certbot 2>&1 | tee -a /var/log/certbot-renew.log && docker compose -f docker-compose.prod.yml exec -T nginx nginx -s reload || true
```

Логирование продления — `/var/log/certbot-renew.log`.

---

## 6. Self-signed сертификаты (staging, без реального домена)

Для локальной проверки HTTPS-пайплайна можно сгенерировать self-signed сертификаты.
Ключи должны лежать в том же месте, которое nginx монтирует в `/etc/nginx/ssl` —
каталоге `./ssl/live/${DOMAIN}/` (см. `docker-compose.prod.yml` → сервис `nginx`).
Замените `${DOMAIN}` на значение из `.env` (например `localhost`).

```bash
mkdir -p ./ssl/live/${DOMAIN}
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ./ssl/live/${DOMAIN}/privkey.pem \
  -out ./ssl/live/${DOMAIN}/fullchain.pem \
  -subj "/CN=${DOMAIN}"
```

> 💡 `server_name ${DOMAIN};` в [`nginx/default.conf`](../../../nginx/default.conf) — **рекомендация для продакшена** (замена `server_name _;`). Для локальной проверки self-signed подойдёт любой `server_name`, совпадающий с `${DOMAIN}`, указанным в сертификате. В продакшене настоятельно рекомендуется выставить реальный `server_name ${DOMAIN};` в обоих `server`-блоках.

---

## 7. Бэкапы PostgreSQL — postgres-alpine + хост-level cron (T6)

Сервис `backup` использует образ `postgres:15-alpine` (содержит `pg_dump`).
Бэкапы пишутся в `./backups/backup_YYYYMMDD_HHMMSS.sql.gz`, ротация — удаление старше 7 дней.

### 7.1 crontab (хост-level)

```bash
crontab -e
```

Добавить строку:

```bash
# Ежедневно в 02:00 — бэкап БД
0 2 * * * cd /path/to/snt-app && docker compose -f docker-compose.prod.yml run --rm backup 2>&1 | tee -a /var/log/db-backup.log
```

### 7.2 Ручной запуск

```bash
cd /path/to/snt-app && docker compose -f docker-compose.prod.yml run --rm backup
```

### 7.3 Восстановление из бэкапа

```bash
# Скачать/взять нужный файл, например backups/backup_20260807_020000.sql.gz
gunzip -c backups/backup_20260807_020000.sql.gz | docker compose -f docker-compose.prod.yml exec -T db \
  psql -U snt_user -d snt_db
```

---

## 8. Healthcheck

- App: `GET /api/health` — всегда 200, тело `{ status: "ok", db: "ok"|"error", timestamp }`.
- Проверка:

```bash
docker inspect snt-prod-app --format='{{.State.Health.Status}}'   # → healthy
curl http://localhost:3000/api/health
```

---

## 9. Полезные команды

```bash
# Валидация конфигурации compose
docker compose -f docker-compose.prod.yml config

# Пересборка образа после изменения NEXT_PUBLIC_*
docker compose -f docker-compose.prod.yml up -d --build app

# Логи
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f nginx
```

---

## 10. Известные ограничения

- `prisma/migrations/remove_members_and_payments/` и `migration.sql` в корне `prisma/migrations/` не соответствуют формату Prisma (без timestamp) — известная проблема, **не применяются** `prisma migrate deploy` (R6/W1). Требует ручного вмешательства при необходимости.
- Изменение `NEXT_PUBLIC_*` требует пересборки образа (R5).
- WebSocket-процесс и `NEXT_PUBLIC_WS_URL` вне скоупа B-034 (отдельный этап).
