# Развёртывание на 2 VPS (Ruvds) с минимальной стоимостью

> Двухсерверная архитектура: **VPS-A** — приложение (Next.js, nginx, certbot), **VPS-DB** — база данных (PostgreSQL) + бэкапы в Object Storage. Сборка образа вынесена на CI, что снижает требования к VPS-A.
>
> 📌 Регистрация домена и настройка DNS — в [руководстве по домену](domain-registration-guide.md).

## 1. Архитектура

```
CI (сборка образа)  ──push image──►  Registry (Docker Hub)
                                              │  pull
                                              ▼
VPS-A (1 vCPU / 1 ГБ / 20 ГБ)           nginx ──► app:3000
                                              │  DATABASE_URL (приватная сеть)
VPS-DB (1 vCPU / 1 ГБ / 15 ГБ)   ◄─────────┘
   PostgreSQL 5432 ─────────► backup ──► Object Storage (S3)
```

Сервисы:

| VPS | Файл | Сервисы |
|-----|------|---------|
| VPS-A | [`docker-compose.prod.yml`](../../../docker-compose.prod.yml) | `app`, `nginx`, `certbot` |
| VPS-DB | [`docker-compose.db.yml`](../../../docker-compose.db.yml) | `db`, `backup` |

Образ приложения собирается в CI (см. [`ci.yml`](../../../.github/workflows/ci.yml)), пушится в Docker Hub как `snt-app/snt:<sha|latest>`. На VPS-A образ только **тянется** из registry — `next build` на сервере не выполняется.

---

## 2. Переменные окружения

Шаблон — [`.env.prod.example`](../../../.env.prod.example). Заполните и положите в `.env`:

### На VPS-A (`.env`)
```bash
DATABASE_URL="postgresql://snt_user:<PASS>@<PRIVATE_IP_VPS_DB>:5432/snt_db?schema=public"
NEXTAUTH_URL="https://snt-berezki-nt.ru"
NEXTAUTH_SECRET="<openssl rand -base64 32>"
WS_INTERNAL_SECRET="<openssl rand -base64 32>"
DOMAIN="snt-berezki-nt.ru"
ACME_EMAIL="admin@snt-berezki-nt.ru"
MAX_FILE_SIZE=10485760
IMAGE="snt-app/snt:<tag>"
```

### На VPS-DB (`.env`)
```bash
POSTGRES_USER="snt_user"
POSTGRES_PASSWORD="<STRONG_PASSWORD>"
POSTGRES_DB="snt_db"
DB_BIND_ADDRESS="<PRIVATE_IP_VPS_DB>"

S3_ENDPOINT="https://..."
S3_ACCESS_KEY="..."
S3_SECRET_KEY="..."
S3_BUCKET="snt-backups"
S3_PREFIX="snt-prod"
S3_REGION="us-east-1"
KEEP_LOCAL_DAYS="0"
S3_MAX_DAYS="30"
```

> ⚠️ `NEXTAUTH_SECRET`, `WS_INTERNAL_SECRET` и пароль БД генерируйте случайно и держите только в `.env` (не в git). Пароль в `DATABASE_URL` на VPS-A и `POSTGRES_PASSWORD` на VPS-DB должны совпадать.

---

## 3. Первичный запуск

### 3.1. VPS-DB (база)

```bash
cd /opt/snt-db
# создать .env (см. выше)
docker compose -f docker-compose.db.yml up -d
# Проверка готовности БД (с VPS-A):
pg_isready -h <PRIVATE_IP_VPS_DB> -p 5432 -U snt_user -d snt_db
```

Postgres слушает только на `DB_BIND_ADDRESS` (приватный IP). Публичный порт 5432 закрыт.

### 3.2. VPS-A (приложение)

```bash
cd /opt/snt-app
# создать .env (см. выше)
# Изменить server_name на реальный домен в nginx/default.conf (два места: HTTP и HTTPS)
docker compose -f docker-compose.prod.yml up -d
# Если образ приватный:
docker login           # один раз
docker compose -f docker-compose.prod.yml pull app

# Применить миграции (на удалённую БД)
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
# Сид (роли, страницы, админ)
docker compose -f docker-compose.prod.yml exec app npx prisma db seed

# Проверка health
curl http://localhost:3000/api/health
```

### 3.3. SSL (Let's Encrypt)

```bash
docker compose -f docker-compose.prod.yml run --rm certbot
docker compose exec -T nginx nginx -t && docker compose exec -T nginx nginx -s reload
curl -I https://snt-berezki-nt.ru/   # → 200
curl -I http://snt-berezki-nt.ru/    # → 301
```

---

## 4. Бэкапы (cron на VPS-DB)

```bash
crontab -e
# Ежедневно в 02:00 — бэкап в Object Storage
0 2 * * * cd /opt/snt-db && docker compose -f docker-compose.db.yml run --rm backup 2>&1 | tee -a /var/log/db-backup.log
```

Скрипт: [`scripts/backup-to-object-storage.sh`](../../../scripts/backup-to-object-storage.sh).

### Восстановление из бэкапа

```bash
# Скачать из Object Storage в файл, затем (на VPS-DB):
gunzip -c backup_XXXXXXXX_XXXXXX.sql.gz | docker compose -f docker-compose.db.yml exec -T db psql -U snt_user -d snt_db
```

---

## 5. Автопродление сертификатов (cron на VPS-A)

```bash
0 3 * * * cd /opt/snt-app && docker compose -f docker-compose.prod.yml run --rm certbot 2>&1 | tee -a /var/log/certbot-renew.log && docker compose -f docker-compose.prod.yml exec -T nginx nginx -s reload || true
```

---

## 6. Обновление / откат

**Обновление:**
1. CI собирает новый образ `snt-app/snt:<new-tag>` и пушит в registry.
2. На VPS-A: `IMAGE="snt-app/snt:<new-tag>" docker compose -f docker-compose.prod.yml up -d app`.
3. Проверить: `curl http://localhost:3000/api/health`.

**Откат приложения:** вернуть прежний тег `IMAGE` → `up -d app`.

**Откат БД:** скачать последний бэкап из Object Storage → восстановить (раздел 4).

---

## 7. Экономия ресурсов

- `docker image prune -af` по cron (очистка старых образов).
- Бэкапы не хранятся локально (`KEEP_LOCAL_DAYS=0`) — только в Object Storage.
- Ротация старых бэкапов в S3 через `S3_MAX_DAYS`.

---

## 8. Ограничения

- **Сборка только на CI** — на VPS-A (1 ГБ ОЗУ) `next build` не выполняется.
- `NEXT_PUBLIC_*` встраиваются на этапе CI-сборки; их изменение требует пересборки образа (новый тег).
- WebSocket вне скоупа первого этапа — `/ws` проксирование в [`nginx/default.conf`](../../../nginx/default.conf) закомментировано.
- Связь VPS-A↔VPS-DB только по приватной сети — при её недоступности приложение не работает.
- Известная проблема миграции `remove_members_and_payments` (не применяется `prisma migrate deploy`) — см. [`docker-prod-ops.md`](docker-prod-ops.md).
