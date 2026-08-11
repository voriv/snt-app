# Спецификация компонент: B-019 COMMS UI — Переход на компоненты дизайн-системы

> **Назначение:** Спецификация компонент и скелетов кода для [B-019](../../plans/B-019-ds-components-migration-plan.md)
> **Создано:** `component-spec` режим
> **Статус:** `[DRAFT]`

---

## 1. 📋 Метаданные

| Параметр | Значение |
|---|---|
| **Feature** | `B-019` — COMMS UI: Переход на компоненты дизайн-системы |
| **План реализации** | [`docs/plans/B-019-ds-components-migration-plan.md`](../../plans/B-019-ds-components-migration-plan.md) |
| **User Stories** | US-21-01, US-21-05, US-21-06 |
| **Требования** | REQ-COMMS-001 |
| **Дизайн-справка** | [`docs/specs/comms/B-019-ui-design.md`](./B-019-ui-design.md) |
| **Ревью** | [`docs/design/comms-ui-review.md`](../../design/comms-ui-review.md) (R-13, R-16, R-22, R-23) |
| **Версия** | `v1.0` |
| **Дата** | `2026-08-06` |
| **Статус** | `[DRAFT]` |

---

## 2. 📊 Матрица трассировки

> Действия: 🆕 — создать файл, ✏️ — добавить в существующий, 🔧 — изменить существующее.

| # | Компонент | Слой | Действие | R-ID | Задача | Статус |
|---|---|---|---|---|---|---|
| 1 | [`Input`](../../../src/components/ui/Input/Input.tsx) `as="textarea"` | UI (DS) | 🔧 | R-13 | B-019-T0 | `[TODO]` |
| 2 | [`ConversationList`](../../../src/components/features/comms/ConversationList/ConversationList.tsx) ошибки | UI | ✏️ | R-23 | B-019-T1 | `[TODO]` |
| 3 | [`EditChatForm`](../../../src/components/features/comms/EditChatForm/EditChatForm.tsx) ошибки | UI | ✏️ | R-23 | B-019-T2 | `[TODO]` |
| 4 | [`chats/new/page.tsx`](../../../src/app/dashboard/comms/chats/new/page.tsx) ошибки | UI | ✏️ | R-23 | B-019-T3 | `[TODO]` |
| 5 | [`chats/[chatId]/edit/page.tsx`](../../../src/app/dashboard/comms/chats/[chatId]/edit/page.tsx) ошибки | UI | ✏️ | R-23 | B-019-T4 | `[TODO]` |
| 6 | [`ConversationDetailPage`](../../../src/components/features/comms/ConversationDetailPage/ConversationDetailPage.tsx) ошибки | UI | ✏️ | R-23 | B-019-T5 | `[TODO]` |
| 7 | [`UserSelectorList`](../../../src/components/features/comms/UserSelectorList/UserSelectorList.tsx) ошибки | UI | ✏️ | R-23 | B-019-T6 | `[TODO]` |
| 8 | [`ParticipantSelector`](../../../src/components/features/comms/ParticipantSelector/ParticipantSelector.tsx) ошибки | UI | ✏️ | R-23 | B-019-T7 | `[TODO]` |
| 9 | [`ConversationEmptyState`](../../../src/components/features/comms/ConversationEmptyState/ConversationEmptyState.tsx) | UI | 🔧 | R-22 | B-019-T8 | `[TODO]` |
| 10 | [`chats/page.tsx`](../../../src/app/dashboard/comms/chats/page.tsx) кнопки | UI | ✏️ | R-13 | B-019-T9 | `[TODO]` |
| 11 | [`chats/new/page.tsx`](../../../src/app/dashboard/comms/chats/new/page.tsx) HTML→DS | UI | ✏️ | R-13 | B-019-T10 | `[TODO]` |
| 12 | [`chats/[chatId]/edit/page.tsx`](../../../src/app/dashboard/comms/chats/[chatId]/edit/page.tsx) кнопки | UI | ✏️ | R-13 | B-019-T11 | `[TODO]` |
| 13 | [`EditChatForm`](../../../src/components/features/comms/EditChatForm/EditChatForm.tsx) HTML→DS | UI | ✏️ | R-13 | B-019-T12 | `[TODO]` |
| 14 | [`ConversationList`](../../../src/components/features/comms/ConversationList/ConversationList.tsx) HTML→DS | UI | ✏️ | R-13 | B-019-T13 | `[TODO]` |
| 15 | [`MessageItem`](../../../src/components/features/comms/MessageItem/MessageItem.tsx) Badge+Button | UI | ✏️ | R-13 | B-019-T14 | `[TODO]` |
| 16 | [`MessageInput`](../../../src/components/features/comms/MessageInput/MessageInput.tsx) HTML→DS | UI | ✏️ | R-13 | B-019-T15 | `[TODO]` |
| 17 | [`ParticipantSelector`](../../../src/components/features/comms/ParticipantSelector/ParticipantSelector.tsx) HTML→DS | UI | ✏️ | R-13 | B-019-T16 | `[TODO]` |
| 18 | [`UserSelectorList`](../../../src/components/features/comms/UserSelectorList/UserSelectorList.tsx) HTML→DS | UI | ✏️ | R-13 | B-019-T17 | `[TODO]` |
| 19 | [`messages/new/page.tsx`](../../../src/app/dashboard/comms/messages/new/page.tsx) дедупликация | UI | 🔧 | R-16 | B-019-T18 | `[TODO]` |

---

## 3. 🗺️ Карта «файл/компонент → конкретные замены»

### 3.1 Блок 0: Подготовка — Расширение `<Input>` для `as="textarea"`

| # | Файл/Компонент | Задача | Замена | Детали |
|---|---|---|---|---|
| 1 | [`src/components/ui/Input/Input.tsx`](../../../src/components/ui/Input/Input.tsx) | B-019-T0 | 🔧 `InputProps` + условный рендер | См. раздел 4 |

---

### 3.2 Блок 1: R-23 — Замена кастомных ошибок на `<ErrorMessage>`

| # | Файл/Компонент | Задача | Было | Стало |
|---|---|---|---|---|
| 2 | [`ConversationList.tsx`](../../../src/components/features/comms/ConversationList/ConversationList.tsx) | B-019-T1 | `<div role="alert" ...>{error + button "Повторить"}</div>` | `<ErrorMessage message={error} />` + `<Button variant="ghost" size="sm">Повторить</Button>` |
| 3 | [`EditChatForm.tsx`](../../../src/components/features/comms/EditChatForm/EditChatForm.tsx) | B-019-T2 | `{error && <div role="alert" className="...">{error}</div>}` | `<ErrorMessage message={error} />` |
| 4 | [`chats/new/page.tsx`](../../../src/app/dashboard/comms/chats/new/page.tsx) | B-019-T3 | `{error && <div role="alert" className="...">{error}</div>}` | `<ErrorMessage message={error} />` |
| 5 | [`chats/[chatId]/edit/page.tsx`](../../../src/app/dashboard/comms/chats/[chatId]/edit/page.tsx) | B-019-T4 | `<div role="alert" className="...">{loadError}</div>` | `<ErrorMessage message={loadError} />` |
| 6 | [`ConversationDetailPage.tsx`](../../../src/components/features/comms/ConversationDetailPage/ConversationDetailPage.tsx) | B-019-T5 | `<div className="... bg-[var(--theme-danger)]/10 ...">{error + button}</div>` | `<ErrorMessage message={error?.message ?? ''} />` + `<Button variant="ghost" size="sm">Повторить</Button>` |
| 7 | [`UserSelectorList.tsx`](../../../src/components/features/comms/UserSelectorList/UserSelectorList.tsx) | B-019-T6 | Кастомный блок ошибки | `<ErrorMessage message={error} />` |
| 8 | [`ParticipantSelector.tsx`](../../../src/components/features/comms/ParticipantSelector/ParticipantSelector.tsx) | B-019-T7 | Кастомный блок ошибки | `<ErrorMessage message={error} />` |

---

### 3.3 Блок 2: R-22 — Замена `ConversationEmptyState` на `<EmptyState>`

| # | Файл/Компонент | Задача | Замена |
|---|---|---|---|
| 9 | [`ConversationEmptyState.tsx`](../../../src/components/features/comms/ConversationEmptyState/ConversationEmptyState.tsx) | B-019-T8 | Кастомный JSX → `<EmptyState title="Нет личных диалогов" description="Начните новый диалог" />` + `<Button variant="primary">Написать сообщение</Button>` |

**Целевая структура:**

```tsx
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export function ConversationEmptyState(): React.JSX.Element {
  const router = useRouter();
  return (
    <div>
      <EmptyState
        title="Нет личных диалогов"
        description="Начните новый диалог"
      />
      <div className="mt-4 flex justify-center">
        <Button
          variant="primary"
          onClick={() => router.push('/dashboard/comms/messages/new')}
        >
          Написать сообщение
        </Button>
      </div>
    </div>
  );
}
```

---

### 3.4 Блок 3: R-13 — Замена сырых HTML-элементов на DS-компоненты

#### 3.4.1 Кнопки (`<button>` → `<Button>`)

| # | Файл | Задача | Строка | Было | Стало |
|---|---|---|---|---|---|
| 10 | [`chats/page.tsx`](../../../src/app/dashboard/comms/chats/page.tsx) | B-019-T9 | ~74–93 | `<button ... className="... bg-[var(--theme-accent)] ...">Создать чат</button>` | `<Button variant="primary" onClick={...}>Создать чат</Button>` |
| 11a | [`chats/new/page.tsx`](../../../src/app/dashboard/comms/chats/new/page.tsx) | B-019-T10 | ~157–175 | `<button ...>Назад</button>` | `<Button variant="ghost">Назад</Button>` |
| 11b | [`chats/new/page.tsx`](../../../src/app/dashboard/comms/chats/new/page.tsx) | B-019-T10 | ~252–258 | `<button ...>Отмена</button>` | `<Button variant="secondary">Отмена</Button>` |
| 11c | [`chats/new/page.tsx`](../../../src/app/dashboard/comms/chats/new/page.tsx) | B-019-T10 | ~260–292 | `<button ...>Создать чат</button>` | `<Button variant="primary" isLoading={isCreating}>Создать чат</Button>` |
| 12 | [`chats/[chatId]/edit/page.tsx`](../../../src/app/dashboard/comms/chats/[chatId]/edit/page.tsx) | B-019-T11 | ~166–184 | `<button ...>Назад</button>` | `<Button variant="ghost">Назад</Button>` |
| 13a | [`EditChatForm.tsx`](../../../src/components/features/comms/EditChatForm/EditChatForm.tsx) | B-019-T12 | ~181–188 | `<button ...>Отмена</button>` | `<Button variant="secondary">Отмена</Button>` |
| 13b | [`EditChatForm.tsx`](../../../src/components/features/comms/EditChatForm/EditChatForm.tsx) | B-019-T12 | ~189–210 | `<button ...>Сохранить</button>` | `<Button variant="primary" isLoading={isSaving}>Сохранить</Button>` |
| 14a | [`ConversationList.tsx`](../../../src/components/features/comms/ConversationList/ConversationList.tsx) | B-019-T13 | ~125–144 | `<button ... className="... bg-indigo-600 ...">Новый диалог</button>` | `<Button variant="primary" size="sm">Новый диалог</Button>` |
| 15b | [`MessageItem.tsx`](../../../src/components/features/comms/MessageItem/MessageItem.tsx) | B-019-T14 | ~157–165 | `<button ...>Удалить</button>` | `<Button variant="ghost" size="sm">Удалить</Button>` |
| 16 | [`MessageInput.tsx`](../../../src/components/features/comms/MessageInput/MessageInput.tsx) | B-019-T15 | ~110–120 | `<button ...>` | `<Button variant="primary" size="md" isLoading={isLoading}>` |
| 17a | [`ParticipantSelector.tsx`](../../../src/components/features/comms/ParticipantSelector/ParticipantSelector.tsx) | B-019-T16 | ~292–295 | `<button ...>` (удалить тег) | `<Button variant="ghost" size="sm">` |
| 18 | [`UserSelectorList.tsx`](../../../src/components/features/comms/UserSelectorList/UserSelectorList.tsx) | B-019-T17 | ~... | `<button ...>` (кнопки действий) | `<Button>` с соответствующим `variant` |

#### 3.4.2 Поля ввода (`<input>` → `<Input>`)

| # | Файл | Задача | Строка | Было | Стало |
|---|---|---|---|---|---|
| 11d | [`chats/new/page.tsx`](../../../src/app/dashboard/comms/chats/new/page.tsx) | B-019-T10 | ~202–212 | `<input ... />` | `<Input ... />` |
| 13c | [`EditChatForm.tsx`](../../../src/components/features/comms/EditChatForm/EditChatForm.tsx) | B-019-T12 | ~139–150 | `<input ... />` | `<Input label="Название чата" ... />` |
| 14b | [`ConversationList.tsx`](../../../src/components/features/comms/ConversationList/ConversationList.tsx) | B-019-T13 | ~146–153 | `<input ... />` | `<Input placeholder="..." />` |
| 17b | [`ParticipantSelector.tsx`](../../../src/components/features/comms/ParticipantSelector/ParticipantSelector.tsx) | B-019-T16 | ~271 | `<input ... />` | `<Input placeholder="..." />` |
| 18b | [`UserSelectorList.tsx`](../../../src/components/features/comms/UserSelectorList/UserSelectorList.tsx) | B-019-T17 | ~156 | `<input ... />` | `<Input ... />` |

#### 3.4.3 Textarea (`<textarea>` → `<Input as="textarea">`)

| # | Файл | Задача | Строка | Было | Стало |
|---|---|---|---|---|---|
| 11e | [`chats/new/page.tsx`](../../../src/app/dashboard/comms/chats/new/page.tsx) | B-019-T10 | ~226–235 | `<textarea ... />` | `<Input as="textarea" ... />` |
| 13d | [`EditChatForm.tsx`](../../../src/components/features/comms/EditChatForm/EditChatForm.tsx) | B-019-T12 | ~164–176 | `<textarea ... />` | `<Input as="textarea" label="Описание" ... />` |
| 16 | [`MessageInput.tsx`](../../../src/components/features/comms/MessageInput/MessageInput.tsx) | B-019-T15 | ~90–110 | `<textarea ... />` | `<Input as="textarea" ... />` (или `<textarea>` с обоснованием) |

#### 3.4.4 Badge (`<span>` → `<Badge>`)

| # | Файл | Задача | Строка | Было | Стало |
|---|---|---|---|---|---|
| 15a | [`MessageItem.tsx`](../../../src/components/features/comms/MessageItem/MessageItem.tsx) | B-019-T14 | ~155 | `<span ...>` (статус/бейдж) | `<Badge variant="danger">` |

---

### 3.5 Блок 4: R-16 — Удаление дублирования `UserSelectorList`

| # | Файл/Компонент | Задача | Замена |
|---|---|---|---|
| 19 | [`messages/new/page.tsx`](../../../src/app/dashboard/comms/messages/new/page.tsx) | B-019-T18 | Удалить инлайн-компонент (~строки 256–518). Импортировать `UserSelectorList` из `@/components/features/comms/UserSelectorList` |
| — | [`UserSelectorList.tsx`](../../../src/components/features/comms/UserSelectorList/UserSelectorList.tsx) | B-019-T18 | Расширить API: добавить опциональные пропсы `existingConversations?`, `conversationsLoaded?`, изменить `onSelectUser` → `(userId: string, conversationId?: string) => void` |

---

## 4. 📐 Спецификация изменения `components/ui/Input` (`as="textarea"`)

### 4.1 Цель

Поддержать замену `<textarea>` на `<Input as="textarea">` (задачи T10, T12, T15) единым подходом.

### 4.2 Текущее состояние

[`src/components/ui/Input/Input.tsx`](../../../src/components/ui/Input/Input.tsx):
- Рендерит только `<input>`
- `InputProps extends InputHTMLAttributes<HTMLInputElement>`
- `forwardRef<HTMLInputElement, InputProps>`

### 4.3 Новый API (backward compatible)

```tsx
type InputBaseProps = {
  as?: "textarea";
  label?: string;
  error?: string;
  autoResize?: boolean; // по требованию MessageInput (опционально)
};

export type InputProps =
  | (InputBaseProps & InputHTMLAttributes<HTMLInputElement> & { as?: undefined })
  | (InputBaseProps & TextareaHTMLAttributes<HTMLTextAreaElement> & { as: "textarea" });
```

- **`as?: "textarea"`** — рендер `<textarea>`
- **`as` не задан / `undefined`** — рендер `<input>` (backward compatibility)
- **`forwardRef` тип:** `forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>`

### 4.4 Условный рендер

```tsx
const Component = props.as === "textarea" ? "textarea" : "input";
// ...
<Component ref={ref} {...filteredProps} />
```

> **Важно:** `label`, `error`, `autoResize` НЕ передаются в DOM — должны быть исключены из `props` перед spread.

### 4.5 Атрибуты textarea

- Наследует `TextareaHTMLAttributes<HTMLTextAreaElement>` (поддержка `rows`, `cols`, `wrap`)
- `rows` — HTML-атрибут, передаётся через `{...props}`

### 4.6 Backward compatibility

| Сценарий | Результат |
|----------|-----------|
| `<Input label="..." />` | `<input>` (без изменений) |
| `<Input as="textarea" rows={3} />` | `<textarea rows="3">` |
| `ref` для `<Input>` | `HTMLInputElement` |
| `ref` для `<Input as="textarea">` | `HTMLTextAreaElement` |

### 4.7 Использование в MessageInput (auto-resize)

- Auto-resize функциональность сохраняется (ограничение — см. раздел 5.3)
- Реализация: перенести логику на `ref` + `onInput`
- При невозможности чистой реализации — оставить `<textarea>` с комментарием-обоснованием (риск R3)

---

## 5. 🚧 Ограничения

### 5.1 Не менять бизнес-логику

- API-запросы, обработка ответов, `useEffect`/`useState`, обработчики событий (`onClick`/`onChange`), типизация доменных сущностей **не изменяются**
- Меняется только presentation-слой (JSX + стили) и, где это необходимо, API пропсов DS-расширений

### 5.2 Не менять состояние/эффекты

- Состояния и эффекты в COMMS-компонентах сохраняются как есть (план §«Что НЕ меняется»)

### 5.3 Auto-resize textarea в MessageInput

- Функциональность auto-resize **обязана сохраниться**
- Реализация: перенести логику на `ref` поднятого `<Input as="textarea">` + `onInput`
- При невозможности чистой реализации — оставить `<textarea>` в [`MessageInput.tsx`](../../../src/components/features/comms/MessageInput/MessageInput.tsx) с комментарием-обоснованием (риск R3). Это **единственное санкционированное отступление**

### 5.4 De-дупликация inline UserSelectorList (R-16)

- Удалить инлайн-реализацию из [`messages/new/page.tsx`](../../../src/app/dashboard/comms/messages/new/page.tsx) (~строки 256–518)
- Использовать [`UserSelectorList.tsx`](../../../src/components/features/comms/UserSelectorList/UserSelectorList.tsx) как единственный источник
- Расширить API `UserSelectorList` опциональными пропсами (`existingConversations`, `conversationsLoaded`) с **backward compatibility**
- Не менять UX-поведение: при наличии `existingConversations` показывать две кнопки («Открыть диалог» / «Написать»), иначе — одну
- Кнопки внутри `UserSelectorList` использовать `<Button>` DS

### 5.5 Кнопка «Повторить» и «Назад»

- Кнопки «Повторить» (retry): `<Button variant="ghost" size="sm">`
- Кнопки «Назад»: `<Button variant="ghost">` (без изменения навигации)

### 5.6 Запрет хардкода

- Цвета/размеры только через токены `color.*` / `space-*` / `text-*` / `radius-*`
- Никаких `bg-indigo-600`, `text-indigo-600`, `focus:ring-indigo-500`, `bg-red-50`
- Не добавлять новые локации иконок без необходимости

---

## 6. ✅ Критерии приёмки для code-агентов

### 6.1 Ручные критерии

| # | Критерий | Как проверить | Задачи |
|---|----------|---------------|--------|
| AC-1 | Все `<button>` в COMMS заменены на `<Button>` | Поиск `<button` в `src/app/dashboard/comms/*` и `src/components/features/comms/*` | T9–T17, T18 |
| AC-2 | Все `<input type="text">` заменены на `<Input>` | Поиск `<input` в тех же директориях | T10, T12, T13, T15–T17 |
| AC-3 | Все `<textarea>` заменены на `<Input as="textarea">` (или обоснованно оставлены) | Поиск `<textarea` в тех же директориях | T10, T12, T15 |
| AC-4 | Все кастомные `div[role="alert"]` заменены на `<ErrorMessage>` | Поиск `role="alert"` в тех же директориях | T1–T7 |
| AC-5 | `<span>` как статусные бейджи заменены на `<Badge>` | Поиск статусных `<span>` (минимум MessageItem.tsx:155) | T14 |
| AC-6 | `ConversationEmptyState` использует `<EmptyState>` DS | Визуальный просмотр компонента | T8 |
| AC-7 | В `messages/new/page.tsx` нет инлайн-компонента `UserSelectorList` | Проверить `grep "function UserSelectorList"` в файле | T18 |
| AC-8 | Приложение отображается в 3 темах без артефактов | Визуальная проверка | Все |

### 6.2 Автоматические критерии

| # | Команда | Ожидаемый результат |
|---|---------|-------------------|
| A-1 | `npx tsc --noEmit` | 0 ошибок |
| A-2 | `npm run lint` | 0 ошибок |
| A-3 | `npm run test` | Все существующие тесты зелёные |

### 6.3 Проверка покрытия AC

| R-ID | AC | Покрыт в строке | Статус |
|------|----|----------------|--------|
| R-13 | AC-1, AC-2, AC-3, AC-5 | #1, #10–#18 | ✅ |
| R-16 | AC-7 | #19 | ✅ |
| R-22 | AC-6 | #9 | ✅ |
| R-23 | AC-4 | #2–#8 | ✅ |
| — | AC-8 | Все | ✅ |

---

## 7. 📋 Справочник замен (Lookup Table)

### 7.1 R-13: HTML-элементы → DS-компоненты

| Сырой элемент | DS-компонент | API | Примечание |
|---------------|-------------|-----|------------|
| `<button>` (primary) | `<Button variant="primary">` | `variant`, `size`, `isLoading`, `disabled` | Основной стиль |
| `<button>` (secondary) | `<Button variant="secondary">` | то же | Вторичный стиль |
| `<button>` (danger) | `<Button variant="danger">` | то же | Опасные действия |
| `<button>` (ghost) | `<Button variant="ghost">` | то же | Без фона |
| `<input type="text">` | `<Input>` | `label`, `error`, `...inputProps` | Без label — без wrapping `<label>` |
| `<textarea>` | `<Input as="textarea">` | то же | Проверить поддержку textarea в Input |
| `<span>` (status badge) | `<Badge variant="...">` | `variant`, `children` | Для статусов |

### 7.2 R-23: Кастомные ошибки → `<ErrorMessage>`

| Было | Стало |
|------|-------|
| `{error && <div role="alert" className="...">{error}</div>}` | `<ErrorMessage message={error} />` |
| `{error && <div role="alert" className="...">...</div>}` | `<ErrorMessage message={error} />` |

### 7.3 R-22: `ConversationEmptyState` → `<EmptyState>`

| Было | Стало |
|------|-------|
| Кастомный JSX с иконкой, заголовком, текстом, кнопкой | `<EmptyState>` + `<Button>` для CTA |

---

## 8. 🔗 Связанные артефакты

| Артефакт | Путь |
|----------|------|
| План реализации | [`docs/plans/B-019-ds-components-migration-plan.md`](../../plans/B-019-ds-components-migration-plan.md) |
| Дизайн-справка | [`docs/specs/comms/B-019-ui-design.md`](./B-019-ui-design.md) |
| Ревью | [`docs/design/comms-ui-review.md`](../../design/comms-ui-review.md) |
| DS-компоненты | [`src/components/ui/`](../../../src/components/ui/) |
| Правила | [`docs/rules/component-spec-rules.md`](../../rules/component-spec-rules.md) |
| UI-правила | [`docs/rules/ui-design-rules.md`](../../rules/ui-design-rules.md) |
