# Спецификация компонент: B-020 COMMS UI — Скелетоны, breadcrumbs и кнопка удаления сообщения

> **Назначение:** Спецификация компонент и скелетов кода для [B-020](../../plans/B-020-skeletons-breadcrumbs-plan.md)
> **Создано:** `component-spec` режим
> **Статус:** `[DONE]` — реализовано, Code Review APPROVE, QA PASS (2026-08-07)

---

## 1. 📋 Метаданные

| Параметр | Значение |
|---|---|
| **Feature** | `B-020` — COMMS UI: Скелетоны, breadcrumbs и кнопка удаления сообщения (R-14, R-15, R-19, R-20) |
| **План реализации** | [`docs/plans/B-020-skeletons-breadcrumbs-plan.md`](../../plans/B-020-skeletons-breadcrumbs-plan.md) v1.1 |
| **User Stories** | US-21-01, US-21-03, US-21-04, US-NAV-06 |
| **Требования** | REQ-COMMS-001, REQ-NAV-001 |
| **Дизайн-справка** | [`docs/specs/comms/B-020-ui-design.md`](./B-020-ui-design.md) |
| **Ревью-замечания** | [`docs/design/comms-ui-review.md`](../../design/comms-ui-review.md) (R-14, R-15, R-19, R-20) |
| **Предшественник** | B-019 → [`docs/specs/comms/B-019-component-spec.md`](./B-019-component-spec.md) |
| **Версия** | `v1.0` |
| **Дата** | `2026-08-07` |
| **Статус** | `[DONE]` |

---

## 2. 📊 Матрица трассировки

> Действия: 🆕 — создать файл, ✏️ — добавить в существующий, 🔧 — изменить существующее.

| # | Компонент | Слой | Действие | R-ID | AC | Задача | Статус |
|---|---|---|---|---|---|---|---|
| 1 | [`ConversationList.tsx`](../../../src/components/features/comms/ConversationList/ConversationList.tsx) скелетон | UI (Feature) | ✏️ | R-14 | AC-R14-1 | B-020-T1 | `[DONE]` |
| 2 | [`ConversationMessagesList.tsx`](../../../src/components/features/comms/ConversationMessagesList/ConversationMessagesList.tsx) скелетон | UI (Feature) | ✏️ | R-14 | AC-R14-2 | B-020-T2 | `[DONE]` |
| 3 | [`messages/page.tsx`](../../../src/app/dashboard/comms/messages/page.tsx) скелетон | Page | ✏️ | R-14 | AC-R14-3 | B-020-T3 | `[DONE]` |
| 4 | [`chats/page.tsx`](../../../src/app/dashboard/comms/chats/page.tsx) скелетон | Page | ✏️ | R-14 | AC-R14-4 | B-020-T4 | `[DONE]` |
| 5 | 7 страниц COMMS — breadcrumbs | Page | ✏️ | R-15 | AC-R15-1..6 | B-020-T5 | `[DONE]` |
| 6 | [`Breadcrumbs.tsx`](../../../src/components/layouts/Breadcrumbs.tsx) токены | Layout (DS) | 🔧 | R-15 | AC-R15-5 | B-020-T5b | `[DONE]` |
| 7 | [`MessageItem.tsx`](../../../src/components/features/comms/MessageItem/MessageItem.tsx) isCurrentUser + ConfirmDialog | UI (Feature) | 🔧 | R-19 | AC-R19-1..8 | B-020-T6 | `[DONE]` |
| 8 | [`ConfirmDialog.tsx`](../../../src/components/ui/ConfirmDialog/ConfirmDialog.tsx) токены | UI (DS) | 🔧 | R-19 | AC-R19-4 | B-020-T6b | `[DONE]` |
| 9 | [`MessageInput.tsx`](../../../src/components/features/comms/MessageInput/MessageInput.tsx) верификация | UI (Feature) | ✏️ | R-20 | AC-R20-1..4 | B-020-T7 | `[DONE]` |

### Покрытие AC

| AC | # | Компонент(ы) | Статус покрытия |
|----|---|---|---|
| AC-R14-1 | 1 | ConversationList | ✅ покрыт |
| AC-R14-2 | 2 | ConversationMessagesList | ✅ покрыт |
| AC-R14-3 | 3 | messages/page.tsx | ✅ покрыт |
| AC-R14-4 | 4 | chats/page.tsx | ✅ покрыт |
| AC-R14-5..7 | 1..4 | все скелетоны (токены, animate-pulse, A11y) | ✅ покрыт |
| AC-R15-1..4 | 5 | 7 страниц COMMS | ✅ покрыт |
| AC-R15-5 | 6 | Breadcrumbs.tsx токены | ✅ покрыт |
| AC-R15-6 | 5 | hidden md:flex | ✅ покрыт |
| AC-R19-1 | 7 | MessageItem isCurrentUser | ✅ покрыт |
| AC-R19-2..8 | 7 | MessageItem ConfirmDialog | ✅ покрыт |
| AC-R20-1..4 | 9 | MessageInput верификация | ✅ покрыт |

---

## 3. 🗺️ Карта «файл/компонент → конкретные изменения»

### 3.1 Блок 1: R-14 — Скелетоны (T1–T4)

| # | Файл/Компонент | Задача | Изменение | Детали |
|---|---|---|---|---|
| 1 | [`ConversationList.tsx`](../../../src/components/features/comms/ConversationList/ConversationList.tsx) | B-020-T1 | ✏️ Заменить спиннер на 4 pulsing-карточки | Спиннер (~строки 135–158) → скелетон-карточки с аватаром + строки текста + время. `animate-pulse`, `var(--theme-bg-secondary)`, `role="status" aria-live="polite"` |
| 2 | [`ConversationMessagesList.tsx`](../../../src/components/features/comms/ConversationMessagesList/ConversationMessagesList.tsx) | B-020-T2 | ✏️ Заменить спиннер на 3 pulsing-сообщения | Спиннер (~строки 200–218) → скелетон-сообщения с аватаром + пузырёк. `animate-pulse`, `var(--theme-bg-secondary)` |
| 3 | [`messages/page.tsx`](../../../src/app/dashboard/comms/messages/page.tsx) | B-020-T3 | ✏️ Заменить спиннер при session loading на скелетон страницы | Спиннер (~строки 42–64) → скелетон с заголовком (h-8) + карточкой списка (4 блока) |
| 4 | [`chats/page.tsx`](../../../src/app/dashboard/comms/chats/page.tsx) | B-020-T4 | ✏️ Заменить спиннер при session loading на скелетон страницы | Спиннер (~строки 44–67) → скелетон с заголовком + кнопкой «Создать чат» + карточками (4 блока) |

**Общие правила скелетонов (для T1–T4):**
- Цвет: `bg-[var(--theme-bg-secondary)]` — только через CSS-токены
- Анимация: `animate-pulse` (Tailwind)
- Скругление: `rounded` (строки), `rounded-lg` (пузырьки), `rounded-full` (аватары)
- Доступность: контейнер `role="status" aria-live="polite"`
- Разделители: `divide-[var(--theme-border-color)]`
- **Запрещено:** `bg-gray-*`, `bg-white`, `text-indigo-*` — только `var(--theme-*)`

---

### 3.2 Блок 2: R-15 — Breadcrumbs (T5, T5b)

| # | Файл/Компонент | Задача | Изменение | Детали |
|---|---|---|---|---|
| 5a | [`messages/page.tsx`](../../../src/app/dashboard/comms/messages/page.tsx) | B-020-T5 | ✏️ Добавить `<Breadcrumbs />` | `import { Breadcrumbs }`; перед `<h1>Сообщения</h1>` |
| 5b | [`messages/new/page.tsx`](../../../src/app/dashboard/comms/messages/new/page.tsx) | B-020-T5 | ✏️ Добавить `<Breadcrumbs />` | перед `<h1>` |
| 5c | [`messages/[conversationId]/page.tsx`](../../../src/app/dashboard/comms/messages/[conversationId]/page.tsx) | B-020-T5 | ✏️ Добавить `<Breadcrumbs />` | перед заголовком |
| 5d | [`chats/page.tsx`](../../../src/app/dashboard/comms/chats/page.tsx) | B-020-T5 | ✏️ Добавить `<Breadcrumbs />` | перед `<h1>Групповые чаты</h1>` |
| 5e | [`chats/new/page.tsx`](../../../src/app/dashboard/comms/chats/new/page.tsx) | B-020-T5 | ✏️ Добавить `<Breadcrumbs />` | перед `<h1>` |
| 5f | [`chats/[chatId]/page.tsx`](../../../src/app/dashboard/comms/chats/[chatId]/page.tsx) | B-020-T5 | ✏️ Добавить `<Breadcrumbs />` | перед заголовком |
| 5g | [`chats/[chatId]/edit/page.tsx`](../../../src/app/dashboard/comms/chats/[chatId]/edit/page.tsx) | B-020-T5 | ✏️ Добавить `<Breadcrumbs />` | перед `<h1>` |
| 6 | [`Breadcrumbs.tsx`](../../../src/components/layouts/Breadcrumbs.tsx) | B-020-T5b | 🔧 Миграция на токены | 5 замен: `text-gray-*` → `var(--theme-text-*)`, `focus:ring-blue-500` → `var(--theme-accent)` |

**Ожидаемые цепочки breadcrumbs (для верификации):**

| Страница | Путь | Цепочка |
|----------|------|---------|
| messages | `/comms/messages` | Дашборд › Общение › Сообщения |
| messages/new | `/comms/messages/new` | Дашборд › Общение › Сообщения › Новое сообщение |
| messages/:id | `/comms/messages/:id` | Дашборд › Общение › Сообщения › [имя диалога] |
| chats | `/comms/chats` | Дашборд › Общение › Групповые чаты |
| chats/new | `/comms/chats/new` | Дашборд › Общение › Групповые чаты › Создать чат |
| chats/:id | `/comms/chats/:id` | Дашборд › Общение › Групповые чаты › [имя чата] |
| chats/:id/edit | `/comms/chats/:id/edit` | Дашборд › Общение › Групповые чаты › [имя чата] › Редактирование |

---

### 3.3 Блок 3: R-19 — Удаление сообщения с ConfirmDialog (T6, T6b)

| # | Файл/Компонент | Задача | Изменение | Детали |
|---|---|---|---|---|
| 7 | [`MessageItem.tsx`](../../../src/components/features/comms/MessageItem/MessageItem.tsx) | B-020-T6 | 🔧 Ограничить видимость delete-кнопки + добавить ConfirmDialog | (а) P-01a: `{onDelete && ...}` → `{onDelete && isCurrentUser && ...}`; (б) P-01b: кнопка вызывает `setShowDeleteConfirm(true)`, а не `onDelete()`; вставить `<ConfirmDialog>` в JSX |
| 8 | [`ConfirmDialog.tsx`](../../../src/components/ui/ConfirmDialog/ConfirmDialog.tsx) | B-020-T6b | 🔧 Миграция на токены | 10 замен: `bg-indigo-600` → `var(--theme-accent)`, `bg-red-600` → `var(--theme-danger)`, `bg-white` → `var(--theme-bg-primary)`, `bg-gray-*` → `var(--theme-*)`, `text-gray-*` → `var(--theme-text-*)` |

---

### 3.4 Блок 4: R-20 — Верификация кнопки отправки (T7)

| # | Файл/Компонент | Задача | Изменение | Детали |
|---|---|---|---|---|
| 9 | [`MessageInput.tsx`](../../../src/components/features/comms/MessageInput/MessageInput.tsx) | B-020-T7 | ✏️ Верификация (без изменений кода) | Проверить: `<Button variant="primary">`, фон `var(--theme-accent)`, видна иконка, 3 темы. Если проблемы — задокументировать |

**Ограничение P-04:** Спиннер `<Spinner />` внутри Button (`isLoading`-состояние) НЕ заменяется на скелетон.

---

## 4. 📐 Спецификация изменения MessageItem (B-020-T6)

### 4.1 Цель

Исправить два дефекта в [`MessageItem.tsx`](../../../src/components/features/comms/MessageItem/MessageItem.tsx):
1. **P-01a (R-19):** Кнопка «Удалить» видна для чужих сообщений — отсутствует проверка `isCurrentUser`
2. **P-01b (R-19):** Удаление происходит без подтверждения — нет ConfirmDialog

### 4.2 Текущее состояние

[`MessageItem.tsx`](../../../src/components/features/comms/MessageItem/MessageItem.tsx:158-168):

```tsx
{/* Строка 158 — BUG: нет проверки isCurrentUser */}
{onDelete && (
  <Button
    variant="ghost"
    size="sm"
    type="button"
    onClick={() => onDelete(message.id)}  // <-- удаление без подтверждения
    aria-label="Удалить сообщение"
  >
    Удалить
  </Button>
)}
```

### 4.3 Целевое состояние

```tsx
import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  currentUserId,
  isLastMessage = false,
  onDelete,
  readStatus,
  conversationType = 'DIRECT'
}) => {
  const isCurrentUser = message.senderId === currentUserId;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ... существующий код ...

  return (
    <div /* ... */ >
      {/* ... аватар ... */}
      {/* ... контент сообщения ... */}

      {/* ФИКС P-01a: кнопка видна только для своих сообщений */}
      {onDelete && isCurrentUser && (
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => setShowDeleteConfirm(true)}  // ФИКС P-01b: не вызывает onDelete напрямую
          aria-label="Удалить сообщение"
        >
          Удалить
        </Button>
      )}

      {/* ... read receipts ... */}
    </div>

    {/* ConfirmDialog — всегда в JSX (isOpen контролирует видимость) */}
    <ConfirmDialog
      isOpen={showDeleteConfirm}
      onClose={() => setShowDeleteConfirm(false)}
      title="Удаление сообщения"
      message="Вы действительно хотите удалить это сообщение? Это действие нельзя отменить."
      confirmLabel="Удалить"
      cancelLabel="Отмена"
      variant="danger"
      onConfirm={() => {
        onDelete!(message.id);
        setShowDeleteConfirm(false);
      }}
    />
  );
};
```

### 4.4 API (без изменений)

Интерфейс `MessageItemProps` не меняется:

```tsx
export interface MessageItemProps {
  message: MessageWithSender | MessageWithReadStatus;
  currentUserId: string;
  isLastMessage?: boolean;
  onDelete?: (messageId: string) => void;
  readStatus?: ReadStatus;
  conversationType?: ConversationType;
}
```

### 4.5 Изменения в деталях

| Элемент | Было | Стало |
|---------|------|-------|
| Условие видимости | `{onDelete && (...)}` | `{onDelete && isCurrentUser && (...)}` |
| `onClick` кнопки | `() => onDelete(message.id)` | `() => setShowDeleteConfirm(true)` |
| Подтверждение | Нет (прямой вызов) | `<ConfirmDialog variant="danger">` |
| Состояние | Нет `useState` | `const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)` |
| Импорт | Нет `ConfirmDialog` | `import { ConfirmDialog } from '@/components/ui/ConfirmDialog'` |

### 4.6 Поведение ConfirmDialog (Fluent)

| Действие | Результат |
|----------|-----------|
| Клик «Удалить» в MessageItem | `setShowDeleteConfirm(true)` → ConfirmDialog появляется |
| Клик «Отмена» / Escape / клик вне диалога | `onClose()` → `setShowDeleteConfirm(false)`, сообщение остаётся |
| Клик «Удалить» в ConfirmDialog | `onDelete(message.id)` + `setShowDeleteConfirm(false)` |

### 4.7 Инварианты

- **INV-01:** Кнопка «Удалить» никогда не отображается для чужих сообщений (`isCurrentUser === false`)
- **INV-02:** `onDelete()` вызывается только после подтверждения в ConfirmDialog
- **INV-03:** Состояние `showDeleteConfirm` сбрасывается после удаления или отмены
- **INV-04:** ConfirmDialog рендерится в JSX всегда (не условно), `isOpen` управляет видимостью

---

## 5. 📐 Спецификация миграции Breadcrumbs.tsx на токены (B-020-T5b)

### 5.1 Цель

Заменить хардкод-классы в [`Breadcrumbs.tsx`](../../../src/components/layouts/Breadcrumbs.tsx) на CSS-токены для корректной работы в 3 темах (Light/Dark/Green).

### 5.2 Текущее состояние

[`Breadcrumbs.tsx`](../../../src/components/layouts/Breadcrumbs.tsx):

| Строка | Текущий класс | Контекст |
|--------|--------------|----------|
| 61 | `text-gray-500` | nav контейнер |
| 71 | `text-gray-900` | последний элемент (`aria-current="page"`) |
| 79 | `hover:text-gray-900` | ссылки (hover) |
| 79 | `focus:ring-blue-500` | ссылки (focus ring) |
| 86 | `text-gray-400` | разделитель `›` |

### 5.3 Карта замен

| Строка | Было | Стало | Токен |
|--------|------|-------|-------|
| 61 | `text-gray-500` | `text-[var(--theme-text-secondary)]` | `color.text.secondary` |
| 71 | `text-gray-900` | `text-[var(--theme-text-primary)]` | `color.text.primary` |
| 79 | `hover:text-gray-900` | `hover:text-[var(--theme-text-primary)]` | `color.text.primary` |
| 79 | `focus:ring-blue-500` | `focus:ring-[var(--theme-accent)]` | `color.accent.default` |
| 86 | `text-gray-400` | `text-[var(--theme-text-secondary)]` | `color.text.secondary` |

### 5.4 Что НЕ менять

- `hidden md:flex` — breadcrumbs скрыты на мобильных (согласно R-15 №6)
- `text-xs` — размер шрифта (12px, `text.caption`)
- `max-w-[30ch]`, `max-w-[40ch]` — ограничение ширины ярлыка
- `truncate`, `title` — обрезка длинных имён
- `aria-current="page"` — семантика
- `generateBreadcrumbs()` — логика авто-генерации

### 5.5 Целевой JSX (фрагмент)

```tsx
<nav
  aria-label="Breadcrumb"
  role="navigation"
  className={cn('hidden md:flex items-center gap-1 text-xs text-[var(--theme-text-secondary)] px-4 py-2', className)}
>
  <ol className="flex items-center gap-1 flex-wrap">
    {items.map((item, index) => {
      const isLast = index === items.length - 1;
      return (
        <li key={`${item.href}-${index}`} className="flex items-center gap-1">
          {isLast ? (
            <span
              aria-current="page"
              className="text-[var(--theme-text-primary)] font-medium truncate max-w-[40ch]"
              title={item.label}
            >
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href}
              className="hover:text-[var(--theme-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] rounded truncate max-w-[30ch]"
              title={item.label}
            >
              {item.label}
            </Link>
          )}
          {!isLast && (
            <span className="text-[var(--theme-text-secondary)] select-none" aria-hidden="true">
              {separator}
            </span>
          )}
        </li>
      );
    })}
  </ol>
</nav>
```

---

## 6. 📐 Спецификация миграции ConfirmDialog.tsx на токены (B-020-T6b)

### 6.1 Цель

Заменить хардкод-классы в [`ConfirmDialog.tsx`](../../../src/components/ui/ConfirmDialog/ConfirmDialog.tsx) на CSS-токены для корректной работы в 3 темах.

### 6.2 Текущее состояние

[`ConfirmDialog.tsx`](../../../src/components/ui/ConfirmDialog/ConfirmDialog.tsx):

| Строка | Текущий класс | Контекст |
|--------|--------------|----------|
| 108 | `bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500` | confirm кнопка, primary variant |
| 109 | `bg-red-600 text-white hover:bg-red-700 focus:ring-red-500` | confirm кнопка, danger variant |
| 121 | `bg-gray-500` | backdrop overlay |
| 129 | `bg-white` | modal container |
| 133 | `bg-gray-100` | icon background |
| 135 | `text-gray-600` | icon color |
| 150 | `text-gray-900` | title |
| 156 | `text-gray-500` | message |

### 6.3 Карта замен

| Строка | Было | Стало | Токен |
|--------|------|-------|-------|
| 108 | `bg-indigo-600` | `bg-[var(--theme-accent)]` | `color.accent.default` |
| 108 | `hover:bg-indigo-700` | `hover:opacity-90` | opacity (hover) |
| 108 | `focus:ring-indigo-500` | `focus:ring-[var(--theme-accent)]` | `color.accent.default` |
| 109 | `bg-red-600` | `bg-[var(--theme-danger)]` | `color.danger.default` |
| 109 | `hover:bg-red-700` | `hover:opacity-90` | opacity (hover) |
| 109 | `focus:ring-red-500` | `focus:ring-[var(--theme-danger)]` | `color.danger.default` |
| 121 | `bg-gray-500 bg-opacity-75` | `bg-[var(--theme-bg-overlay)]` | `color.bg.overlay` |
| 129 | `bg-white` | `bg-[var(--theme-bg-primary)]` | `color.bg.primary` |
| 133 | `bg-gray-100` | `bg-[var(--theme-bg-secondary)]` | `color.bg.secondary` |
| 135 | `text-gray-600` | `text-[var(--theme-text-secondary)]` | `color.text.secondary` |
| 150 | `text-gray-900` | `text-[var(--theme-text-primary)]` | `color.text.primary` |
| 156 | `text-gray-500` | `text-[var(--theme-text-secondary)]` | `color.text.secondary` |

### 6.4 Целевой код (фрагменты)

**confirmButtonVariants (строки 106–110):**

```tsx
const confirmButtonVariants = {
  primary:
    'bg-[var(--theme-accent)] text-white hover:opacity-90 focus:ring-[var(--theme-accent)]',
  danger: 'bg-[var(--theme-danger)] text-white hover:opacity-90 focus:ring-[var(--theme-danger)]',
};
```

**Backdrop (строка 121):**

```tsx
className="fixed inset-0 bg-[var(--theme-bg-overlay)] transition-opacity"
```

**Modal container (строка 129):**

```tsx
className="relative transform overflow-hidden rounded-lg bg-[var(--theme-bg-primary)] px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6"
```

**Icon zone (строки 133–135):**

```tsx
<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--theme-bg-secondary)]">
  <svg className="h-6 w-6 text-[var(--theme-text-secondary)]" /* ... */>
```

**Title (строка 150):**

```tsx
className="text-base font-semibold leading-6 text-[var(--theme-text-primary)]"
```

**Message (строка 156):**

```tsx
<p className="text-sm text-[var(--theme-text-secondary)]">{message}</p>
```

### 6.5 Что НЕ менять

- `<Button>` компонент внутри ConfirmDialog — уже использует `variant` prop (T6b не затрагивает кнопки, если они передают variant)
- Логика фокуса (`confirmButtonRef.current?.focus()`)
- Обработчики Escape, backdrop click
- `document.body.style.overflow`
- `role="dialog"`, `aria-modal="true"` — A11y
- Иконка SVG — структура без изменений

### 6.6 Примечание по токенам

Токены `--theme-bg-overlay`, `--theme-accent-hover`, `--theme-danger-hover` должны быть проверены в [`src/app/globals.css`](../../../src/app/globals.css). Если отсутствуют:
- `--theme-bg-overlay` → использовать `bg-[var(--theme-bg-overlay)]` (если токен не определён, fallback к `rgba(0,0,0,0.75)`)
- Hover-состояние → `hover:opacity-90` вместо отдельного hover-токена (универсальный подход)

Это может быть доделано в рамках B-021 (глобальные токены).

---

## 7. 🚫 Ограничения

### 7.1 Общие

1. **Не менять бизнес-логику отправки сообщений.** Логика `handleSubmit` в MessageInput остаётся без изменений.
2. **Не менять бизнес-логику удаления сообщений.** `onDelete()` callback вызывается как раньше (те же параметры, та же асинхронность).
3. **Не менять API-эндпоинты.** Никаких изменений на сервере.
4. **Не менять структуру маршрутов (pages).** Breadcrumbs — чистое добавление UI.
5. **Не трогать `<Spinner />` внутри Button.** Ограничение P-04: спиннер loading-состояния кнопки — это не скелетон страницы. Замена возможна в B-021.

### 7.2 Специфические по задачам

| Задача | Ограничение |
|--------|-------------|
| T1–T4 | `isLoading` флаг — без изменений; меняется только JSX ветки |
| T5 | `generateBreadcrumbs()` из `nav-utils` — без изменений |
| T5b | Структура JSX (nav → ol → li) — без изменений; меняются только Tailwind-классы |
| T6 | `MessageItemProps` — без изменений; внутреннее состояние — только `showDeleteConfirm` |
| T6b | Логика ConfirmDialog (Escape, focus, backdrop) — без изменений |
| T7 | Верификация без изменений кода |

---

## 8. ✅ Критерии приёмки для code-агентов

### 8.1 R-14: Скелетоны

| AC | Проверка code-агентом | Где проверить |
|----|----------------------|---------------|
| AC-R14-1 | `ConversationList.tsx`: при `isLoading` — 4 блока `animate-pulse` с аватаром+строками+временем | Поиск `animate-pulse` + `[var(--theme-bg-secondary)]` |
| AC-R14-2 | `ConversationMessagesList.tsx`: при `isLoading` — 3 блока `animate-pulse` с аватаром+пузырьком | Аналогично |
| AC-R14-3 | `messages/page.tsx`: при `status === 'loading'` — скелетон страницы с `role="status" aria-live="polite"` | Нет `<svg className="animate-spin">` в ветке loading |
| AC-R14-4 | `chats/page.tsx`: при `status === 'loading'` — скелетон страницы | Аналогично |
| AC-R14-5 | Все 4 файла: `animate-pulse` класс присутствует в скелетоне | Глобальный поиск `animate-pulse` |
| AC-R14-6 | Все 4 файла: нет `bg-gray-*`, `bg-white`, `text-indigo-*` в скелетонах | Глобальный поиск `bg-gray`, `bg-white` в контексте скелетона |
| AC-R14-7 | Все 4 файла: `role="status" aria-live="polite"` на контейнере скелетона | Поиск атрибутов |

### 8.2 R-15: Breadcrumbs

| AC | Проверка code-агентом | Где проверить |
|----|----------------------|---------------|
| AC-R15-1 | Все 7 страниц: `<Breadcrumbs />` присутствует в JSX | Поиск `Breadcrumbs` |
| AC-R15-2 | Все 7 страниц: `import { Breadcrumbs }` в импортах | Проверка импортов |
| AC-R15-3 | Rодительские уровни кликабельны (автоматически через `generateBreadcrumbs`) | Не требует кода — компонент готов |
| AC-R15-4 | Последний уровень: `<span>` с `aria-current="page"` | В Breadcrumbs.tsx — `<span aria-current="page">` |
| AC-R15-5 | Breadcrumbs.tsx: нет `text-gray-*`, `focus:ring-blue-*` | Поиск `text-gray`, `ring-blue` в Breadcrumbs.tsx |
| AC-R15-6 | `hidden md:flex` в nav контейнере | Поиск `hidden md:flex` |

### 8.3 R-19: Удаление с ConfirmDialog

| AC | Проверка code-агентом | Где проверить |
|----|----------------------|---------------|
| AC-R19-1 | `MessageItem.tsx`: кнопка удаления — `{onDelete && isCurrentUser && ...}` | Строка условия: поиск `isCurrentUser` рядом с кнопкой |
| AC-R19-2 | Кнопка вызывает `setShowDeleteConfirm(true)`, а не `onDelete()` | Поиск `onClick` в кнопке удаления |
| AC-R19-3 | `<ConfirmDialog>` присутствует с `message="Вы действительно хотите удалить..."` | Поиск `ConfirmDialog` |
| AC-R19-4 | `variant="danger"` в ConfirmDialog | Атрибут |
| AC-R19-5 | `onClose` ConfirmDialog → `setShowDeleteConfirm(false)` | Проверка `onClose` пропса |
| AC-R19-6 | `onConfirm` → `onDelete(message.id)` | Проверка `onConfirm` пропса |
| AC-R19-7 | После `onDelete()` → `setShowDeleteConfirm(false)` | В том же `onConfirm` |
| AC-R19-8 | Escape закрывает (встроено в ConfirmDialog) | Наследуется из ConfirmDialog |

### 8.4 R-20: Кнопка отправки

| AC | Проверка code-агентом | Где проверить |
|----|----------------------|---------------|
| AC-R20-1 | `MessageInput.tsx`: `<Button variant="primary">` | Проверка variant |
| AC-R20-2 | Фон кнопки через `var(--theme-accent)` (в `<Button>` компоненте) | Наследуется из Button |
| AC-R20-3 | Иконка видна (белый цвет на акцентном фоне) | Визуальная проверка |
| AC-R20-4 | `disabled` prop блокирует кнопку | Проверка disabled prop |

---

## 9. 📦 Зависимости

```
T1, T2, T3, T4  ──┐
                   ├── НЕЗАВИСИМЫ (можно параллельно)
T5                ──┤
T7                ──┘

T5b → T5          ── T5b зависит от T5 (migration Breadcrumbs.tsx)

T6                ──┐
T6b → T6            ── T6b зависит от T6 (migration ConfirmDialog.tsx)
```

**Внешние зависимости:**
- B-018 (закрыт): цветовые токены в `globals.css`
- B-019 (закрыт): DS-компоненты (Button, Input, Badge, EmptyState, ErrorMessage, ConfirmDialog)

---

## 10. 📝 Порядок выполнения

Рекомендуемый порядок:

1. **T7** — Верификация R-20 (быстрая проверка)
2. **T3, T4** — Скелетоны в страницах (простые, независимые)
3. **T1, T2** — Скелетоны в компонентах (чуть сложнее)
4. **T5** — Breadcrumbs на 7 страницах (однотипные изменения)
5. **T5b** — Миграция Breadcrumbs.tsx на токены
6. **T6** — ConfirmDialog в MessageItem (изменение поведения)
7. **T6b** — Миграция ConfirmDialog.tsx на токены
