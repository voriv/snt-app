# Руководство разработчика: CI/CD пайплайн

## Обзор

Данное руководство описывает CI/CD-пайплайн проекта СНТ «Берёзки-НТ», построенный на GitHub Actions. Формализованные требования к пайплайну зафиксированы в требовании [REQ-INFRA-CICD-001](../requirements/REQ-INFRA-CICD-001.md) (задача B-013, эпик INFRA).

Пайплайн автоматизирует проверки качества кода (lint, type-check, unit/integration/component/E2E-тесты) и сборку Docker-образа при пуше в `main`, а также запускает проверки при PR в `main` и пуше в `develop`. Цель — не допустить попадания сломанного кода в основную ветку и дать разработчикам быструю обратную связь.

> **Область действия (Scope-02 / EC-01a):** Деплой на сервер НЕ входит в CI-пайплайн. Он выполняется отдельным workflow [`deploy-ssh.yml`](../../.github/workflows/deploy-ssh.yml).

---

## 1. Архитектура пайплайна

Пайплайн описан в двух workflow-файлах:

| Файл | Назначение |
|------|------------|
| [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) | CI/CD Pipeline — проверки качества и сборка Docker-образа |
| [`.github/workflows/deploy-ssh.yml`](../../.github/workflows/deploy-ssh.yml) | Deploy via SSH — развёртывание на сервер |

### 1.1. CI/CD Pipeline (ci.yml)

Workflow [`ci.yml`](../../.github/workflows/ci.yml) состоит из 6 джоб:

```
push to main/develop, PR to main
        │
        ├────── lint ──────────────────────────────┐
        ├────── unit-tests ────────────────────────┤
        ├────── integration-tests ─────────────────┤
        └────── component-tests ───────────────────┤
                                                    │
                                                    ▼
                                         (all must pass)
                                                    │
                    ┌───────────────────────────────┤
                    ▼                               │
    [push main only] e2e-tests                     │
                    │                               │
                    ▼                               │
    [push main only] build-docker ◄───────────────┤
```

- **`lint`** — ESLint (`npm run lint`) и проверка типов (`npm run type-check`).
- **`unit-tests`** — юнит-тесты Vitest (`npm run test:unit`) после генерации Prisma Client.
- **`integration-tests`** — интеграционные тесты (`npm run test:integration`) с сервис-базой PostgreSQL.
- **`component-tests`** — компонентные тесты React (`npm run test:components`).
- **`e2e-tests`** — Playwright end-to-end тесты, выполняются **только при пуше в `main`**.
- **`build-docker`** — сборка и публикация Docker-образа, **только при пуше в `main`**, после всех тестов (`needs: [...]`).

Четыре независимые джобы (`lint`, `unit-tests`, `integration-tests`, `component-tests`) выполняются параллельно (NFR-02). Джобы `e2e-tests` и `build-docker` зависят от их успеха.

### 1.2. Триггеры

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  workflow_dispatch:   # ручной запуск
```

| Триггер | Какие этапы выполняются |
|---------|--------------------------|
| PR в `main` | lint, unit-tests, integration-tests, component-tests |
| Пуш в `develop` | lint, unit-tests, integration-tests, component-tests |
| Пуш в `main` | всё (включая E2E и Docker-сборку) |

E2E и Docker-сборка ограничены условием `if: github.event_name == 'push' && github.ref == 'refs/heads/main'`.

---

## 2. Переменные окружения и версии

На уровне workflow заданы `env`:

| Переменная | Значение | Назначение |
|------------|----------|------------|
| `NODE_VERSION` | `24` | Версия Node.js для всех джоб |
| `POSTGRES_VERSION` | `15` | Версия сервис-базы PostgreSQL |
| `DOCKER_USERNAME` / `DOCKER_PASSWORD` | из GitHub Secrets | Для входа в Docker Hub и публикации образа |

Секреты (`DOCKER_USERNAME`, `DOCKER_PASSWORD`, `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `SSH_PORT`) хранятся в **GitHub Secrets** и не должны попадать в логи (NFR-04, BR-08).

Параметры сервис-базы PostgreSQL для интеграционных и E2E тестов:

```
POSTGRES_USER=test
POSTGRES_PASSWORD=test
POSTGRES_DB=snt_test
DATABASE_URL=postgresql://test:test@localhost:5432/snt_test
```

---

## 3. Этапы пайплайна

### 3.1. Этап lint — Lint & Type Check

Джоба `lint`:
1. `actions/checkout@v4` — получение кода.
2. `actions/setup-node@v4` с `cache: 'npm'` (FR-26).
3. `npm ci` — детерминированная установка зависимостей (BR-05, NFR-05).
4. `npm run lint` — ESLint (FR-04).
5. `npm run type-check` — `tsc --noEmit` (FR-05).

### 3.2. Этап unit-tests — Unit Tests

1. Выборка кода и установка Node.js + зависимостей.
2. `npm run db:generate` — генерация Prisma Client (FR-08, BR-06).
3. `npm run test:unit` — юнит-тесты (FR-07). Базы данных не требуется (FR-09, FR-14).

### 3.3. Этап integration-tests — Integration Tests

Использует сервисную PostgreSQL (GitHub Actions `services`) и шаги:
1. Выборка кода, установка Node.js.
2. `cp .env.example .env.test` и правка порта на `5432`.
3. `npm run db:generate` — генерация Prisma Client.
4. `prisma db push` с `DATABASE_URL` — применение схемы БД (FR-12, BR-07).
5. `npm run test:integration` — интеграционные тесты (FR-10, FR-11).

### 3.4. Этап component-tests — Component Tests

1. Выборка кода, установка Node.js.
2. `npm run test:components` — компонентные тесты React через собственный Vitest-конфиг (FR-13). Базы данных не требуется (FR-14).

### 3.5. Этап e2e-tests — E2E Tests (только push в main)

Выполняется только при `push` в `main`. Этапы:
1. Выборка кода, установка Node.js, `npm ci`.
2. `npx playwright install --with-deps` — установка браузеров Playwright (FR-19).
3. `npm run db:generate` и `prisma db push` — БД (FR-17).
4. `npm run build` — сборка приложения (FR-17).
5. `npm start` — запуск приложения. В CI (`CI=true`) Playwright не стартует встроенный `webServer` (EC-08), поэтому приложение запускается отдельным шагом.
6. Health check до 30 секунд вместо фиксированного `sleep` (EC-04).
7. `npm run test:e2e` с переменными `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ENABLE_TEST_ROUTES=true` (FR-18, EC-09).
8. `upload-artifact@v4` — загрузка результатов (`test-results/`) как артефакт `e2e-test-results` (FR-28, BR-11), выполняется даже при провале (`if: always()`).

Playwright-конфигурация (BR-09, BR-10, EC-02, NFR-07):
- `forbidOnly: !process.env.CI` — защита от случайного запуска только одного теста в CI.
- `retries: process.env.CI ? 2 : 0` — автоповтор проваленных тестов до 2 раз.
- `workers: 2` — не более 2 параллельных воркеров.
- `reuseExistingServer: !process.env.CI` — в CI сервер не переиспользуется.

### 3.6. Этап build-docker — Build Docker Image (только push в main)

Выполняется после всех тестов (`needs: [lint, unit-tests, integration-tests, component-tests, e2e-tests]`) и только при `push` в `main`. Этапы:
1. `docker/setup-buildx-action@v3` — настройка Buildx.
2. `docker/login-action@v3` — вход в Docker Hub (пропускается, если секреты не настроены).
3. `docker/metadata-action@v5` — теги: commit SHA и `latest` (только для `main`).
4. `docker/build-push-action@v5` — сборка и публикация образа `snt-app/snt` с кэшем `type=gha` (FR-22, FR-23).

Если секреты Docker Hub не настроены, вход и `push` пропускаются, а не падают (EC-03).

### 3.7. Deploy via SSH (отдельный workflow)

[`deploy-ssh.yml`](../../.github/workflows/deploy-ssh.yml) не является частью B-013 и запускается отдельно при пуше в `main` или вручную:
- **Job `test`** — прогон lint, type-check, юнит- и интеграционных тестов перед деплоем.
- **Job `deploy`** (`needs: test`) — SSH-подключение к серверу (`appleboy/ssh-action`): `git pull`, `npm ci --only=production`, `prisma db push`, `npm run build`, перезапуск `systemd`-сервиса `snt-app`, health check.

Секреты для деплоя: `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `SSH_PORT` (по умолчанию 22).

---

## 4. Практики и ограничения

| Практика | Описание |
|----------|----------|
| Установка зависимостей | Только `npm ci` (BR-05, NFR-05) — детерминированная установка из `package-lock.json`; защита от рассинхрона (EC-05) |
| Применение схемы БД | `prisma db push` перед интеграционными и E2E тестами (BR-07) |
| Конкурентные запуски | `concurrency` по `${{ github.ref }}` с `cancel-in-progress: true` (NFR-03, EC-06, AC-10) |
| Параллелизм джоб | Независимые джобы выполняются параллельно (NFR-02) |
| Версии actions | Зафиксированы по тегу (например `actions/checkout@v4`), не по `main` (NFR-09) |
| Тайминги | Полный пайплайн на `main` ≤ 15 минут (NFR-01) |
| Runner | `ubuntu-latest` (NFR-06) |

### 4.1. Ограничения запуска E2E и Docker

E2E и сборка Docker запускаются исключительно при пуше в `main`. На PR в `main` и пуше в `develop` джобы `e2e-tests` и `build-docker` имеют статус **skipped** — GitHub трактует skip как успех, поэтому `build-docker` не блокирует зелёный статус PR.

---

## 5. Локальный запуск проверок

Перед созданием коммита разработчику рекомендуется прогнать те же проверки, что выполняет CI:

```bash
npm run lint          # ESLint
npm run type-check    # tsc --noEmit
npm run db:generate   # генерация Prisma Client
npm run test:unit     # юнит-тесты (без БД)
npm run test:components  # компонентные тесты (без БД)
```

Для интеграционных и E2E тестов нужна запущенная PostgreSQL (см. `.env.test` и `docker-compose.test.yml`) — в CI это обеспечивается сервис-джобами.

---

## 6. Устранение неполадок

| Ситуация | Причина / решение |
|----------|-------------------|
| `npm ci` падает | `package-lock.json` рассинхронизирован с `package.json` (EC-05). Выполнить `npm install` и закоммитить актуальный lock-файл |
| Интеграционные тесты не могут подключиться к БД | Проверить наличие сервис-джобы PostgreSQL и значение `DATABASE_URL` (порт `5432`) (EC-07) |
| E2E не запускается на PR | Это ожидаемо: E2E выполняется только при пуше в `main` (FR-20). Проверить статус джобы — она skipped |
| E2E подключается к несуществующей БД | В CI `DATABASE_URL` передаётся из шага и переопределяет значение из `playwright.config.ts` (порт `5433` → `5432`) (EC-09) |
| Приложение не стартует для E2E | Health check 30 секунд не прошёл (EC-04). Смотреть логи шага `npm start` |
| Docker-образ не публикуется | Секреты `DOCKER_USERNAME`/`DOCKER_PASSWORD` не настроены — сборка пропускается (EC-03) |

---

## 7. Связанные артефакты

| Тип | ID | Ссылка |
|-----|-----|--------|
| Требование | REQ-INFRA-CICD-001 | [REQ-INFRA-CICD-001.md](../requirements/REQ-INFRA-CICD-001.md) |
| План | REQ-INFRA-CICD-001-B013 | [REQ-INFRA-CICD-001-B013-plan.md](../plans/REQ-INFRA-CICD-001-B013-plan.md) |
| QA-отчёт | B-013 | [B-013-qa-report.md](../tests/B-013-qa-report.md) |
| Code Review | B-013 | [B-013-review.md](../reviews/B-013-review.md) |
| Гайд по продакшен-развёртыванию | B-034 | [deployment-development.md](./deployment-development.md) → подробности в [docker-prod-ops.md](../docs/deployment/docker-prod-ops.md) |
| Workflow CI | — | [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) |
| Workflow Deploy | — | [`.github/workflows/deploy-ssh.yml`](../../.github/workflows/deploy-ssh.yml) |
