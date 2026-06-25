# План реализации приложения СНТ

## Обзор проекта

Приложение для управления садоводческим товариществом (СНТ) с использованием Next.js, Prisma, PostgreSQL и WebSocket-сервера.

## Технологический стек

- **Frontend/Backend**: Next.js 15 (Standalone mode)
- **База данных**: PostgreSQL 16
- **ORM**: Prisma 6
- **Authentication**: NextAuth.js
- **UI Framework**: TailwindCSS 3.4
- **WebSocket**: Отдельный WebSocket-сервер (Node.js + ws)
- **Package Manager**: pnpm
- **Process Management**: PM2
- **Reverse Proxy**: Nginx

## Архитектура

### Компоненты системы

```
┌─────────────────────────────────────────────────────────────┐
│                        Клиент (Browser)                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                    ┌───────┴────────┐
                    │   Nginx (80/443) │
                    └───────┬────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  Next.js      │    │  WebSocket    │    │  PostgreSQL   │
│  Server       │    │  Server       │    │  Database     │
│  (port 3000)  │    │  (port 3001)  │    │  (port 5432)  │
│               │    │               │    │               │
│  - SSR/SSG    │    │  - Чаты       │    │  - Данные     │
│  - API Routes │    │  - Уведомления│    │  - Миграции   │
│  - Server     │    │  - Push       │    │               │
│    Actions    │    │               │    │               │
└───────┬───────┘    └───────┬───────┘    └───────────────┘
        │                    │
        └────────┬───────────┘
                 ▼
          ┌─────────────┐
          │    PM2      │
          │  (Process   │
          │   Manager)  │
          └─────────────┘
```

### Структура проекта

```
snt-app/
├── prisma/
│   ├── schema.prisma           # ORM схема БД
│   ├── seed.ts                 # Начальные данные
│   └── migrations/             # Миграции БД
├── public/
│   ├── favicon.ico
│   └── images/
│       ├── logo.svg
│       └── default-avatar.png
├── ws-server/
│   ├── package.json            # Зависимости WS сервера
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts            # Точка входа
│       ├── connectionManager.ts # Управление соединениями
│       ├── handlers/
│       │   ├── chat.ts         # Обработка чатов
│       │   └── notifications.ts # Уведомления
│       └── utils/
│           └── auth.ts         # JWT аутентификация
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Корневой layout
│   │   ├── page.tsx            # Редирект на dashboard/login
│   │   ├── globals.css         # Глобальные стили
│   │   ├── not-found.tsx       # 404 страница
│   │   ├── error.tsx           # Глобальная обработка ошибок
│   │   ├── (public)/           # Публичные страницы
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── info/
│   │   │       ├── page.tsx
│   │   │       └── [slug]/page.tsx
│   │   ├── (auth)/             # Авторизованные пользователи (садоводы)
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── plots/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── members/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── documents/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── announcements/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── votes/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── accounting/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── charges/page.tsx
│   │   │   │   └── payments/page.tsx
│   │   │   ├── forum/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── chat/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── notifications/page.tsx
│   │   │   └── profile/
│   │   │       ├── page.tsx
│   │   │       └── settings/page.tsx
│   │   └── (admin)/            # Админ-панель
│   │       ├── layout.tsx
│   │       └── admin/
│   │           ├── page.tsx
│   │           ├── plots/
│   │           │   ├── page.tsx
│   │           │   ├── new/page.tsx
│   │           │   └── [id]/edit/page.tsx
│   │           ├── members/
│   │           │   ├── page.tsx
│   │           │   ├── new/page.tsx
│   │           │   └── [id]/edit/page.tsx
│   │           ├── documents/
│   │           │   ├── page.tsx
│   │           │   ├── new/page.tsx
│   │           │   └── [id]/edit/page.tsx
│   │           ├── announcements/
│   │           │   ├── page.tsx
│   │           │   ├── new/page.tsx
│   │           │   └── [id]/edit/page.tsx
│   │           ├── votes/
│   │           │   ├── page.tsx
│   │           │   ├── new/page.tsx
│   │           │   └── [id]/edit/page.tsx
│   │           └── accounting/
│   │               ├── page.tsx
│   │               ├── charges/
│   │               │   ├── page.tsx
│   │               │   └── new/page.tsx
│   │               ├── payments/
│   │               │   ├── page.tsx
│   │               │   └── new/page.tsx
│   │               └── reports/page.tsx
│   ├── components/
│   │   ├── ui/                 # Базовые UI компоненты
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── table.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── dropdown.tsx
│   │   │   ├── pagination.tsx
│   │   │   ├── spinner.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── file-upload.tsx
│   │   │   └── confirm-dialog.tsx
│   │   ├── layout/             # Компоненты макета
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── admin-sidebar.tsx
│   │   │   ├── footer.tsx
│   │   │   └── mobile-nav.tsx
│   │   ├── forms/              # Переиспользуемые формы
│   │   │   ├── login-form.tsx
│   │   │   ├── register-form.tsx
│   │   │   ├── plot-form.tsx
│   │   │   ├── member-form.tsx
│   │   │   ├── document-form.tsx
│   │   │   ├── announcement-form.tsx
│   │   │   ├── vote-form.tsx
│   │   │   └── charge-form.tsx
│   │   ├── features/           # Доменные компоненты
│   │   │   ├── plot-card.tsx
│   │   │   ├── member-card.tsx
│   │   │   ├── document-card.tsx
│   │   │   ├── announcement-card.tsx
│   │   │   ├── vote-card.tsx
│   │   │   ├── vote-option.tsx
│   │   │   ├── charge-row.tsx
│   │   │   ├── payment-row.tsx
│   │   │   ├── forum-post.tsx
│   │   │   ├── chat-message.tsx
│   │   │   └── notification-item.tsx
│   │   └── providers/          # React Context провайдеры
│   │       ├── session-provider.tsx
│   │       ├── theme-provider.tsx
│   │       └── ws-provider.tsx
│   ├── lib/                    # Утилиты и конфигурация
│   │   ├── prisma.ts           # Singleton Prisma Client
│   │   ├── auth.ts             # NextAuth.js конфигурация
│   │   ├── validators.ts       # Zod схемы валидации
│   │   ├── utils.ts            # Общие утилиты (cn, formatDate, formatMoney)
│   │   └── constants.ts        # Константы (роли, статусы)
│   ├── actions/                # Server Actions
│   │   ├── auth.ts
│   │   ├── plots.ts
│   │   ├── members.ts
│   │   ├── documents.ts
│   │   ├── announcements.ts
│   │   ├── votes.ts
│   │   ├── accounting.ts
│   │   ├── forum.ts
│   │   ├── chat.ts
│   │   ├── notifications.ts
│   │   └── profile.ts
│   └── types/                  # TypeScript типы
│       ├── index.ts
│       ├── user.ts
│       ├── plot.ts
│       ├── member.ts
│       ├── document.ts
│       ├── announcement.ts
│       ├── vote.ts
│       ├── accounting.ts
│       ├── forum.ts
│       ├── chat.ts
│       ├── notification.ts
│       └── common.ts
├── package.json                # Основной package.json
├── pnpm-lock.yaml
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── .env                        # Конфигурация окружения
├── .env.example                # Пример .env файла
├── .gitignore
├── ecosystem.config.js         # PM2 конфигурация
├── docker-compose.yml          # Docker конфигурация для разработки
├── Dockerfile                  # Dockerfile для деплоя
├── nginx.conf                  # Конфигурация Nginx
└── README.md                   # Документация проекта
```

## База данных

### Сущности (13 моделей Prisma)

#### 1. User (Пользователь системы)
- id (UUID) - уникальный идентификатор
- email (String, unique) - email для входа
- passwordHash (String) - хешированный пароль
- role (UserRole) - роль: ADMIN, MEMBER, GUEST
- name (String, optional) - имя пользователя
- phone (String, optional) - телефон
- avatarUrl (String, optional) - URL аватара
- isActive (Boolean) - активен ли пользователь
- emailVerified (DateTime, optional) - дата верификации email
- resetToken (String, unique, optional) - токен сброса пароля
- resetTokenExp (DateTime, optional) - срок действия токена сброса
- **Связи**: member (1:1), notifications (1:N), forumPosts (1:N), chatMessages (1:N), voteResponses (1:N), uploadedDocs (1:N), authoredAnn (1:N), chatParticipants (1:N)

#### 2. Member (Садовод)
- id (UUID) - уникальный идентификатор
- userId (String, unique) - связь с User
- surname (String) - фамилия
- firstName (String) - имя
- patronymic (String, optional) - отчество
- address (String, optional) - адрес проживания
- snn (String, optional) - номер садовогоNumer
- **Связи**: User (1:1), plotMemberships (1:N), payments (1:N)

#### 3. Plot (Садовый участок)
- id (UUID) - уникальный идентификатор
- number (String, unique) - номер участка
- area (Float) - площадь участка
- address (String, optional) - адрес
- cadastralNum (String, optional) - кадастровый номер
- status (PlotStatus) - статус: ACTIVE, INACTIVE, ABANDONED
- **Связи**: plotMemberships (1:N), charges (1:N)

#### 4. PlotMembership (Связь участок-садовод)
- id (UUID) - уникальный идентификатор
- plotId (String) - ID участка
- memberId (String) - ID садовода
- role (MembershipRole) - роль: OWNER, CO_OWNER, TENANT, FAMILY
- share (Float, optional) - доля в участке
- since (DateTime) - дата начала членства
- until (DateTime, optional) - дата окончания членства
- **Связи**: Plot (N:1), Member (N:1)
- **Уникальность**: [plotId, memberId, since]

#### 5. Charge (Начисление)
- id (UUID) - уникальный идентификатор
- plotId (String) - ID участка
- type (ChargeType) - тип: MEMBERSHIP_FEE, TARGET_FEE, ELECTRICITY, WATER, LAND_TAX, OTHER
- amount (Decimal, 12,2) - сумма
- description (String, optional) - описание
- period (String) - период начисления
- dueDate (DateTime, optional) - дата оплаты
- status (ChargeStatus) - статус: PENDING, PARTIALLY_PAID, PAID, CANCELLED
- **Связи**: Plot (N:1), payments (1:N)
- **Индексы**: [plotId, period], [status]

#### 6. Payment (Платеж)
- id (UUID) - уникальный идентификатор
- memberId (String) - ID садовода
- chargeId (String, optional) - ID начисления
- amount (Decimal, 12,2) - сумма платежа
- method (PaymentMethod) - способ оплаты: CASH, CARD, TRANSFER, SBERPAY, OTHER
- receiptNum (String, optional) - номер чека
- receiptUrl (String, optional) - URL чека
- note (String, optional) - примечание
- paidAt (DateTime) - дата оплаты
- **Связи**: Member (N:1), Charge (N:1)
- **Индексы**: [memberId], [chargeId]

#### 7. Document (Документ)
- id (UUID) - уникальный идентификатор
- title (String) - заголовок
- description (String, optional) - описание
- category (DocCategory) - категория: CHARTER, PROTOCOL, RULE, REPORT, CONTRACT, INVOICE, OTHER
- fileUrl (String) - URL файла
- fileName (String) - имя файла
- fileSize (Int) - размер файла (байты)
- mimeType (String) - MIME тип
- isPublic (Boolean) - публичный документ
- uploadedById (String) - ID загрузившего пользователя
- **Связи**: User (N:1)
- **Индексы**: [category], [isPublic]

#### 8. Announcement (Объявление)
- id (UUID) - уникальный идентификатор
- title (String) - заголовок
- content (String) - содержание
- isPinned (Boolean) - закреплено ли объявление
- isPublic (Boolean) - публичное объявление
- authorId (String) - ID автора
- **Связи**: User (N:1)
- **Индексы**: [isPinned], [isPublic]

#### 9. Vote (Голосование)
- id (UUID) - уникальный идентификатор
- title (String) - заголовок
- description (String, optional) - описание
- type (VoteType) - тип: SINGLE_CHOICE, MULTIPLE_CHOICE
- status (VoteStatus) - статус: DRAFT, ACTIVE, CLOSED
- isAnonymous (Boolean) - анонимное ли голосование
- startedAt (DateTime, optional) - дата начала
- endedAt (DateTime, optional) - дата окончания
- createdById (String) - ID создателя
- **Связи**: options (1:N), responses (1:N)
- **Индексы**: [status]

#### 10. VoteOption (Вариант ответа)
- id (UUID) - уникальный идентификатор
- voteId (String) - ID голосования
- text (String) - текст варианта
- sortOrder (Int) - порядок отображения
- **Связи**: Vote (N:1)
- **Индексы**: [voteId]

#### 11. VoteResponse (Ответ в голосовании)
- id (UUID) - уникальный идентификатор
- voteId (String) - ID голосования
- optionId (String) - ID варианта ответа
- userId (String) - ID пользователя
- **Связи**: Vote (N:1), Option (N:1), User (N:1)
- **Уникальность**: [userId, voteId, optionId]
- **Индексы**: [voteId], [userId, voteId]

#### 12. ForumTopic (Тема форума)
- id (UUID) - уникальный идентификатор
- title (String) - заголовок темы
- isPinned (Boolean) - закреплена ли тема
- isLocked (Boolean) - закрыта ли тема для ответов
- authorId (String) - ID автора темы
- **Связи**: posts (1:N)
- **Индексы**: [isPinned]

#### 13. ForumPost (Сообщение форума)
- id (UUID) - уникальный идентификатор
- topicId (String) - ID темы
- authorId (String) - ID автора
- content (String) - содержание сообщения
- parentId (String, optional) - ID родительского сообщения (для вложенных ответов)
- **Связи**: Topic (N:1), Author (N:1), Parent (1:1), Replies (1:N)
- **Индексы**: [topicId]

### Дополнительные модели

#### 14. Chat (Чат)
- id (UUID) - уникальный идентификатор
- type (ChatType) - тип: PRIVATE, GROUP
- name (String, optional) - название (для групповых чатов)
- **Связи**: messages (1:N), participants (1:N)

#### 15. ChatParticipant (Участник чата)
- id (UUID) - уникальный идентификатор
- chatId (String) - ID чата
- userId (String) - ID пользователя
- lastReadAt (DateTime, optional) - дата последнего прочтения
- **Связи**: Chat (N:1), User (N:1)
- **Уникальность**: [chatId, userId]

#### 16. ChatMessage (Сообщение чата)
- id (UUID) - уникальный идентификатор
- chatId (String) - ID чата
- senderId (String) - ID отправителя
- content (String) - содержание сообщения
- **Связи**: Chat (N:1), Sender (N:1)
- **Индексы**: [chatId, createdAt]

#### 17. Notification (Уведомление)
- id (UUID) - уникальный идентификатор
- userId (String) - ID пользователя
- type (NotificationType) - тип: ANNOUNCEMENT, VOTE_STARTED, VOTE_ENDED, CHARGE_CREATED, PAYMENT_RECEIVED, DOCUMENT_UPLOADED, CHAT_MESSAGE, FORUM_REPLY, SYSTEM
- title (String) - заголовок
- content (String, optional) - содержание
- link (String, optional) - ссылка для перехода
- isRead (Boolean) - прочитано ли уведомление
- **Связи**: User (N:1)
- **Индексы**: [userId, isRead], [userId, createdAt]

#### 18. InfoPage (Информационная страница)
- id (UUID) - уникальный идентификатор
- slug (String, unique) - URL- Slug
- title (String) - заголовок
- content (String) - содержание
- isPublic (Boolean) - публичная ли страница
- **Индексы**: [slug]

## WebSocket Протокол

### Типы сообщений (Клиент → Сервер)

| type | payload | Описание |
|------|---------|----------|
| `chat.join` | `{ chatId: string }` | Войти в чат |
| `chat.leave` | `{ chatId: string }` | Покинуть чат |
| `chat.message` | `{ chatId: string, content: string }` | Отправить сообщение |
| `chat.typing` | `{ chatId: string }` | Индикатор набора текста |

### Типы сообщений (Сервер → Клиент)

| type | payload | Описание |
|------|---------|----------|
| `chat.message` | `{ id: string, chatId: string, sender: User, content: string, createdAt: DateTime }` | Новое сообщение |
| `chat.typing` | `{ chatId: string, userId: string, name: string }` | Кто-то печатает |
| `notification` | `{ id: string, type: NotificationType, title: string, content?: string, link?: string }` | Push-уведомление |

### Интеграция с Next.js

1. Server Action выполняет транзакцию в БД
2. Server Action отправляет HTTP POST на WS-сервер (внутренний API)
3. WS-сервер рассылает push-уведомления подключенным клиентам

## План реализации

### Этап 1: Инициализация проекта (Файлы конфигурации)
- [ ] Создать package.json с зависимостями
- [ ] Создать tsconfig.json с настройками TypeScript
- [ ] Создать next.config.ts с настройками Next.js
- [ ] Создать tailwind.config.ts с конфигурацией TailwindCSS
- [ ] Создать .env.example с примерами переменных окружения
- [ ] Создать .gitignore

### Этап 2: Создание структуры директорий
- [ ] Создать prisma/
- [ ] Создать public/images/
- [ ] Создать ws-server/src/ и поддиректории
- [ ] Создать src/app/ и поддиректории (route groups)
- [ ] Создать src/components/ui/, layout/, forms/, features/, providers/
- [ ] Создать src/lib/
- [ ] Создать src/actions/
- [ ] Создать src/types/
- [ ] Создать src/hooks/
- [ ] Создать uploads/

### Этап 3: Настройка Prisma
- [ ] Создать prisma/schema.prisma с 18 моделями
- [ ] Создать prisma/seed.ts с начальными данными
- [ ] Настроить миграции (migrations)
- [ ] Создать src/lib/prisma.ts (Singleton Prisma Client)

### Этап 4: Создание TypeScript типов
- [ ] src/types/common.ts (общие типы)
- [ ] src/types/user.ts
- [ ] src/types/plot.ts
- [ ] src/types/member.ts
- [ ] src/types/document.ts
- [ ] src/types/announcement.ts
- [ ] src/types/vote.ts
- [ ] src/types/accounting.ts
- [ ] src/types/forum.ts
- [ ] src/types/chat.ts
- [ ] src/types/notification.ts
- [ ] src/types/index.ts (реэкспорт всех типов)

### Этап 5: Создание утилит
- [ ] src/lib/utils.ts (cn, formatDate, formatMoney, и другие)
- [ ] src/lib/constants.ts (роли, статусы, типы)
- [ ] src/lib/validators.ts (Zod схемы)
- [ ] src/lib/auth.ts (NextAuth.js конфигурация)

### Этап 6: Создание базовых UI-компонентов (16 компонентов)
- [ ] src/components/ui/button.tsx
- [ ] src/components/ui/input.tsx
- [ ] src/components/ui/select.tsx
- [ ] src/components/ui/textarea.tsx
- [ ] src/components/ui/checkbox.tsx
- [ ] src/components/ui/modal.tsx
- [ ] src/components/ui/table.tsx
- [ ] src/components/ui/card.tsx
- [ ] src/components/ui/badge.tsx
- [ ] src/components/ui/tabs.tsx
- [ ] src/components/ui/dropdown.tsx
- [ ] src/components/ui/pagination.tsx
- [ ] src/components/ui/spinner.tsx
- [ ] src/components/ui/avatar.tsx
- [ ] src/components/ui/alert.tsx
- [ ] src/components/ui/toast.tsx
- [ ] src/components/ui/file-upload.tsx
- [ ] src/components/ui/confirm-dialog.tsx

### Этап 7: Создание компонентов Layout
- [ ] src/components/layout/header.tsx
- [ ] src/components/layout/sidebar.tsx
- [ ] src/components/layout/admin-sidebar.tsx
- [ ] src/components/layout/footer.tsx
- [ ] src/components/layout/mobile-nav.tsx

### Этап 8: Создание компонентов форм (8 форм)
- [ ] src/components/forms/login-form.tsx
- [ ] src/components/forms/register-form.tsx
- [ ] src/components/forms/plot-form.tsx
- [ ] src/components/forms/member-form.tsx
- [ ] src/components/forms/document-form.tsx
- [ ] src/components/forms/announcement-form.tsx
- [ ] src/components/forms/vote-form.tsx
- [ ] src/components/forms/charge-form.tsx

### Этап 9: Создание компонентов Features (11 компонентов)
- [ ] src/components/features/plot-card.tsx
- [ ] src/components/features/member-card.tsx
- [ ] src/components/features/document-card.tsx
- [ ] src/components/features/announcement-card.tsx
- [ ] src/components/features/vote-card.tsx
- [ ] src/components/features/vote-option.tsx
- [ ] src/components/features/charge-row.tsx
- [ ] src/components/features/payment-row.tsx
- [ ] src/components/features/forum-post.tsx
- [ ] src/components/features/chat-message.tsx
- [ ] src/components/features/notification-item.tsx

### Этап 10: Создание провайдеров
- [ ] src/components/providers/session-provider.tsx
- [ ] src/components/providers/theme-provider.tsx
- [ ] src/components/providers/ws-provider.tsx

### Этап 11: Создание пользовательских хуков
- [ ] src/hooks/useSession.ts
- [ ] src/hooks/useWebSocket.ts
- [ ] src/hooks/useDebounce.ts
- [ ] src/hooks/usePagination.ts
- [ ] src/hooks/useConfirm.ts
- [ ] src/hooks/useToast.ts

### Этап 12: Создание Server Actions (11 файлов)
- [ ] src/actions/auth.ts (login, register, logout, forgotPassword, resetPassword)
- [ ] src/actions/plots.ts (createPlot, updatePlot, deletePlot)
- [ ] src/actions/members.ts (createMember, updateMember, deleteMember, assignPlot)
- [ ] src/actions/documents.ts (uploadDocument, updateDocument, deleteDocument)
- [ ] src/actions/announcements.ts (createAnnouncement, updateAnnouncement, deleteAnnouncement)
- [ ] src/actions/votes.ts (createVote, castVote, closeVote)
- [ ] src/actions/accounting.ts (createCharge, recordPayment, generateReport)
- [ ] src/actions/forum.ts (createTopic, createPost, updatePost, deletePost)
- [ ] src/actions/chat.ts (createChat, sendMessage)
- [ ] src/actions/notifications.ts (markAsRead, markAllAsRead, updateNotificationSettings)
- [ ] src/actions/profile.ts (updateProfile, changePassword)

### Этап 13: Создание маршрутов App Router
- [ ] src/app/layout.tsx
- [ ] src/app/page.tsx
- [ ] src/app/globals.css
- [ ] src/app/not-found.tsx
- [ ] src/app/error.tsx
- [ ] src/app/(public)/ (4 страницы)
- [ ] src/app/(auth)/ (15 страниц)
- [ ] src/app/(admin)/ (20 страниц)

### Этап 14: Создание WebSocket-сервера
- [ ] ws-server/package.json
- [ ] ws-server/tsconfig.json
- [ ] ws-server/src/index.ts
- [ ] ws-server/src/connectionManager.ts
- [ ] ws-server/src/handlers/chat.ts
- [ ] ws-server/src/handlers/notifications.ts
- [ ] ws-server/src/utils/auth.ts

### Этап 15: Настройка деплоя
- [ ] ecosystem.config.js (PM2 конфигурация)
- [ ] docker-compose.yml (для локальной разработки)
- [ ] Dockerfile (для контейнеризации)
- [ ] nginx.conf (конфигурация Nginx)

### Этап 16: Документация и тестирование
- [ ] README.md с инструкциями по запуску
- [ ] Проверка всех компонентов
- [ ] Unit-тесты для ключевых функций

## Следующие шаги

После утверждения плана можно переходить к реализации:
1. Создать все файлы конфигурации (package.json, tsconfig.json, next.config.ts, tailwind.config.ts, .env.example)
2. Создать структуру директорий проекта
3. Настроить Prisma и создать схему базы данных
4. Начать создание UI-компонентов
