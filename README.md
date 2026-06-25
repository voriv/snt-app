# СНТ-Приложение

Современное веб-приложение для управления садоводческим некоммерческим товариществом (СНТ), разработанное с использованием **Next.js 15**, **Prisma**, **PostgreSQL** и **WebSocket** для实时-уведомлений.

## 🏗️ Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                      Клиент (Браузер)                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                ┌───────┴────────┐
                │   Nginx (80/443) │
                └───────┬─────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌─────────────┐  ┌──────────────┐  ┌─────────────┐
│ Next.js     │  │ WebSocket    │  │ PostgreSQL  │
│ Server      │  │ Server       │  │ Database    │
│ (port 3000) │  │ (port 3001)  │  │ (port 5432) │
│             │  │              │  │             │
│ - SSR/SSG   │  │ - Чаты       │  │ - Данные    │
│ - API       │  │ - Уведомления│  │ - Миграции  │
│ - Actions   │  │ - Push       │  │             │
└─────────────┘  └──────────────┘  └─────────────┘
        │               │
        └───────┬───────┘
                ▼
        ┌─────────────┐
        │    PM2      │
        │ (Process    │
        │  Manager)   │
        └─────────────┘
```

## 🚀 Быстрый старт

### Системные требования

- **Node.js**: >= 18.x
- **npm/pnpm**: Последняя версия
- **Docker** (опционально, для PostgreSQL)
- **PostgreSQL**: >= 14.x (если не используется Docker)

### Установка

#### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd snt-app
```

#### 2. Установка зависимостей

```bash
npm install
```

#### 3. Настройка окружения

Создайте файл `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

Редактируйте `.env` для вашей среды:

```env
# База данных
DATABASE_URL="postgresql://snt_user:snt_password@localhost:5432/snt_db?schema=public"

# Next.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-generate-with-openssl-rand-base64-32"

# WebSocket сервер
WS_PORT=3001
WS_INTERNAL_SECRET="your-internal-secret-generate-with-openssl-rand-base64-32"

# Файлы
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760
```

> **Примечание**: Для генерации секретных ключей используйте:
> ```bash
> openssl rand -base64 32
> ```

#### 4. Запуск PostgreSQL (опционально, с Docker)

```bash
docker-compose up -d postgres
```

#### 5. Настройка базы данных

```bash
# Запустить миграции базы данных
npm run db:migrate

# Сгенерировать Prisma клиент
npm run db:generate

# Заполнить базу тестовыми данными (опционально)
npm run db:seed
```

## 🏃‍♂️ Запуск приложения

### Разработка

Запуск Next.js и WebSocket сервера одновременно:

```bash
npm run dev:all
```

Или по отдельности:

```bash
# Terminal 1 - Next.js
npm run dev

# Terminal 2 - WebSocket сервер
npm run dev:ws
```

### Разработка PostgreSQL локально (через Docker)

```bash
# Запустить базу данных
docker-compose up -d postgres

# Заполнить базу тестовыми данными
npm run db:seed
```

### Production

```bash
# Собрать приложение
npm run build

# Запустить приложения
npm run start
npm run start:ws
```

## 📊 Статистика и метрики

| Компонент | RAM | Диск | Описание |
|-----------|-----|------|----------|
| Next.js | 80-150 MB | 200-400 MB | SSR + API + Server Actions |
| WebSocket Server | 30-50 MB | 10-20 MB | Real-time уведомления |
| PostgreSQL | 150-250 MB | 1-5 GB | Хранение данных |
| Nginx | 5-10 MB | 5 MB | Reverse proxy |
| PM2 | 20-30 MB | 5 MB | Process manager |
| **Итого** | **385-590 MB** | **3-8 GB** | - |

При 1 GB RAM - комфортно, запас ~400 MB. При 500 MB - впритык.

## 🗂️ Структура проекта

```
snt-app/
├── prisma/
│   ├── schema.prisma        # Модель базы данных
│   ├── seed.ts              # Данные для заполнения
│   └── migrations/          # Миграции БД
├── public/
│   └── images/              # Статические изображения
├── ws-server/
│   ├── src/
│   │   ├── index.ts         # Точка входа WS сервера
│   │   ├── connectionManager.ts # Управление соединениями
│   │   ├── handlers/
│   │   │   ├── chat.ts      # Обработка чатов
│   │   │   └── notifications.ts # Push-уведомления
│   │   └── utils/
│   │       └── auth.ts      # JWT аутентификация
│   ├── package.json
│   └── tsconfig.json
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (public)/        # Публичные страницы
│   │   ├── (auth)/          # Страницы авторизации
│   │   └── (admin)/         # Админ-панель
│   ├── components/
│   │   ├── ui/              # Базовые UI компоненты
│   │   ├── layout/          # Макеты
│   │   ├── forms/           # Формы
│   │   ├── features/        # Доменные компоненты
│   │   └── providers/       # Context providers
│   ├── lib/
│   │   ├── prisma.ts        # Singleton Prisma Client
│   │   ├── auth.ts          # NextAuth.js конфигурация
│   │   ├── validators.ts    # Zod схемы валидации
│   │   ├── utils.ts         # Утилиты
│   │   └── constants.ts     # Константы
│   ├── actions/             # Server Actions
│   └── types/               # TypeScript типы
├── uploads/                 # Загруженные файлы
├── .env.example             # Пример переменных окружения
├── ecosystem.config.js      # PM2 конфигурация
├── nginx.conf               # Nginx конфигурация
├── docker-compose.yml       # Docker конфигурация
└── package.json             # Зависимости
```

## 📦 Зависимости

### Основные

- **next**: ^15.0.0 - Фреймворк
- **react**: ^19.0.0 - UI библиотека
- **@prisma/client**: ^6.0.0 - ORM
- **next-auth**: ^4.24.7 - Аутентификация
- **bcryptjs**: ^2.4.3 - Хеширование паролей
- **zod**: ^3.23.8 - Валидация схем
- **date-fns**: ^3.6.0 - Работа с датами

### Утилиты

- **clsx**: ^2.1.1 - Конкатенация классов
- **tailwind-merge**: ^2.4.0 - Объединение классов Tailwind
- **concurrently**: ^9.0.1 - Запуск нескольких процессов

### WebSocket сервер

- **ws**: ^8.18.0 - WebSocket библиотека
- **jsonwebtoken**: ^9.0.2 - JWT токены
- **express**: ^4.21.0 - Web server для API
- **cors**: ^2.8.5 - CORS middleware

### DevDependencies

- **typescript**: ^5.5.4 - TypeScript
- **@types/node**: ^22.5.4 - Типы Node.js
- **@types/react**: ^19.0.0 - Типы React
- **@types/bcryptjs**: ^2.4.6 - Типы bcryptjs
- **@types/jsonwebtoken**: ^9.0.7 - Типы JWT
- **@types/express**: ^5.0.0 - Типы Express
- **@types/cors**: ^2.8.17 - Типы CORS
- **prisma**: ^6.0.0 - CLI Prisma
- **tailwindcss**: ^3.4.10 - TailwindCSS
- **eslint**: ^9.9.1 - Линтер
- **eslint-config-next**: ^15.0.0 - ESLint для Next.js
- **ts-node**: ^10.9.2 - TypeScript Node runner
- **tsx**: ^4.19.0 - TypeScript executor

## 🔧 Полезные команды

### База данных

```bash
# Запуск миграций
npm run db:migrate

# Генерация Prisma клиента
npm run db:generate

# Заполнение тестовыми данными
npm run db:seed

# Открытие Prisma Studio
npm run db:studio

# Push изменений схемы в базу
npm run db:push
```

### Разработка

```bash
# Запуск Next.js (port 3000)
npm run dev

# Запуск WebSocket сервера (port 3001)
npm run dev:ws

# Запуск обоих серверов
npm run dev:all
```

### Production

```bash
# Сборка приложения
npm run build

# Запуск Next.js
npm run start

# Запуск WebSocket сервера
npm run start:ws

# Запуск обоих серверов
```

### lint и тесты

```bash
# Линтинг
npm run lint

# Форматирование
npm run format
```

## 🔐 Роли пользователей

| Роль | Описание | Права |
|------|----------|-------|
| **ADMIN** | Администратор СНТ | Полный доступ ко всем функциям |
| **MEMBER** | Член СНТ | Доступ к своим данным, чатам, голосованиям |
| **GUEST** | Гость | Доступ только к публичной информации |

## 🌐 API и WebSocket

### REST API Endpoints (Server Actions)

- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/logout` - Выход
- `GET /api/plots` - Получить участки
- `POST /api/plots` - Создать участок
- `GET /api/members` - Получить садоводов
- `POST /api/charges` - Создать начисление
- `POST /api/payments` - Создать платеж
- `GET /api/announcements` - Получить объявления
- `POST /api/announcements` - Создать объявление
- `GET /api/votes` - Получить голосования
- `POST /api/votes` - Создать голосование
- `POST /api/votes/:id/cast` - Проголосовать
- `GET /api/notifications` - Получить уведомления

### WebSocket Protocol

**Типы сообщений клиент → сервер:**

```json
{
  "type": "chat.join",
  "payload": { "chatId": "uuid" }
}

{
  "type": "chat.leave",
  "payload": { "chatId": "uuid" }
}

{
  "type": "chat.message",
  "payload": {
    "chatId": "uuid",
    "content": "Текст сообщения"
  }
}

{
  "type": "chat.typing",
  "payload": { "chatId": "uuid" }
}
```

**Типы сообщений сервер → клиент:**

```json
{
  "type": "chat.message",
  "payload": {
    "id": "uuid",
    "chatId": "uuid",
    "senderId": "uuid",
    "senderName": "Иван Иванов",
    "content": "Текст сообщения",
    "createdAt": "2024-01-01T12:00:00Z"
  }
}

{
  "type": "chat.typing",
  "payload": {
    "chatId": "uuid",
    "userId": "uuid",
    "name": "Иван Иванов"
  }
}

{
  "type": "notification",
  "payload": {
    "id": "uuid",
    "type": "ANNOUNCEMENT",
    "title": "Новое объявление",
    "content": "Описание",
    "link": "/announcements/123"
  }
}
```

## 🐳 Docker & Deployment

### Локальная разработка с Docker

```bash
# Запустить PostgreSQL
docker-compose up -d postgres

# Проверить состояние
docker-compose ps

# Остановить все сервисы
docker-compose down
```

### Production deployment

1. **Сборка образов**:
   ```bash
   npm run build
   cd ws-server && npm run build
   ```

2. **Настройка PM2**:
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

3. **Настройка Nginx**:
   - Скопируйте `nginx.conf` в `/etc/nginx/sites-available/snt-app`
   - Создайте symlink в `/etc/nginx/sites-enabled/`
   - Перезапустите Nginx

4. **SSL证书**:
   ```bash
   certbot --nginx -d snt.example.com
   ```

## 🛠️ Troubleshooting

### База данных не подключается

1. Проверьте переменные окружения:
   ```bash
   cat .env
   ```

2. Убедитесь, что PostgreSQL запущен:
   ```bash
   docker-compose ps
   # или
   pg_isready -h localhost -p 5432
   ```

3. Проверьте, что миграции применены:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

### WebSocket не подключается

1. Проверьте, что WebSocket сервер запущен:
   ```bash
   npm run dev:ws
   ```

2. Проверьте CORS настройки в Nginx

3. Убедитесь, что порт 3001 открыт

### Превышение лимита файлов

1. Увеличьте `MAX_FILE_SIZE` в `.env`
2. Обновите `client_max_body_size` в `nginx.conf`

## 📝 License

MIT License - see LICENSE file for details.

## 👥 Contributors

Разработано для удобного управления садоводческими товариществами.
