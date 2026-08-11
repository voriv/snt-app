# Спецификация компонент: Унификация дизайна чатов (B-024)

> **Назначение:** Спецификация компонент и скелетов кода для [B-024](../../plans/B-024-chat-design-unification-plan.md)
> **Создано:** `component-spec` режим
> **Статус:** `[DRAFT]`

---

## 1. 📋 Метаданные

| Параметр | Значение |
|---|---|
| **Feature** | `comms-chat-design` |
| **План реализации** | [`docs/plans/B-024-chat-design-unification-plan.md`](../../plans/B-024-chat-design-unification-plan.md) |
| **User Stories** | [US-38-01](../../user-stories/US-38-01-единый-визуальный-шаблон-чатов.md), [US-38-02](../../user-stories/US-38-02-фон-зоны-сообщений-и-контрастность-пузырьков.md) |
| **Требования** | REQ-COMMS-002 |
| **Модель данных** | Без изменений (чистый UI/CSS) |
| **Дизайн-ревью** | [`docs/design/B-024-chat-design-review.md`](../../design/B-024-chat-design-review.md) |
| **Версия** | `v1.0` |
| **Дата** | `2026-07-31` |
| **Статус** | `[DRAFT]` |

---

## 2. 📊 Матрица трассировки

> Каждая строка связывает компонент с требованиями. Без строки в матрице — нет компонента.
> Действия: 🆕 — создать файл, ✏️ — добавить в существующий, 🔧 — изменить существующее.

| # | Компонент | Слой | Действие | US | AC | Задача | Статус |
|---|---|---|---|---|---|---|---|
| 1 | CSS-переменные чата (`globals.css`) | CSS | 🔧 | US-38-02 | AC-2 | B-024-T1-1 | `[TODO]` |
| 2 | `MessageItem` — цвета пузырьков | UI/Feature | 🔧 | US-38-02 | AC-4, AC-5 | B-024-T2-1 | `[TODO]` |
| 3 | `ConversationMessagesList` — фон + onDelete | UI/Feature | 🔧 | US-38-02 | AC-1, AC-7 | B-024-T3-1, B-024-T10-1 | `[TODO]` |
| 4 | `ChatHeader` | UI/Feature | 🆕 | US-38-01 | AC-3, AC-4, AC-6 | B-024-T4-1 | `[TODO]` |
| 5 | `ChatLayout` | UI/Layout | 🆕 | US-38-01 | AC-1, AC-2, AC-6, AC-7 | B-024-T5-1 | `[TODO]` |
| 6 | `ConversationDetailPage` — адаптация | UI/Feature | 🔧 | US-38-01 | AC-1, AC-2 | B-024-T7-1 | `[TODO]` |
| 7 | `messages/[conversationId]/page.tsx` | Page | 🔧 | US-38-01 | AC-1 | B-024-T8-1 | `[TODO]` |
| 8 | `chats/[chatId]/page.tsx` — адаптация + пагинация | Page | 🔧 | US-38-01 | AC-1, AC-2, AC-5 | B-024-T9-1 | `[TODO]` |

### Проверка покрытия AC

| US | AC | Покрыт в строке | Статус |
|---|---|---|---|
| US-38-01 | AC-1 (Единая структура страниц) | #5, #6, #7, #8 | ✅ |
| US-38-01 | AC-2 (Единый компонент-обёртка) | #5, #6, #8 | ✅ |
| US-38-01 | AC-3 (Структура заголовка) | #4, #5 | ✅ |
| US-38-01 | AC-4 (Разделитель заголовка) | #4, #5 | ✅ |
| US-38-01 | AC-5 (Пагинация в групповом чате) | #8 | ✅ |
| US-38-01 | AC-6 (Фиксированный заголовок) | #4, #5 | ✅ |
| US-38-01 | AC-7 (Поле ввода внизу) | #5 | ✅ |
| US-38-02 | AC-1 (Фон отличается от фона страницы) | #1, #3 | ✅ |
| US-38-02 | AC-2 (Фон для каждой темы) | #1 | ✅ |
| US-38-02 | AC-3 (Обновление при смене темы) | #1 | ✅ |
| US-38-02 | AC-4 (Контраст чужих пузырьков) | #1, #2 | ✅ |
| US-38-02 | AC-5 (Контраст своих пузырьков) | #1, #2 | ✅ |
| US-38-02 | AC-6 (Единый фон для обоих типов) | #1, #3, #5 | ✅ |
| US-38-02 | AC-7 (Компонент применяет фон) | #3 | ✅ |

---

## 3. 🏗️ Спецификация по слоям

> Данная спецификация покрывает CSS-слой (globals.css) и UI-слой (Components, Pages).
> Domain/API слои — без изменений (унификация — чистый UI/CSS).

---

### 3.1 CSS Layer — Переменные фона чата

---

#### 3.1.1 `globals.css` — добавление CSS-переменных для чата

| Параметр | Значение |
|---|---|
| **Файл** | `src/app/globals.css` |
| **Действие** | 🔧 Изменить |
| **Задача** | B-024-T1-1 |
| **Трассировка** | US-38-02 AC-2 |

**Что добавить:**

В каждую тему (`[data-theme='light']`, `[data-theme='dark']`, `[data-theme='green']`) добавить блок переменных:

```css
/* Переменные фона чата и пузырьков */
--chat-bg: /* значение для темы */;
--chat-bubble-other-bg: /* фон чужого пузырька */;
--chat-bubble-own-bg: /* фон своего пузырька */;
--chat-bubble-other-color: /* текст чужого пузырька */;
--chat-bubble-own-color: /* текст своего пузырька */;
```

**Значения по темам:**

| Тема | `--chat-bg` | `--chat-bubble-other-bg` | `--chat-bubble-own-bg` | `--chat-bubble-other-color` | `--chat-bubble-own-color` |
|------|-------------|--------------------------|------------------------|----------------------------|--------------------------|
| `light` | `#f0f2f5` | `#ffffff` | `#1976d2` | `#111827` | `#ffffff` |
| `dark` | `#1e1e1e` | `#2d2d2d` | `#8b5cf6` | `#f9fafb` | `#ffffff` |
| `green` | `#045c43` | `#065f46` | `#10b981` | `#ecfdf5` | `#ffffff` |

**Обоснование выбора цветов:**

- **Светлая тема:** Фон зоны — серый `#f0f2f5` (как в Telegram/WhatsApp). Чужие пузырьки — белые (контраст с фоном). Свои — акцент `#1976d2`.
- **Тёмная тема:** Фон зоны — `#1e1e1e` (отличается от `--theme-bg-primary: #111827`). Чужие пузырьки — `#2d2d2d` (контраст). Свои — акцент `#8b5cf6`.
- **Зелёная тема:** Фон зоны — `#045c43` (оттенок зелёного, отличающийся от `--theme-bg-primary: #064e3b`). Чужие пузырьки — `#065f46`. Свои — `#10b981`.

**Чек-лист:**

- [ ] `--chat-bg` определён для всех 3 тем
- [ ] `--chat-bubble-other-bg` определён для всех 3 тем
- [ ] `--chat-bubble-own-bg` определён для всех 3 тем
- [ ] `--chat-bubble-other-color` определён для всех 3 тем
- [ ] `--chat-bubble-own-color` определён для всех 3 тем
- [ ] Контраст каждого пузырька с `--chat-bg` визуально проверен

---

### 3.2 UI Layer — Изменение существующих компонентов

---

#### 3.2.1 `MessageItem` — цвета пузырьков через CSS-переменные

| Параметр | Значение |
|---|---|
| **Файл** | `src/components/features/comms/MessageItem/MessageItem.tsx` |
| **Тип** | Client Component |
| **Действие** | 🔧 Изменить |
| **Задача** | B-024-T2-1 |
| **Трассировка** | US-38-02 AC-4, AC-5 |

**Текущее состояние (line 111-116):**

```tsx
// Пузырёк сообщения
className={cn(
  'rounded-lg px-4 py-2 shadow-sm',
  isCurrentUser
    ? 'bg-[var(--theme-accent)] text-white rounded-tr-none'
    : 'bg-[var(--theme-bg-primary)] text-[var(--theme-text-primary)] rounded-tl-none'
)}
```

**Целевое состояние:**

```tsx
// Пузырёк сообщения
className={cn(
  'rounded-lg px-4 py-2 shadow-sm',
  isCurrentUser
    ? 'bg-[var(--chat-bubble-own-bg)] text-[var(--chat-bubble-own-color)] rounded-tr-none'
    : 'bg-[var(--chat-bubble-other-bg)] text-[var(--chat-bubble-other-color)] rounded-tl-none'
)}
```

**Также изменить аватар (line 72-77):**

```tsx
// Было:
isCurrentUser
  ? 'bg-[var(--theme-accent)] text-white ml-3'
  : 'bg-[var(--theme-bg-secondary)] text-[var(--theme-text-primary)] mr-3'

// Стало:
isCurrentUser
  ? 'bg-[var(--chat-bubble-own-bg)] text-[var(--chat-bubble-own-color)] ml-3'
  : 'bg-[var(--chat-bubble-other-bg)] text-[var(--chat-bubble-other-color)] mr-3'
```

**Интерфейс — без изменений:**

| Пропс | Тип | Описание |
|---|---|---|
| `message` | `MessageWithSender` | Данные сообщения |
| `currentUserId` | `string` | ID текущего пользователя |
| `isLastMessage` | `boolean?` | Флаг последнего сообщения |

**Чек-лист:**

- [ ] Пузырёк чужих сообщений: `bg-[var(--chat-bubble-other-bg)] text-[var(--chat-bubble-other-color)]`
- [ ] Пузырёк своих сообщений: `bg-[var(--chat-bubble-own-bg)] text-[var(--chat-bubble-own-color)]`
- [ ] Аватар синхронизирован с цветами пузырьков
- [ ] Визуальный контраст проверен для всех 3 тем

---

#### 3.2.2 `ConversationMessagesList` — фон зоны сообщений + onDelete prop

| Параметр | Значение |
|---|---|
| **Файл** | `src/components/features/comms/ConversationMessagesList/ConversationMessagesList.tsx` |
| **Тип** | Client Component |
| **Действие** | 🔧 Изменить |
| **Задача** | B-024-T3-1, B-024-T10-1 |
| **Трассировка** | US-38-02 AC-1, AC-7 |

**Изменение 1: Добавить `bg-[var(--chat-bg)]` к контейнеру скролла (line 121-126):**

```tsx
// Было:
className={cn(
  'flex-1 overflow-y-auto px-4 py-6',
  '[overflow-anchor:none]',
  'scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600',
  'scrollbar-track-transparent'
)}

// Стало:
className={cn(
  'flex-1 overflow-y-auto px-4 py-6',
  'bg-[var(--chat-bg)]',
  '[overflow-anchor:none]',
  'scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600',
  'scrollbar-track-transparent'
)}
```

**Изменение 2: Добавить `onDelete` prop в интерфейс:**

```tsx
export interface ConversationMessagesListProps {
  messages: MessageWithSender[];
  currentUserId: string;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  lastMessageId?: string;
  onDelete?: (messageId: string) => void; // ← добавлено
}
```

**Изменение 3: Передать `onDelete` в `MessageItem`:**

```tsx
<MessageItem
  key={message.id}
  message={message}
  currentUserId={currentUserId}
  isLastMessage={index === messages.length - 1}
  onDelete={onDelete} // ← передать
/>
```

**Чек-лист:**

- [ ] `bg-[var(--chat-bg)]` добавлен к контейнеру скролла
- [ ] `onDelete` добавлен в interface
- [ ] `onDelete` передан в `MessageItem`
- [ ] EmptyState inherits фон зоны сообщений
- [ ] Загрузочный индикатор inherits фон

---

### 3.3 UI Layer — Новые компоненты

---

#### 3.3.1 `ChatHeader` — единый компонент заголовка чата

| Параметр | Значение |
|---|---|
| **Файл** | `src/components/features/comms/ChatHeader/ChatHeader.tsx` |
| **Re-export** | `src/components/features/comms/ChatHeader/index.ts` |
| **Тип** | Client Component (`'use client'`) |
| **Действие** | 🆕 Создать |
| **Задача** | B-024-T4-1 |
| **Трассировка** | US-38-01 AC-3, AC-4, AC-6 |

**ASCII-макет:**

```
┌──────────────────────────────────────────────────────────────┐
│ bg-[var(--theme-bg-primary)], border-b, flex-shrink-0        │
│                                                              │
│  [←] [Название чата/диалога...                 [✎] [👥] [⋮]  │
│       │подпись (опционально)│                                  │
│                                                              │
│  ──────────────────────────────────────────────────────────  │
│        border-[var(--theme-border-color)]                     │
└──────────────────────────────────────────────────────────────┘
```

**Props Interface:**

| Пропс | Тип | Обязательный | Описание |
|---|---|---|---|
| `title` | `string` | ✅ | Название чата/диалога |
| `description` | `string?` | ❌ | Описание (для групповых чатов) |
| `onBack` | `() => void` | ✅ | Callback возврата назад |
| `actions` | `React.ReactNode?` | ❌ | Слот для кнопок действий справа |
| `avatar` | `React.ReactNode?` | ❌ | Аватар/иконка чата (опционально) |

**Структура компонента:**

```tsx
<div
  className="flex-shrink-0 px-4 py-3 border-b border-[var(--theme-border-color)] bg-[var(--theme-bg-primary)]"
  role="banner"
>
  <div className="flex items-center gap-3">
    {/* Кнопка "Назад" */}
    <button
      onClick={onBack}
      className="p-2 rounded-lg hover:bg-[var(--theme-bg-secondary)] transition-colors"
      aria-label="Вернуться к списку"
    >
      <ArrowLeftIcon className="w-5 h-5 text-[var(--theme-text-secondary)]" />
    </button>

    {/* Аватар (опционально) */}
    {avatar}

    {/* Информация о чате */}
    <div className="flex-1 min-w-0">
      <h2 className="font-medium text-[var(--theme-text-primary)] truncate">{title}</h2>
      {description && (
        <p className="text-sm text-[var(--theme-text-secondary)] truncate">{description}</p>
      )}
    </div>

    {/* Действия */}
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
</div>
```

**Tailwind-классы:**

| Элемент | Классы |
|---|---|
| Корневой div | `flex-shrink-0 px-4 py-3 border-b border-[var(--theme-border-color)] bg-[var(--theme-bg-primary)]` |
| Внутренний flex | `flex items-center gap-3` |
| Кнопка «Назад» | `p-2 rounded-lg hover:bg-[var(--theme-bg-secondary)] transition-colors` |
| Иконка «Назад» | `w-5 h-5 text-[var(--theme-text-secondary)]` |
| Название | `font-medium text-[var(--theme-text-primary)] truncate` |
| Описание | `text-sm text-[var(--theme-text-secondary)] truncate` |
| Слот действий | `flex items-center gap-2` |

**Состояния:**

| Состояние | Условие | Отображение |
|---|---|---|
| `с description` | `description` передан | Двухстрочный заголовок (название + описание) |
| `без description` | `description` не передан | Однострочный заголовок |
| `с actions` | `actions` передан | Кнопки действий справа |
| `без actions` | `actions` не передан | Только назад + информация |

**A11y:**

- `role="banner"` — корневой div
- `aria-label="Вернуться к списку"` — кнопка «Назад»
- `<h2>` для названия (семантический заголовок)
- Keyboard: Tab + Enter

**Зависимости:**

- `lucide-react` — `ArrowLeft`
- `@/shared/utils` — `cn`

**Чек-лист:**

- [ ] Компонент создан с интерфейсом `ChatHeaderProps`
- [ ] Кнопка «Назад» с `aria-label`
- [ ] Название с `truncate` для длинных имён
- [ ] `description` опционален (двухстрочный заголовок)
- [ ] `actions` — slot для кнопок действий
- [ ] `avatar` — slot для аватара
- [ ] `flex-shrink-0` — заголовок не сжимается
- [ ] `border-b` — разделительная линия
- [ ] `bg-[var(--theme-bg-primary)]` — фон заголовка = фон страницы
- [ ] `role="banner"` — ARIA-роль
- [ ] Re-export через `index.ts`

---

#### 3.3.2 `ChatLayout` — единая обёртка для страниц чатов

| Параметр | Значение |
|---|---|
| **Файл** | `src/components/features/comms/ChatLayout/ChatLayout.tsx` |
| **Re-export** | `src/components/features/comms/ChatLayout/index.ts` |
| **Тип** | Client Component (`'use client'`) |
| **Действие** | 🆕 Создать |
| **Задача** | B-024-T5-1 |
| **Трассировка** | US-38-01 AC-1, AC-2, AC-6, AC-7 |

**ASCII-макет:**

```
┌──────────────────────────────────────────────────────────┐
│ [ChatLayout: flex flex-col h-full]                       │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ [ChatHeader: flex-shrink-0]                          │ │
│ │ ← [Название чата]                          [Действия] │ │
│ │ ───────────────────────────────────────────────────  │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ [children: flex flex-col flex-1 min-h-0]             │ │
│ │                                                      │ │
│ │ ┌──────────────────────────────────────────────────┐ │ │
│ │ │ [ConversationMessagesList: flex-1 overflow-y-auto] │ │ │
│ │ │ bg-[var(--chat-bg)]                               │ │ │
│ │ │                                                    │ │ │
│ │ │  ┌──────────────────────────────────┐              │ │ │
│ │ │  │ [MessageItem] — чужой пузырёк    │              │ │ │
│ │ │  │ bg-[var(--chat-bubble-other-bg)] │              │ │ │
│ │ │  └──────────────────────────────────┘              │ │ │
│ │ │  ┌──────────────────────────────────┐              │ │ │
│ │ │  │ [MessageItem] — свой пузырёк     │              │ │ │
│ │ │  │ bg-[var(--chat-bubble-own-bg)]   │              │ │ │
│ │ │  └──────────────────────────────────┘              │ │ │
│ │ │                                                    │ │ │
│ │ └──────────────────────────────────────────────────┘ │ │
│ │                                                      │ │
│ │ ┌──────────────────────────────────────────────────┐ │ │
│ │ │ [ErrorBar: flex-shrink-0] (опционально)           │ │ │
│ │ └──────────────────────────────────────────────────┘ │ │
│ │                                                      │ │
│ │ ┌──────────────────────────────────────────────────┐ │ │
│ │ │ [MessageInput: flex-shrink-0]                    │ │ │
│ │ │ [✏️ Введите сообщение...]  [📎]  [➤]             │ │ │
│ │ └──────────────────────────────────────────────────┘ │ │
│ └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**Props Interface:**

| Пропс | Тип | Обязательный | Описание |
|---|---|---|---|
| `title` | `string` | ✅ | Название чата/диалога |
| `description` | `string?` | ❌ | Описание (для групповых чатов) |
| `onBack` | `() => void` | ✅ | Callback возврата назад |
| `headerActions` | `React.ReactNode?` | ❌ | Слот для действий в заголовке |
| `children` | `React.ReactNode` | ✅ | Зона сообщений + опционально error bar + input |

**Структура компонента:**

```tsx
export const ChatLayout: React.FC<ChatLayoutProps> = ({
  title,
  description,
  onBack,
  headerActions,
  children,
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* Заголовок */}
      <ChatHeader
        title={title}
        description={description}
        onBack={onBack}
        actions={headerActions}
      />

      {/* Зона сообщений + ErrorBar + Input */}
      {/* flex-1 min-h-0 для корректного flex-layout */}
      <div className="flex flex-col flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
};
```

**Внутренний layout children:**

`children` ожидается в структуре:
- `ConversationMessagesList` — `flex-1 overflow-y-auto` (скроллируемая зона)
- Error bar (опционально) — `flex-shrink-0`
- `MessageInput` — `flex-shrink-0`

Внешний контейнер `children` имеет `flex flex-col flex-1 min-h-0`, что обеспечивает:
- `ConversationMessagesList` занимает всё доступное пространство (`flex-1`)
- `MessageInput` фиксирован внизу (`flex-shrink-0`)
- Корректный overflow (сообщения скроллятся внутри `ConversationMessagesList`)

**Tailwind-классы:**

| Элемент | Классы |
|---|---|
| Корневой div | `flex flex-col h-full` |
| Container children | `flex flex-col flex-1 min-h-0` |

**Зависимости:**

- `@/components/features/comms/ChatHeader` — `ChatHeader`

**Чек-лист:**

- [ ] Компонент создан с интерфейсом `ChatLayoutProps`
- [ ] `flex flex-col h-full` — корректный layout
- [ ] `ChatHeader` в шапке с `title`, `description`, `onBack`, `actions`
- [ ] Container для `children` имеет `flex flex-col flex-1 min-h-0`
- [ ] `children` — слот для ConversationMessagesList + ErrorBar + MessageInput
- [ ] Re-export через `index.ts`

---

### 3.4 UI Layer — Адаптация существующих компонентов

---

#### 3.4.1 `ConversationDetailPage` — замена на ChatLayout

| Параметр | Значение |
|---|---|
| **Файл** | `src/components/features/comms/ConversationDetailPage/ConversationDetailPage.tsx` |
| **Тип** | Client Component |
| **Действие** | 🔧 Изменить |
| **Задача** | B-024-T7-1 |
| **Трассировка** | US-38-01 AC-1, AC-2 |

**Текущее состояние (line 148-209):**

Собственный header (div с кнопкой «Назад» + название) + `ConversationMessagesList` + ErrorBar + `MessageInput`

**Целевое состояние:**

```tsx
return (
  <ChatLayout
    title={conversationTitle}
    onBack={onBack}
  >
    <ConversationMessagesList
      messages={messages}
      currentUserId={currentUserId}
      isLoading={isLoading}
      hasMore={hasMore}
      onLoadMore={handleLoadMore}
      lastMessageId={lastMessageId}
    />

    {error && (
      <div className="flex-shrink-0 px-4 py-3 bg-[var(--theme-danger)]/10 border-t border-[var(--theme-danger)]/20">
        {/* error content — без изменений */}
      </div>
    )}

    <MessageInput
      onSendMessage={handleSendMessage}
      isLoading={isSending}
      disabled={error !== null}
    />
  </ChatLayout>
);
```

**Что удаляется:**

- Собственный блок header (line 149-178)
- Внешний `<div className="flex flex-col h-full bg-[var(--theme-bg-primary)]">` (line 148)

**Что сохраняется:**

- Весь внутренний state (`messages`, `isLoading`, `isSending`, `error`, `hasMore`, `lastMessageId`)
- Callbacks (`loadMessages`, `handleSendMessage`, `handleDelete`, `handleLoadMore`)
- `ConversationMessagesList`
- Error bar
- `MessageInput`

**Чек-лист:**

- [ ] Собственный header убран → заменён на `ChatLayout`
- [ ] `ConversationMessagesList` внутри `children`
- [ ] Error bar сохраняется
- [ ] `MessageInput` внутри `children`
- [ ] Внутренний state без изменений
- [ ] Логика `handleSendMessage`, `handleDelete`, `handleLoadMore` без изменений

---

### 3.5 Pages Layer

---

#### 3.5.1 `messages/[conversationId]/page.tsx` — проверка после ChatLayout

| Параметр | Значение |
|---|---|
| **Файл** | `src/app/dashboard/comms/messages/[conversationId]/page.tsx` |
| **Тип** | Server Component (page) |
| **Действие** | 🔧 Изменить |
| **Задача** | B-024-T8-1 |
| **Трассировка** | US-38-01 AC-1 |

**Текущее состояние:**

```tsx
<div className="h-full w-full">
  <ConversationDetailPage
    conversationId={searchParams.id}
    currentUserId={...}
    onBack={() => router.push('/dashboard/comms/messages')}
  />
</div>
```

**Целевое состояние:**

Без изменений. `ConversationDetailPage` уже использует `ChatLayout` после обновления в T7-1.

**Проверка:**

- [ ] `h-full w-full` корректно наследует высоту от `<main>`
- [ ] Layout-цепочка: AppLayout → main → page → ChatLayout → ChatHeader + children
- [ ] Страница корректно отображается после обновления `ConversationDetailPage`

---

#### 3.5.2 `chats/[chatId]/page.tsx` — переписать через ChatLayout + пагинацию

| Параметр | Значение |
|---|---|
| **Файл** | `src/app/dashboard/comms/chats/[chatId]/page.tsx` |
| **Тип** | Client Component (page) |
| **Действие** | 🔧 Изменить |
| **Задача** | B-024-T9-1 |
| **Трассировка** | US-38-01 AC-1, AC-2, AC-5 |

**Текущее состояние:**

Монолитная страница с inline header + `MessageList` (без пагинации) + `MessageInput` + `max-w-4xl mx-auto`

**Целевое состояние:**

```tsx
return (
  <ChatLayout
    title={chat.title || 'Групповой чат'}
    description={chat.description}
    onBack={() => router.push('/dashboard/comms/chats')}
    headerActions={
      <button onClick={() => router.push(`/dashboard/comms/chats/${chatId}/edit`)}>
        {/* Редактировать — иконка */}
      </button>
    }
  >
    <ConversationMessagesList
      messages={messages}
      currentUserId={currentUserId}
      isLoading={isLoading}
      hasMore={hasMore}
      onLoadMore={handleLoadMore}
      lastMessageId={lastMessageId}
      onDelete={handleDeleteMessage}
    />

    {error && <ErrorBar ... />}

    <MessageInput
      onSendMessage={handleSendMessage}
      isLoading={isSending}
    />
  </ChatLayout>
);
```

**Ключевые изменения:**

1. **Inline header убран** → `ChatLayout` + `ChatHeader`
2. **`MessageList` заменён на `ConversationMessagesList`** → поддержка пагинации
3. **Добавлен state для пагинации:**
   ```tsx
   const [hasMore, setHasMore] = useState(false);
   const [lastMessageId, setLastMessageId] = useState<string | undefined>(undefined);
   const messagesRef = useRef(messages);
   ```
4. **`loadMessages` поддерживает `beforeId`:**
   ```tsx
   const loadMessages = useCallback(async (limit = 20, beforeId?: string) => {
     const response = await apiClient.getWithQuery<MessageWithSender[]>(
       `/conversations/${encodeURIComponent(chatId)}/messages`,
       { limit, beforeId: beforeId || undefined }
     );
     // Обработка: prepend при beforeId, replace иначе
   }, [chatId]);
   ```
5. **Новый `handleLoadMore`:**
   ```tsx
   const handleLoadMore = useCallback(() => {
     if (messages.length > 0 && !isLoading) {
       const firstMessage = messages[0];
       loadMessages(20, firstMessage.id);
     }
   }, [isLoading, messages.length, loadMessages]);
   ```
6. **`max-w-4xl mx-auto` убран** с корневого контейнера

**Чек-лист:**

- [ ] Inline header убран → `ChatLayout` + `ChatHeader`
- [ ] `MessageList` заменён на `ConversationMessagesList`
- [ ] `max-w-4xl mx-auto` убран
- [ ] Добавлен state для пагинации (`hasMore`, `lastMessageId`, `messagesRef`)
- [ ] `loadMessages` поддерживает `beforeId` параметр
- [ ] `handleLoadMore` callback создан
- [ ] `headerActions` содержит кнопку «Редактировать»
- [ ] `description` передаётся в `ChatLayout`
- [ ] `onDelete` передан в `ConversationMessagesList`

---

## 4. 📁 Дерево файлов

```
src/
├── app/
│   ├── globals.css                                    ✏️ ИЗМЕНИТЬ (добавить --chat-bg, --chat-bubble-*)
│   └── dashboard/
│       └── comms/
│           ├── messages/[conversationId]/page.tsx     ✏️ ИЗМЕНИТЬ (проверка после ChatLayout)
│           └── chats/[chatId]/page.tsx                ✏️ ИЗМЕНИТЬ (ChatLayout + пагинация)
├── components/features/comms/
│   ├── ChatLayout/
│   │   ├── ChatLayout.tsx                             ✨ СОЗДАТЬ
│   │   └── index.ts                                   ✨ СОЗДАТЬ
│   ├── ChatHeader/
│   │   ├── ChatHeader.tsx                             ✨ СОЗДАТЬ
│   │   └── index.ts                                   ✨ СОЗДАТЬ
│   ├── MessageItem/
│   │   └── MessageItem.tsx                            ✏️ ИЗМЕНИТЬ (цвета через --chat-bubble-*)
│   ├── ConversationMessagesList/
│   │   └── ConversationMessagesList.tsx               ✏️ ИЗМЕНИТЬ (фон + onDelete)
│   ├── ConversationDetailPage/
│   │   └── ConversationDetailPage.tsx                 ✏️ ИЗМЕНИТЬ (ChatLayout)
│   ├── MessageList/
│   │   └── MessageList.tsx                            ✅ OK (без изменений)
│   └── MessageInput/
│       └── MessageInput.tsx                           ✅ OK (без изменений)
```

---

## 5. 🔗 Порядок выполнения

```
T1-1 (globals.css) ──┬──→ T2-1 (MessageItem)
                      ├──→ T3-1 (ConversationMessagesList фон)
                      │
T4-1 (ChatHeader) ────┴──→ T5-1 (ChatLayout) ──┬──→ T7-1 (ConversationDetailPage)
                                                ├──→ T8-1 (messages page)
T10-1 (onDelete prop) ──────────────────────────┤
                                                └──→ T9-1 (chats page)
```

**Рекомендуемый порядок:**

1. **T1-1** — CSS-переменные (`globals.css`)
2. **T2-1** — MessageItem цвета пузырьков
3. **T3-1** — ConversationMessagesList фон
4. **T10-1** — ConversationMessagesList onDelete prop
5. **T4-1** — ChatHeader компонент
6. **T5-1** — ChatLayout компонент
7. **T7-1** — ConversationDetailPage → ChatLayout
8. **T8-1** — Страница личного диалога (проверка)
9. **T9-1** — Страница группового чата → ChatLayout + пагинация

---

## 6. 📎 Связанные артефакты

- 📋 **План:** [`docs/plans/B-024-chat-design-unification-plan.md`](../../plans/B-024-chat-design-unification-plan.md)
- 📋 **Дизайн-ревью:** [`docs/design/B-024-chat-design-review.md`](../../design/B-024-chat-design-review.md)
- 📋 **Требования:** [`docs/requirements/REQ-COMMS-002.md`](../../requirements/REQ-COMMS-002.md)
- 📋 **US-38-01:** [`docs/user-stories/US-38-01-единый-визуальный-шаблон-чатов.md`](../../user-stories/US-38-01-единый-визуальный-шаблон-чатов.md)
- 📋 **US-38-02:** [`docs/user-stories/US-38-02-фон-зоны-сообщений-и-контрастность-пузырьков.md`](../../user-stories/US-38-02-фон-зоны-сообщений-и-контрастность-пузырьков.md)
- 📁 **Существующие компоненты:**
  - [`src/components/features/comms/MessageItem/MessageItem.tsx`](../../../src/components/features/comms/MessageItem/MessageItem.tsx)
  - [`src/components/features/comms/ConversationMessagesList/ConversationMessagesList.tsx`](../../../src/components/features/comms/ConversationMessagesList/ConversationMessagesList.tsx)
  - [`src/components/features/comms/ConversationDetailPage/ConversationDetailPage.tsx`](../../../src/components/features/comms/ConversationDetailPage/ConversationDetailPage.tsx)
  - [`src/components/features/comms/MessageList/MessageList.tsx`](../../../src/components/features/comms/MessageList/MessageList.tsx)
- 📁 **Страницы:**
  - [`src/app/dashboard/comms/messages/[conversationId]/page.tsx`](../../../src/app/dashboard/comms/messages/[conversationId]/page.tsx)
  - [`src/app/dashboard/comms/chats/[chatId]/page.tsx`](../../../src/app/dashboard/comms/chats/[chatId]/page.tsx)
- 📁 **CSS:** [`src/app/globals.css`](../../../src/app/globals.css)

---

## 7. 📝 История изменений

| Дата | Версия | Автор | Изменение |
|---|---|---|---|
| 2026-07-31 | v1.0 | Component Spec | Создание спецификации для B-024 (ChatLayout, ChatHeader, MessageItem, CSS) |
