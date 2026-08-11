# Руководство разработчика: Система общения (Comms)

## Обзор

Данное руководство описывает архитектуру, структуру кода и процессы разработки модуля "Общение" (REQ-COMMS-001). Модуль реализует вкладку "Общение" — единую точку входа для личных сообщений, групповых чатов, объявлений и модерации.

---

## 1. Архитектура

Модуль построен по принципу Clean Architecture с разделением на слои:

```
src/
├── domains/comms/            # Доменный слой
│   ├── comms.types.ts        # Типы данных
│   ├── comms.repository.interface.ts  # Интерфейс repository
│   ├── comms.repository.prisma.ts     # Prisma-реализация
│   └── comms.service.ts      # Бизнес-логика
├── di/
│   └── container.ts          # DI-контейнер
├── app/api/v1/               # API слой
│   ├── comms/unread-counts/route.ts
│   ├── conversations/route.ts
│   ├── conversations/[id]/route.ts
│   ├── conversations/[id]/read/route.ts       # PATCH: отметка прочитанных (DIRECT)
│   ├── conversations/[id]/messages/route.ts
│   ├── chats/route.ts
│   ├── chats/[id]/route.ts
│   ├── chats/[id]/read/route.ts               # PATCH: отметка прочитанных (GROUP)
│   ├── chats/[id]/participants/route.ts
│   ├── messages/[id]/route.ts
│   └── announcements/route.ts
└── components/               # UI слой
    └── features/comms/
        ├── CommsTab/
        │   ├── CommsTab.tsx   # Отдельная вкладка (Link + иконка + бейдж)
        │   └── index.ts       # Re-export
        ├── CommsTabs/
        │   ├── CommsTabs.tsx  # Панель вкладок с загрузкой счётчиков
        │   └── index.ts       # Re-export
        └── (другие компоненты)  # ConversationCard, MessageInput, ...
```

### Слой Domain

| Файл | Назначение |
|------|------------|
| `comms.types.ts` | Типы `UnreadCounts`, `ConversationListItem`, `ChatListItem` |
| `comms.repository.interface.ts` | Интерфейс `ICommsRepository` с методами для работы с данными |
| `comms.repository.prisma.ts` | Реализация `ICommsRepository` через Prisma Client |
| `comms.service.ts` | Бизнес-логика: валидация, бизнес-правила, координация repository |

### Слой API

API Route Handlers (Next.js App Router) выступают как контроллеры:
1. Проверяют авторизацию через `auth()`
2. Извлекают и валидируют данные запроса
3. Вызывают методы сервиса через DI-контейнер
4. Возвращают стандартизированный JSON-ответ

### Слой UI

UI-компоненты реализованы как Client Components с использованием React hooks для управления состоянием.

---

## 2. Типы данных

### UnreadCounts

```typescript
interface UnreadCounts {
  messages: number;  // Непрочитанные в личных диалогах (DIRECT)
  chats: number;     // Непрочитанные в групповых чатах (GROUP)
}
```

Инварианты:
- `messages >= 0`, `chats >= 0`
- `messages` — сумма непрочитанных во всех DIRECT диалогах
- `chats` — сумма непрочитанных во всех GROUP чатах

### MessageWithReadStatus

> **B-026** (REQ-COMMS-003)

Тип сообщения с информацией о статусе прочтения. Используется `GET /api/v1/conversations/:id/messages` для возврата read receipts.

```typescript
interface MessageWithReadStatus {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderEmail?: string;
  senderAvatarUrl?: string | null;
  content: string;
  replyToId: string | null;
  isDeleted: boolean;
  deletedBy: string | null;
  deletedAt: Date | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  /** Сообщение прочитано получателем (для DIRECT) */
  isReadByRecipient: boolean;
  /** Количество прочитавших (для GROUP) */
  readByCount?: number;
  /** Общее число получателей кроме автора (для GROUP) */
  totalParticipants?: number;
}
```

Инварианты:
- `isReadByRecipient` всегда определён (для DIRECT и GROUP)
- `readByCount` / `totalParticipants` определены только для GROUP
- `totalParticipants` не включает автора сообщения (BR-07)

---

## 3. DI-контейнер

Для получения сервиса используется DI-контейнер:

```typescript
import { getContainer } from '@/di/container';

const service = getContainer().getCommsService();
const counts = await service.getUnreadCounts(userId);
```

---

## 4. Бизнес-правила

### BR-01: Авторизация

Все операции требуют авторизации. API endpoints проверяют сессию через `auth()`:

```typescript
const session = await auth();
if (!session?.user?.id) {
  return NextResponse.json(
    { success: false, error: { code: 'UNAUTHORIZED', message: 'Необходима авторизация' } },
    { status: 401 }
  );
}
```

### BR-02: Доступ к личным сообщениям

Личные сообщения видны только участникам диалога. На уровне repository выполняется фильтрация по `userId`.

### BR-42: Вкладка "Общение"

Вкладка "Общение" — единая точка входа. При переходе на `/dashboard/comms` пользователь автоматически перенаправляется на подраздел "Личные сообщения".

### BR-43: Переключение вкладок

Внутри вкладки реализовано переключение между подразделами через вложенный роутинг:
- Личные сообщения (`/dashboard/comms/messages`)
- Групповые чаты (`/dashboard/comms/chats`)
- Объявления (`/dashboard/comms/announcements`)
- Модерация (`/dashboard/comms/moderation`) — только для ADMIN/SUPER_ADMIN

---

## 5. Структура компонент UI

### CommsTab

Компонент отдельной вкладки в панели "Общение". Содержит `Link` для навигации, иконку, label и опциональный бейдж непрочитанных.

**Пропсы:**

| Prop | Тип | Описание |
|------|-----|----------|
| `href` | `string` | Маршрут вкладки |
| `label` | `string` | Текст вкладки |
| `icon` | `ReactNode` | Иконка вкладки |
| `active` | `boolean` | Активна ли вкладка |
| `badgeCount` | `number \| undefined` | Количество непрочитанных (опционально) |

```tsx
// Использование внутри CommsTabs
<CommsTab
  href="/dashboard/comms/messages"
  label="Личные сообщения"
  icon={<MessageSquareIcon />}
  active={activeTab === 'messages'}
  badgeCount={unreadCounts?.messages}
/>
```

### CommsTabs

Компонент панели вкладок "Общение". Управляет загрузкой счётчиков непрочитанных и рендерит список вкладок.

**Пропсы:**

| Prop | Тип | Описание |
|------|-----|----------|
| `activeTab` | `'messages' \| 'chats' \| 'announcements' \| 'moderation'` | Активная вкладка |
| `userRoles` | `string[]` | Роли пользователя |

**Поведение:**
- При mount выполняется запрос `GET /api/v1/comms/unread-counts`
- Счётчики обновляются при смене `activeTab`
- Вкладка "Модерация" скрыта для не-ADMIN/SUPER_ADMIN
- Бейдж "99+" при count > 99, скрыт при count === 0
- ARIA: `role="tablist"`, `role="tab"`, `aria-selected`

```tsx
// Использование в layout.tsx
<CommsTabs activeTab={activeTab} userRoles={userRoles} />
```
```

---

## 6. Тестирование

### Unit-тесты

Тесты сервисного слоя проверяют бизнес-логику и правила валидации.

**Запуск:**
```bash
npm test -- --grep "comms"
```

### API-тесты

Интеграционные тесты API endpoints:

| Файл | Описание |
|------|----------|
| `tests/api/comms-unread-counts.test.ts` | Тесты GET /api/v1/comms/unread-counts |
| `tests/api/conversations.test.ts` | Тесты API диалогов |

**Запуск:**
```bash
npm run test:api
```

### Component-тесты

Тесты UI-компонентов:

| Файл | Описание |
|------|----------|
| `tests/components/features/comms/CommsTab.test.tsx` | Тесты компонента CommsTab |
| `tests/components/features/comms/CommsTabs.test.tsx` | Тесты компонента CommsTabs |

**Запуск:**
```bash
npm run test:components
```

### E2E-тесты

Полные сценарии пользовательского взаимодействия:

| Файл | Описание |
|------|----------|
| `tests/e2e/comms/comms-tabs.e2e.spec.ts` | Навигация по вкладкам "Общение" |
| `tests/e2e/comms/conversations-list.e2e.spec.ts` | Список диалогов |
| `tests/e2e/comms/new-conversation.e2e.spec.ts` | Начало нового диалога |

**Запуск:**
```bash
npx playwright test --grep "comms"
```

---

## 7. Добавление нового endpoint

Шаги для добавления нового API endpoint:

1. **Определить тип** в `comms.types.ts`
2. **Добавить метод в интерфейс** `ICommsRepository`
3. **Реализовать в Prisma repository** `PrismaCommsRepository`
4. **Добавить метод в сервис** `CommsService` с бизнес-логикой
5. **Создать Route Handler** в `src/app/api/v1/...`
6. **Написать тесты**: API-тесты + component-тесты (если есть UI)

### Пример: Создание endpoint

```typescript
// 1. Тип
interface NewType {
  id: string;
  name: string;
}

// 2. Интерфейс repository
interface ICommsRepository {
  getNewItem(id: string): Promise<NewType | null>;
}

// 3. Prisma реализация
class PrismaCommsRepository implements ICommsRepository {
  async getNewItem(id: string): Promise<NewType | null> {
    return this.prisma.newItem.findUnique({ where: { id } });
  }
}

// 4. Service
class CommsService {
  async getNewItem(userId: string, id: string): Promise<NewType> {
    const item = await this.repository.getNewItem(id);
    if (!item) {
      throw new NotFoundError('Элемент не найден');
    }
    return item;
  }
}

// 5. Route Handler
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Необходима авторизация' } },
      { status: 401 }
    );
  }
  const service = getContainer().getCommsService();
  const data = await service.getNewItem(session.user.id, id);
  return NextResponse.json({ success: true, data });
}
```

---

## 8. Обработка ошибок

Все слои используют типизированные ошибки из `src/shared/errors/`:

| Класс ошибки | HTTP код | Описание |
|--------------|----------|----------|
| `UnauthorizedError` | 401 | Не авторизован |
| `ForbiddenError` | 403 | Недостаточно прав |
| `NotFoundError` | 404 | Ресурс не найден |
| `ConflictError` | 409 | Конфликт данных |
| `ValidationError` | 400 | Ошибка валидации |
| `BaseError` | 500 | Общая ошибка |

В API Route Handlers используется функция `errorResponse()`:

```typescript
function errorResponse(error: unknown): NextResponse {
  if (error instanceof Error && 'code' in error) {
    const typedError = error as BaseError;
    return NextResponse.json(
      { success: false, error: { code: typedError.code, message: typedError.message } },
      { status: typedError.httpStatus }
    );
  }
  return NextResponse.json(
    { success: false, error: 'Внутренняя ошибка сервера' },
    { status: 500 }
  );
}
```

---

## 9. Стилевые правила

### Именование

- **Типы:** PascalCase (`UnreadCounts`, `ConversationListItem`)
- **Интерфейсы repository:** `I` + PascalCase (`ICommsRepository`)
- **Сервисы:** PascalCase + `Service` (`CommsService`)
- **Route handlers:** кamelCase для функций (`handleGet`, `handlePost`)

### JSDoc

Все файлы API Route Handlers обязаны содержать JSDoc-комментарии с:
- `@file` — путь и описание
- `@route` — HTTP метод и URL
- `@auth` — требование авторизации
- `@description` — описание
- `@query` / `@body` — параметры
- `@response` — коды ответов
- `@spec` — ссылки на спецификацию

Пример:
```typescript
/**
 * @file comms/unread-counts/route.ts
 * @description Route handler для счётчиков непрочитанных
 * @route GET /api/v1/comms/unread-counts
 * @auth required
 * @response 200 { success: true, data: { messages: number, chats: number } }
 * @response 401 { success: false, error: { code: string, message: string } }
 */
```

---

## 10. Layout-паттерн: Sticky-низ контрола ввода сообщений

### Проблема

Контрол ввода сообщений (`MessageInput`) на обеих страницах чатов (личный диалог и групповой чат) мог «уплывать» за нижнюю границу экрана из-за неправильной цепочки высоты:

- Страницы использовали `h-screen` / `calc(100vh-4rem)` вместо `h-full`, не учитывая высоту Navbar (64px), Breadcrumbs (~40px) и `py-6` (48px) контейнера main.
- `MessageInput` не имел `flex-shrink-0`, что при сжатии flex-контейнера могло сжать контрол.

### Решение (B-023)

**Стратегия:** `h-full` от AppLayout через CSS-переменные. Ключевые изменения:

1. **AppLayout** ([`src/components/layouts/AppLayout.tsx`](../../src/components/layouts/AppLayout.tsx)) — корневой div переведён с `min-h-screen` на `h-[100dvh] flex flex-col`. Дочерние блоки используют `flex-1 min-h-0` для заполнения оставшейся высоты.
2. **CSS-переменная** `--navbar-height: 64px` добавлена в `:root` ([`src/app/globals.css`](../../src/app/globals.css)).
3. **Страницы чатов** — заменён `h-screen` / `calc(100vh-4rem)` на `h-full` для наследования высоты от flex-цепочки AppLayout.
4. **MessageInput** — добавлен `flex-shrink-0` в корневой div компонента.
5. **ConversationMessagesList** — добавлен `overflow-anchor: none` для предотвращения «прыжков» скролла при пагинации.

### Затронутые файлы

| Файл | Изменение |
|------|-----------|
| `src/app/globals.css` | Добавлена CSS-переменная `--navbar-height: 64px` |
| `src/components/layouts/AppLayout.tsx` | `min-h-screen` → `h-[100dvh] flex flex-col`, flex-цепочка |
| `src/app/dashboard/comms/messages/[conversationId]/page.tsx` | `h-screen` → `h-full` |
| `src/app/dashboard/comms/chats/[chatId]/page.tsx` | `calc(100vh-4rem)` → `h-full` |
| `src/components/features/comms/MessageInput/MessageInput.tsx` | Добавлен `flex-shrink-0` |
| `src/components/features/comms/ConversationMessagesList/ConversationMessagesList.tsx` | Добавлен `overflow-anchor: none` |

### Детали реализации

#### AppLayout — корневой контейнер

```tsx
<div className="h-[100dvh] bg-gray-50 flex flex-col">
  <Navbar />
  <div className="flex flex-1 min-h-0">
    <Sidebar />
    <div className="flex-1 min-w-0 flex flex-col">
      <Breadcrumbs />
      <main className="flex-1 min-h-0 py-6">
        {children}
      </main>
    </div>
  </div>
</div>
```

#### MessageInput — flex-shrink-0

```tsx
<div className="flex-shrink-0 border-t border-[var(--theme-border-color)] bg-[var(--theme-bg-primary)] px-4 py-3">
```

### Связанные требования

- [FR-REQ-COMMS-001-68 — FR-REQ-COMMS-001-75](../requirements/REQ-COMMS-001.md) — функциональные требования sticky-низа.

### Ссылки

- [План B-023: Sticky-низ контрола ввода сообщений](../plans/B-023-message-input-sticky-layout-plan.md)
- [REQ-COMMS-001: Система общения в СНТ](../requirements/REQ-COMMS-001.md)

---

## 11. Layout-паттерн: Ограничение ширины и центрирование зоны сообщений

### Проблема

На широких десктоп-экранах зона сообщений (список сообщений + контрол ввода) растягивалась на всю доступную ширину контейнера. Это приводило к:

- Слишком длинным строкам текста, что ухудшало читаемость (рекомендуемая длина строки — 45–90 символов).
- Визуальному «расползанию» чата на ультрашироких мониторах (1920px+), когда сообщения и контрол ввода оказывались разнесены на большое расстояние от центра экрана.
- Несоответствию макету дизайна (см. [`docs/design/layouts/comms/layout.md`](../design/layouts/comms/layout.md)), где предусмотрена фиксированная максимальная ширина зоны сообщений.

### Решение (B-025)

**Стратегия:** ограничение ширины зоны сообщений через Tailwind-класс `lg:max-w-4xl` (896px) с горизонтальным центрированием. Реализовано централизованно в компоненте [`ChatLayout`](../../src/components/features/comms/ChatLayout/ChatLayout.tsx), который является общей обёрткой для страниц личного диалога и группового чата.

Ключевые принципы:

1. **Заголовок на всю ширину.** `ChatHeader` остаётся прямым потомком корневого контейнера и растягивается на всю ширину страницы — это сохраняет единый визуальный верх для чата и не «обрезает» действия в заголовке (кнопка «Назад», меню).
2. **Зона сообщений ограничена и центрирована.** Контейнер с `children` (список сообщений + `MessageInput`) обёрнут во внешний `flex justify-center` и внутренний `w-full lg:max-w-4xl mx-auto`. На экранах ≥ `lg` (1024px) ширина ограничена 896px и центрирована; по бокам виден фон страницы (`--theme-bg-primary`).
3. **Mobile-first.** На экранах < `lg` (1024px) ограничение не применяется — зона сообщений занимает всю ширину (`w-full`), что оптимально для мобильных устройств и планшетов.
4. **Единое поведение для обоих типов чатов.** Поскольку ограничение реализовано в `ChatLayout`, личный диалог ([`ConversationDetailPage`](../../src/components/features/comms/ConversationDetailPage/ConversationDetailPage.tsx)) и групповой чат ([`ChatPage`](../../src/app/dashboard/comms/chats/[chatId]/page.tsx)) получают идентичное поведение без дополнительной конфигурации.

### Структура компонента ChatLayout

```tsx
// src/components/features/comms/ChatLayout/ChatLayout.tsx
<div className="flex flex-col h-full w-full">
  {/* Заголовок — растягивается на всю ширину страницы */}
  <ChatHeader
    title={title}
    description={description}
    onBack={onBack}
    actions={headerActions}
  />

  {/* Зона сообщений + ErrorBar + Input.
      На широких экранах (≥lg/1024px) ограничена по ширине и центрирована.
      По бокам виден фон страницы --theme-bg-primary.
      На мобильных (<1024px) — без ограничения, на всю ширину. */}
  <div className="flex-1 min-h-0 w-full flex justify-center">
    <div className="w-full lg:max-w-4xl mx-auto flex flex-col h-full">
      {children}
    </div>
  </div>
</div>
```

### Разбор классов

| Класс | Назначение |
|-------|-----------|
| `flex flex-col h-full w-full` | Корневой контейнер: колонка, заполняет всю высоту и ширину |
| `flex justify-center` (внешний) | Горизонтальное центрирование внутреннего контейнера |
| `w-full` (внутренний) | Mobile-first: на всю ширину по умолчанию |
| `lg:max-w-4xl` | На ≥1024px ограничивает ширину до 896px (56rem) |
| `mx-auto` | Дублирующее центрирование (в связке с max-w) |
| `flex flex-col h-full` (внутренний) | Колонка для `children` (сообщения + input), корректная высота |

### Затронутые файлы

| Файл | Изменение |
|------|-----------|
| `src/components/features/comms/ChatLayout/ChatLayout.tsx` | Добавлен внешний `flex justify-center` и внутренний `w-full lg:max-w-4xl mx-auto` контейнер вокруг `children` |

> **Примечание:** Изменён только один файл. Компоненты-потребители (`ConversationDetailPage`, `ChatPage`) не требуют модификации — они уже используют `ChatLayout` как обёртку.

### Тестирование

Добавлены 13 unit-тестов в [`tests/unit/components/features/comms/ChatLayout/ChatLayout.test.tsx`](../../tests/unit/components/features/comms/ChatLayout/ChatLayout.test.tsx):

- Рендер заголовка и описания
- Передача `onBack` и `headerActions`
- Наличие классов `lg:max-w-4xl`, `mx-auto`, `flex justify-center`
- Заголовок вне центрирующего контейнера (sibling)
- `children` внутри центрирующего контейнера
- Поведение на мобильных (`w-full` без `max-w`)
- Единое поведение для обоих типов чатов

**Запуск:**

```bash
npx vitest run tests/unit/components/features/comms/ChatLayout/ChatLayout.test.tsx
```

### Точки расширения

- **Изменение максимальной ширины.** Для изменения целевой ширины зоны сообщений достаточно заменить `lg:max-w-4xl` на другой Tailwind-класс (например, `lg:max-w-5xl` = 1024px). Изменение применяется сразу к обоим типам чатов.
- **Изменение breakpoint.** По умолчанию используется `lg` (1024px). Для срабатывания ограничения на другой ширине замените префикс (например, `md:max-w-4xl` для ≥768px).
- **Пер-страничная конфигурация.** Текущая реализация не предусматривает передачу ширины через пропсы — поведение едино для всех чатов. При необходимости можно расширить `ChatLayoutProps` опциональным пропсом `maxWidthClassName`.

### Связанные требования и артефакты

- [US-38-03: Ограничение ширины и центрирование зоны сообщений](../user-stories/US-38-03-ограничение-ширины-и-центрирование-зоны-сообщений.md)
- [План B-025: Ограничение ширины и центрирование зоны сообщений](../plans/B-025-chat-width-centering-plan.md)
- [Спецификация B-025](../specs/comms/B-025-component-spec.md)
- [QA-отчёт B-025](../tests/B-025-qa-report.md)
- [Макет layout COMMS](../design/layouts/comms/layout.md)
- [REQ-COMMS-001: Система общения в СНТ](../requirements/REQ-COMMS-001.md)

---

## 12. Механизм отметки прочитанных и Read Receipts (B-026)

> **B-026** (REQ-COMMS-003) — автоматическая отметка прочитанных сообщений при открытии диалога/чата и индикация статуса прочтения (read receipts).

### Обзор

Механизм реализует два связанных направления:

1. **Автоматическая отметка прочитанных** — при открытии личного диалога или группового чата все сообщения от других участников помечаются прочитанными.
2. **Read Receipts** — индикация статуса прочтения под отправленными сообщениями (галочки в DIRECT, счётчик «Прочитано: N из M» в GROUP).

Модель данных не требовала изменений — используется существующее поле `ConversationParticipant.lastReadAt`.

### Архитектура

```
Поток отметки прочитанных:
Страница диалога/чата
  └─ useMarkAsRead (client hook)
       ├─ DIRECT → PATCH /api/v1/conversations/:id/read
       └─ GROUP  → PATCH /api/v1/chats/:id/read
             └─ CommsService.markConversationAsRead(id, userId)
                  └─ ICommsRepository.markAsRead(id, userId)
                       └─ обновляет ConversationParticipant.lastReadAt = now()

Поток read receipts:
GET /api/v1/conversations/:id/messages
  └─ CommsService.getMessagesWithReadStatus(id, userId)
       └─ MessageWithReadStatus[]
            ├─ DIRECT: isReadByRecipient = recipient.lastReadAt >= message.createdAt
            └─ GROUP:  readByCount / totalParticipants (исключая автора, BR-07)
```

### Domain-слой

| Файл | Изменение |
|------|-----------|
| [`src/domains/comms/comms.types.ts`](../../src/domains/comms/comms.types.ts) | Добавлен тип `MessageWithReadStatus` |
| [`src/domains/comms/comms.errors.ts`](../../src/domains/comms/comms.errors.ts) | Добавлен `ParticipantNotFoundError` (extends `NotFoundError`, код `PARTICIPANT_NOT_FOUND`, HTTP 404) |
| [`src/domains/comms/comms.validators.ts`](../../src/domains/comms/comms.validators.ts) | Добавлена `markAsReadSchema` (`z.object({ id: uuid })`) |
| [`src/domains/comms/comms.repository.interface.ts`](../../src/domains/comms/comms.repository.interface.ts) | Добавлены методы `markAsRead()` и `getMessagesWithReadStatus()` |
| [`src/domains/comms/comms.repository.prisma.ts`](../../src/domains/comms/comms.repository.prisma.ts) | Реализация `markAsRead` и `getMessagesWithReadStatus` |
| [`src/domains/comms/comms.service.ts`](../../src/domains/comms/comms.service.ts) | Добавлены `markConversationAsRead()` и `getMessagesWithReadStatus()` |

#### Repository: `markAsRead`

- `findUnique` участника по `(conversationId, userId)`.
- Если участник не найден — бросает `ParticipantNotFoundError`.
- Обновляет `lastReadAt = now()`. Операция **идемпотентна** (AC-4): повторный вызов не вызывает ошибку.

#### Repository: `getMessagesWithReadStatus`

- **DIRECT:** `isReadByRecipient = recipient.lastReadAt >= message.createdAt`.
- **GROUP:** `readByCount = COUNT(participants WHERE lastReadAt >= createdAt AND userId != senderId)`, `totalParticipants = COUNT(participants WHERE userId != senderId)`.
- Фильтр `isDeleted = false`, сортировка `createdAt ASC`.

### Service

```typescript
// Отметка прочитанных (DIRECT и GROUP — один метод)
service.markConversationAsRead(conversationId: string, userId: string): Promise<void>

// Получение сообщений со статусом прочтения
service.getMessagesWithReadStatus(conversationId: string, userId: string): Promise<MessageWithReadStatus[]>
```

Метод `markConversationAsRead` валидирует ID через `markAsReadSchema`, затем делегирует в `repository.markAsRead`. `getMessagesWithReadStatus` — тонкая обёртка над repository.

### API-слой

| Файл | Метод | Описание |
|------|-------|----------|
| [`src/app/api/v1/conversations/[id]/read/route.ts`](../../src/app/api/v1/conversations/[id]/read/route.ts) | `PATCH /api/v1/conversations/:id/read` | Отметка прочитанных в личном диалоге (DIRECT) |
| [`src/app/api/v1/chats/[id]/read/route.ts`](../../src/app/api/v1/chats/[id]/read/route.ts) | `PATCH /api/v1/chats/:id/read` | Отметка прочитанных в групповом чате (GROUP) |
| [`src/app/api/v1/conversations/[id]/messages/route.ts`](../../src/app/api/v1/conversations/[id]/messages/route.ts) | `GET /api/v1/conversations/:id/messages` | Доработан: возвращает `MessageWithReadStatus[]` |

Обработка ошибок:
- `ZodError` → 400
- `BaseError` → соответствующий статус (`ParticipantNotFoundError` → 404)
- прочее → 500

### Hook: `useMarkAsRead`

```bash
src/hooks/useMarkAsRead.ts   # экспорт из src/hooks/index.ts
```

```typescript
const { markAsRead, isMarking } = useMarkAsRead();
await markAsRead(conversationId, 'DIRECT'); // или 'GROUP'
```

- `type='DIRECT'` → `PATCH /conversations/:id/read`
- `type='GROUP'` → `PATCH /chats/:id/read`
- **Silent fail** (BR-09, AC-6): при ошибке сети/API ошибка не выбрасывается наружу, UI не блокируется.
- `isMarking` + ref-флаг защищают от дублирующихся вызовов при быстром переключении (EC-02).
- После успеха refetch `GET /api/v1/comms/unread-counts` для обновления счётчиков на вкладках (AC-5 US-39-01, AC-7 US-21-37).

### UI-компоненты

| Компонент | Файл | Описание |
|-----------|------|----------|
| `ReadReceiptIcon` | [`src/components/features/comms/ReadReceiptIcon/ReadReceiptIcon.tsx`](../../src/components/features/comms/ReadReceiptIcon/ReadReceiptIcon.tsx) | 🆕 Индикатор статуса прочтения |
| `MessageItem` | [`src/components/features/comms/MessageItem/MessageItem.tsx`](../../src/components/features/comms/MessageItem/MessageItem.tsx) | 🔧 Добавлены пропсы `readStatus`/`conversationType`, рендер `ReadReceiptIcon` |
| `ConversationMessagesList` | [`src/components/features/comms/ConversationMessagesList/ConversationMessagesList.tsx`](../../src/components/features/comms/ConversationMessagesList/ConversationMessagesList.tsx) | 🔧 Проброс read status из `MessageWithReadStatus` |
| `CommsTabs` | [`src/components/features/comms/CommsTabs/CommsTabs.tsx`](../../src/components/features/comms/CommsTabs/CommsTabs.tsx) | 🔧 Проп `refetchTrigger` — refetch счётчиков после markAsRead |

`ReadReceiptIcon` имеет три состояния (из макета [read-receipts-layout.md](../design/layouts/comms/read-receipts-layout.md)):

| Состояние | Тип | Условие | Визуал | aria-label |
|-----------|-----|---------|--------|------------|
| S-1: Доставлено | DIRECT | `!isRead` | одна серая ✓ | `Доставлено` |
| S-2: Прочитано | DIRECT | `isRead` | две акцентные ✓✓ | `Прочитано` |
| S-3: Счётчик | GROUP | — | «Прочитано: N из M» | `Прочитано: N из M` |

Индикатор рендерится **только** под сообщениями текущего пользователя (`isCurrentUser`, AC-5 US-39-02). Для сообщений собеседника `ReadReceiptIcon` не отображается.

### Страницы

| Файл | Изменение |
|------|-----------|
| [`src/app/dashboard/comms/messages/[conversationId]/page.tsx`](../../src/app/dashboard/comms/messages/[conversationId]/page.tsx) | 🔧 `useMarkAsRead(id, 'DIRECT')` при открытии диалога |
| [`src/app/dashboard/comms/chats/[chatId]/page.tsx`](../../src/app/dashboard/comms/chats/[chatId]/page.tsx) | 🔧 `useMarkAsRead(id, 'GROUP')` при открытии чата |
| [`src/app/dashboard/comms/layout.tsx`](../../src/app/dashboard/comms/layout.tsx) | 🔧 Инкремент `refetchTrigger` при смене pathname → обновление счётчиков вкладок |

### Тестирование

Добавлены тесты (см. [QA-отчёт B-026](../tests/B-026-qa-report.md)):

| Уровень | Файл |
|---------|------|
| Unit/service | `tests/unit/domains/comms/comms.service.markRead.test.ts`, `comms.errors.markRead.test.ts`, `comms.validators.markRead.test.ts` |
| Integration | `tests/integration/domains/comms.test.ts` (дополнен) |
| API | `tests/api/comms-read.test.ts` |
| Component | `tests/components/features/comms/ReadReceiptIcon.test.tsx`, `MessageItem.test.tsx`, `tests/components/hooks/useMarkAsRead.test.tsx` |
| E2E | `tests/e2e/comms/mark-as-read.e2e.spec.ts` |

**Предсуществующие падения (не связаны с B-026):** `userProfile` (3+1), `ErrorMessage` (7), documents API (4), `LoginForm` (10), `CommsTabs` mock (1 suite). Эти падения выявлены до прогона B-026 и рекомендуются к передаче в отдельные debug-задачи.

### Связанные требования и артефакты

- [REQ-COMMS-003: Отметка прочитанных сообщений и счётчики непрочитанных](../requirements/REQ-COMMS-003.md)
- [US-39-01: Автоматическая отметка прочитанных](../user-stories/US-39-01-автоматическая-отметка-прочитанных.md)
- [US-39-02: Read Receipts](../user-stories/US-39-02-read-receipts.md)
- [US-21-37: Счётчики непрочитанных на вкладках](../user-stories/US-21-37-счетчики-непрочитанных-на-вкладках.md)
- [Спецификация B-026](../specs/comms/B-026-component-spec.md)
- [План B-026: REQ-COMMS-003](../plans/REQ-COMMS-003-realization-plan.md)
- [Макет read-receipts-layout.md](../design/layouts/comms/read-receipts-layout.md)
- [QA-отчёт B-026](../tests/B-026-qa-report.md)

---

## 13. Корректный учёт непрочитанных сообщений (B-027)

> **B-027** (REQ-COMMS-003) — исправление 3 корневых причин расхождений в счётчиках непрочитанных, выявленных диагностикой [`docs/tests/B-027-diagnostic-report.md`](../tests/B-027-diagnostic-report.md).

### Корневые причины и решения

| # | Причина | Решение |
|---|---------|---------|
| **#1** | Глобальный бейдж в Navbar не обновлялся после `markAsRead` (загрузка один раз на mount) | Единый хук [`useUnreadCounts`](../../src/hooks/useUnreadCounts.ts) + синхронизация по `usePathname()` |
| **#2** | Новый участник видел всю историю чата как непрочитанную (`lastReadAt` не инициализировался) | Инициализация `lastReadAt = now()` при вступлении в чат / создании чата и диалога |
| **#3** | Удалённые сообщения (`isDeleted`) учитывались в счётчиках, но не в списке сообщений | Фильтр `isDeleted: false` во всех count-запросах |

### Политика новичка (инициализация `lastReadAt`)

При вступлении нового участника в групповой чат и при создании группового чата / личного диалога поле `ConversationParticipant.lastReadAt` инициализируется текущим временем (`new Date()`):

- `addChatParticipant` — `lastReadAt: new Date()` при `create` участника.
- `createGroupChat` — `lastReadAt: new Date()` в `createMany` для участников (MEMBERS).
- `createConversation` (DIRECT) — идентичная инициализация для собеседника.

**Назначение:** непрочитанными считаются только сообщения, отправленные **после** вступления; вся предшествующая история не «засчитывается» как непрочитанная (AC-10 US-21-37).

### Исключение удалённых сообщений (`isDeleted`)

Во **все 4** `prisma.message.count()`-запроса подсчёта непрочитанных добавлен фильтр `isDeleted: false`:

| Метод | Назначение |
|--------|-----------|
| `getUnreadCounts` (DIRECT) | Глобальный счётчик личных диалогов |
| `getUnreadCounts` (GROUP) | Глобальный счётчик групповых чатов |
| `getUserConversations` | Счётчик `unreadCount` диалога в списке |
| `getUserGroupChats` | Счётчик `unreadCount` чата в списке |

Это устраняет расхождение с `getMessagesWithReadStatus`, который уже фильтровал `isDeleted` (AC-11 US-21-37, AC-1.7 US-21-01, AC-1.6 US-21-04).

### Единый хук `useUnreadCounts` (синхронизация Navbar и вкладок)

Консолидирует загрузку счётчиков `GET /api/v1/comms/unread-counts` в единый хук, используемый и Navbar (глобальный бейдж), и `CommsTabs` (бейджи вкладок):

```bash
src/hooks/useUnreadCounts.ts   # экспорт из src/hooks/index.ts
```

**Триггеры обновления:**

| Потребитель | Триггер | Описание |
|-------------|---------|----------|
| `Navbar` | [`usePathname()`](../../src/components/layouts/Navbar.tsx) | Перезагрузка счётчиков при навигации — глобальный бейдж обновляется после `markAsRead` без полного ремаунта (AC-9 US-21-37) |
| `CommsTabs` | `refetchTrigger` | Инкремент в `comms/layout.tsx` при смене pathname → refetch счётчиков вкладок |

**Ключевой эффект (#1):** открытие диалога/чата (→ `markAsRead` → `PATCH /read`) и возврат на дашборд без перезагрузки страницы больше не оставляют глобальный бейдж устаревшим — `useUnreadCounts` перечитывает счётчики при смене маршрута.

### Реализация (Domain / UI)

| Слой | Файл | Изменение |
|------|------|-----------|
| Repository | [`src/domains/comms/comms.repository.prisma.ts`](../../src/domains/comms/comms.repository.prisma.ts) | `isDeleted: false` в 4 count-запросах; `lastReadAt = new Date()` при `addChatParticipant`, `createGroupChat`, `createConversation` |
| Hook | [`src/hooks/useUnreadCounts.ts`](../../src/hooks/useUnreadCounts.ts) | 🆕 Единый хук загрузки счётчиков |
| UI | [`src/components/layouts/Navbar.tsx`](../../src/components/layouts/Navbar.tsx) | Подписка на `useUnreadCounts` + `usePathname()` |
| UI | [`src/components/features/comms/CommsTabs/CommsTabs.tsx`](../../src/components/features/comms/CommsTabs/CommsTabs.tsx) | Рефакторинг на `useUnreadCounts(refetchTrigger)` |

### Тестирование

Добавлены тесты (см. [QA-отчёт B-027](../tests/B-027-qa-report.md)):

| Уровень | Файл | Покрытие |
|---------|------|----------|
| Unit (repository) | `tests/unit/domains/comms/comms.repository.unread.test.ts` | 8 тестов: `getUnreadCounts` (isDeleted DIRECT/GROUP, только `createdAt>lastReadAt`, `senderId!=userId`, игнор ANNOUNCEMENT, пустой список), `addChatParticipant` / `createGroupChat` (lastReadAt=now), `getUserConversations` / `getUserGroupChats` (isDeleted) |
| Hook | `tests/components/hooks/useUnreadCounts.test.tsx` | Синхронизация счётчиков |
| E2E | `tests/e2e/comms/unread-counts.e2e.spec.ts` | 9 тестов: AC-5, AC-12, AC-10, AC-11, AC-9, AC-1.8/US-21-01, AC-1.7/US-21-04, AC-3, AC-6 |

> **Замечание:** E2E-тесты B-027 структурно корректны, но требуют сидированной БД (`npm run db:seed`); прогон падает на этапе логина из-за отсутствия тестовых пользователей — предсуществующая инфраструктурная проблема окружения (см. [QA-отчёт B-027](../tests/B-027-qa-report.md)).

### Связанные требования и артефакты

- [REQ-COMMS-003: Отметка прочитанных сообщений и счётчики непрочитанных](../requirements/REQ-COMMS-003.md)
- [US-21-37: Счётчики непрочитанных на вкладках](../user-stories/US-21-37-счетчики-непрочитанных-на-вкладках.md)
- [US-21-01: Просмотр личных диалогов](../user-stories/US-21-01-просмотр-личных-диалогов.md)
- [US-21-04: Просмотр списка групповых чатов](../user-stories/US-21-04-просмотр-списка-групповых-чатов.md)
- [Диагностический отчёт B-027](../tests/B-027-diagnostic-report.md)
- [План B-027](../plans/REQ-COMMS-003-B027-plan.md)
- [QA-отчёт B-027](../tests/B-027-qa-report.md)

---

## 14. Запрет дублирования личных диалогов (B-029)

> **B-029** (REQ-COMMS-004) — запрет создания дублирующихся личных диалогов (DIRECT). Один личный диалог на пару пользователей.

### Бизнес-правило

**BR-01 (B-029):** Между двумя пользователями существует **не более одного** личного диалога (`conversation.type = 'DIRECT'`). Повторная попытка создать диалог между той же парой возвращает ошибку `CONVERSATION_ALREADY_EXISTS` (HTTP 409) вместо создания дубликата.

- Инвариант: для любой пары `(userIdA, userIdB)` существует **максимум один** DIRECT-диалог.
- Нарушение предотвращается на двух уровнях:
  1. **Бизнес-уровень** — поиск существующего диалога до вставки (`findConversationBetween`).
  2. **Уровень БД** — partial unique index на `pair_key` (защита от race condition).

### pairKey = sorted.join('|')

Канонический ключ пары участников, не зависящий от порядка. Вычисляется как отсортированная по возрастанию конкатенация ID через разделитель `|`:

```typescript
function computePairKey(userIdA: string, userIdB: string): string {
  return [userIdA, userIdB].sort().join('|');
}
```

- Оба участника пишут один и тот же `pairKey` независимо от того, кто инициировал диалог.
- Поле `pairKey` хранится в каждой записи `conversation_participants`.
- Применяется только для `type = 'DIRECT'`; для GROUP/ANNOUNCEMENT поле `NULL`.

### Partial unique index: WHERE pair_key IS NOT NULL

Уникальность обеспечивается **partial unique index** на столбце `pair_key`, который применяется только к DIRECT-диалогам (где `pair_key` не `NULL`):

```sql
-- migration: add_unique_direct_conversation_constraint
CREATE UNIQUE INDEX unique_direct_pair_key
ON conversation_participants (pair_key)
WHERE pair_key IS NOT NULL;
```

Это гарантирует уникальность пары на уровне СУБД и является финальной защитой от гонок (race condition) — две параллельные транзакции не могут создать одинаковую пару.

### Цепочка race condition (P2002 → 409)

При одновременной попытке двух пользователей (или клиентов) создать диалог с одной парой оба проходят бизнес-проверку `findConversationBetween` (диалога ещё нет), но при вставке СУБД отклоняет один из них из-за partial unique index (Prisma `P2002`). Цепочка обработки:

```
P2002 (unique violation на pair_key)
   └─ PrismaCommsRepository.findOrCreateDirect → DuplicateConversationError
        └─ CommsService.startConversation → ConversationAlreadyExistsError
             └─ POST /api/v1/conversations → 409 CONVERSATION_ALREADY_EXISTS
                  └─ клиент: редирект в существующий диалог (без показа ошибки)
```

| Ошибка | Слой | Код | HTTP |
|--------|------|-----|------|
| `DuplicateConversationError` | Repository | `DUPLICATE_CONVERSATION` | 409 (внутренняя) |
| `ConversationAlreadyExistsError` | Service | `CONVERSATION_ALREADY_EXISTS` | 409 (публичная) |

`DuplicateConversationError` — внутренняя ошибка repository (наследует `BaseError`), **не** экспонируется наружу: service-слой перехватывает её и пробрасывает публичный `ConversationAlreadyExistsError` с `conversationId` существующего диалога для редиректа клиента.

### findConversationBetween

Метод repository, который ищет существующий DIRECT-диалог между двумя пользователями:

```typescript
// ICommsRepository
findConversationBetween(userIdA: string, userIdB: string): Promise<{ id: string } | null>
```

- Вычисляет `pairKey = computePairKey(userIdA, userIdB)`.
- Ищет первую запись `conversation_participants` с этим `pair_key`.
- Если найден — возвращает `conversationId`; иначе `null`.
- Вызывается сервисом в `startConversation` **до** создания нового диалога (BR-01). При положительном результате сервис бросает `ConversationAlreadyExistsError(conversationId)` → HTTP 409.

### Service: startConversation

```typescript
service.startConversation(userId: string, payload): Promise<{ conversationId: string; isNew: true }>
```

1. Валидирует `participantId` (UUID).
2. Проверяет: нельзя писать самому себе (`CannotMessageSelfError`, 400) и заблокированному пользователю (`CannotMessageBlockedUserError`, 400).
3. Вызывает `findConversationBetween` — если диалог существует, бросает `ConversationAlreadyExistsError(existingId)`.
4. Иначе создаёт новый DIRECT-диалог; `create` участников с `pairKey`.
5. При `P2002` из repository приходит `DuplicateConversationError` → преобразуется в `ConversationAlreadyExistsError` (race condition, AC-03).

### API-слой

[`src/app/api/v1/conversations/route.ts`](../../src/app/api/v1/conversations/route.ts) `POST /api/v1/conversations`:

- **201** — только новый диалог: `data: { conversationId, isNew: true }`.
- **409** — `ConversationAlreadyExistsError` обрабатывается **до** generic `errorResponse()`: `data: { conversationId, isNew: false }` (для редиректа клиента).

### Миграция / backfill

Миграция `prisma/migrations/20260804081300_add_unique_direct_conversation_constraint/migration.sql`:

1. Добавляет столбец `pair_key` в `conversation_participants`.
2. **Backfill:** для существующих DIRECT-диалогов заполняет `pair_key` по паре участников (`computePairKey`).
3. Создаёт partial unique index `unique_direct_pair_key` (`WHERE pair_key IS NOT NULL`).

Для **корректного backfill** требуется сначала вычислить и заполнить `pair_key` для уже созданных DIRECT-диалогов (иначе индекс нельзя наложить из-за возможных дубликатов). Если в данных уже есть дубликаты пар — их необходимо устранить (смержить) до применения индекса.

### Тестирование

| Уровень | Файл | Покрытие |
|---------|------|----------|
| Unit/service | `tests/unit/domains/comms/comms.service.b029.test.ts` | `findConversationBetween` → 409, создание нового → 201, запрет самому себе / блоку, race condition (DuplicateConversationError → ConversationAlreadyExistsError) |
| Unit/repository | `tests/unit/domains/comms/comms.repository.b029.test.ts` | `pairKey`-вычисление, partial уникальность, обработка P2002 |
| API | `tests/api/comms-duplicate-conversation.test.ts` | 201 / 409 / 400, структура ответа (code/data.conversationId) |

**Запуск:**
```bash
npm test -- --grep "comms"
npm run test:api
```

### Связанные требования и артефакты

- [US-21-38: Продолжение существующего личного диалога](../user-stories/US-21-38-продолжение-существующего-личного-диалога.md)
- [US-21-39: Создание нового личного диалога при наличии других](../user-stories/US-21-39-создание-нового-личного-диалога-при-наличии-других.md)
- [REQ-COMMS-004: Запрет дублирующихся личных диалогов](../requirements/REQ-COMMS-004.md)
- [План B-029](../plans/REQ-COMMS-004-B029-plan.md)
- [QA-отчёт B-029](../tests/B-029-qa-report.md)

---

## 15. Разделение состояний загрузки предзагрузки списка диалогов (B-031)

> **B-031** (регрессия B-030, REQ-COMMS-004) — разделение `existingConversations` (собственно данные) и `conversationsLoaded` (флаг завершения предзагрузки) как эталонный паттерн для страниц с предзагрузкой.

### Проблема

На странице начала нового диалога ([`src/app/dashboard/comms/messages/new/page.tsx`](../../src/app/dashboard/comms/messages/new/page.tsx)) ранее использовалось одно состояние `mappingReady`, которое одновременно сигнализировало и о факте завершения предзагрузки, и о готовности данных к использованию.

При **сбое предзагрузки** `GET /api/v1/conversations` (например, HTTP 500) состояние не переводилось в «готово», из-за чего кнопки «Открыть диалог» / «Написать» не отображались — страница «застревала» в состоянии загрузки, и начать диалог с новым собеседником было невозможно.

Дополнительно в repository-слое (`getUserConversations`) использовался non-null assertion `participantMap.get(conversation.id)!`, который при отсутствии участника в `Map` приводил к `TypeError` и серверному HTTP 500.

### Решение

Разделены две независимые оси состояния:

| Состояние | Тип | Назначение |
|-----------|-----|------------|
| `existingConversations` | `Map<string, string>` | Собственно данные: `Map<participantId, conversationId>` существующих диалогов (FR-09). Используется для выбора кнопки «Открыть диалог» / «Написать». |
| `conversationsLoaded` | `boolean` | Флаг завершения предзагрузки, **независимый** от успешности данных. Начальное значение `false`, перевод в `true` происходит в `finally` предзагрузки. |

**Ключевой принцип:** данные и флаг завершения загрузки — это **разные вещи**. Даже при сбое данные сбрасываются в «пустой» `new Map()`, но флаг `conversationsLoaded` всё равно становится `true`, чтобы UI мог отобразить состояние готовности (кнопку «Написать» для нового собеседника).

### Реализация (T1-1 — Page Layer)

```tsx
// existingConversations — всегда Map (без | undefined)
const [existingConversations, setExistingConversations] = useState<Map<string, string>>(new Map());
// conversationsLoaded — флаг завершения предзагрузки
const [conversationsLoaded, setConversationsLoaded] = useState(false);
```

Обработка всех веток предзагрузки с учётом abort-флага:

```tsx
useEffect(() => {
  let aborted = false;
  // ...
  if (!aborted && /* успешный ответ */) {
    setExistingConversations(new Map(...));
  } else if (!aborted) {
    // не-успешный ответ: данные пусты, но загрузка завершена
    setExistingConversations(new Map());
  }
  // ...
  return () => { aborted = true; };
}, []);
```

- `catch { if (!aborted) setExistingConversations(new Map()) }` — при ошибке данные пусты.
- `finally { if (!aborted) setConversationsLoaded(true) }` — флаг завершения срабатывает **всегда** (и при успехе, и при сбое).

Блокировка UI определяется только через флаг завершения:

```tsx
const isMappingLoading = !conversationsLoaded;
```

`UserSelectorList` получает оба пропса (не-опциональный `existingConversations: Map<string, string>` и `conversationsLoaded: boolean`), что упрощает логику выбора кнопки в дочернем компоненте.

### Реализация (T2-1 — Repository Layer)

В `getUserConversations` убран небезопасный non-null assertion и добавлена null-фильтрация:

```typescript
const items = await Promise.all(
  conversations.map(async (conversation) => {
    const participant = participantMap.get(conversation.id);
    if (!participant) {
      // B031-T2-1: корректная обработка отсутствующего participant вместо TypeError → 500
      console.warn(
        `[CommsRepository] Participant not found for conversation ${conversation.id}, skipping`
      );
      return null; // НЕ continue — внутри .map() запрещён
    }
    // ...
  })
);
// Type guard filter отсекает null-элементы
.filter((item): item is NonNullable<typeof item> => item !== null)
```

Это устраняет серверный HTTP 500, если в данных диалог окажется без участника.

### Эталонный паттерн для страниц с предзагрузкой

Для страниц, которые предзагружают данные до отрисовки UI-действий, следует разделять:

1. **Данные** (`existingConversations`) — содержат результат (могут быть пустыми при сбое).
2. **Флаг завершения** (`conversationsLoaded`) — индицирует, что предзагрузка окончена (успех или сбой), и UI может отрисовать финальное состояние.

Это гарантирует, что при сбое предзагрузки страница не зависнет в loading, а отобразит корректное деградированное состояние (например, кнопку «Написать»).

### Тестирование

| Уровень | Файл | Покрытие |
|---------|------|----------|
| E2E | [`tests/e2e/comms/new-conversation.e2e.spec.ts`](../../tests/e2e/comms/new-conversation.e2e.spec.ts) (блок `B031-T3-1`) | EC-04 (Loading-кнопки исчезают при сбое 500), AC-05 (кнопка «Написать» видна для нового собеседника при сбое) |
| Unit | [`tests/unit/domains/comms/comms.repository.b031.test.ts`](../../tests/unit/domains/comms/comms.repository.b031.test.ts) | Null-фильтрация в `getUserConversations` (диалог с отсутствующим участником отфильтрован, `items.length===2`), отсутствие TypeError/HTTP 500 |

**Результаты QA (B-031-qa-report.md):** T3-1 ✅ PASSED (chromium/firefox/webkit), T4-1 ✅ 2 passed, регрессия B-030 (email-поиск, создание диалога при наличии другого) ✅, comms unit регрессия ✅.

### Связанные требования и артефакты

- [REQ-COMMS-004: Запрет дублирующихся личных диалогов](../requirements/REQ-COMMS-004.md)
- [US-21-38: Продолжение существующего личного диалога](../user-stories/US-21-38-продолжение-существующего-личного-диалога.md)
- [US-21-39: Создание нового личного диалога при наличии других](../user-stories/US-21-39-создание-нового-личного-диалога-при-наличии-других.md)
- [Спецификация B-031](../specs/comms/B-031-component-spec.md)
- [План B-031](../plans/REQ-COMMS-004-B031-plan.md)
- [QA-отчёт B-031](../tests/B-031-qa-report.md)

---

## 16. Миграция цветов на токены (B-017, B-018)

> **Задачи:** B-017 — миграция акцентных цветов; B-018 — миграция нейтральных и семантических цветов (R-02…R-07) + очистка `globals.css` от `!important`-переопределений (R-27).

Все страницы и компоненты COMMS UI используют **только** CSS-переменные дизайн-системы `var(--theme-*)` для цветов. Хардкод-классы Tailwind (нейтральные, семантические, акцентные, `dark:`-префиксы) в COMMS отсутствуют.

### Правило

Для нейтральных и семантических цветов **запрещены** хардкод-классы Tailwind (`text-gray-*`, `bg-white`, `bg-red-*`, `text-blue-*` и т.п.) и `dark:`-префиксы. Вместо них используются токены через `[]`-нотацию:

| Хардкод (запрещено) | Токен (обязательно) |
|----------------------|---------------------|
| `text-gray-900` / `text-gray-800` | `text-[var(--theme-text-primary)]` |
| `text-gray-500` / `text-gray-600` / `text-gray-400` | `text-[var(--theme-text-secondary)]` |
| `bg-white` | `bg-[var(--theme-bg-primary)]` |
| `bg-gray-50` / `bg-gray-100` | `bg-[var(--theme-bg-secondary)]` |
| `border-gray-200` | `border-[var(--theme-border-color)]` |
| `border-gray-300` | `border-[var(--theme-input-border)]` |
| `bg-red-50` / `text-red-*` / `border-red-*` | `bg-[var(--theme-danger)]/10`, `text-[var(--theme-danger)]`, `border-[var(--theme-danger)]/20` |
| `bg-blue-*` / `text-blue-*` / `border-blue-*` | `bg-[var(--theme-info)]/10`, `text-[var(--theme-info)]`, `border-[var(--theme-info)]/20` |
| `text-green-*` | `text-[var(--theme-success)]` |
| `text-indigo-600` / `bg-indigo-*` | `text-[var(--theme-accent)]` / `bg-[var(--theme-accent)]` |

### Изменённые файлы (B-018)

| Файл | Изменение |
|------|-----------|
| [`src/app/dashboard/comms/announcements/page.tsx`](../../src/app/dashboard/comms/announcements/page.tsx) | R-02, R-03, R-04, R-06 → токены |
| [`src/app/dashboard/comms/announcements/create/page.tsx`](../../src/app/dashboard/comms/announcements/create/page.tsx) | R-02, R-03, R-04, R-05 → токены |
| [`src/app/dashboard/comms/announcements/[id]/page.tsx`](../../src/app/dashboard/comms/announcements/[id]/page.tsx) | R-06 → токены |
| [`src/app/globals.css`](../../src/app/globals.css) | Удалены `!important`-переопределения (R-27, строки 153–200) |

### Полный список токенов

См. [`docs/design/tokens/colors.md`](../design/tokens/colors.md). Значения во всех 3 темах (Light/Dark/Green) — в [B-017-tokens-review.md](../design/B-017-tokens-review.md).

### Связанные артефакты

- [План B-018](../plans/B-018-tokens-migration-plan.md)
- [Валидация B-018](../plans/B-018-tokens-migration-plan-validation.md)
- [Дизайн-справка B-018](../specs/comms/B-018-ui-design.md)
- [Компонент-спека B-018](../specs/comms/B-018-component-spec.md)
- [Review B-018](../reviews/B-018-review.md)
- [QA-отчёт B-018](../tests/B-018-qa-report.md)
- [Аудит UI COMMS](../design/comms-ui-review.md) (R-02…R-07, R-27)
- [Токены цветов](../design/tokens/colors.md)

---

## 17. Миграция на компоненты дизайн-системы (B-019)

> **Задача:** B-019 — COMMS UI: Переход на компоненты дизайн-системы (Button, Input, Badge, EmptyState, ErrorMessage)
> **Закрытие замечаний:** R-13, R-16, R-22, R-23 из [`docs/design/comms-ui-review.md`](../design/comms-ui-review.md)

### Политика

В COMMS-модуле **запрещено** использовать сырые HTML-элементы `<button>`, `<input>`, `<textarea>`, `<span>` (для статусных бейджей), а также кастомные `div` для ошибок и пустых состояний. Вместо них **обязательно** применяются компоненты дизайн-системы (DS):

| Сырой элемент (запрещено) | DS-компонент (обязательно) |
|---------------------------|---------------------------|
| `<button>` | `<Button variant="...">` |
| `<input type="text">` | `<Input>` |
| `<textarea>` | `<Input as="textarea">` |
| `<span>` (статус/бейдж) | `<Badge variant="...">` |
| `div[role="alert"]` (ошибка) | `<ErrorMessage message={...}>` |
| Кастомное пустое состояние | `<EmptyState>` |

### Расширение `<Input>` для поддержки `as="textarea"`

В ходе B-019 компонент [`Input`](../../src/components/ui/Input/Input.tsx) был расширен для условного рендера `<textarea>`:

- **Проп `as?: "textarea"`** — при значении `"textarea"` компонент рендерит `<textarea>` вместо `<input>`
- **Проп `autoResize?: boolean`** — автоматическая подгонка высоты `<textarea>` по содержимому
- **Типы** — `InputProps` объединяет `InputHTMLAttributes<HTMLInputElement>` и `TextareaHTMLAttributes<HTMLTextAreaElement>`
- **`forwardRef`** — использует объединённый тип `HTMLInputElement | HTMLTextAreaElement`

**Примеры использования:**

```tsx
// Обычное текстовое поле
<Input label="Название" id="name" />

// Многострочное поле с фиксированной высотой
<Input as="textarea" label="Описание" rows={3} />

// Многострочное поле с авто-высотой (для ввода сообщений)
<Input as="textarea" autoResize placeholder="Сообщение..." />
```

### Удаление дублирования UserSelectorList

Из [`src/app/dashboard/comms/messages/new/page.tsx`](../../src/app/dashboard/comms/messages/new/page.tsx) удалена инлайн-версия `UserSelectorList` (R-16). Теперь используется единственный источник — компонент [`UserSelectorList`](../../src/components/features/comms/UserSelectorList/UserSelectorList.tsx) из `features/comms/`.

### Изменённые файлы

| Файл | Изменение |
|------|-----------|
| [`src/components/ui/Input/Input.tsx`](../../src/components/ui/Input/Input.tsx) | Расширен API: `as="textarea"`, `autoResize`, объединённые типы |
| [`src/app/dashboard/comms/chats/page.tsx`](../../src/app/dashboard/comms/chats/page.tsx) | `<button>` → `<Button>`, `<input>` → `<Input>`, `<div error>` → `<ErrorMessage>` |
| [`src/app/dashboard/comms/chats/new/page.tsx`](../../src/app/dashboard/comms/chats/new/page.tsx) | `<input>`, `<textarea>`, `<button>` → DS-компоненты |
| [`src/app/dashboard/comms/chats/[chatId]/edit/page.tsx`](../../src/app/dashboard/comms/chats/[chatId]/edit/page.tsx) | `<button>`, `<div error>` → `<Button>`, `<ErrorMessage>` |
| [`src/app/dashboard/comms/messages/new/page.tsx`](../../src/app/dashboard/comms/messages/new/page.tsx) | Удалено дублирование UserSelectorList (R-16) |
| [`src/components/features/comms/ConversationEmptyState/ConversationEmptyState.tsx`](../../src/components/features/comms/ConversationEmptyState/ConversationEmptyState.tsx) | Заменён на `<EmptyState>` + `<Button>` (R-22) |
| [`src/components/features/comms/ConversationList/ConversationList.tsx`](../../src/components/features/comms/ConversationList/ConversationList.tsx) | `<input>`, `<button>`, `<div error>` → DS-компоненты |
| [`src/components/features/comms/EditChatForm/EditChatForm.tsx`](../../src/components/features/comms/EditChatForm/EditChatForm.tsx) | `<input>`, `<textarea>`, `<button>`, `<div error>` → DS-компоненты |
| [`src/components/features/comms/MessageItem/MessageItem.tsx`](../../src/components/features/comms/MessageItem/MessageItem.tsx) | `<button>` (удаление) → `<Button>`, `<span>` → `<Badge>` |
| [`src/components/features/comms/MessageInput/MessageInput.tsx`](../../src/components/features/comms/MessageInput/MessageInput.tsx) | `<textarea>`, `<button>` → `<Input as="textarea">`, `<Button>` |
| [`src/components/features/comms/ParticipantSelector/ParticipantSelector.tsx`](../../src/components/features/comms/ParticipantSelector/ParticipantSelector.tsx) | `<input>`, `<button>` → `<Input>`, `<Button>` |
| [`src/components/features/comms/UserSelectorList/UserSelectorList.tsx`](../../src/components/features/comms/UserSelectorList/UserSelectorList.tsx) | `<input>`, `<button>`, `<div error>` → DS-компоненты |
| [`src/components/features/comms/ConversationDetailPage/ConversationDetailPage.tsx`](../../src/components/features/comms/ConversationDetailPage/ConversationDetailPage.tsx) | `<div error>` → `<ErrorMessage>` |

### Связанные артефакты

- [План B-019](../plans/B-019-ds-components-migration-plan.md)
- [Валидация B-019](../plans/B-019-ds-components-migration-plan-validation.md)
- [Дизайн-справка B-019](../specs/comms/B-019-ui-design.md)
- [Компонент-спека B-019](../specs/comms/B-019-component-spec.md)
- [Review B-019](../reviews/B-019-review.md)
- [QA-отчёт B-019](../tests/B-019-qa-report.md)
- [Аудит UI COMMS](../design/comms-ui-review.md) (R-13, R-16, R-22, R-23)

---

## 18. Скелетоны, breadcrumbs и удаление сообщения (B-020)

> **Задача:** B-020 — COMMS UI: скелетоны, breadcrumbs и кнопка удаления сообщения (R-14, R-15, R-19, R-20)
> **Статус:** ✅ Завершено (Code Review APPROVE, QA PASS)

Данный раздел описывает изменения UX, внесённые в рамках B-020: состояния загрузки (скелетоны), навигация (breadcrumbs) и действие удаления сообщения с подтверждением.

### 18.1 Скелетоны вместо спиннеров (R-14)

Спиннеры заменены на **скелетоны** — пульсирующие блоки с `animate-pulse` и `var(--theme-bg-secondary)`. Скелетоны применены в:

| Компонент / страница | Содержимое скелетона |
|----------------------|----------------------|
| `ConversationList` | 4 pulsing-карточки (аватар + строки текста + время) |
| `ConversationMessagesList` | 3 pulsing-сообщения (аватар + пузырёк) |
| `messages/page.tsx` | заголовок (h-8) + карточка списка (4 блока) |
| `chats/page.tsx` | заголовок + кнопка «Создать чат» + карточки (4 блока) |

Обязательные инварианты скелетонов:

- **`animate-pulse`** — пульсирующая анимация;
- **CSS-токены** — фон через `var(--theme-bg-secondary)`, запрещены `bg-gray-*`/`bg-white`/`text-indigo-*`;
- **A11y** — `role="status"` и `aria-live="polite"`.

> **Ограничение (P-04):** спиннер внутри `<Button isLoading>` (состояние «отправка/сохранение») НЕ заменяется скелетоном — это индикатор действия кнопки, а не загрузки страницы.

### 18.2 Breadcrumbs на подстраницах COMMS (R-15)

Добавлен компонент `<Breadcrumbs />` на **7 подстраниц** модуля:

- `messages/page.tsx`
- `messages/new/page.tsx`
- `messages/[conversationId]/page.tsx`
- `chats/page.tsx`
- `chats/new/page.tsx`
- `chats/[chatId]/page.tsx`
- `chats/[chatId]/edit/page.tsx`

Поведение:

- Родительские уровни кликабельны;
- Последний уровень — `<span aria-current="page">`;
- `hidden md:flex` — скрывается на мобильных (breakpoint `md`).

В рамках B-020 также выполнена **миграция** [`Breadcrumbs.tsx`](../../src/components/layouts/Breadcrumbs.tsx) на CSS-токены: `text-gray-*` → `var(--theme-text-*)`, `focus:ring-blue-500` → `var(--theme-accent)`. Хардкод-классы запрещены.

### 18.3 Удаление сообщения с ConfirmDialog (R-19)

В [`MessageItem.tsx`](../../src/components/features/comms/MessageItem/MessageItem.tsx) кнопка удаления:

- видна **только для `isCurrentUser`** (свои сообщения);
- клик **открывает** `<ConfirmDialog variant="danger">`, а не вызывает `onDelete` сразу;
- после подтверждения вызывается `onDelete(message.id)`, диалог закрывается;
- диалог закрывается по `onClose` / Escape.

В рамках B-020 выполнен перевод [`ConfirmDialog.tsx`](../../src/components/ui/ConfirmDialog/ConfirmDialog.tsx) на CSS-токены (`var(--theme-accent)`, `var(--theme-danger)`, `var(--theme-bg-primary)`, `var(--theme-text-*)`).

### 18.4 Кнопка отправки (R-20, верификация)

[`MessageInput.tsx`](../../src/components/features/comms/MessageInput/MessageInput.tsx) использует `<Button variant="primary">` с фоном `var(--theme-accent)`. Иконка видна, `disabled` блокирует. Верификация подтвердила корректность — замечание R-20 закрыто.

### 18.5 Токен `--theme-bg-overlay`

В [`globals.css`](../../src/app/globals.css) добавлен токен `--theme-bg-overlay` (3 темы: light, dark, green) — фон модальных оверлеев (используется ConfirmDialog).

### 18.6 Компонент-тесты B-020

Добавлено **29 компонент-тестов** в `tests/components/features/comms/`:

| Файл | Покрытие |
|------|----------|
| `ConversationList.skeleton.test.tsx` | AC-R14-1, -5, -6, -7 (4 теста) |
| `ConversationMessagesList.skeleton.test.tsx` | AC-R14-2, -5, -6, -7 (4 теста) |
| `comms-pages.skeleton.test.tsx` | AC-R14-3, -4 + AC-R15-1 (4 теста) |
| `MessageItem.delete.test.tsx` | AC-R19-1..7 (7 тестов) |
| `comms-breadcrumbs.test.tsx` | AC-R15-1..6 (10 тестов) |

### Связанные артефакты

- [План B-020](../plans/B-020-skeletons-breadcrumbs-plan.md)
- [Валидация B-020](../plans/B-020-skeletons-breadcrumbs-plan-validation.md)
- [Дизайн-справка B-020](../specs/comms/B-020-ui-design.md)
- [Компонент-спека B-020](../specs/comms/B-020-component-spec.md)
- [Review B-020](../reviews/B-020-review.md)
- [QA-отчёт B-020](../tests/B-020-qa-report.md)
- [Аудит UI COMMS](../design/comms-ui-review.md) (R-14, R-15, R-19, R-20)

---

## 19. Доступность и рефакторинг токенов бейджей (B-021)

> **Задача:** B-021 — COMMS UI: Рефакторинг globals.css и доступность (R-17, R-25, R-26, R-27)
> **Статус:** ✅ Завершено (Component Spec 20/20 AC, Code Review APPROVE, QA PASS — 13 новых тестов)
> **Закрытие замечаний:** R-17, R-25, R-26, R-27 из [`docs/design/comms-ui-review.md`](../design/comms-ui-review.md)

Данный раздел описывает очистку технического долга B-021: удаление `!important`-переопределений из `globals.css` и миграцию статус-бейджей на токены (R-27), отказ от `dark:`-префиксов в COMMS (R-25), а также внедрение aria-паттерна для индикаторов загрузки (R-17/R-26).

### 19.1 Токены статус-бейджей `--theme-badge-*` (R-27)

В [`globals.css`](../../src/app/globals.css) добавлены токены статус-бейджей для **всех 3 тем** (light, dark, green):

| Токен | Назначение |
|-------|------------|
| `--theme-badge-default-bg` / `--theme-badge-default-color` | Нейтральный статус |
| `--theme-badge-success-bg` / `--theme-badge-success-color` | Успех / активен |
| `--theme-badge-warning-bg` / `--theme-badge-warning-color` | Предупреждение / ожидание |
| `--theme-badge-danger-bg` / `--theme-badge-danger-color` | Ошибка / удаление |
| `--theme-badge-info-bg` / `--theme-badge-info-color` | Информация |

Значения во всех 3 темах — см. [`docs/design/tokens/colors.md`](../design/tokens/colors.md).

Статус-бейджи в следующих компонентах мигрированы на эти токены (вместо хардкод-классов `bg-{gray,green,yellow,red,blue}-100`):

| Файл | Изменение |
|------|-----------|
| [`src/components/features/documents/DocumentCard/DocumentCard.tsx`](../../src/components/features/documents/DocumentCard/DocumentCard.tsx) | Статусы документа → `var(--theme-badge-{default,success,warning}-{bg,color})` |
| [`src/components/features/documents/DocumentDetail/DocumentDetail.tsx`](../../src/components/features/documents/DocumentDetail/DocumentDetail.tsx) | Статусы → `var(--theme-badge-*)` |
| [`src/components/features/comms/ChatList/ChatList.tsx`](../../src/components/features/comms/ChatList/ChatList.tsx) | Статусные бейджи → `var(--theme-badge-*)` |
| [`src/components/features/comms/UserList/UserList.tsx`](../../src/components/features/comms/UserList/UserList.tsx) | Статус пользователя → `var(--theme-badge-*)` |
| [`src/components/features/documents/DeleteCategoryDialog/DeleteCategoryDialog.tsx`](../../src/components/features/documents/DeleteCategoryDialog/DeleteCategoryDialog.tsx) | Опасные элементы → `var(--theme-badge-danger-bg)` |

**`!important`-переопределения** из `globals.css`, оставшиеся после предыдущих миграций цвета на токены (B-017/B-018), **удалены полностью** (R-27). Миграция бейджей была предпосылкой для этой очистки.

### 19.2 Отказ от `dark:`-префиксов в COMMS (R-25)

Все `dark:`-префиксы в COMMS-компонентах заменены на CSS-переменные. Пример: [`ConversationMessagesList`](../../src/components/features/comms/ConversationMessagesList/ConversationMessagesList.tsx) использует `var(--theme-border-color)` вместо `dark:border-*`.

Правило: в COMMS **запрещены** `dark:`-префиксы и хардкод-классы цветов — используется исключительно `var(--theme-*)` (дополняет политику раздела 16).

### 19.3 aria-паттерн индикаторов загрузки (R-17/R-26)

Добавлен паттерн для **всех индикаторов загрузки (спиннеров)** в COMMS:

```
<div role="status" aria-live="polite">
  <svg aria-hidden="true">…</svg>
  <span class="sr-only">Загрузка…</span>
</div>
```

- **`role="status"` + `aria-live="polite"`** — на контейнере спиннера, чтобы скринридер объявил изменение состояния без прерывания.
- **`aria-hidden="true"`** — на декоративном `<svg>`, чтобы иконка не озвучивалась отдельно.
- **`sr-only`** — скрытый доступный текст-заглушка.

Паттерн применён к **10 спиннерам** в COMMS, включая спиннер загрузки сессии на страницах `messages`/`chats` и спиннер поиска участников в `ParticipantSelector`.

> Визуальный вид спиннера (`animate-spin`, `text-[var(--theme-accent)]`) не изменён (негативные критерии AC-NEG-06 и др.).

### 19.4 Компонент-тесты B-021 (13 новых)

| Файл | Покрытие |
|------|----------|
| `tests/components/features/comms/ParticipantSelector.a11y.test.tsx` | AC-R17/26-7, AC-NEG-06 (спиннер поиска участников) |
| `tests/components/features/comms/comms-pages-spinner-a11y.test.tsx` | AC-R17/26-1..6 (спиннеры страниц messages/chats) |
| `tests/components/features/documents/documents-badges-tokens.test.tsx` | AC-R27-1, AC-R27-6, AC-NEG-04 (миграция badge-токенов) |

### 19.5 Компонент-спека и покрытие

- **20 AC** в [`docs/specs/comms/B-021-component-spec.md`](../specs/comms/B-021-component-spec.md) — покрыты на **100%**.
- **Code Review** — [`docs/reviews/B-021-review.md`](../reviews/B-021-review.md) — **APPROVE**.
- **QA-отчёт** — [`docs/tests/B-021-qa-report.md`](../tests/B-021-qa-report.md) — **PASS** (13 новых тестов).

### Связанные артефакты

- [План B-021](../plans/B-021-globals-a11y-plan.md)
- [UI-дизайн B-021](../specs/comms/B-021-ui-design.md)
- [Компонент-спека B-021](../specs/comms/B-021-component-spec.md)
- [Review B-021](../reviews/B-021-review.md)
- [QA-отчёт B-021](../tests/B-021-qa-report.md)
- [Аудит UI COMMS](../design/comms-ui-review.md) (R-17, R-25, R-26, R-27)
- [Токены цветов](../design/tokens/colors.md)

---

## 20. Минорные правки UX (B-022)

> **Задача:** B-022 — COMMS UI: Минорные правки UX (R-18, R-21, R-24, R-28, R-29)
> **Статус:** ✅ Завершено (Component Spec 24/24 AC, Code Review APPROVE, QA PASS — 16 новых тестов)
> **Закрытие замечаний:** R-18, R-21, R-24, R-28, R-29 из [`docs/design/comms-ui-review.md`](../design/comms-ui-review.md)

Данный раздел описывает минорные UX-правки B-022, приведшие UI-компоненты и страницы COMMS в соответствие с макетом и дизайн-системой.

### 20.1 Аватар `h-10 w-10` в ConversationCard (R-18)

В [`ConversationCard`](../../src/components/features/comms/ConversationCard/ConversationCard.tsx) размер аватара приведён к единому стандарту `h-10 w-10`:

- `<img>` аватара — `h-10 w-10` (было `h-11 w-11`).
- Fallback-блок (при отсутствии аватара) — также `h-10 w-10`.
- `rounded-full` сохранён (img + fallback).
- Аватар в [`MessageItem`](../../src/components/features/comms/MessageItem/MessageItem.tsx) остаётся `w-10 h-10` (регрессия не внесена).

### 20.2 Перенос ChatList/ChatCard в features/comms (R-21)

Компоненты `ChatList` и `ChatCard` перенесены из `features/chats/` в `features/comms/`:

| Файл | Изменение |
|------|-----------|
| [`src/components/features/comms/ChatList/ChatList.tsx`](../../src/components/features/comms/ChatList/ChatList.tsx) | 🆕 Перенесён из `features/chats/` |
| [`src/components/features/comms/ChatCard/ChatCard.tsx`](../../src/components/features/comms/ChatCard/ChatCard.tsx) | 🆕 Перенесён из `features/chats/` |
| `features/chats/` | 🗑 Удалена полностью |

При этом:
- `chats/page.tsx` импортирует `ChatList` из `features/comms/`.
- `ChatList.tsx` импортирует `ChatCard` из `features/comms/`.
- Обновлены `vi.mock` в тестах `comms-pages.skeleton.test.tsx` и `comms-pages-spinner-a11y.test.tsx`.
- В `src/` отсутствуют импорты из `features/chats` (grep → 0).
- Визуальная идентичность ChatCard/ChatList сохранена.

### 20.3 Отсутствие bg-акцента isLastMessage (R-24)

В [`MessageItem`](../../src/components/features/comms/MessageItem/MessageItem.tsx):

- Убран визуальный акцент `bg-[var(--theme-info)]/10` и подушки для последнего сообщения (`isLastMessage`).
- Сохранён `animate-fade-in` для анимации появления.
- Проп `isLastMessage?` остаётся в интерфейсе `MessageItemProps` (для совместимости и будущего использования через анимацию).

### 20.4 Fallback «чат не найден» (R-28)

В [`chats/[chatId]/edit/page.tsx`](../../src/app/dashboard/comms/chats/[chatId]/edit/page.tsx) состояние «чат не найден» дополнено:

- Заголовок (например, «Чат не найден»).
- Кнопка «Назад» → `router.push('/dashboard/comms/chats')`.
- Компонент [`<ErrorMessage>`](../../src/components/ui/ErrorMessage/ErrorMessage.tsx) с деталями ошибки.

> Паттерн соответствует обработке «диалог не найден» в личных диалогах ([`ConversationDetailPage`](../../src/components/features/comms/ConversationDetailPage/ConversationDetailPage.tsx)).

### 20.5 Стрелка chevron + hover на карточке диалога (R-29)

В [`ConversationCard`](../../src/components/features/comms/ConversationCard/ConversationCard.tsx):

- Добавлена иконка-стрелка (chevron), указывающая на переход к диалогу.
- Добавлен hover-эффект на карточке (акцентный фон/бордер), сигнализирующий интерактивность.

### 20.6 Компонент-тесты B-022 (16 новых)

| Файл | Тестов | Покрытые AC |
|------|:------:|-------------|
| `tests/components/features/comms/ConversationCard.test.tsx` | 6 | AC-R18-1, -2, AC-NEG-02, AC-R29-1..3 |
| `tests/components/features/comms/MessageItem.no-accent.test.tsx` | 4 | AC-R24-1..3, AC-NEG-01 |
| `tests/components/features/comms/edit-page-notfound.test.tsx` | 3 | AC-R28-1..3 |
| `tests/components/features/comms/ChatList.render.test.tsx` | 3 | AC-R21-1, -2, -4, -9 |

**Итого новых тестов: 16.** Всего компонентных тестов COMMS после B-022 — **115** (100% passed).

### 20.7 Компонент-спека и покрытие

- **24 AC** в [`docs/specs/comms/B-022-component-spec.md`](../specs/comms/B-022-component-spec.md) — покрыты на **100%**.
- **Code Review** — [`docs/reviews/B-022-review.md`](../reviews/B-022-review.md) — **APPROVE**.
- **QA-отчёт** — [`docs/tests/B-022-qa-report.md`](../tests/B-022-qa-report.md) — **PASS** (16 новых тестов).

### Связанные артефакты

- [План B-022](../plans/B-022-ux-minor-plan.md)
- [UI-дизайн B-022](../specs/comms/B-022-ui-design.md)
- [Компонент-спека B-022](../specs/comms/B-022-component-spec.md)
- [Review B-022](../reviews/B-022-review.md)
- [QA-отчёт B-022](../tests/B-022-qa-report.md)
- [Аудит UI COMMS](../design/comms-ui-review.md) (R-18, R-21, R-24, R-28, R-29)

---

## История изменений

| Версия | Дата | Описание |
|--------|------|----------|
| 1.11 | 2026-08-07 | Добавлен раздел 20 «Минорные правки UX» (B-022) |
| 1.10 | 2026-08-07 | Добавлен раздел 19 «Доступность и рефакторинг токенов бейджей» (B-021) |
| 1.9 | 2026-08-07 | Добавлен раздел 18 «Скелетоны, breadcrumbs и удаление сообщения» (B-020) |
| 1.8 | 2026-08-07 | Добавлен раздел 17 «Миграция на компоненты дизайн-системы» (B-019) |
| 1.7 | 2026-08-06 | Добавлен раздел 16 «Миграция цветов на токены» (B-017, B-018) |
| 1.6 | 2026-08-06 | Добавлен раздел 15 «Разделение состояний загрузки предзагрузки списка диалогов» (B-031) |
| 1.5 | 2026-08-04 | Добавлен раздел 14 «Запрет дублирования личных диалогов» (B-029) |
| 1.4 | 2026-08-03 | Добавлен раздел 13 «Корректный учёт непрочитанных сообщений» (B-027) |
| 1.3 | 2026-08-03 | Добавлен раздел 12 «Механизм отметки прочитанных и Read Receipts» (B-026) |
| 1.2 | 2026-07-31 | Добавлен раздел 11 «Layout-паттерн: Ограничение ширины и центрирование зоны сообщений» (B-025) |
| 1.1 | 2026-07-28 | Добавлен раздел 10 «Layout-паттерн: Sticky-низ контрола ввода сообщений» (B-023) |
| 1.0 | 2026-07-24 | Первоначальное руководство разработчика (MVP) |
