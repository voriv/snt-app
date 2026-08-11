# Спецификация компонент: B-021 COMMS UI — Рефакторинг globals.css и доступность R-17, R-25, R-26, R-27

> **Назначение:** Спецификация компонент для [B-021](../../plans/B-021-globals-a11y-plan.md)
> **Создано:** `component-spec` режим
> **Статус:** `[TODO]`

---

## 1. 📋 Метаданные

| Параметр | Значение |
|---|---|
| **Feature** | `B-021` — COMMS UI: Рефакторинг globals.css и доступность R-17, R-25, R-26, R-27 |
| **План реализации** | [`docs/plans/B-021-globals-a11y-plan.md`](../../plans/B-021-globals-a11y-plan.md) v1.1 |
| **User Stories** | US-21-01, US-21-03, US-21-04, US-21-09 |
| **Требования** | REQ-COMMS-001 |
| **Дизайн-справка** | [`docs/specs/comms/B-021-ui-design.md`](./B-021-ui-design.md) |
| **Ревью-замечания** | [`docs/design/comms-ui-review.md`](../../design/comms-ui-review.md) (R-17, R-25, R-26, R-27) |
| **Предшественник** | B-020 → [`docs/specs/comms/B-020-component-spec.md`](./B-020-component-spec.md) |
| **Версия** | `v1.0` |
| **Дата** | `2026-08-07` |
| **Статус** | `[TODO]` |

---

## 2. 📊 Матрица трассировки

> Действия: 🆕 — создать файл, ✏️ — добавить в существующий, 🔧 — изменить существующее.

| # | Компонент | Слой | Действие | R-ID | AC | Задача | Статус |
|---|---|---|---|---|---|---|---|
| 1 | [`DocumentCard.tsx`](../../../src/components/features/documents/DocumentCard.tsx) badge-токены | UI (Feature) | 🔧 | R-27 | AC-R27-1, AC-R27-5 | B-021-T1a | `[TODO]` |
| 2 | [`DocumentDetail.tsx`](../../../src/components/features/documents/DocumentDetail.tsx) badge-токены | UI (Feature) | 🔧 | R-27 | AC-R27-2, AC-R27-5 | B-021-T1a | `[TODO]` |
| 3 | [`ChatList.tsx`](../../../src/components/features/chats/ChatList/ChatList.tsx) badge-токены | UI (Feature) | 🔧 | R-27 | AC-R27-3, AC-R27-5 | B-021-T1a | `[TODO]` |
| 4 | [`UserList.tsx`](../../../src/components/features/users/UserList/UserList.tsx) badge-токены | UI (Feature) | 🔧 | R-27 | AC-R27-4, AC-R27-5 | B-021-T1a | `[TODO]` |
| 5 | [`DeleteCategoryDialog.tsx`](../../../src/components/features/documents/DeleteCategoryDialog.tsx) badge-токены | UI (Feature) | 🔧 | R-27 | AC-R27-6, AC-R27-5 | B-021-T1a | `[TODO]` |
| 6 | [`globals.css`](../../../src/app/globals.css) определение токенов `--theme-badge-*` | CSS (Global) | ✏️ | R-27 | AC-R27-7 | B-021-T1a | `[TODO]` |
| 7 | [`globals.css`](../../../src/app/globals.css) удаление !important-блоков (стр. 228–287) | CSS (Global) | 🔧 | R-27 | AC-R27-8, AC-R27-9 | B-021-T1 | `[TODO]` |
| 8 | [`ConversationMessagesList.tsx`](../../../src/components/features/comms/ConversationMessagesList/ConversationMessagesList.tsx) scrollbar-токен | UI (Feature) | 🔧 | R-25 | AC-R25-1, AC-R25-2 | B-021-T2 | `[TODO]` |
| 9 | `messages/[conversationId]/page.tsx` aria-pattern | Page | 🔧 | R-17/R-26 | AC-R17/26-1 | B-021-T3 | `[TODO]` |
| 10 | `chats/[chatId]/page.tsx` aria-pattern (2 спиннера) | Page | 🔧 | R-17/R-26 | AC-R17/26-2 | B-021-T3 | `[TODO]` |
| 11 | `chats/new/page.tsx` aria-pattern | Page | 🔧 | R-17/R-26 | AC-R17/26-3 | B-021-T3 | `[TODO]` |
| 12 | `chats/[chatId]/edit/page.tsx` aria-pattern (2 спиннера) | Page | 🔧 | R-17/R-26 | AC-R17/26-4 | B-021-T3 | `[TODO]` |
| 13 | `announcements/page.tsx` aria-pattern | Page | 🔧 | R-17/R-26 | AC-R17/26-5 | B-021-T3 | `[TODO]` |
| 14 | `announcements/[id]/page.tsx` aria-pattern (2 спиннера) | Page | 🔧 | R-17/R-26 | AC-R17/26-6 | B-021-T3 | `[TODO]` |
| 15 | [`ParticipantSelector.tsx`](../../../src/components/features/comms/ParticipantSelector/ParticipantSelector.tsx) aria-pattern | UI (Feature) | 🔧 | R-17/R-26 | AC-R17/26-7 | B-021-T3 | `[TODO]` |

### Покрытие AC

| AC | # | Компонент(ы) | Статус покрытия |
|----|---|---|---|
| AC-R27-1 | 1 | DocumentCard | ✅ покрыт |
| AC-R27-2 | 2 | DocumentDetail | ✅ покрыт |
| AC-R27-3 | 3 | ChatList | ✅ покрыт |
| AC-R27-4 | 4 | UserList | ✅ покрыт |
| AC-R27-5 | 1..5 | все 5 мигрированных компонентов | ✅ покрыт |
| AC-R27-6 | 5 | DeleteCategoryDialog | ✅ покрыт |
| AC-R27-7 | 6 | globals.css токены | ✅ покрыт |
| AC-R27-8 | 7 | globals.css удаление !important | ✅ покрыт |
| AC-R27-9 | 7 | globals.css нет ссылок на удалённые селекторы | ✅ покрыт (негативный) |
| AC-R25-1 | 8 | ConversationMessagesList scrollbar | ✅ покрыт |
| AC-R25-2 | 8 | COMMS scope: dark: = 0 | ✅ покрыт (негативный) |
| AC-R17/26-1 | 9 | messages/[conversationId] | ✅ покрыт |
| AC-R17/26-2 | 10 | chats/[chatId] (2 спиннера) | ✅ покрыт |
| AC-R17/26-3 | 11 | chats/new | ✅ покрыт |
| AC-R17/26-4 | 12 | chats/[chatId]/edit (2 спиннера) | ✅ покрыт |
| AC-R17/26-5 | 13 | announcements | ✅ покрыт |
| AC-R17/26-6 | 14 | announcements/[id] (2 спиннера) | ✅ покрыт |
| AC-R17/26-7 | 15 | ParticipantSelector | ✅ покрыт |

---

## 3. 🗺️ Карта «файл/компонент → конкретные изменения»

### 3.1 Блок 1a: R-27 — Миграция компонентов на CSS-токены `--theme-badge-*` (T1a)

#### 3.1.1 Определение токенов в globals.css

В [`globals.css`](../../../src/app/globals.css) необходимо определить 10 токенов (`5 семантик × 2 свойства`) для 3 тем:

**Токены:**

| Токен | Light | Dark | Green |
|-------|-------|------|-------|
| `--theme-badge-default-bg` | `#f3f4f6` | `#374151` | `#374151` |
| `--theme-badge-default-color` | `#1f2937` | `#f9fafb` | `#f9fafb` |
| `--theme-badge-success-bg` | `#d1fae5` | `#065f46` | `#065f46` |
| `--theme-badge-success-color` | `#065f46` | `#6ee7b7` | `#6ee7b7` |
| `--theme-badge-warning-bg` | `#fef3c7` | `#78350f` | `#78350f` |
| `--theme-badge-warning-color` | `#92400e` | `#fde68a` | `#fde68a` |
| `--theme-badge-danger-bg` | `#fee2e2` | `#7f1d1d` | `#7f1d1d` |
| `--theme-badge-danger-color` | `#991b1b` | `#fca5a5` | `#fca5a5` |
| `--theme-badge-info-bg` | `#dbeafe` | `#1e3a8a` | `#1e3a8a` |
| `--theme-badge-info-color` | `#1e40af` | `#93c5fd` | `#93c5fd` |

**CSS-фрагмент для добавления:**

```css
/* === Badge токены (B-021) === */
:root, [data-theme='light'] {
  --theme-badge-default-bg: #f3f4f6;
  --theme-badge-default-color: #1f2937;
  --theme-badge-success-bg: #d1fae5;
  --theme-badge-success-color: #065f46;
  --theme-badge-warning-bg: #fef3c7;
  --theme-badge-warning-color: #92400e;
  --theme-badge-danger-bg: #fee2e2;
  --theme-badge-danger-color: #991b1b;
  --theme-badge-info-bg: #dbeafe;
  --theme-badge-info-color: #1e40af;
}

[data-theme='dark'] {
  --theme-badge-default-bg: #374151;
  --theme-badge-default-color: #f9fafb;
  --theme-badge-success-bg: #065f46;
  --theme-badge-success-color: #6ee7b7;
  --theme-badge-warning-bg: #78350f;
  --theme-badge-warning-color: #fde68a;
  --theme-badge-danger-bg: #7f1d1d;
  --theme-badge-danger-color: #fca5a5;
  --theme-badge-info-bg: #1e3a8a;
  --theme-badge-info-color: #93c5fd;
}

[data-theme='green'] {
  --theme-badge-default-bg: #374151;
  --theme-badge-default-color: #f9fafb;
  --theme-badge-success-bg: #065f46;
  --theme-badge-success-color: #6ee7b7;
  --theme-badge-warning-bg: #78350f;
  --theme-badge-warning-color: #fde68a;
  --theme-badge-danger-bg: #7f1d1d;
  --theme-badge-danger-color: #fca5a5;
  --theme-badge-info-bg: #1e3a8a;
  --theme-badge-info-color: #93c5fd;
}
```

#### 3.1.2 Карта миграции 5 компонентов

| # | Компонент | Контекст | Было (класс) | Стало (токен) | Строки |
|---|-----------|----------|--------------|---------------|--------|
| 1a | [`DocumentCard.tsx`](../../../src/components/features/documents/DocumentCard.tsx) | Статус «Черновик» | `bg-gray-100 text-gray-800` | `bg-[var(--theme-badge-default-bg)] text-[var(--theme-badge-default-color)]` | 39 |
| 1b | [`DocumentCard.tsx`](../../../src/components/features/documents/DocumentCard.tsx) | Статус «Опубликован» | `bg-green-100 text-green-800` | `bg-[var(--theme-badge-success-bg)] text-[var(--theme-badge-success-color)]` | 45 |
| 1c | [`DocumentCard.tsx`](../../../src/components/features/documents/DocumentCard.tsx) | Статус «Архив» | `bg-yellow-100 text-yellow-800` | `bg-[var(--theme-badge-warning-bg)] text-[var(--theme-badge-warning-color)]` | 51 |
| 2a | [`DocumentDetail.tsx`](../../../src/components/features/documents/DocumentDetail.tsx) | те же 3 статуса | те же 3 класса | те же 3 пары токенов | 75, 81, 87 |
| 3 | [`ChatList.tsx`](../../../src/components/features/chats/ChatList/ChatList.tsx) | Иконка ошибки | `bg-red-100` | `bg-[var(--theme-badge-danger-bg)]` | 189 |
| 4 | [`UserList.tsx`](../../../src/components/features/users/UserList/UserList.tsx) | Иконка ошибки | `bg-red-100` | `bg-[var(--theme-badge-danger-bg)]` | 187 |
| 5 | [`DeleteCategoryDialog.tsx`](../../../src/components/features/documents/DeleteCategoryDialog.tsx) | Иконка предупреждения | `bg-red-100` | `bg-[var(--theme-badge-danger-bg)]` | 36 |

#### 3.1.3 Целевой код (фрагменты)

**DocumentCard.tsx / DocumentDetail.tsx (статус-бейджи):**

```tsx
// Статус "Черновик"
<span className="inline-flex items-center rounded-full bg-[var(--theme-badge-default-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--theme-badge-default-color)]">
  Черновик
</span>

// Статус "Опубликован"
<span className="inline-flex items-center rounded-full bg-[var(--theme-badge-success-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--theme-badge-success-color)]">
  Опубликовано
</span>

// Статус "Архив"
<span className="inline-flex items-center rounded-full bg-[var(--theme-badge-warning-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--theme-badge-warning-color)]">
  Архив
</span>
```

**ChatList.tsx / UserList.tsx / DeleteCategoryDialog.tsx (иконка ошибки/предупреждения):**

```tsx
<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--theme-badge-danger-bg)]">
  {/* ... иконка ... */}
</div>
```

> **Примечание:** Форма бейджа (овал `rounded-full`, padding `space-0.5 × space-2.5`, шрифт `text-xs font-medium`) остаётся неизменной. Меняются **только** значения `bg-*` / `text-*`.

---

### 3.2 Блок 1: R-27 — Удаление `!important` из globals.css (T1)

#### 3.2.1 Что удаляется

Из [`globals.css`](../../../src/app/globals.css) удалить badge-блоки с `!important` (строки 228–287), включающие:

| Селекторы | Блоки | Строки |
|-----------|-------|--------|
| `[data-theme='dark'] .bg-gray-100, [data-theme='green'] .bg-gray-100` | 1 | 230–239 |
| `[data-theme='dark'] .bg-green-100, [data-theme='green'] .bg-green-100` | 1 | 242–251 |
| `[data-theme='dark'] .bg-yellow-100, [data-theme='green'] .bg-yellow-100` | 1 | 254–263 |
| `[data-theme='dark'] .bg-red-100, [data-theme='green'] .bg-red-100` | 1 | 266–275 |
| `[data-theme='dark'] .bg-blue-100, [data-theme='green'] .bg-blue-100` | 1 | 278–287 |

**Всего:** 5 блоков, 15 вхождений `!important`.

#### 3.2.2 Что сохраняется (НЕ удалять)

| Строки | Контент | Причина |
|--------|---------|---------|
| 289–297 | `divide-y` блоки | Используют `--theme-border-color`, корректны |

---

### 3.3 Блок 2: R-25 — Замена `dark:` на токен (T2)

| Строка | Файл | Было | Стало |
|--------|------|------|-------|
| 157 | [`ConversationMessagesList.tsx`](../../../src/components/features/comms/ConversationMessagesList/ConversationMessagesList.tsx) | `scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600` | `scrollbar-thin scrollbar-thumb-[var(--theme-border-color)]` |

> **Scope:** только COMMS-модуль. `dark:` в ThemeToggle, PlotUserForm и др. — вне B-021.

---

### 3.4 Блок 3: R-17/R-26 — Aria-pattern для спиннеров (T3)

#### 3.4.1 Единый aria-pattern

Каждый из 10 спиннеров оборачивается в контейнер с атрибутами:

| Атрибут | Значение | Назначение |
|---------|----------|------------|
| `role="status"` | — | Compound role: регион статуса/прогресса |
| `aria-live="polite"` | — | Анонсирует изменения, не перебивая |
| `aria-hidden="true"` | на `<svg>` внутри | Декоративная анимация не читается дважды |

**Шаблон:**

```tsx
// Было
<div className="flex items-center justify-center py-12">
  <svg className="animate-spin h-8 w-8 text-[var(--theme-accent)]" ...>
    ...
  </svg>
</div>

// Стало
<div className="flex items-center justify-center py-12" role="status" aria-live="polite">
  <svg className="animate-spin h-8 w-8 text-[var(--theme-accent)]" aria-hidden="true" ...>
    ...
  </svg>
</div>
```

#### 3.4.2 Карта 10 спиннеров

| # | Файл | Строка | Контекст | Родительский контейнер |
|---|------|--------|----------|----------------------|
| 1 | `messages/[conversationId]/page.tsx` | 71 | Загрузка сессии | `<div>` со спиннером |
| 2 | `chats/[chatId]/page.tsx` | 247 | Загрузка сессии | `<div>` session-loading |
| 3 | `chats/[chatId]/page.tsx` | 275 | Загрузка чата | `<div>` chat-loading |
| 4 | `chats/new/page.tsx` | 133 | Загрузка сессии | `<div>` со спиннером |
| 5 | `chats/[chatId]/edit/page.tsx` | 113 | Загрузка сессии | `<div>` session-loading |
| 6 | `chats/[chatId]/edit/page.tsx` | 140 | Загрузка чата | `<div>` chat-loading |
| 7 | `announcements/page.tsx` | 108 | Загрузка данных | `<div>` со спиннером |
| 8 | `announcements/[id]/page.tsx` | 132 | Загрузка сессии | `<div>` session-loading |
| 9 | `announcements/[id]/page.tsx` | 160 | Загрузка данных | `<div>` data-loading |
| 10 | [`ParticipantSelector.tsx`](../../../src/components/features/comms/ParticipantSelector/ParticipantSelector.tsx) | 291 | Поиск участников | `<div>` search-loading |

> **Важно:** Спиннер в [`MessageInput.tsx:116`](../../../src/components/features/comms/MessageInput/MessageInput.tsx:116) — **НЕ меняется** (находится внутри `<Button isLoading>`, доступность обрабатывает Button).

---

## 4. 🚫 Ограничения

### 4.1 Общие

1. **Не менять бизнес-логику.** Загрузка, API, `useEffect`/`useState`, обработчики, пропсы компонентов — не изменяются.
2. **Не менять API и endpoints.** Никаких изменений на сервере.
3. **Не создавать новые компоненты.** Токены добавляются в `globals.css`; компоненты используют `var()`; a11y — через атрибуты.
4. **Не менять вид спиннеров.** Любые изменения — только добавление `role`/`aria`, не изменение стилей.
5. **Не трогать `<Button isLoading>`.** MessageInput-спиннер — вне scope.

### 4.2 Специфические по задачам

| Задача | Ограничение |
|--------|-------------|
| T1a | Только замена `bg-*-100`/`text-*-800` → `var(--theme-badge-*)`. Форма, размеры, отступы бейджей — без изменений |
| T1 | Удаляются только badge-блоки (стр. 228–287). `divide-y` блоки сохраняются |
| T2 | Scope строго COMMS. `dark:` в других модулях — вне B-021 |
| T3 | `role="status"` + `aria-live="polite"` на контейнер; `aria-hidden="true"` на `<svg>`. Структура JSX без изменений |

### 4.3 Порядок обязателен

**T1a (миграция компонентов) строго ПЕРЕД T1 (удаление `!important`).** Иначе бейджи сломаются в Dark/Green темах.

---

## 5. 📐 Приёмочные критерии (AC)

### 5.1 T1a — Миграция компонентов на CSS-токены (R-27)

| AC-ID | Компонент | Ожидаемое поведение | Проверка |
|-------|-----------|-------------------|----------|
| **AC-R27-1** | [`DocumentCard.tsx`](../../../src/components/features/documents/DocumentCard.tsx) | Статус-бейджи (Черновик/Опубликован/Архив) используют токены `--theme-badge-{default,success,warning}-{bg,color}` вместо `bg-gray-100`, `bg-green-100`, `bg-yellow-100` | `grep 'bg-gray-100\|bg-green-100\|bg-yellow-100' DocumentCard.tsx` → 0 |
| **AC-R27-2** | [`DocumentDetail.tsx`](../../../src/components/features/documents/DocumentDetail.tsx) | Те же 3 бейджа используют те же токены | `grep 'bg-gray-100\|bg-green-100\|bg-yellow-100' DocumentDetail.tsx` → 0 |
| **AC-R27-3** | [`ChatList.tsx`](../../../src/components/features/chats/ChatList/ChatList.tsx) | Иконка ошибки использует `bg-[var(--theme-badge-danger-bg)]` вместо `bg-red-100` | `grep 'bg-red-100' ChatList.tsx` → 0 |
| **AC-R27-4** | [`UserList.tsx`](../../../src/components/features/users/UserList/UserList.tsx) | Иконка ошибки использует `bg-[var(--theme-badge-danger-bg)]` вместо `bg-red-100` | `grep 'bg-red-100' UserList.tsx` → 0 |
| **AC-R27-5** | Все 5 мигрированных компонентов | Бейджи корректно отображаются в 3 темах (Light/Dark/Green) без артефактов | Визуальная проверка |
| **AC-R27-6** | [`DeleteCategoryDialog.tsx`](../../../src/components/features/documents/DeleteCategoryDialog.tsx) | Иконка предупреждения использует `bg-[var(--theme-badge-danger-bg)]` вместо `bg-red-100` | `grep 'bg-red-100' DeleteCategoryDialog.tsx` → 0 |
| **AC-R27-7** | [`globals.css`](../../../src/app/globals.css) | Токены `--theme-badge-{default,success,warning,danger,info}-{bg,color}` определены для всех 3 тем (`:root`, `[data-theme='dark']`, `[data-theme='green']`) | `grep -- '--theme-badge-' globals.css` → 30 строк (10 токенов × 3 темы) |

### 5.2 T1 — Удаление `!important` (R-27)

> **Предусловие:** T1a выполнена.

| AC-ID | Компонент | Ожидаемое поведение | Проверка |
|-------|-----------|-------------------|----------|
| **AC-R27-8** | [`globals.css`](../../../src/app/globals.css) | В файле нет `!important`-вхождений | `grep '!important' globals.css` → 0 |
| **AC-R27-9** | [`globals.css`](../../../src/app/globals.css) | Нет ссылок на удалённые `.bg-gray-100`, `.bg-green-100`, `.bg-yellow-100`, `.bg-red-100`, `.bg-blue-100` селекторы (в badge-блоках) | `grep '\.bg-gray-100\|\.bg-green-100\|\.bg-yellow-100\|\.bg-red-100\|\.bg-blue-100' globals.css` → 0 |

### 5.3 T2 — Замена `dark:` на токен (R-25)

| AC-ID | Компонент | Ожидаемое поведение | Проверка |
|-------|-----------|-------------------|----------|
| **AC-R25-1** | [`ConversationMessagesList.tsx`](../../../src/components/features/comms/ConversationMessagesList/ConversationMessagesList.tsx) | Scrollbar-thumb использует `scrollbar-thumb-[var(--theme-border-color)]` вместо `scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600` | `grep 'dark:' ConversationMessagesList.tsx` → 0 |
| **AC-R25-2** | `src/components/features/comms/` | В COMMS-компонентах нет `dark:`-префиксов | `grep -r 'dark:' src/components/features/comms/` → 0 |

### 5.4 T3 — Aria-pattern для спиннеров (R-17/R-26)

| AC-ID | Компонент | Ожидаемое поведение | Проверка |
|-------|-----------|-------------------|----------|
| **AC-R17/26-1** | `messages/[conversationId]/page.tsx` | Контейнер спиннера (стр. 71) имеет `role="status" aria-live="polite"`; `<svg>` имеет `aria-hidden="true"` | Поиск атрибутов |
| **AC-R17/26-2** | `chats/[chatId]/page.tsx` | Оба спиннера (стр. 247, 275) имеют `role="status" aria-live="polite"` на контейнере; `<svg>` имеет `aria-hidden="true"` | Аналогично |
| **AC-R17/26-3** | `chats/new/page.tsx` | Спиннер (стр. 133) имеет `role="status" aria-live="polite"` на контейнере; `<svg>` имеет `aria-hidden="true"` | Аналогично |
| **AC-R17/26-4** | `chats/[chatId]/edit/page.tsx` | Оба спиннера (стр. 113, 140) имеют `role="status" aria-live="polite"` на контейнере; `<svg>` имеет `aria-hidden="true"` | Аналогично |
| **AC-R17/26-5** | `announcements/page.tsx` | Спиннер (стр. 108) имеет `role="status" aria-live="polite"` на контейнере; `<svg>` имеет `aria-hidden="true"` | Аналогично |
| **AC-R17/26-6** | `announcements/[id]/page.tsx` | Оба спиннера (стр. 132, 160) имеют `role="status" aria-live="polite"` на контейнере; `<svg>` имеет `aria-hidden="true"` | Аналогично |
| **AC-R17/26-7** | [`ParticipantSelector.tsx`](../../../src/components/features/comms/ParticipantSelector/ParticipantSelector.tsx) | Спиннер поиска (стр. 291) имеет `role="status" aria-live="polite"` на контейнере; `<svg>` имеет `aria-hidden="true"` | Аналогично |

### 5.5 Негативные сценарии (негативные AC)

| AC-ID | Компонент | Ожидаемое поведение | Проверка |
|-------|-----------|-------------------|----------|
| **AC-NEG-01** | [`globals.css`](../../../src/app/globals.css) | После удаления badge-блоков: в файле нет `!important` | `grep -c '!important' globals.css` → 0 |
| **AC-NEG-02** | [`globals.css`](../../../src/app/globals.css) | В файле нет ссылок на удалённые badge-селекторы (`.bg-gray-100` и т.д.) | `grep '\.bg-gray-100\|\.bg-green-100\|\.bg-yellow-100\|\.bg-red-100\|\.bg-blue-100' globals.css` → 0 |
| **AC-NEG-03** | `src/components/features/comms/` | В COMMS нет `dark:`-префиксов после T2 | `grep -r 'dark:' src/components/features/comms/` → 0 |
| **AC-NEG-04** | Мигрированные компоненты (documents/chats/users) | В 5 мигрированных файлах нет `bg-gray-100`, `bg-green-100`, `bg-yellow-100`, `bg-red-100`, `bg-blue-100` | `grep -r 'bg-gray-100\|bg-green-100\|bg-yellow-100\|bg-red-100\|bg-blue-100' <5 файлов>` → 0 |
| **AC-NEG-05** | [`MessageInput.tsx`](../../../src/components/features/comms/MessageInput/MessageInput.tsx) | Спиннер внутри `<Button isLoading>` **НЕ** получил `role="status"` (не тронут) | `grep 'role="status"' MessageInput.tsx` → 0 (в контексте спиннера отправки) |
| **AC-NEG-06** | Все 10 файлов T3 | Визуальный вид спиннеров не изменился (та же анимация, тот же цвет `text-[var(--theme-accent)]`) | Визуальная проверка |

---

## 6. 📦 Зависимости

```
T1a ──→ T1        ── Цепочка: миграция компонентов ПЕРЕД удалением !important
T2                ── Независима (можно параллельно с T1a)
T3                ── Независима (можно параллельно с T1a)
```

**Внешние зависимости:**
- B-018 (закрыт): базовые CSS-токены в `globals.css`, включая `--theme-border-color`
- B-019 (закрыт): DS-компоненты
- B-020 (закрыт): скелетоны с `role="status"` (не конфликтуют — T3 касается только спиннеров на страницах, не скелетонов)

---

## 7. ✅ Критерии приёмки для code-агентов

### 7.1 T1a: Миграция badge-токенов

| AC | Проверка code-агентом | Где проверить |
|----|----------------------|---------------|
| AC-R27-1 | `DocumentCard.tsx`: 3 замены `bg-*-100 text-*-800` → `var(--theme-badge-*)` | Строки 39, 45, 51 |
| AC-R27-2 | `DocumentDetail.tsx`: те же 3 замены | Строки 75, 81, 87 |
| AC-R27-3 | `ChatList.tsx`: `bg-red-100` → `bg-[var(--theme-badge-danger-bg)]` | Строка 189 |
| AC-R27-4 | `UserList.tsx`: `bg-red-100` → `bg-[var(--theme-badge-danger-bg)]` | Строка 187 |
| AC-R27-6 | `DeleteCategoryDialog.tsx`: `bg-red-100` → `bg-[var(--theme-badge-danger-bg)]` | Строка 36 |
| AC-R27-7 | `globals.css`: 30 строк с `--theme-badge-` (10 токенов × 3 темы) | Глобальный поиск |

### 7.2 T1: Удаление !important

| AC | Проверка code-агентом | Где проверить |
|----|----------------------|---------------|
| AC-R27-8 | `globals.css`: 0 вхождений `!important` | `grep -c '!important'` |
| AC-R27-9 | `globals.css`: 0 вхождений badge-селекторов `.bg-*-100` | `grep` по селекторам |
| AC-NEG-01 | Дублирует AC-R27-8 (негативная проверка) | `globals.css` |
| AC-NEG-02 | Дублирует AC-R27-9 (негативная проверка) | `globals.css` |

### 7.3 T2: Замена dark:

| AC | Проверка code-агентом | Где проверить |
|----|----------------------|---------------|
| AC-R25-1 | `ConversationMessagesList.tsx`: `scrollbar-thumb-[var(--theme-border-color)]` | Строка 157 |
| AC-R25-2 | COMMS: 0 вхождений `dark:` | `grep -r 'dark:' src/components/features/comms/` |

### 7.4 T3: Aria-pattern

| AC | Проверка code-агентом | Где проверить |
|----|----------------------|---------------|
| AC-R17/26-1..7 | 10 спиннеров: `role="status" aria-live="polite"` на контейнере + `aria-hidden="true"` на svg | Все 7 файлов из карты §3.4.2 |
| AC-NEG-05 | `MessageInput.tsx`: спиннер внутри Button без `role="status"` | Проверка контекста |

---

## 8. 📝 Порядок выполнения

Рекомендуемый порядок:

1. **T1a** — Определение токенов `--theme-badge-*` в globals.css + миграция 5 компонентов (обязательно первым)
2. **T1** — Удаление `!important`-блоков из globals.css (строго после T1a)
3. **T2** — Замена `dark:` в ConversationMessagesList (независимо, но удобно после T1a)
4. **T3** — Добавление `role="status"` + `aria-live="polite"` в 10 спиннеров (независимо)

```
T1a ──→ T1
T2   (параллельно с T1a)
T3   (параллельно с T1a)
```

---

## 9. 🔗 Связанные артефакты

| Артефакт | Путь | Назначение |
|----------|------|-----------|
| План | [`docs/plans/B-021-globals-a11y-plan.md`](../../plans/B-021-globals-a11y-plan.md) | Задачи T1a, T1, T2, T3 |
| UI-дизайн | [`docs/specs/comms/B-021-ui-design.md`](./B-021-ui-design.md) | Токены, aria-pattern, чек-листы |
| globals.css | [`src/app/globals.css`](../../../src/app/globals.css) | CSS-токены, badge-блоки |
| Аудит | [`docs/design/comms-ui-review.md`](../../design/comms-ui-review.md) | R-17, R-25, R-26, R-27 |
| Предуспец | [`docs/specs/comms/B-020-component-spec.md`](./B-020-component-spec.md) | Формат, образец |
