# Аудит реализованного UI домена «Общение» (Comms)

> **Дата аудита:** 2026-07-27
> **Аудитор:** UI Designer (режим `ui-designer`)
> **Задача:** B-016 — Ревизия реализованного кода вкладки «Общение» на соответствие дизайн-системе
> **Scope:** `messages/*`, `chats/*` (без `announcements/*`, `moderation/*`)
> **Вердикт:** ❌ **FAIL** — критическое несоответствие цветовым темам

---

## 1. Общая информация

| Параметр | Значение |
|----------|----------|
| Проверяемые страницы | 8 (layout + 7 подстраниц) |
| Проверяемые feature-компоненты | 13 |
| Дизайн-система | tokens (colors, typography, spacing, radius, shadows), 9 UI-компонентов |
| Паттерны | list-page, detail-page, form-page |
| Макет | [`docs/design/layouts/comms/layout.md`](layouts/comms/layout.md) |
| Предыдущий аудит макетов | [`docs/design/comms-ui-audit.md`](comms-ui-audit.md) |

---

## 2. Матрица: Экран/Компонент → Файл → Критерии → Статус

| # | Экран/Компонент | Файл | Theme (токены) | UX (состояния) | Доступность | Layout (макет) | Статус |
|---|----------------|------|:---------:|:-----------:|:--------:|:----------:|:------:|
| 1 | CommsLayout | [`layout.tsx`](../../src/app/dashboard/comms/layout.tsx) | ✅ | ✅ | ⚠️ | ✅ | ⚠️ PASS |
| 2 | CommsTab | [`CommsTab.tsx`](../../src/components/features/comms/CommsTab/CommsTab.tsx) | ✅ **эталон** | ✅ | ✅ | ✅ | ✅ PASS |
| 3 | CommsTabs | [`CommsTabs.tsx`](../../src/components/features/comms/CommsTabs/CommsTabs.tsx) | ✅ | ✅ | ✅ | ✅ | ✅ PASS |
| 4 | Messages page | [`messages/page.tsx`](../../src/app/dashboard/comms/messages/page.tsx) | ❌ | ⚠️ | ⚠️ | ✅ | ❌ FAIL |
| 5 | New message page | [`messages/new/page.tsx`](../../src/app/dashboard/comms/messages/new/page.tsx) | ❌ | ✅ | ⚠️ | — | ❌ FAIL |
| 6 | Conversation detail route | [`messages/[conversationId]/page.tsx`](../../src/app/dashboard/comms/messages/[conversationId]/page.tsx) | ❌ | ⚠️ | ⚠️ | — | ❌ FAIL |
| 7 | Chats page | [`chats/page.tsx`](../../src/app/dashboard/comms/chats/page.tsx) | ❌ | ⚠️ | ⚠️ | ✅ | ❌ FAIL |
| 8 | New chat page | [`chats/new/page.tsx`](../../src/app/dashboard/comms/chats/new/page.tsx) | ❌ | ✅ | ⚠️ | — | ❌ FAIL |
| 9 | Chat page | [`chats/[chatId]/page.tsx`](../../src/app/dashboard/comms/chats/[chatId]/page.tsx) | ❌ | ✅ | ⚠️ | — | ❌ FAIL |
| 10 | Edit chat page | [`chats/[chatId]/edit/page.tsx`](../../src/app/dashboard/comms/chats/[chatId]/edit/page.tsx) | ❌ | ✅ | ⚠️ | — | ❌ FAIL |
| 11 | ConversationList | [`ConversationList.tsx`](../../src/components/features/comms/ConversationList/ConversationList.tsx) | ❌ | ✅ | ⚠️ | ✅ | ❌ FAIL |
| 12 | ConversationCard | [`ConversationCard.tsx`](../../src/components/features/comms/ConversationCard/ConversationCard.tsx) | ❌ | ✅ | ✅ | ✅ | ⚠️ PASS |
| 13 | ConversationEmptyState | [`ConversationEmptyState.tsx`](../../src/components/features/comms/ConversationEmptyState/ConversationEmptyState.tsx) | ❌ | ✅ | ⚠️ | ✅ | ⚠️ PASS |
| 14 | ConversationDetailPage | [`ConversationDetailPage.tsx`](../../src/components/features/comms/ConversationDetailPage/ConversationDetailPage.tsx) | ❌ | ✅ | ⚠️ | — | ❌ FAIL |
| 15 | ConversationMessagesList | [`ConversationMessagesList.tsx`](../../src/components/features/comms/ConversationMessagesList/ConversationMessagesList.tsx) | ❌ | ✅ | ✅ | — | ⚠️ PASS |
| 16 | MessageItem | [`MessageItem.tsx`](../../src/components/features/comms/MessageItem/MessageItem.tsx) | ❌ | ✅ | ✅ | — | ❌ FAIL |
| 17 | MessageList | [`MessageList.tsx`](../../src/components/features/comms/MessageList/MessageList.tsx) | ⚠️ | ✅ | ✅ | — | ⚠️ PASS |
| 18 | MessageInput | [`MessageInput.tsx`](../../src/components/features/comms/MessageInput/MessageInput.tsx) | ❌ | ✅ | ✅ | — | ❌ FAIL |
| 19 | EditChatForm | [`EditChatForm.tsx`](../../src/components/features/comms/EditChatForm/EditChatForm.tsx) | ❌ | ✅ | ✅ | — | ❌ FAIL |
| 20 | ParticipantSelector | [`ParticipantSelector.tsx`](../../src/components/features/comms/ParticipantSelector/ParticipantSelector.tsx) | ❌ | ✅ | ✅ | — | ❌ FAIL |
| 21 | UserSelectorList | [`UserSelectorList.tsx`](../../src/components/features/comms/UserSelectorList/UserSelectorList.tsx) | ❌ | ✅ | ✅ | — | ❌ FAIL |

---

## 3. Замечания по файлам

### 3.1 Критические (🔴) — нарушают работу тем Dark/Green

#### R-01 🔴 `theme` — Сплошной хардкод `text-indigo-600` вместо `var(--theme-accent)`

**Файлы:** Множественные.

**Проблема:** Во всех страницах и большинстве компонентов используется `text-indigo-600` для спиннеров, иконок, акцентных элементов. Это НЕ работает в Dark (акцент `#8b5cf6` purple) и Green (акцент `#10b981` green) темах.

**Примеры:**

| Файл | Строка | Значение |
|------|--------|----------|
| [`messages/page.tsx`](../../src/app/dashboard/comms/messages/page.tsx) | 44 | `text-indigo-600` — spinner |
| [`chats/page.tsx`](../../src/app/dashboard/comms/chats/page.tsx) | 46 | `text-emerald-600` — spinner (другой оттенок!) |
| [`chats/new/page.tsx`](../../src/app/dashboard/comms/chats/new/page.tsx) | 130, 262 | `text-indigo-600` — spinner и submit |
| [`chats/[chatId]/page.tsx`](../../src/app/dashboard/comms/chats/[chatId]/page.tsx) | 176, 202, 232, 276 | `text-indigo-600` — spinner, focus ring |
| [`chats/[chatId]/edit/page.tsx`](../../src/app/dashboard/comms/chats/[chatId]/edit/page.tsx) | 111, 169, 191, 216 | `text-indigo-600` — spinner, focus ring |
| [`ConversationList.tsx`](../../src/components/features/comms/ConversationList/ConversationList.tsx) | 138, 184 | `text-indigo-600` — spinner |
| [`ConversationEmptyState.tsx`](../../src/components/features/comms/ConversationEmptyState/ConversationEmptyState.tsx) | 50 | `bg-indigo-600` — CTA button |
| [`UserSelectorList.tsx`](../../src/components/features/comms/UserSelectorList/UserSelectorList.tsx) | 177, 285 | `text-indigo-600` — spinner и initials |
| [`ParticipantSelector.tsx`](../../src/components/features/comms/ParticipantSelector/ParticipantSelector.tsx) | 226, 232, 292, 395, 427 | `bg-indigo-100`, `text-indigo-600`, `bg-indigo-600` |
| [`EditChatForm.tsx`](../../src/components/features/comms/EditChatForm/EditChatForm.tsx) | 145, 184, 191 | `focus:ring-indigo-500`, `bg-indigo-600` |

**Рекомендация:** Заменить все `text-indigo-*`, `bg-indigo-*`, `focus:ring-indigo-*` на `text-[var(--theme-accent)]`, `bg-[var(--theme-accent)]`, `focus:ring-[var(--theme-accent)]`.

---

#### R-02 🔴 `theme` — Хардкод `text-gray-900` вместо `var(--theme-text-primary)` — ✅ Закрыт B-018

**Файлы:** Все страницы и компоненты.

**Проблема:** `text-gray-900` переопределён в `globals.css` через `!important` для dark/green тем, что является хрупким решением и не соответствует правилу «токены — единый источник правды».

**Примеры:**

| Файл | Строка | Контекст |
|------|--------|----------|
| [`messages/page.tsx`](../../src/app/dashboard/comms/messages/page.tsx) | 69 | `<h1>` заголовок |
| [`chats/page.tsx`](../../src/app/dashboard/comms/chats/page.tsx) | 73 | `<h1>` заголовок |
| [`chats/new/page.tsx`](../../src/app/dashboard/comms/chats/new/page.tsx) | 177 | `<h1>` заголовок |
| [`chats/[chatId]/edit/page.tsx`](../../src/app/dashboard/comms/chats/[chatId]/edit/page.tsx) | 186, 233 | `<h1>` заголовок |
| [`ConversationCard.tsx`](../../src/components/features/comms/ConversationCard/ConversationCard.tsx) | 147 | Имя участника |
| [`ConversationList.tsx`](../../src/components/features/comms/ConversationList/ConversationList.tsx) | 123, 179 | Заголовок, ошибка |
| [`ConversationEmptyState.tsx`](../../src/components/features/comms/ConversationEmptyState/ConversationEmptyState.tsx) | 41 | Заголовок |
| [`MessageItem.tsx`](../../src/components/features/comms/MessageItem/MessageItem.tsx) | 101 | Имя отправителя |
| [`UserSelectorList.tsx`](../../src/components/features/comms/UserSelectorList/UserSelectorList.tsx) | 217, 243, 294 | Заголовок, имя |
| [`ParticipantSelector.tsx`](../../src/components/features/comms/ParticipantSelector/ParticipantSelector.tsx) | 332, 358, 436 | Заголовок, имя |

**Рекомендация:** Заменить `text-gray-900` на `text-[var(--theme-text-primary)]`. Удалить `!important`-переопределения из `globals.css`.

---

#### R-03 🔴 `theme` — Хардкод `bg-white` вместо `var(--theme-bg-primary)` — ✅ Закрыт B-018

**Файлы:** Множественные.

**Проблема:** `bg-white` переопределён в `globals.css`, но это хрупкое решение. При использовании компонентов вне контейнера с `[data-theme]` они отобразятся с белым фоном.

**Примеры:**

| Файл | Строка |
|------|--------|
| [`messages/page.tsx`](../../src/app/dashboard/comms/messages/page.tsx) | 72 |
| [`chats/page.tsx`](../../src/app/dashboard/comms/chats/page.tsx) | 96 |
| [`chats/new/page.tsx`](../../src/app/dashboard/comms/chats/new/page.tsx) | 193 |
| [`EditChatForm.tsx`](../../src/components/features/comms/EditChatForm/EditChatForm.tsx) | 120 |
| [`ConversationDetailPage.tsx`](../../src/components/features/comms/ConversationDetailPage/ConversationDetailPage.tsx) | 148, 150 |
| [`MessageInput.tsx`](../../src/components/features/comms/MessageInput/MessageInput.tsx) | 88, 100 |

**Рекомендация:** Заменить `bg-white` на `bg-[var(--theme-bg-primary)]`.

---

#### R-04 🔴 `theme` — Хардкод `border-gray-*` вместо `var(--theme-border-color)` / `var(--theme-input-border)` — ✅ Закрыт B-018

**Файлы:** Все страницы и компоненты с формами.

**Проблема:** Границы формы и разделители используют `border-gray-300`, `border-gray-200` вместо токенов.

**Примеры:**

| Файл | Строка | Значение |
|------|--------|----------|
| [`messages/new/page.tsx`](../../src/app/dashboard/comms/messages/new/page.tsx) | 223, 265, 272 | `border-gray-300`, `border-gray-200`, `border-red-200` |
| [`chats/new/page.tsx`](../../src/app/dashboard/comms/chats/new/page.tsx) | 208, 231, 251 | `border-gray-300`, `border-gray-200` |
| [`chats/[chatId]/edit/page.tsx`](../../src/app/dashboard/comms/chats/[chatId]/edit/page.tsx) | 192 | `border-red-200` |
| [`ConversationList.tsx`](../../src/components/features/comms/ConversationList/ConversationList.tsx) | 129 | `border-gray-300` |
| [`ConversationDetailPage.tsx`](../../src/components/features/comms/ConversationDetailPage/ConversationDetailPage.tsx) | 150, 192 | `border-gray-200`, `border-red-200` |
| [`MessageInput.tsx`](../../src/components/features/comms/MessageInput/MessageInput.tsx) | 88, 99 | `border-t border-gray-200`, `border-gray-300` |
| [`EditChatForm.tsx`](../../src/components/features/comms/EditChatForm/EditChatForm.tsx) | 125, 145, 169, 180 | `border-red-200`, `border-gray-300`, `border-gray-200` |
| [`ParticipantSelector.tsx`](../../src/components/features/comms/ParticipantSelector/ParticipantSelector.tsx) | 271, 369, 396 | `border-gray-300`, `divide-gray-200`, `border-gray-300` |
| [`UserSelectorList.tsx`](../../src/components/features/comms/UserSelectorList/UserSelectorList.tsx) | 156, 254 | `border-gray-300`, `divide-gray-200` |

**Рекомендация:** 
- `border-gray-300` → `border-[var(--theme-input-border)]`
- `border-gray-200` → `border-[var(--theme-border-color)]`
- `border-red-200` → `border-[var(--theme-danger)]` (opacity-20)

---

#### R-05 🔴 `theme` — Хардкод `text-gray-500` / `text-gray-600` / `text-gray-400` вместо `var(--theme-text-secondary)` — ✅ Закрыт B-018

**Файлы:** Множественные.

**Проблема:** Вторичный текст (описания, email, даты, метаданные) использует хардкод вместо токена.

**Примеры:**

| Файл | Строка |
|------|--------|
| [`chats/[chatId]/edit/page.tsx`](../../src/app/dashboard/comms/chats/[chatId]/edit/page.tsx) | 173, 204, 220 |
| [`chats/[chatId]/page.tsx`](../../src/app/dashboard/comms/chats/[chatId]/page.tsx) | 236, 265, 280, 298 |
| [`ConversationCard.tsx`](../../src/components/features/comms/ConversationCard/ConversationCard.tsx) | 151, 163, 164 |
| [`ConversationEmptyState.tsx`](../../src/components/features/comms/ConversationEmptyState/ConversationEmptyState.tsx) | 28, 44 |
| [`ConversationMessagesList.tsx`](../../src/components/features/comms/ConversationMessagesList/ConversationMessagesList.tsx) | 135, 165 |
| [`MessageInput.tsx`](../../src/components/features/comms/MessageInput/MessageInput.tsx) | 103, 153 |
| [`MessageItem.tsx`](../../src/components/features/comms/MessageItem/MessageItem.tsx) | 104 |

**Рекомендация:** 
- `text-gray-500` / `text-gray-600` → `text-[var(--theme-text-secondary)]`
- `text-gray-400` → `text-[var(--theme-text-secondary)]`

---

#### R-06 🔴 `theme` — Хардкод `bg-red-*` и `text-red-*` вместо `var(--theme-danger)` — ✅ Закрыт B-018

**Файлы:** Все компоненты с ошибками.

**Проблема:** Сообщения об ошибках используют хардкод `bg-red-50`, `text-red-600`, `text-red-700`, `text-red-800`, `border-red-200` вместо семантического токена `color.danger`.

**Примеры:**

| Файл | Строка |
|------|--------|
| [`messages/new/page.tsx`](../../src/app/dashboard/comms/messages/new/page.tsx) | 98 – 99, 265 – 266 |
| [`chats/new/page.tsx`](../../src/app/dashboard/comms/chats/new/page.tsx) | 184 – 188 |
| [`chats/[chatId]/edit/page.tsx`](../../src/app/dashboard/comms/chats/[chatId]/edit/page.tsx) | 125 |
| [`chats/[chatId]/page.tsx`](../../src/app/dashboard/comms/chats/[chatId]/page.tsx) | 253 |
| [`ConversationDetailPage.tsx`](../../src/components/features/comms/ConversationDetailPage/ConversationDetailPage.tsx) | 192 – 197 |
| [`EditChatForm.tsx`](../../src/components/features/comms/EditChatForm/EditChatForm.tsx) | 125 |

**Рекомендация:** Использовать компонент `<ErrorMessage>` из дизайн-системы или заменить хардкод на:
- `bg-red-50` → `bg-[var(--theme-danger)]/10`
- `text-red-600` / `text-red-700` / `text-red-800` → `text-[var(--theme-danger)]`
- `border-red-200` → `border-[var(--theme-danger)]/20`

---

#### R-07 🔴 `theme` — Хардкод `bg-blue-*` и `text-blue-*` вместо `var(--theme-info)` — ✅ Закрыт B-018

**Файлы:** [`messages/new/page.tsx`](../../src/app/dashboard/comms/messages/new/page.tsx)

**Проблема:** Строки 322 – 344 используют `bg-blue-50`, `border-blue-200`, `text-blue-600`, `text-blue-700` для индикатора загрузки создания диалога. Это не работает в dark/green темах.

**Рекомендация:** Заменить на `bg-[var(--theme-info)]/10`, `border-[var(--theme-info)]/20`, `text-[var(--theme-info)]`.

---

#### R-08 🔴 `theme` — MessageItem: хардкод вместо CSS-переменных

**Файл:** [`MessageItem.tsx`](../../src/components/features/comms/MessageItem/MessageItem.tsx)

**Проблема:** Полная несовместимость с темами:

| Строка | Проблема | Рекомендация |
|--------|----------|-------------|
| 66 | `bg-blue-50 dark:bg-blue-900/20` | `bg-[var(--theme-info)]/10` |
| 75 | `bg-primary` | `bg-[var(--theme-accent)]` |
| 76 | `bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300` | `bg-[var(--theme-bg-secondary)] text-[var(--theme-text-primary)]` |
| 101 | `text-gray-900 dark:text-gray-100` | `text-[var(--theme-text-primary)]` |
| 104 | `text-gray-500 dark:text-gray-400` | `text-[var(--theme-text-secondary)]` |
| 114 | `bg-primary` | `bg-[var(--theme-accent)]` |
| 115 | `bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100` | `bg-[var(--theme-bg-primary)] text-[var(--theme-text-primary)]` |
| 136 | `text-green-500` / `text-green-600 dark:text-green-400` | `text-[var(--theme-success)]` |
| 142 | `text-blue-500` / `text-blue-600 dark:text-blue-400` | `text-[var(--theme-info)]` |

---

#### R-09 🔴 `theme` — ConversationDetailPage: хардкод dark-классов

**Файл:** [`ConversationDetailPage.tsx`](../../src/components/features/comms/ConversationDetailPage/ConversationDetailPage.tsx)

**Проблема:** Использует `dark:`-префиксы Tailwind вместо CSS-переменных. Это работает только для dark-темы, но НЕ для green-темы.

| Строка | Проблема |
|--------|----------|
| 148 | `bg-white dark:bg-gray-900` |
| 150 | `border-gray-200 dark:border-gray-700`, `bg-white dark:bg-gray-900` |
| 154 | `hover:bg-gray-100 dark:hover:bg-gray-800` |
| 158 | `text-gray-600 dark:text-gray-400` |
| 173 | `text-gray-900 dark:text-gray-100` |
| 192 | `bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800` |
| 194, 197 | `text-red-700 dark:text-red-400` |

**Рекомендация:** Заменить все `dark:`-префиксы на CSS-переменные через `var(--theme-*)`.

---

#### R-10 🔴 `theme` — MessageInput: хардкод dark-классов

**Файл:** [`MessageInput.tsx`](../../src/components/features/comms/MessageInput/MessageInput.tsx)

Аналогичная проблема — использование `dark:`-префиксов:

| Строка | Проблема |
|--------|----------|
| 88 | `border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800` |
| 99 | `border-gray-300 dark:border-gray-600` |
| 100 | `bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100` |
| 102 | `disabled:bg-gray-100 dark:disabled:bg-gray-800` |
| 103 | `placeholder:text-gray-400 dark:placeholder:text-gray-500` |
| 153, 154 | `text-gray-500 dark:text-gray-400`, `bg-gray-100 dark:bg-gray-700` |

---

#### R-11 🔴 `theme` — Нестандартный `text-primary` класс

**Файлы:** [`MessageItem.tsx`](../../src/components/features/comms/MessageItem/MessageItem.tsx:75,114), [`MessageInput.tsx`](../../src/components/features/comms/MessageInput/MessageInput.tsx:101,117)

**Проблема:** Используется `bg-primary`, `focus:ring-primary` — это не токен дизайн-системы. В `globals.css` нет определения `.bg-primary` или `.ring-primary`. Это полагается на нестандартный Tailwind-класс, который не определен.

**Рекомендация:** Заменить на `bg-[var(--theme-accent)]` и `focus:ring-[var(--theme-accent)]`.

---

#### R-12 🔴 `theme` — Несоответствие цвета спиннера на chats page

**Файл:** [`chats/page.tsx`](../../src/app/dashboard/comms/chats/page.tsx:46)

**Проблема:** Спиннер использует `text-emerald-600`, в то время как все остальные страницы используют `text-indigo-600`. Это нарушает консистентность и не работает в темах.

**Рекомендация:** Заменить на `text-[var(--theme-accent)]`.

---

### 3.2 Средние (🟡) — ухудшают UX

#### R-13 🟡 `ux` — Отсутствие компонентов дизайн-системы — ✅ Закрыт B-019

**Файлы:** Все страницы.

**Проблема:** Вместо использования компонентов дизайн-системы (`<Button>`, `<Input>`, `<Badge>`, `<Select>`, `<Checkbox>`, `<ErrorMessage>`) код использует сырые HTML-элементы с Tailwind-классами.

**Примеры:**

| Файл | Строка | Используется | Должно быть |
|------|--------|-------------|-------------|
| [`chats/page.tsx`](../../src/app/dashboard/comms/chats/page.tsx) | 74 | `<button>` | `<Button variant="primary">` |
| [`chats/new/page.tsx`](../../src/app/dashboard/comms/chats/new/page.tsx) | 202 | `<input>` | `<Input>` |
| [`chats/new/page.tsx`](../../src/app/dashboard/comms/chats/new/page.tsx) | 226 | `<textarea>` | `<Input as="textarea">` |
| [`chats/[chatId]/page.tsx`](../../src/app/dashboard/comms/chats/[chatId]/page.tsx) | 305 | `<button>` | `<Button variant="secondary">` |
| [`chats/[chatId]/edit/page.tsx`](../../src/app/dashboard/comms/chats/[chatId]/edit/page.tsx) | 139 – 148 | `<input>` | `<Input>` |
| [`chats/[chatId]/edit/page.tsx`](../../src/app/dashboard/comms/chats/[chatId]/edit/page.tsx) | 164 – 173 | `<textarea>` | `<Input as="textarea">` |
| [`ConversationList.tsx`](../../src/components/features/comms/ConversationList/ConversationList.tsx) | 124 – 131 | `<input>` | `<Input>` |
| [`ConversationEmptyState.tsx`](../../src/components/features/comms/ConversationEmptyState/ConversationEmptyState.tsx) | 47 – 50 | `<button>` | `<Button variant="primary">` |
| [`EditChatForm.tsx`](../../src/components/features/comms/EditChatForm/EditChatForm.tsx) | 139 – 148, 164 – 173 | `<input>`, `<textarea>` | `<Input>` |
| [`EditChatForm.tsx`](../../src/components/features/comms/EditChatForm/EditChatForm.tsx) | 181 – 191 | `<button>` | `<Button>` |
| [`MessageItem.tsx`](../../src/components/features/comms/MessageItem/MessageItem.tsx) | 155 | `<span>` | `<Badge variant="danger">` |

**Рекомендация:** Заменить все сырые HTML-формы на компоненты из дизайн-системы (`docs/design/components/`).

---

#### R-14 🟡 `ux` — Отсутствие скелетонов для Loading состояния

**Файлы:** Все страницы.

**Проблема:** Все компоненты используют спиннер для индикации загрузки вместо скелетонов (pulsing блоков), как предписано в [`ui-design-rules.md`](../rules/ui-design-rules.md) (секция 5.1).

**Примеры:**

| Файл | Строка | Текущее состояние |
|------|--------|-------------------|
| [`ConversationList.tsx`](../../src/components/features/comms/ConversationList/ConversationList.tsx) | 135 – 158 | Спиннер + текст |
| [`ConversationMessagesList.tsx`](../../src/components/features/comms/ConversationMessagesList/ConversationMessagesList.tsx) | 163 – 181 | Спиннер |
| [`messages/page.tsx`](../../src/app/dashboard/comms/messages/page.tsx) | 42 – 64 | Спиннер |

**Рекомендация:** Заменить спиннеры на скелетоны (pulsing блоки) в соответствии с макетом.

---

#### R-15 🟡 `ux` — Отсутствие кнопки «Назад» с breadcrumbs

**Файлы:** Все подстраницы.

**Проблема:** В макете (`layout.md`) описаны breadcrumbs для навигации. В реализованном коде навигация назад реализована через иконку-стрелку, а не через breadcrumbs. Отсутствует компонент `<Breadcrumbs>`.

**Рекомендация:** Добавить breadcrumbs на все подстраницы согласно макету и US-NAV-06.

---

#### R-16 🟡 `ux` — Дублирование кода UserSelectorList — ✅ Закрыт B-019

**Файлы:** [`messages/new/page.tsx`](../../src/app/dashboard/comms/messages/new/page.tsx), [`UserSelectorList/UserSelectorList.tsx`](../../src/components/features/comms/UserSelectorList/UserSelectorList.tsx)

**Проблема:** Компонент `UserSelectorList` определён дважды:
1. Как инлайн-компонент в `messages/new/page.tsx` (строки 108 – 352)
2. Как отдельный компонент в `UserSelectorList/UserSelectorList.tsx`

Это дублирование ведёт к рассинхронизации и увеличивает объём кода для поддержки. Инлайн-версия имеет отличный UX от отдельного компонента (нет клавиатурной навигации в инлайн-версии).

**Рекомендация:** Удалить инлайн-версию из `messages/new/page.tsx` и использовать импортированный `UserSelectorList`.

---

#### R-17 🟡 `ux` — Отсутствие `role="status"` для Loading состояний

**Файлы:** Все компоненты с Loading.

**Проблема:** Loading индикаторы не имеют `role="status"` и `aria-live="polite"`, что ухудшает доступность для screen readers.

**Рекомендация:** Добавить `role="status"` и `aria-live="polite"` к контейнерам спиннеров/скелетонов.

---

#### R-18 🟡 `ux` — Неравномерная высота аватарки

**Файлы:** [`ConversationCard.tsx`](../../src/components/features/comms/ConversationCard/ConversationCard.tsx:135)

**Проблема:** Аватар имеет `h-12 w-12` (48px), аватар-заглушка тоже. Но в макете (`layout.md:133`) аватар показан как `[Ава]` — компактный (`h-10 w-10` — 40px). Несоответствие макету.

**Рекомендация:** Привести размер аватара к единому стандарту (`h-10 w-10`).

---

#### R-19 🟡 `ux` — MessageItem: Отсутствие кнопки удаления

**Файл:** [`MessageItem.tsx`](../../src/components/features/comms/MessageItem/MessageItem.tsx)

**Проблема:** В файле нет кнопки удаления сообщения, хотя в `ChatPage` (`chats/[chatId]/page.tsx`) определён `handleDeleteMessage`. MessageList также принимает `onDelete`, но MessageItem не использует этот проп.

**Рекомендация:** Добавить кнопку удаления (с `<ConfirmDialog>`) для своих сообщений.

---

#### R-20 🟡 `ux` — MessageInput: отсутствует кнопка «Отправить» с визуальным стилем

**Файл:** [`MessageInput.tsx`](../../src/components/features/comms/MessageInput/MessageInput.tsx:110 – 120)

**Проблема:** Кнопка отправки не использует `<Button>` компонент и не имеет фона (`bg-[var(--theme-accent)]`). Иконка белая (`text-white`), но фон кнопки не задан. В тёмных темах иконка может быть не видна.

**Рекомендация:** Заменить на `<Button variant="primary" size="md">` или явно задать фон.

---

#### R-21 🟡 `ux` — Chats page: импорт из chats вместо comms

**Файл:** [`chats/page.tsx`](../../src/app/dashboard/comms/chats/page.tsx:27)

**Проблема:** Импорт `{ ChatList }` из `@/components/features/chats/ChatList` вместо `@/components/features/comms/ChatList`. Это нарушает консистентность — все остальные компоненты в comms находятся внутри `features/comms/`.

**Рекомендация:** Переместить ChatList в `@/components/features/comms/ChatList` или переимпортировать.

---

#### R-22 🟡 `ux` — Не используется `<EmptyState>` дизайн-системы — ✅ Закрыт B-019

**Файлы:** [`ConversationEmptyState.tsx`](../../src/components/features/comms/ConversationEmptyState/ConversationEmptyState.tsx)

**Проблема:** Компонент `ConversationEmptyState` — это кастомная реализация пустого состояния. В дизайн-системе есть готовый компонент `<EmptyState>` из `docs/design/components/empty-state.md`.

**Рекомендация:** Использовать `<EmptyState>` дизайн-системы вместо кастомной реализации.

---

#### R-23 🟡 `ux` — Не используется `<ErrorMessage>` дизайн-системы — ✅ Закрыт B-019

**Файлы:** Все компоненты с обработкой ошибок.

**Проблема:** Компоненты отображают ошибки через кастомные `div` с `bg-red-50`, вместо использования `<ErrorMessage>` из дизайн-системы.

**Рекомендация:** Использовать `<ErrorMessage message={error}>` из дизайн-системы.

---

### 3.3 Низкие (🟢) — минорные несоответствия

#### R-24 🟢 `ux` — ConversationMessageList: не используется isLastMessage

**Файл:** [`ConversationMessagesList.tsx`](../../src/components/features/comms/ConversationMessagesList/ConversationMessagesList.tsx:158)

**Проблема:** `isLastMessage` передаётся в `MessageItem`, но в `MessageItem` он используется только для визуального акцента (background highlight), что может быть избыточно.

**Рекомендация:** Убрать визуальный акцент для последнего сообщения или сделать его через анимацию.

---

#### R-25 🟢 `theme` — Отсутствие green-темы в dark:префиксах

**Файлы:** [`ConversationDetailPage.tsx`](../../src/components/features/comms/ConversationDetailPage/ConversationDetailPage.tsx), [`MessageInput.tsx`](../../src/components/features/comms/MessageInput/MessageInput.tsx)

**Проблема:** Использование `dark:`-префиксов работает только для `data-theme="dark"`, но не для `data-theme="green"`. Для green-темы `dark:`-префиксы не применяются, так как Tailwind `dark:` селектор ориентируется на `@media (prefers-color-scheme: dark)` или `.dark` класс, а не на `[data-theme="green"]`.

**Рекомендация:** Полностью отказаться от `dark:`-префиксов в пользу CSS-переменных `var(--theme-*)`.

---

#### R-26 🟢 `ux` — Отсутствие атрибутов `role="status"` на индикаторах загрузки

**Файлы:** Множественные.

**Проблема:** Спиннеры и индикаторы загрузки не имеют `role="status"` и `aria-live`.

**Рекомендация:** Добавить `role="status" aria-live="polite"` ко всем индикаторам загрузки.

---

#### R-27 🟢 `theme` — `globals.css`: хрупкие `!important`-переопределения — ✅ Закрыт B-018

**Файл:** [`globals.css`](../../src/app/globals.css:153 – 200)

**Проблема:** Файл содержит `!important`-переопределения для Tailwind-классов в тёмных темах (строки 153 – 189). Это хрупкое решение:
- `!important` может сломаться при изменении порядка CSS
- Не все классы переопределены (например, `bg-gray-100` не переопределён)
- `bg-indigo-*`, `bg-red-*`, `bg-blue-*` и другие кастомные цвета не переопределены

**Рекомендация:** Полностью отказаться от `!important`-переопределений, заменив все хардкод-классы во всех компонентах на CSS-переменные `var(--theme-*)`.

---

#### R-28 🟢 `ux` — Сообщение «Чат не найден» без заголовка

**Файл:** [`chats/[chatId]/edit/page.tsx`](../../src/app/dashboard/comms/chats/[chatId]/edit/page.tsx:201 – 206)

**Проблема:** При состоянии «чат не найден» отображается только `text-gray-500` без заголовка страницы и кнопки назад.

**Рекомендация:** Добавить заголовок «Редактирование чата» и кнопку «Назад» для консистентности с другими экранами ошибок.

---

#### R-29 🟢 `ux` — ConversationCard: клик по всей карточке, нет CTA

**Файл:** [`ConversationCard.tsx`](../../src/components/features/comms/ConversationCard/ConversationCard.tsx)

**Проблема:** Карточка полностью кликабельна, но нет явного визуального CTA (стрелка, кнопка «Открыть»). Пользователь может не понять, что карточка интерактивна.

**Рекомендация:** Добавить иконку-стрелку или hover-эффект, явно указывающий на кликабельность.

---

## 4. Сводка по категориям

### 4.1 По серьёзности

| Серьёзность | Количество | Описание |
|:-----------:|:----------:|----------|
| 🔴 Critical | 12 | Нарушают работу тем Dark/Green, блокируют функциональность |
| 🟡 Medium | 11 | Ухудшают UX, несоответствие дизайн-системе |
| 🟢 Low | 6 | Минорные несоответствия |
| **Итого** | **29** | |

### 4.2 По категориям

| Категория | Количество | % |
|:---------:|:----------:|:-:|
| `theme` (цветовые темы) | 17 | 59% |
| `ux` (удобство использования) | 12 | 41% |

### 4.3 По файлам

| Статус | Количество | Файлы |
|:------:|:----------:|-------|
| ✅ PASS | 3 | `CommsTab`, `CommsTabs`, `CommsLayout` |
| ⚠️ PASS | 4 | `ConversationCard`, `ConversationEmptyState`, `ConversationMessagesList`, `MessageList` |
| ❌ FAIL | 14 | Все остальные |

---

## 5. Анализ globals.css: проблема патч-подхода

Текущий подход к темам в `globals.css` — патч-поверх Tailwind-классов через `[data-theme]`-селекторы. Это имеет следующие проблемы:

### 5.1 Проблемы

| # | Проблема | Описание |
|---|----------|----------|
| P-01 | **Неполное покрытие** | Переопределены только `bg-white`, `bg-gray-50`, `bg-gray-900`, `text-gray-{900,800,700,600,500,400,300,200,100}`. Но НЕ переопределены: `bg-indigo-*`, `bg-red-*`, `bg-blue-*`, `bg-green-*`, `border-*`, `divide-*` и др. |
| P-02 | **!important** | Использование `!important` (строки 161, 167, 173, 178, 183, 188) делает CSS хрупким — любой сторонний компонент с `!important` может перебить тему |
| P-03 | **Green-тема не полная** | `dark:`-префиксы Tailwind не срабатывают для `data-theme="green"`, так как Tailwind не знает о green-теме |
| P-04 | **Подход не масштабируется** | При добавлении новых компонентов с новыми Tailwind-классами нужно не забыть добавить переопределение в `globals.css` |

### 5.2 Рекомендация

Единственное правильное решение — **полный переход на CSS-переменные** (`var(--theme-*)`) во всех компонентах, без использования хардкод-классов Tailwind для цветов. Подход:

```tsx
// ❌ Текущий подход (не работает в темах)
<div className="bg-white text-gray-900">
  <button className="bg-indigo-600">Кнопка</button>
</div>

// ✅ Целевой подход (работает во всех темах)
<div className="bg-[var(--theme-bg-primary)] text-[var(--theme-text-primary)]">
  <button className="bg-[var(--theme-accent)] text-white">Кнопка</button>
</div>
```

---

## 6. Рекомендации по remediation (приоритезированный список)

> **✅ Статус закрытия:** Замечания **R-02…R-07** (нейтральные и семантические цвета в `messages/*`, `chats/*`, `announcements/*`) и **R-27** (очистка `globals.css` от `!important`) закрыты задачей **B-018**. Замечания **R-13, R-16, R-22, R-23** (переход на компоненты дизайн-системы) закрыты задачей **B-019**. См. [план B-018](../plans/B-018-tokens-migration-plan.md), [QA-отчёт B-018](../tests/B-018-qa-report.md), [план B-019](../plans/B-019-ds-components-migration-plan.md) и [QA-отчёт B-019](../tests/B-019-qa-report.md). Ниже список актуален на момент аудита (B-016).

### 🔴 Неделя 1: Критические (блокируют работу тем)

| Приоритет | ID | Задача | Файлы | Оценка |
|:---------:|:--:|--------|-------|:------:|
| P0 | R-01 | Заменить `text-indigo-*` / `bg-indigo-*` / `focus:ring-indigo-*` на `var(--theme-accent)` | Все файлы | 2 дня |
| P0 | R-08 | Мигрировать MessageItem на CSS-переменные | `MessageItem.tsx` | 0.5 дня |
| P0 | R-09 | Мигрировать ConversationDetailPage на CSS-переменные | `ConversationDetailPage.tsx` | 0.5 дня |
| P0 | R-10 | Мигрировать MessageInput на CSS-переменные | `MessageInput.tsx` | 0.5 дня |
| P1 | R-02 | Заменить `text-gray-900` на `var(--theme-text-primary)` | Все файлы | 0.5 дня |
| P1 | R-03 | Заменить `bg-white` на `var(--theme-bg-primary)` | Все файлы | 0.5 дня |
| P1 | R-04 | Заменить `border-gray-*` на `var(--theme-border-color)` / `var(--theme-input-border)` | Все файлы | 0.5 дня |
| P1 | R-05 | Заменить `text-gray-500/600/400` на `var(--theme-text-secondary)` | Все файлы | 0.5 дня |
| P1 | R-06 | Заменить `bg-red-*` / `text-red-*` на `var(--theme-danger)` | Все файлы | 0.5 дня |
| P1 | R-11 | Заменить `bg-primary` / `focus:ring-primary` на `var(--theme-accent)` | `MessageItem.tsx`, `MessageInput.tsx` | 0.25 дня |

### 🟡 Неделя 2: Средние (улучшение UX)

| Приоритет | ID | Задача | Файлы | Оценка |
|:---------:|:--:|--------|-------|:------:|
| P2 | R-13 | Заменить сырые HTML-элементы на компоненты DS (Button, Input, Badge, ErrorMessage) | Все файлы | 2 дня |
| P2 | R-16 | Удалить дублирование UserSelectorList | `messages/new/page.tsx`, `UserSelectorList.tsx` | 0.5 дня |
| P2 | R-22 | Использовать `<EmptyState>` DS вместо кастомного | `ConversationEmptyState.tsx` | 0.25 дня |
| P2 | R-23 | Использовать `<ErrorMessage>` DS вместо кастомных div | Все файлы | 0.5 дня |
| P2 | R-20 | Исправить кнопку отправки в MessageInput | `MessageInput.tsx` | 0.25 дня |
| P3 | R-14 | Заменить спиннеры на скелетоны | `ConversationList.tsx`, `ConversationMessagesList.tsx`, `pages` | 1 день |
| P3 | R-15 | Добавить breadcrumbs | Все подстраницы | 0.5 дня |
| P3 | R-19 | Добавить кнопку удаления сообщения | `MessageItem.tsx` | 0.5 дня |

### 🟢 Неделя 3: Низкие

| Приоритет | ID | Задача | Оценка |
|:---------:|:--:|--------|:------:|
| P4 | R-27 | Рефакторинг `globals.css` — удаление `!important` | 1 день |
| P4 | R-17 | Добавить `role="status"` для loading состояний | 0.5 дня |
| P4 | R-18 | Исправить размер аватара | 0.25 дня |
| P4 | R-21 | Исправить импорт ChatList | 0.25 дня |
| P4 | R-28 | Исправить состояние «чат не найден» | 0.25 дня |
| P4 | R-29 | Добавить CTA на карточку диалога | 0.25 дня |

---

## 7. Эталонный компонент

Компонент [`CommsTab.tsx`](../../src/components/features/comms/CommsTab/CommsTab.tsx) является эталоном корректного использования CSS-переменных:

```tsx
// ✅ Эталон: CommsTab.tsx (строка 69)
active
  ? 'border-[var(--theme-accent)] text-[var(--theme-text-primary)]'
  : 'border-transparent text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:border-[var(--theme-border-color)]',
```

Все компоненты должны быть мигрированы к этому подходу.

---

## 8. Связанные артефакты

- 📋 **Токены цветов:** [`docs/design/tokens/colors.md`](tokens/colors.md)
- 📋 **UI-компоненты:** [`docs/design/components/`](components/)
- 📋 **Правила UI Designer:** [`docs/rules/ui-design-rules.md`](../rules/ui-design-rules.md)
- 📋 **Макет:** [`docs/design/layouts/comms/layout.md`](layouts/comms/layout.md)
- 📋 **Предыдущий аудит (макеты):** [`docs/design/comms-ui-audit.md`](comms-ui-audit.md)
- 📋 **Требование:** [`docs/requirements/REQ-COMMS-001.md`](../requirements/REQ-COMMS-001.md)
- ✅ **Закрытие R-02…R-07, R-27:** [план B-018](../plans/B-018-tokens-migration-plan.md), [валидация B-018](../plans/B-018-tokens-migration-plan-validation.md), [design B-018](../specs/comms/B-018-ui-design.md), [component-spec B-018](../specs/comms/B-018-component-spec.md), [review B-018](../reviews/B-018-review.md), [QA-отчёт B-018](../tests/B-018-qa-report.md)
- ✅ **Закрытие R-13, R-16, R-22, R-23:** [план B-019](../plans/B-019-ds-components-migration-plan.md), [валидация B-019](../plans/B-019-ds-components-migration-plan-validation.md), [design B-019](../specs/comms/B-019-ui-design.md), [component-spec B-019](../specs/comms/B-019-component-spec.md), [review B-019](../reviews/B-019-review.md), [QA-отчёт B-019](../tests/B-019-qa-report.md)
