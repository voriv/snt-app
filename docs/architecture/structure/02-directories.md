# Структура директорий проекта

## Общий вид

```
snt-app/
├── prisma/
├── public/
├── ws-server/
├── src/
├── package.json
├── pnpm-lock.yaml
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .env
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── ecosystem.config.js
└── README.md
```

## prisma/ — Prisma ORM

```
prisma/
├── schema.prisma          # Полная схема БД
├── seed.ts                # Начальные данные: admin, настройки
└── migrations/            # Автогенерируемые миграции
```

## public/ — Статические файлы

```
public/
├── favicon.ico
└── images/
    ├── logo.svg
    └── default-avatar.png
```

## ws-server/ — WebSocket минисервер

Отдельный процесс с минимальным набором зависимостей. Свой `package.json` для оптимизации размера и независимого деплоя.

```
ws-server/
├── package.json           # ws, jsonwebtoken, @prisma/client
├── tsconfig.json
└── src/
    ├── index.ts            # Точка входа, запуск WS на порту 3001
    ├── connectionManager.ts # Управление соединениями, комнаты
    ├── handlers/
    │   ├── chat.ts         # join, message, typing, leave
    │   └── notifications.ts # push-уведомления
    └── utils/
        └── auth.ts         # Проверка JWT для WS-подключений
```

## src/app/ — Next.js App Router

Три route groups: `(public)`, `(auth)`, `(admin)`. Каждый имеет свой layout.

```
src/app/
├── layout.tsx              # Корневой layout
├── page.tsx                # / — редирект на dashboard или login
├── globals.css             # TailwindCSS + глобальные стили
├── not-found.tsx           # 404
├── error.tsx               # Глобальная обработка ошибок
│
├── (public)/               # Без авторизации
│   ├── layout.tsx          # Без сайдбара
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── forgot-password/page.tsx
│   └── info/
│       ├── page.tsx
│       └── [slug]/page.tsx
│
├── (auth)/                 # Авторизованный садовод
│   ├── layout.tsx          # С сайдбаром + проверка сессии
│   ├── dashboard/page.tsx
│   ├── plots/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── members/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── documents/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── announcements/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── votes/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── accounting/
│   │   ├── page.tsx
│   │   ├── charges/page.tsx
│   │   └── payments/page.tsx
│   ├── forum/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── chat/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── notifications/page.tsx
│   └── profile/
│       ├── page.tsx
│       └── settings/page.tsx
│
└── (admin)/                # Администратор
    ├── layout.tsx          # Админ-сайдбар
    └── admin/
        ├── page.tsx
        ├── plots/
        │   ├── page.tsx
        │   ├── new/page.tsx
        │   └── [id]/edit/page.tsx
        ├── members/
        │   ├── page.tsx
        │   ├── new/page.tsx
        │   └── [id]/edit/page.tsx
        ├── documents/
        │   ├── page.tsx
        │   ├── new/page.tsx
        │   └── [id]/edit/page.tsx
        ├── announcements/
        │   ├── page.tsx
        │   ├── new/page.tsx
        │   └── [id]/edit/page.tsx
        ├── votes/
        │   ├── page.tsx
        │   ├── new/page.tsx
        │   └── [id]/edit/page.tsx
        └── accounting/
            ├── page.tsx
            ├── charges/
            │   ├── page.tsx
            │   └── new/page.tsx
            ├── payments/
            │   ├── page.tsx
            │   └── new/page.tsx
            └── reports/page.tsx