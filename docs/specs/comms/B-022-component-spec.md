# Спецификация компонент: B-022 COMMS UI — Минорные правки UX (R-18, R-21, R-24, R-28, R-29)

> **Назначение:** Спецификация компонент для [B-022](../../plans/B-022-ux-minor-plan.md)
> **Создано:** `component-spec` режим
> **Статус:** `[TODO]`

---

## 1. 📋 Метаданные

| Параметр | Значение |
|---|---|
| **Feature** | `B-022` — COMMS UI: Минорные правки UX (R-18, R-21, R-24, R-28, R-29) |
| **План реализации** | [`docs/plans/B-022-ux-minor-plan.md`](../../plans/B-022-ux-minor-plan.md) v1.1 |
| **User Stories** | US-21-01, US-21-04, US-21-06 |
| **Требования** | REQ-COMMS-001 |
| **Дизайн-справка** | [`docs/specs/comms/B-022-ui-design.md`](./B-022-ui-design.md) |
| **Ревью-замечания** | [`docs/design/comms-ui-review.md`](../../design/comms-ui-review.md) (R-18, R-21, R-24, R-28, R-29) |
| **Предшественник** | B-021 → [`docs/specs/comms/B-021-component-spec.md`](./B-021-component-spec.md) |
| **Версия** | `v1.0` |
| **Дата** | `2026-08-07` |
| **Статус** | `[TODO]` |

---

## 2. 📊 Матрица трассировки

> Действия: 🆕 — создать файл, ✏️ — добавить в существующий, 🔧 — изменить существующее, 🗑️ — удалить.

| # | Компонент | Слой | Действие | R-ID | AC | Задача | Статус |
|---|---|---|---|---|---|---|---|
| 1 | [`ConversationCard.tsx`](../../../src/components/features/comms/ConversationCard/ConversationCard.tsx) аватар img | UI (Feature) | 🔧 | R-18 | AC-R18-1 | B-022-T1 | `[TODO]` |
| 2 | [`ConversationCard.tsx`](../../../src/components/features/comms/ConversationCard/ConversationCard.tsx) аватар fallback | UI (Feature) | 🔧 | R-18 | AC-R18-2 | B-022-T1 | `[TODO]` |
| 3 | [`features/comms/ChatList/`](../../../src/components/features/comms/ChatList/) | UI (Feature) | 🆕 | R-21 | AC-R21-1 | B-022-T2 | `[TODO]` |
| 4 | [`features/comms/ChatCard/`](../../../src/components/features/comms/ChatCard/) | UI (Feature) | 🆕 | R-21 | AC-R21-2 | B-022-T2 | `[TODO]` |
| 5 | [`chats/page.tsx`](../../../src/app/dashboard/comms/chats/page.tsx) импорт ChatList | Page | 🔧 | R-21 | AC-R21-3 | B-022-T2 | `[TODO]` |
| 6 | [`ChatList.tsx`](../../../src/components/features/chats/ChatList/ChatList.tsx) внутренний импорт ChatCard | UI (Feature) | 🔧 | R-21 | AC-R21-4 | B-022-T2 | `[TODO]` |
| 7 | [`features/chats/index.ts`](../../../src/components/features/chats/index.ts) ре-экспорт | UI | 🗑️ | R-21 | AC-R21-5 | B-022-T2 | `[TODO]` |
| 8 | `comms-pages.skeleton.test.tsx` vi.mock ChatList | Test | 🔧 | R-21 | AC-R21-6 | B-022-T2 | `[TODO]` |
| 9 | `comms-pages-spinner-a11y.test.tsx` vi.mock ChatList, ChatCard | Test | 🔧 | R-21 | AC-R21-7 | B-022-T2 | `[TODO]` |
| 10 | [`features/chats/`](../../../src/components/features/chats/) директория | UI (Feature) | 🗑️ | R-21 | AC-R21-8 | B-022-T2 | `[TODO]` |
| 11 | [`MessageItem.tsx`](../../../src/components/features/comms/MessageItem/MessageItem.tsx) cn() isLastMessage | UI (Feature) | 🔧 | R-24 | AC-R24-1 | B-022-T3 | `[TODO]` |
| 12 | [`chats/[chatId]/edit/page.tsx`](../../../src/app/dashboard/comms/chats/[chatId]/edit/page.tsx) fallback «чат не найден» | Page | 🔧 | R-28 | AC-R28-1 | B-022-T4 | `[TODO]` |
| 13 | [`ConversationCard.tsx`](../../../src/components/features/comms/ConversationCard/ConversationCard.tsx) group + chevron-right | UI (Feature) | 🔧 | R-29 | AC-R29-1 | B-022-T5 | `[TODO]` |
| 14 | Сборка (`next build`) | Build | ✅ | Все | AC-BUILD-1 | B-022-T6 | `[TODO]` |

### Покрытие AC

| AC | # | Компонент(ы) | Статус покрытия |
|----|---|---|---|
| AC-R18-1 | 1 | ConversationCard img | ✅ покрыт |
| AC-R18-2 | 2 | ConversationCard fallback | ✅ покрыт |
| AC-R18-3 | — | MessageItem (регрессия) | ✅ покрыт (негативный) |
| AC-R21-1 | 3 | comms/ChatList создан | ✅ покрыт |
| AC-R21-2 | 4 | comms/ChatCard создан | ✅ покрыт |
| AC-R21-3 | 5 | chats/page.tsx импорт | ✅ покрыт |
| AC-R21-4 | 6 | ChatList.tsx внутренний импорт ChatCard | ✅ покрыт |
| AC-R21-5 | 7 | features/chats/index.ts удалён | ✅ покрыт |
| AC-R21-6 | 8 | comms-pages.skeleton.test.tsx vi.mock | ✅ покрыт |
| AC-R21-7 | 9 | comms-pages-spinner-a11y.test.tsx vi.mock | ✅ покрыт |
| AC-R21-8 | 10 | features/chats/ директория удалена | ✅ покрыт |
| AC-R21-9 | — | src/: 0 импортов из features/chats | ✅ покрыт (негативный) |
| AC-R21-10 | — | Визуальная регрессия ChatList/ChatCard | ✅ покрыт (негативный) |
| AC-R24-1 | 11 | MessageItem bg-акцент убран | ✅ покрыт |
| AC-R24-2 | 11 | MessageItem animate-fade-in сохранён | ✅ покрыт (негативный) |
| AC-R24-3 | 11 | Проп isLastMessage остаётся в интерфейсе | ✅ покрыт (негативный) |
| AC-R28-1 | 12 | edit/page.tsx: заголовок + кнопка + ErrorMessage | ✅ покрыт |
| AC-R29-1 | 13 | ConversationCard: group + chevron-right SVG | ✅ покрыт |
| AC-R29-2 | 13 | hover: group-hover:translate-x-0.5 | ✅ покрыт |
| AC-BUILD-1 | 14 | next build без ошибок | ✅ покрыт |

---

## 3. 🗺️ Карта «файл/компонент → конкретные изменения»

### 3.1 Блок 1 (R-18 / T1): Аватар `ConversationCard` → `h-10 w-10`

#### 3.1.1 ConversationCard.tsx — Аватар (img + fallback)

| Строка | Контекст | Было (класс) | Стало (класс) |
|--------|----------|--------------|---------------|
| 135 | `<img className="h-12 w-12 rounded-full ...">` | `h-12 w-12` | `h-10 w-10` |
| 138 | `<div className="h-12 w-12 rounded-full ...">` | `h-12 w-12` | `h-10 w-10` |

**Целевой фрагмент:**

```tsx
// Строка 135 — img
<img
  src={participantAvatar}
  alt={`Аватар ${participantName}`}
  className="h-10 w-10 rounded-full object-cover"
/>

// Строка 138 — fallback
<div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-sm">
  {displayInitials}
</div>
```

> **Примечание:** `rounded-full` и `object-cover` остаются без изменений. Только `h-12 w-12` → `h-10 w-10`.

---

### 3.2 Блок 2 (R-21 / T2): Перенос ChatList + ChatCard в features/comms/

#### 3.2.1 Перемещение компонентов

| Компонент | Было | Стало |
|-----------|------|-------|
| `ChatList/` | `src/components/features/chats/ChatList/` | `src/components/features/comms/ChatList/` |
| `ChatCard/` | `src/components/features/chats/ChatCard/` | `src/components/features/comms/ChatCard/` |

После копирования в `comms/`, старая директория `features/chats/` **удаляется целиком**.

#### 3.2.2 Карта импортов (6 файлов)

| # | Файл | Строка | Тип импорта | Было | Стало |
|---|------|--------|-------------|------|-------|
| 5a | [`chats/page.tsx:30`](../../../src/app/dashboard/comms/chats/page.tsx:30) | 30 | Production | `@/components/features/chats/ChatList` | `@/components/features/comms/ChatList` |
| 6a | [`ChatList.tsx:27`](../../../src/components/features/chats/ChatList/ChatList.tsx:27) | 27 | Production (внутренний) | `@/components/features/chats/ChatCard` | `@/components/features/comms/ChatCard` |
| 7a | [`features/chats/index.ts:6-7`](../../../src/components/features/chats/index.ts:6) | 6-7 | Production (re-export) | `export { ChatCard }`, `export { ChatList }` | **удалить файл целиком** |
| 8a | [`comms-pages.skeleton.test.tsx:37`](../../../tests/components/features/comms/comms-pages.skeleton.test.tsx:37) | 37 | Test (vi.mock) | `@/components/features/chats/ChatList` | `@/components/features/comms/ChatList` |
| 9a | [`comms-pages-spinner-a11y.test.tsx:43`](../../../tests/components/features/comms/comms-pages-spinner-a11y.test.tsx:43) | 43 | Test (vi.mock) | `@/components/features/chats/ChatList` | `@/components/features/comms/ChatList` |
| 9b | [`comms-pages-spinner-a11y.test.tsx:46`](../../../tests/components/features/comms/comms-pages-spinner-a11y.test.tsx:46) | 46 | Test (vi.mock) | `@/components/features/chats/ChatCard` | `@/components/features/comms/ChatCard` |

#### 3.2.3 Целевой код (фрагменты)

**chats/page.tsx:30:**
```tsx
// Было
import { ChatList } from '@/components/features/chats/ChatList';
// Стало
import { ChatList } from '@/components/features/comms/ChatList';
```

**ChatList.tsx:27 (после переноса в comms/):**
```tsx
// Было
import { ChatCard } from '@/components/features/chats/ChatCard';
// Стало
import { ChatCard } from '@/components/features/comms/ChatCard';
```

**comms-pages.skeleton.test.tsx:37:**
```tsx
// Было
vi.mock('@/components/features/chats/ChatList', () => ({
// Стало
vi.mock('@/components/features/comms/ChatList', () => ({
```

**comms-pages-spinner-a11y.test.tsx:43-46:**
```tsx
// Было
vi.mock('@/components/features/chats/ChatList', () => ({
vi.mock('@/components/features/chats/ChatCard', () => ({
// Стало
vi.mock('@/components/features/comms/ChatList', () => ({
vi.mock('@/components/features/comms/ChatCard', () => ({
```

> **ВАЖНО:** Это **чисто структурная** правка. Визуальный вид ChatCard/ChatList **не изменяется**.

---

### 3.3 Блок 3 (R-24 / T3): Убрать визуальный акцент isLastMessage в MessageItem

#### 3.3.1 MessageItem.tsx — cn()

| Строка | Контекст | Было | Стало |
|--------|----------|------|-------|
| 106 | `cn()` условие isLastMessage | `isLastMessage && 'bg-[var(--theme-info)]/10 -mx-2 px-2 py-1 rounded-lg'` | *(удалить)* |

**Целевой фрагмент:**

```tsx
// Было (строки 103-107)
className={cn(
  'flex gap-3 mb-4 animate-fade-in',
  isCurrentUser ? 'flex-row-reverse' : 'flex-row',
  isLastMessage && 'bg-[var(--theme-info)]/10 -mx-2 px-2 py-1 rounded-lg'
)}

// Стало (строки 103-106)
className={cn(
  'flex gap-3 mb-4 animate-fade-in',
  isCurrentUser ? 'flex-row-reverse' : 'flex-row',
)}
```

> **Критично:**
> - `animate-fade-in` **остаётся** — плавное появление сохраняется
> - Проп `isLastMessage` **остаётся** в интерфейсе `MessageItemProps` — используется как scroll-якорь в `ConversationMessagesList`
> - Из `cn()` только убирается условная ветка isLastMessage

---

### 3.4 Блок 4 (R-28 / T4): Состояние «чат не найден» в edit-странице

#### 3.4.1 chats/[chatId]/edit/page.tsx — fallback-блок

| Строки | Контекст | Было | Стало |
|--------|----------|------|-------|
| 201-206 | `if (!chat)` блок | `<p className="text-[var(--theme-text-secondary)]">Чат не найден</p>` | Полноценный fallback с заголовком, кнопкой «Назад», ErrorMessage |

**Целевой фрагмент:**

```tsx
// Было (строки 201-206)
if (!chat) {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <p className="text-[var(--theme-text-secondary)]">Чат не найден</p>
    </div>
  );
}

// Стало
if (!chat) {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          type="button"
          onClick={() => router.push('/dashboard/comms/chats')}
          aria-label="Назад к списку чатов"
        >
          <svg
            className="h-5 w-5 text-[var(--theme-text-secondary)]"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
        </Button>
        <h1 className="text-2xl font-bold text-[var(--theme-text-primary)]">
          Редактирование чата
        </h1>
      </div>
      <ErrorMessage message="Чат не найден" />
    </div>
  );
}
```

> **Согласовано** с блоком `loadError` (строки 167-197 в том же файле): та же шапка с кнопкой «Назад» + заголовок, тот же тип ErrorMessage. Отличие — текст «Чат не найден».

---

### 3.5 Блок 5 (R-29 / T5): Иконка-стрелка и hover в ConversationCard

#### 3.5.1 ConversationCard.tsx — group + chevron-right

**Изменения:**

| Строка | Контекст | Изменение |
|--------|----------|-----------|
| 118-125 | Корневой `<div>` карточки | Добавить `group` в className |
| 166-167 | После `</div>` (информация о диалоге) | Добавить блок стрелки-индикатора |

**Целевой фрагмент (корневой div):**

```tsx
// Было (строка 122-125)
className={cn(
  'flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-colors',
  'hover:bg-[var(--theme-bg-secondary)] focus:outline-none focus:ring-2 focus:ring-indigo-500',
)}

// Стало
className={cn(
  'group flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-colors',
  'hover:bg-[var(--theme-bg-secondary)] focus:outline-none focus:ring-2 focus:ring-indigo-500',
)}
```

**Целевой фрагмент (стрелка после информации):**

```tsx
{/* После <div className="flex-1 min-w-0">...</div>, перед закрывающим </div> корня */}
<div className="flex-shrink-0">
  <svg
    className="h-4 w-4 text-[var(--theme-text-secondary)] transition-transform group-hover:translate-x-0.5"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
</div>
```

> `flex-shrink-0` гарантирует, что стрелка не сжимается при длинном `lastMessagePreview`.

---

## 4. 🚫 Ограничения

### 4.1 Общие

1. **Не менять бизнес-логику.** Загрузка, API, `useEffect`/`useState`, обработчики, пропсы компонентов — не изменяются.
2. **Не менять API и endpoints.** Никаких изменений на сервере.
3. **Не создавать новые компоненты.** Используются существующие `[Button]`, `[ErrorMessage]`; стрелка — inline SVG-декор, не отдельный UI-компонент.
4. **Только токены без `dark:`.** Все цвета через `var(--theme-*)`; запрещены `dark:`-префиксы.
5. **R-21 — только структура.** Перенос не меняет ни одного визуального параметра ChatCard/ChatList.

### 4.2 Специфические по задачам

| Задача | Ограничение |
|--------|-------------|
| T1 (R-18) | Только `h-12 w-12` → `h-10 w-10`. `rounded-full`, `object-cover` — без изменений |
| T2 (R-21) | Перемещение файлов + коррекция импортов. Визуально без изменений. Старая директория `features/chats/` удаляется после обновления всех ссылок |
| T3 (R-24) | Убрать только `bg-[var(--theme-info)]/10 -mx-2 px-2 py-1 rounded-lg` из `cn()`. Проп `isLastMessage` остаётся в интерфейсе. `animate-fade-in` не трогать |
| T4 (R-28) | Fallback-шаблон согласован с блоком `loadError` в том же файле (стр. 167-197). Кнопка «Назад» → `router.push('/dashboard/comms/chats')` |
| T5 (R-29) | `group` класс на корневом div. Стрелка: `flex-shrink-0`, `h-4 w-4`, `color.text.secondary`, `group-hover:translate-x-0.5`. После T1 (тот же файл) |

### 4.3 Порядок

```
T1 ──→ T5        ── Цепочка: оба в ConversationCard.tsx
T3                ── Независима
T4                ── Независима
T2                ── Независима
T6                ── После всех T1..T5
```

---

## 5. 📐 Приёмочные критерии (AC)

### 5.1 T1 — Аватар h-10 w-10 (R-18)

| AC-ID | Компонент | Ожидаемое поведение | Проверка |
|-------|-----------|-------------------|----------|
| **AC-R18-1** | [`ConversationCard.tsx:135`](../../../src/components/features/comms/ConversationCard/ConversationCard.tsx:135) | `<img>` аватара имеет классы `h-10 w-10` вместо `h-12 w-12` | `grep 'h-12\|w-12' ConversationCard.tsx` → 0 вхождений в контексте аватара |
| **AC-R18-2** | [`ConversationCard.tsx:138`](../../../src/components/features/comms/ConversationCard/ConversationCard.tsx:138) | Fallback-блок аватара имеет классы `h-10 w-10` вместо `h-12 w-12` | `grep 'h-12\|w-12' ConversationCard.tsx` → 0 |
| **AC-R18-3** | [`MessageItem.tsx`](../../../src/components/features/comms/MessageItem/MessageItem.tsx) | Аватар в MessageItem остаётся `w-10 h-10` (регрессия) | `grep 'w-10 h-10' MessageItem.tsx` → ≥1 |

### 5.2 T2 — Перенос ChatList + ChatCard (R-21)

| AC-ID | Компонент | Ожидаемое поведение | Проверка |
|-------|-----------|-------------------|----------|
| **AC-R21-1** | `features/comms/ChatList/` | Директория создана с `ChatList.tsx` + `index.ts` | Файл существует |
| **AC-R21-2** | `features/comms/ChatCard/` | Директория создана с `ChatCard.tsx` + `index.ts` | Файл существует |
| **AC-R21-3** | [`chats/page.tsx:30`](../../../src/app/dashboard/comms/chats/page.tsx:30) | Импорт: `@/components/features/comms/ChatList` | `grep 'features/chats/ChatList' chats/page.tsx` → 0 |
| **AC-R21-4** | [`comms/ChatList/ChatList.tsx`](../../../src/components/features/comms/ChatList/ChatList.tsx) | Внутренний импорт ChatCard: `@/components/features/comms/ChatCard` | `grep 'features/chats/ChatCard' ChatList.tsx` → 0 |
| **AC-R21-5** | `features/chats/` | Директория удалена целиком (включая index.ts, ChatList/, ChatCard/) | Директория не существует |
| **AC-R21-6** | [`comms-pages.skeleton.test.tsx:37`](../../../tests/components/features/comms/comms-pages.skeleton.test.tsx:37) | vi.mock: `@/components/features/comms/ChatList` | `grep 'features/chats/ChatList' comms-pages.skeleton.test.tsx` → 0 |
| **AC-R21-7** | [`comms-pages-spinner-a11y.test.tsx:43,46`](../../../tests/components/features/comms/comms-pages-spinner-a11y.test.tsx:43) | vi.mock: ChatList и ChatCard из `@/components/features/comms/` | `grep 'features/chats/' comms-pages-spinner-a11y.test.tsx` → 0 |
| **AC-R21-8** | `src/` | Нет импортов из `@/components/features/chats/` | `grep -r 'features/chats/' src/` → 0 |
| **AC-R21-9** | `features/comms/ChatList/` + `ChatCard/` | Визуальный вид ChatList/ChatCard идентичен до и после переноса | Визуальная проверка в 3 темах |
| **AC-R21-10** | Тесты COMMS-pages | `npm test -- comms-pages` проходит без ошибок | Команда тестов |

### 5.3 T3 — Убрать акцент isLastMessage (R-24)

| AC-ID | Компонент | Ожидаемое поведение | Проверка |
|-------|-----------|-------------------|----------|
| **AC-R24-1** | [`MessageItem.tsx:106`](../../../src/components/features/comms/MessageItem/MessageItem.tsx:106) | В `cn()` нет `bg-[var(--theme-info)]/10` и `-mx-2 px-2 py-1 rounded-lg` | `grep 'theme-info' MessageItem.tsx` → 0 |
| **AC-R24-2** | [`MessageItem.tsx:104`](../../../src/components/features/comms/MessageItem/MessageItem.tsx:104) | `animate-fade-in` класс остаётся в `cn()` | `grep 'animate-fade-in' MessageItem.tsx` → ≥1 |
| **AC-R24-3** | [`MessageItem.tsx:51`](../../../src/components/features/comms/MessageItem/MessageItem.tsx:51) | Проп `isLastMessage` остаётся в `MessageItemProps` | `grep 'isLastMessage' MessageItem.tsx` ≥ 2 (объявление + дефолтное значение) |

### 5.4 T4 — «Чат не найден» с заголовком (R-28)

| AC-ID | Компонент | Ожидаемое поведение | Проверка |
|-------|-----------|-------------------|----------|
| **AC-R28-1** | [`chats/[chatId]/edit/page.tsx`](../../../src/app/dashboard/comms/chats/[chatId]/edit/page.tsx) | Блок `!chat` содержит: заголовок «Редактирование чата», кнопка «Назад» (ghost), `<ErrorMessage message="Чат не найден">` | Визуальная проверка |
| **AC-R28-2** | [`chats/[chatId]/edit/page.tsx`](../../../src/app/dashboard/comms/chats/[chatId]/edit/page.tsx) | Кнопка «Назад» вызывает `router.push('/dashboard/comms/chats')` | Поиск в коде |
| **AC-R28-3** | [`chats/[chatId]/edit/page.tsx`](../../../src/app/dashboard/comms/chats/[chatId]/edit/page.tsx) | Кнопка «Назад» имеет `aria-label="Назад к списку чатов"` | Поиск в коде |

### 5.5 T5 — Стрелка + hover (R-29)

| AC-ID | Компонент | Ожидаемое поведение | Проверка |
|-------|-----------|-------------------|----------|
| **AC-R29-1** | [`ConversationCard.tsx`](../../../src/components/features/comms/ConversationCard/ConversationCard.tsx) | Корневой div имеет `group` в className | `grep 'group' ConversationCard.tsx` → ≥1 |
| **AC-R29-2** | [`ConversationCard.tsx`](../../../src/components/features/comms/ConversationCard/ConversationCard.tsx) | SVG chevron-right: `h-4 w-4`, `transition-transform`, `group-hover:translate-x-0.5` | Поиск `chevron`/`translate-x-0.5` |
| **AC-R29-3** | [`ConversationCard.tsx`](../../../src/components/features/comms/ConversationCard/ConversationCard.tsx) | Стрелка в контейнере `flex-shrink-0` | Поиск `flex-shrink-0` |

### 5.6 T6 — Smoke-тест (сборка)

| AC-ID | Компонент | Ожидаемое поведение | Проверка |
|-------|-----------|-------------------|----------|
| **AC-BUILD-1** | Все изменённые файлы | `next build` завершается успешно (exit code 0) | Команда сборки |

### 5.7 Негативные AC

| AC-ID | Компонент | Ожидаемое поведение | Проверка |
|-------|-----------|-------------------|----------|
| **AC-NEG-01** | [`MessageItem.tsx`](../../../src/components/features/comms/MessageItem/MessageItem.tsx) | Проп `isLastMessage` остаётся в `MessageItemProps` интерфейсе | `grep 'isLastMessage\?:' MessageItem.tsx` → ≥1 |
| **AC-NEG-02** | [`ConversationCard.tsx`](../../../src/components/features/comms/ConversationCard/ConversationCard.tsx) | `rounded-full` сохранён на аватаре (img + fallback) | `grep 'rounded-full' ConversationCard.tsx` → ≥2 |
| **AC-NEG-03** | `src/components/features/comms/` | В COMMS нет `dark:`-префиксов (регрессия после B-021) | `grep -r 'dark:' src/components/features/comms/` → 0 |
| **AC-NEG-04** | [`chats/[chatId]/edit/page.tsx`](../../../src/app/dashboard/comms/chats/[chatId]/edit/page.tsx) | Блок `loadError` (стр. 167-197) не изменён | Визуальная проверка |
| **AC-NEG-05** | `src/app/`, `src/components/` | Бизнес-логика не изменена: те же API-вызовы, те же обработчики | Code review |

---

## 6. 📦 Зависимости

```
T1 ──→ T5        ── Цепочка: оба в ConversationCard.tsx
T3                ── Независима
T4                ── Независима
T2                ── Независима
T6                ── После T1..T5
```

**Внешние зависимости:**
- B-021 (закрыт): CSS-токены `--theme-badge-*`, aria-паттерны спиннеров
- B-020 (закрыт): скелетоны страниц, Breadcrumbs
- DS-компоненты: `[Button]`, `[ErrorMessage]` — используются как есть

---

## 7. ✅ Критерии приёмки для code-агентов

### 7.1 T1: Аватар h-10 w-10

| AC | Проверка code-агентом | Где проверить |
|----|----------------------|---------------|
| AC-R18-1 | `ConversationCard.tsx`: `h-10 w-10` на `<img>` аватара | Строка 135 |
| AC-R18-2 | `ConversationCard.tsx`: `h-10 w-10` на fallback `<div>` | Строка 138 |
| AC-R18-3 | `MessageItem.tsx`: `w-10 h-10` не сломан | Строка 113 |

### 7.2 T2: Перенос ChatList + ChatCard

| AC | Проверка code-агентом | Где проверить |
|----|----------------------|---------------|
| AC-R21-1 | Файл `features/comms/ChatList/ChatList.tsx` существует | — |
| AC-R21-2 | Файл `features/comms/ChatCard/ChatCard.tsx` существует | — |
| AC-R21-3 | `chats/page.tsx:30`: импорт `@/components/features/comms/ChatList` | Строка 30 |
| AC-R21-4 | `comms/ChatList/ChatList.tsx`: импорт `@/components/features/comms/ChatCard` | Строка 27 |
| AC-R21-5 | Директория `features/chats/` не существует | — |
| AC-R21-6 | `comms-pages.skeleton.test.tsx`: mock `@/components/features/comms/ChatList` | Строка 37 |
| AC-R21-7 | `comms-pages-spinner-a11y.test.tsx`: mock ChatList + ChatCard из comms | Строки 43, 46 |
| AC-R21-8 | `grep -r 'features/chats/' src/` → 0 | Глобальный поиск |
| AC-R21-10 | `npm test -- comms-pages` → PASS | Команда |

### 7.3 T3: isLastMessage

| AC | Проверка code-агентом | Где проверить |
|----|----------------------|---------------|
| AC-R24-1 | `MessageItem.tsx`: 0 вхождений `theme-info` | `grep` |
| AC-R24-2 | `MessageItem.tsx`: `animate-fade-in` в cn() | Строка 104 |
| AC-R24-3 | `MessageItem.tsx`: `isLastMessage` в интерфейсе + дефолтное значение | Строки 51, 69 |

### 7.4 T4: «Чат не найден»

| AC | Проверка code-агентом | Где проверить |
|----|----------------------|---------------|
| AC-R28-1 | `edit/page.tsx`: блок `!chat` содержит Button + h1 + ErrorMessage | Строки 201-206 |
| AC-R28-2 | `edit/page.tsx`: `router.push('/dashboard/comms/chats')` в кнопке | Поиск |
| AC-R28-3 | `edit/page.tsx`: `aria-label="Назад к списку чатов"` | Поиск |

### 7.5 T5: Стрелка

| AC | Проверка code-агентом | Где проверить |
|----|----------------------|---------------|
| AC-R29-1 | `ConversationCard.tsx`: `group` в className корне | Строка 122 |
| AC-R29-2 | `ConversationCard.tsx`: SVG chevron-right + `group-hover:translate-x-0.5` | После строки 166 |
| AC-R29-3 | `ConversationCard.tsx`: `flex-shrink-0` на контейнере стрелки | После строки 166 |

### 7.6 T6: Сборка

| AC | Проверка |
|----|----------|
| AC-BUILD-1 | `next build` → exit code 0 |

---

## 8. 📝 Порядок выполнения

Рекомендуемый порядок:

1. **T1** — Аватар `h-10 w-10` в ConversationCard (15 мин)
2. **T5** — Стрелка chevron-right + hover в ConversationCard (30 мин; зависит от T1)
3. **T3** — Убрать акцент isLastMessage в MessageItem (15 мин)
4. **T4** — Fallback «чат не найден» в edit/page.tsx (30 мин)
5. **T2** — Перенос ChatList + ChatCard + исправление импортов (60 мин)
6. **T6** — Smoke-тест: `next build` (30 мин)

```
T1 ──→ T5
T3
T4
T2
T6 (после всех)
```

> T1, T3, T4, T2 можно выполнять параллельно. T5 зависит от T1 (оба в `ConversationCard.tsx`).

---

## 9. 🔗 Связанные артефакты

| Артефакт | Путь | Назначение |
|----------|------|-----------|
| План | [`docs/plans/B-022-ux-minor-plan.md`](../../plans/B-022-ux-minor-plan.md) | Задачи T1..T6 |
| UI-дизайн | [`docs/specs/comms/B-022-ui-design.md`](./B-022-ui-design.md) | Токены, эскизы, чек-листы 3 тем |
| Аудит | [`docs/design/comms-ui-review.md`](../../design/comms-ui-review.md) | R-18, R-21, R-24, R-28, R-29 |
| Предуспеc | [`docs/specs/comms/B-021-component-spec.md`](./B-021-component-spec.md) | Формат, образец |
| ConversationCard | [`src/components/features/comms/ConversationCard/ConversationCard.tsx`](../../../src/components/features/comms/ConversationCard/ConversationCard.tsx) | T1 + T5 |
| MessageItem | [`src/components/features/comms/MessageItem/MessageItem.tsx`](../../../src/components/features/comms/MessageItem/MessageItem.tsx) | T3 |
| ChatList | [`src/components/features/chats/ChatList/ChatList.tsx`](../../../src/components/features/chats/ChatList/ChatList.tsx) | T2 (перенос) |
| ChatCard | [`src/components/features/chats/ChatCard/`](../../../src/components/features/chats/ChatCard/) | T2 (перенос) |
| chats/page.tsx | [`src/app/dashboard/comms/chats/page.tsx`](../../../src/app/dashboard/comms/chats/page.tsx) | T2 (импорт) |
| edit/page.tsx | [`src/app/dashboard/comms/chats/[chatId]/edit/page.tsx`](../../../src/app/dashboard/comms/chats/[chatId]/edit/page.tsx) | T4 |
| skeleton.test.tsx | [`tests/components/features/comms/comms-pages.skeleton.test.tsx`](../../../tests/components/features/comms/comms-pages.skeleton.test.tsx) | T2 (mock) |
| spinner-a11y.test.tsx | [`tests/components/features/comms/comms-pages-spinner-a11y.test.tsx`](../../../tests/components/features/comms/comms-pages-spinner-a11y.test.tsx) | T2 (mock) |
