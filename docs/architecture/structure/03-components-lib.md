# Компоненты, утилиты и REST API Routes

## src/components/ — React-компоненты

### ui/ — Базовые UI-компоненты

| Компонент | Назначение |
|-----------|-----------|
| `button.tsx` | Кнопка с вариантами: primary, secondary, danger, ghost |
| `input.tsx` | Текстовое поле с label, ошибкой, иконкой |
| `select.tsx` | Выпадающий список |
| `textarea.tsx` | Многострочное поле |
| `checkbox.tsx` | Чекбокс |
| `modal.tsx` | Модальное окно |
| `table.tsx` | Таблица с сортировкой |
| `card.tsx` | Карточка контента |
| `badge.tsx` | Бейдж статуса |
| `tabs.tsx` | Вкладки |
| `dropdown.tsx` | Выпадающее меню |
| `pagination.tsx` | Постраничная навигация |
| `spinner.tsx` | Индикатор загрузки |
| `avatar.tsx` | Аватар пользователя |
| `alert.tsx` | Алерт-сообщение |
| `toast.tsx` | Toast-уведомление |
| `file-upload.tsx` | Загрузка файлов |
| `confirm-dialog.tsx` | Диалог подтверждения |

### layout/ — Компоненты layout

| Компонент | Назначение |
|-----------|-----------|
| `header.tsx` | Верхняя панель: логотип, пользователь, уведомления |
| `sidebar.tsx` | Боковая навигация садовода |
| `admin-sidebar.tsx` | Боковая навигация администратора |
| `footer.tsx` | Нижняя панель |
| `mobile-nav.tsx` | Мобильная навигация |

### forms/ — Переиспользуемые формы

| Компонент | Назначение |
|-----------|-----------|
| `login-form.tsx` | Форма входа |
| `register-form.tsx` | Форма регистрации |
| `plot-form.tsx` | Форма участка — создание/редактирование |
| `member-form.tsx` | Форма садовода — создание/редактирование |
| `document-form.tsx` | Форма документа — загрузка/редактирование |
| `announcement-form.tsx` | Форма объявления |
| `vote-form.tsx` | Форма создания голосования |
| `charge-form.tsx` | Форма начисления |

### features/ — Доменные компоненты

| Компонент | Назначение |
|-----------|-----------|
| `plot-card.tsx` | Карточка участка в списке |
| `member-card.tsx` | Карточка садовода |
| `document-card.tsx` | Карточка документа |
| `announcement-card.tsx` | Карточка объявления |
| `vote-card.tsx` | Карточка голосования |
| `vote-option.tsx` | Вариант ответа в голосовании |
| `charge-row.tsx` | Строка начисления в таблице |
| `payment-row.tsx` | Строка платежа в таблице |
| `forum-post.tsx` | Сообщение в теме форума |
| `chat-message.tsx` | Сообщение в чате |
| `notification-item.tsx` | Элемент уведомления |

### providers/ — React Context

| Провайдер | Назначение |
|-----------|-----------|
| `session-provider.tsx` | Данные сессии текущего пользователя |
| `theme-provider.tsx` | Тема: светлая/тёмная |
| `ws-provider.tsx` | WebSocket-соединение, статус подключения |

---

## src/lib/ — Утилиты и конфигурация

| Файл | Назначение |
|------|-----------|
| `prisma.ts` | Singleton Prisma Client — один экземпляр на процесс |
| `auth.ts` | Конфигурация NextAuth.js: провайдеры, колбэки, страницы |
| `validators.ts` | Zod-схемы валидации для всех форм и API |
| `utils.ts` | Общие утилиты: `cn()` для Tailwind, `formatDate()`, `formatMoney()` |
| `constants.ts` | Роли: ADMIN, MEMBER, GUEST; статусы: ACTIVE, INACTIVE и т.д. |

---

## src/app/api/ — REST API Routes

Каждый каталог содержит `route.ts` с обработчиками HTTP-методов (GET, POST, PUT, PATCH, DELETE).

| Каталог | Методы | Описание |
|---------|--------|----------|
| `api/auth/` | POST | Вход, регистрация, обновление токена |
| `api/plots/` | GET, POST | Список участков, создание |
| `api/plots/[id]/` | GET, PATCH, DELETE | Чтение, обновление, удаление участка |
| `api/members/` | GET, POST | Список садоводов, создание |
| `api/members/[id]/` | GET, PATCH, DELETE | Чтение, обновление, удаление садовода |
| `api/documents/` | GET, POST | Список документов, загрузка |
| `api/documents/[id]/` | GET, PATCH, DELETE | Чтение, обновление, удаление документа |
| `api/files/` | GET, POST | Список файлов, загрузка |
| `api/files/[id]/` | GET, PATCH, DELETE | Чтение, обновление, удаление файла |
| `api/announcements/` | GET, POST | Объявления |
| `api/votes/` | GET, POST | Голосования |
| `api/charges/` | GET, POST | Начисления |
| `api/payments/` | GET, POST | Платежи |
| `api/forum/` | GET, POST | Темы форума |
| `api/chat/` | GET, POST | Чаты |
| `api/notifications/` | GET, PATCH | Уведомления |
| `api/profile/` | GET, PATCH | Профиль пользователя |

---

## src/types/ — TypeScript типы

| Файл | Содержимое |
|------|-----------|
| `index.ts` | Реэкспорт из всех файлов ниже |
| `user.ts` | `User`, `Session`, `LoginForm`, `RegisterForm` |
| `plot.ts` | `Plot`, `PlotWithMembers`, `PlotForm` |
| `member.ts` | `Member`, `MemberWithPlots`, `MemberForm` |
| `document.ts` | `Document`, `DocumentWithAuthor`, `DocumentForm` |
| `announcement.ts` | `Announcement`, `AnnouncementForm` |
| `vote.ts` | `Vote`, `VoteOption`, `VoteResult`, `VoteForm` |
| `accounting.ts` | `Charge`, `Payment`, `Balance`, `ChargeForm`, `PaymentForm` |
| `forum.ts` | `ForumTopic`, `ForumPost` |
| `chat.ts` | `Chat`, `ChatMessage` |
| `notification.ts` | `Notification`, `NotificationSettings` |
| `common.ts` | `PaginatedResult`, `SortOrder`, `ApiResponse` |

---

## src/hooks/ — Пользовательские хуки

| Хук | Назначение |
|-----|-----------|
| `useSession.ts` | Данные текущего пользователя из контекста |
| `useWebSocket.ts` | Подключение к WS, отправка/получение сообщений |
| `useDebounce.ts` | Дебаунс для поиска и ввода |
| `usePagination.ts` | Состояние пагинации: page, perPage, totalPages |
| `useConfirm.ts` | Диалог подтверждения перед действием |
| `useToast.ts` | Показ toast-уведомлений |