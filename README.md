# СНТ Берёнки-НТ — Управление садоводческим товариществом

Web-приложение для управления СНТ, реализованное на Next.js с использованием архитектуры Clean Architecture.

## 🏗️ Архитектура

Проект использует **доменную архитектуру (вариант B)** с явным разделением слоёв:

```
src/
├── app/                      # Next.js App Router
│   ├── api/v1/               # API Routes (тонкие handlers)
│   ├── (auth)/               # Страницы авторизации
│   └── (dashboard)/          # Основное приложение
├── domains/                  # Домены — ядро приложения
│   ├── members/              # Домен: Члены СНТ
│   ├── plots/                # Домен: Участки
│   └── _shared/              # Общий код доменов
├── components/               # React-компоненты
│   ├── ui/                   # Базовые компоненты (Button, Input...)
│   ├── features/             # Составные компоненты по доменам
│   └── layouts/              # Layout-компоненты
├── shared/                   # Общий код (ошибки, типы)
├── infrastructure/           # Инфраструктура (Prisma, Auth, WS)
├── di/                       # Composition Root
└── lib/                      # Клиентские утилиты
```

## 📐 Слои приложения

1. **Presentation (API Routes)** — тонкие обработчики, валидация, форматирование ответа
2. **Application (Service)** — бизнес-логика, валидация через Zod
3. **Domain (Repository Interface)** — контракты, типы, доменные ошибки
4. **Infrastructure (Repository Prisma)** — реализация доступа к БД

## 🚀 Быстрый старт

### Требования

- Node.js 18+
- PostgreSQL 14+
- pnpm (рекомендуется) или npm

### Установка

```bash
# Установка зависимостей
npm install

# Создание базы данных и миграция
cp .env.example .env.local
# Отредактируйте DATABASE_URL в .env.local
npx prisma db push

# Запуск сервера разработки
npm run dev
```

## 📋 Основные команды

```bash
# Разработка
npm run dev          # Запуск сервера разработки
npm run build        # Сборка продакшн
npm run start        # Запуск продакшн сервера
npm run lint         # ESLint
npm run test         # Запуск тестов

# База данных
npm run db:generate  # Генерация Prisma Client
npm run db:push      # Применение схемы к БД
npm run db:migrate   # Создание миграции
npm run db:studio    # Prisma Studio

# Домены
npm run domain:create <name> [singular]
# Пример: npm run domain:create votes vote
```

## 🏗️ Создание нового домена

Используйте скрипт-генератор:

```bash
npm run domain:create members member
# Создаёт: src/domains/members/ с файлами:
# - member.types.ts
# - member.errors.ts
# - member.repository.interface.ts
# - member.repository.prisma.ts
# - member.validators.ts
# - member.service.ts
# - index.ts
```

## 📁 Структура домена

Каждый домен состоит из:

| Файл | Описание |
|------|----------|
| `*.types.ts` | Типы данных домена |
| `*.errors.ts` | Классы доменных ошибок |
| `*.repository.interface.ts` | Интерфейс Repository |
| `*.repository.prisma.ts` | Реализация через Prisma |
| `*.validators.ts` | Zod-схемы валидации |
| `*.service.ts` | Бизнес-логика |
| `index.ts` | Публичный API домена |

## 🔑 Принципы разработки

1. **Серверные компоненты запрещены** — только API Routes + Client Components
2. **Repository абстракция** — Service зависит только от интерфейса
3. **DI через конструктор** — Repository внедряется в Service
4. **Typed errors** — использование доменных классов ошибок
5. **Zod валидация** — на всех уровнях
6. **TypeScript strict mode** — запрещены `any`, `unknown`-bypass
7. **Правило 50 строк** — компонент не более 50 строк

## 🔐 Конфигурация

| Переменная | Описание |
|------------|----------|
| `DATABASE_URL` | URL базы данных PostgreSQL |
| `NEXTAUTH_URL` | URL NextAuth |
| `NEXTAUTH_SECRET` | Секрет для сессий |
| `WS_PORT` | Порт WebSocket сервера |

## 📚 Документация

- [План настройки проекта](plans/workspace-setup-plan.md)
- [Правила архитектуры](.roo/rules/architecture.md)
- [План развертывания](plans/deployment-plan.md)

## 🚀 Развертывание

### Требования

- **Node.js** 24+
- **PostgreSQL** 15+
- **npm** или **pnpm**

### Варианты развертывания

#### 1. Локальная разработка (быстрый старт)

```bash
# Клонирование репозитория
git clone <repo-url>
cd snt-app

# Установка зависимостей
npm ci

# Настройка окружения
cp .env.example .env
# Отредактируйте .env

# Настройка базы данных
npm run db:generate
npm run db:push

# Запуск сервера разработки
npm run dev
```

#### 2. Локальная разработка через Docker

```bash
# Запуск приложения и БД
docker-compose up -d

# Приложение доступно по http://localhost:3000
```

#### 3. Продакшен через Docker Compose

```bash
# Создание .env файла
cp .env.example .env
# Отредактируйте .env с реальными значениями

# Запуск продакшена
docker-compose -f docker-compose.prod.yml up -d --build
```

#### 4. Автоматическое развертывание

**Windows:**
```powershell
# Запуск от имени администратора
.\scripts\deploy-windows.ps1
```

**Ubuntu:**
```bash
# Запуск с правами sudo
sudo ./scripts/deploy-ubuntu.sh
```

### Переменные окружения

| Переменная | Описание | Пример |
|------------|----------|--------|
| `DATABASE_URL` | URL базы данных | `postgresql://user:pass@localhost:5432/snt_db` |
| `NEXTAUTH_URL` | URL приложения | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Секрет для сессий | Случайная строка |
| `WS_PORT` | Порт WebSocket | `3001` |
| `WS_INTERNAL_SECRET` | Секрет для WebSocket | Случайная строка |

### CI/CD

Проект использует GitHub Actions для автоматического тестирования и сборки:

- **Lint & Type Check** — проверка кода
- **Unit тесты** — Vitest
- **Integration тесты** — с тестовой БД
- **Component тесты** — React компоненты
- **E2E тесты** — Playwright
- **Docker сборка** — при мерже в main

## 🛠️ Технологии

- **Фреймворк:** Next.js 15 (App Router)
- **Язык:** TypeScript 5
- **ORM:** Prisma
- **База данных:** PostgreSQL
- **Валидация:** Zod
- **Аутентификация:** NextAuth.js
- **CSS:** Tailwind CSS
- **Тестирование:** Vitest + Playwright
- **Контейнеризация:** Docker + Docker Compose
- **CI/CD:** GitHub Actions

## 📝 Лицензия

MIT
