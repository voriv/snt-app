# Тестовое развёртывание без домена (Ruvds, self-signed HTTPS)

Запуск приложения СНТ «Берёзки-НТ» на VPS Ruvds **без регистрации домена** для проверки и ручного тестирования. HTTPS обеспечивается **self-signed сертификатом** (браузер покажет предупреждение — это ожидаемо). Let's Encrypt / certbot **не используются**.

> Связь с общей документацией: [docker-prod-ops.md](../../docs/docs/deployment/docker-prod-ops.md) (§6 — self-signed), [docker-prod-2vps.md](../../docs/docs/deployment/docker-prod-2vps.md), [domain-registration-guide.md](../../docs/docs/deployment/domain-registration-guide.md).

---

## Архитектура (один VPS)

```mermaid
flowchart LR
    subgraph VPS[VPS Ruvds - один сервер]
        N[Nginx :80/:443<br/>server_name _]
        A[app Next.js :3000<br/>127.0.0.1]
        DB[PostgreSQL :5432<br/>127.0.0.1]
        N -->|proxy_pass| A
        A -->|DATABASE_URL| DB
        C[./ssl/live/<DOMAIN><br/>self-signed] -.->|mount /etc/nginx/ssl| N
    end
    B[Браузер] -->|https://PUBLIC_IP| N
```

Стек собирается из существующих compose-файлов проекта по отдельности:
- [`docker-compose.db.yml`](../../docker-compose.db.yml) — PostgreSQL;
- [`docker-compose.prod.yml`](../../docker-compose.prod.yml) — app + nginx (**без сервиса certbot**).

---

## Файлы набора

| Файл | Назначение |
|---|---|
| [`deploy.sh`](deploy.sh) | Точка входа: `full / start / stop / check / cleanup` |
| [`00-check-prereq.sh`](00-check-prereq.sh) | Проверка предусловий (docker, openssl, файлы проекта) |
| [`01-prepare-env.sh`](01-prepare-env.sh) | Интерактивное создание `.env` (IP + секреты) |
| [`02-generate-certs.sh`](02-generate-certs.sh) | Self-signed сертификат с SAN (IP, localhost) |
| [`03-open-ports.sh`](03-open-ports.sh) | ufw: 22/80/443 |
| [`04-start-db.sh`](04-start-db.sh) | Запуск PostgreSQL + ожидание healthy |
| [`05-start-app.sh`](05-start-app.sh) | Запуск app + nginx (сборка при необходимости) |
| [`06-check.sh`](06-check.sh) | Healthcheck: контейнеры, `/api/health`, TLS, редирект |
| [`07-stop.sh`](07-stop.sh) | Остановка стека (данные сохраняются) |
| [`09-cleanup.sh`](09-cleanup.sh) | Полная очистка (контейнеры + тома БД + `ssl/`) |
| [`lib/common.sh`](lib/common.sh) | Общие функции и пути |
| [`.env.test-deploy.example`](.env.test-deploy.example) | Шаблон конфигурации |

---

## Быстрый старт

```bash
# 1. Проверка предусловий
sudo deploy/test/00-check-prereq.sh

# 2. Подготовка конфига (спросит публичный IP, сгенерирует секреты)
sudo deploy/test/01-prepare-env.sh

# 3. Self-signed сертификаты
sudo deploy/test/02-generate-certs.sh

# 4. Порты (ufw + панель Ruvds)
sudo deploy/test/03-open-ports.sh

# 5. Запуск БД
sudo deploy/test/04-start-db.sh

# 6. Запуск приложения + nginx
sudo deploy/test/05-start-app.sh

# 7. Проверки
sudo deploy/test/06-check.sh -r
```

Либо одной командой — полный цикл:

```bash
sudo deploy/test/deploy.sh full
```

---

## Подготовка .env вручную

Скрипт `01-prepare-env.sh` генерирует `.env` автоматически. Если нужно вручную — скопируйте шаблон и заполните:

```bash
cp deploy/test/.env.test-deploy.example deploy/test/.env
nano deploy/test/.env
```

Ключевые переменные:

| Переменная | Значение / смысл |
|---|---|
| `PUBLIC_IP` | Публичный IP VPS (обязательно) |
| `DOMAIN` | Тестовый «домен» = `PUBLIC_IP` (используется в пути `ssl/live/${DOMAIN}` и CN сертификата) |
| `NEXTAUTH_URL` | **Обязательно** `https://<PUBLIC_IP>` — без расхождения с адресной строкой браузера |
| `DATABASE_URL` | `postgresql://snt_user:...@127.0.0.1:5432/snt_db` |
| `NEXTAUTH_SECRET` / `WS_INTERNAL_SECRET` | `openssl rand -base64 32` |
| `NEXT_PUBLIC_*` | Встраиваются в bundle на этапе `next build` — при изменении нужна пересборка образа |
| `IMAGE` | Образ из registry; если недоступен — соберётся `05-start-app.sh` |

---

## Порядок и что происходит на каждом шаге

### Шаг 1 — `00-check-prereq.sh`
Проверяет права, наличие `docker`/`openssl`/`curl`, Compose v2, файлы проекта, наличие `.env` и занятость портов.

### Шаг 2 — `01-prepare-env.sh`
Запрашивает `PUBLIC_IP` (можно передать аргументом), генерирует пароль БД и секреты NextAuth, создаёт `deploy/test/.env` (права `600`). Повторный запуск — только с `--force`.

### Шаг 3 — `02-generate-certs.sh`
Генерирует сертификат в `ssl/live/${DOMAIN}/`:
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/live/${DOMAIN}/privkey.pem \
  -out    ssl/live/${DOMAIN}/fullchain.pem \
  -subj  "/CN=${DOMAIN}" \
  -addext "subjectAltName=IP:${PUBLIC_IP},DNS:${PUBLIC_IP},DNS:localhost"
```
Каталог `ssl/live/${DOMAIN}` монтируется nginx в `/etc/nginx/ssl` (см. [`docker-compose.prod.yml`](../../docker-compose.prod.yml)). **Сертификаты должны быть созданы ДО запуска nginx.**

> Если OpenSSL старее 1.1.1 (нет `-addext`) — скрипт повторит команду без дополнительной SAN. Для test-режима достаточно.

### Шаг 4 — `03-open-ports.sh`
Открывает 22/80/443 в ufw (если установлен). **Дополнительно** откройте 80/443 в панели Ruvds (Firewall/Security Group).

### Шаг 5 — `04-start-db.sh`
`docker compose -f docker-compose.db.yml up -d db` → ожидает healthcheck → `pg_isready`. БД слушает только `127.0.0.1:5432`.

### Шаг 6 — `05-start-app.sh`
- Проверяет, что сертификаты существуют (иначе выход с ошибкой);
- Собирает образ, если его нет локально (`--build` — принудительно);
- `docker compose -f docker-compose.prod.yml up -d app nginx` — **сервис `certbot` не запускается**;
- Ждёт healthcheck `snt-prod-app`, валидирует `nginx -t`.

### Шаг 7 — `06-check.sh`
Показывает статус контейнеров, `nginx -t`, `/api/health` (локально + через nginx), TLS по публичному IP, редирект HTTP→301. Флаг `-r` добавляет внешнюю проверку.

---

## Проверка в браузере

1. Открыть `https://<PUBLIC_IP>/`.
2. Браузер покажет предупреждение о недоверенном сертификате → «Дополнительно» → «Перейти на сайт».
3. Проверить: главную, навигацию, авторизацию (NextAuth), профиль, документы (загрузка/скачивание), healthcheck `/api/health` → `{"status":"ok","db":"ok",...}`.

> ⚠️ Заходить **только** по `https://<PUBLIC_IP>` — NextAuth привязывает сессии к этому origin.

---

## Остановка и очистка

```bash
# Остановить (данные сохраняются)
sudo deploy/test/07-stop.sh

# Полная очистка (удалит контейнеры, тома БД и ssl/, .env останется)
sudo deploy/test/09-cleanup.sh
# SKIP_SSL=1 sudo deploy/test/09-cleanup.sh  # не удалять сертификаты
```

---

## Отладка

| Симптом | Действие |
|---|---|
| App не healthy | `docker compose -f docker-compose.prod.yml logs -f app` |
| nginx 502 | `docker compose -f docker-compose.prod.yml logs -f nginx`; проверить app на сети `snt-network` |
| TLS «name mismatch» | Перегенерировать сертификат (SAN) и сбросить кэш браузера |
| NextAuth redirect-петля | Сверить `NEXTAUTH_URL` и адрес в браузере (должны совпадать включая схему) |
| Миграции не применились | Лог `prisma:migrate`; известное ограничение проекта по миграциям без timestamp (см. [docker-prod-ops.md](../../docs/docs/deployment/docker-prod-ops.md) §10) |

---

## Ограничения тестового режима

- **Предупреждение браузера** — self-signed; для постоянной работы нужен домен + Let's Encrypt.
- **Один VPS** — проверяется монолитная схема, а не боевое 2-VPS (приватная сеть, бэкапы в Object Storage).
- **Срок сертификата** — 365 дней, продление вручную.
- **`NEXT_PUBLIC_*`** — требуют пересборки образа при изменении.
- **WebSocket** — вне скоупа (см. ограничения B-034).

---

## Переход к боевому запуску

После успешного теста — зарегистрировать домен ([domain-registration-guide.md](../../docs/docs/deployment/domain-registration-guide.md)) и следовать [docker-prod-2vps.md](../../docs/docs/deployment/docker-prod-2vps.md): выставить реальный `DOMAIN`/`NEXTAUTH_URL`, `server_name` в [`nginx/default.conf`](../../nginx/default.conf), выпустить сертификат Let's Encrypt (`docker compose -f docker-compose.prod.yml run --rm certbot`) и включить cron-продление.