# B-019 UI Design справка: Переход COMMS на DS-компоненты (R-13, R-16, R-22, R-23)

> **Задача:** B-019 — COMMS UI: Переход на компоненты дизайн-системы
> **Тип:** UI-ремедиация (замена сырых HTML-элементов на DS-компоненты)
> **Тип документа:** Дизайн-справка / Design guidelines (слой дизайна, без реализации)
> **Версия:** v1.0
> **Дата:** 2026-08-06
> **Статус:** `[ACTIVE]`
> **Автор:** UI Designer (режим `ui-designer`)

---

## 1. Назначение документа

Этот документ — **источник требований для UI-слоя** задачи B-019. Он описывает, **какие DS-компоненты** и **в каком виде** должны заменить сырые HTML-элементы в COMMS-файлах согласно ревью-замечаниям R-13, R-16, R-22, R-23.

Назначение:
1. Дать однозначное руководство «какой компонент куда применять».
2. Специфицировать расширение `<Input as="textarea">` (новый API + backward compatibility).
3. Зафиксировать семантику состояний loading/error/empty с выбором DS-компонента, иконки и варианта.
4. Зафиксировать ограничения (не менять логику, auto-resize, дедупликация inline UserSelectorList).
5. Дать визуальный check-list для проверки в 3 темах (Light/Dark/Green).

> **Входные артефакты:**
> - [`docs/plans/B-019-ds-components-migration-plan.md`](../../plans/B-019-ds-components-migration-plan.md) (v1.1)
> - [`docs/design/comms-ui-review.md`](../../design/comms-ui-review.md) (R-13, R-16, R-22, R-23)
> - [`docs/design/components/`](../../design/components/) (Button, Input, Badge, EmptyState, ErrorMessage)
> - [`docs/design/tokens/`](../../design/tokens/) (colors, typography, spacing, radius)
> - [`docs/design/patterns/`](../../design/patterns/) (list-page, form-page, detail-page)

---

## 2. Руководство по применению DS-компонентов (R-13, R-22, R-23)

### 2.1 Таблица замен HTML → DS-компонент

| Было (сырой HTML) | Стало (DS-компонент) | R-ID |
|-------------------|----------------------|:----:|
| `<button>` (основное действие) | `<Button variant="primary">` | R-13 |
| `<button>` (вторичное действие) | `<Button variant="secondary">` | R-13 |
| `<button>` (назад/отмена/ghost) | `<Button variant="ghost">` | R-13 |
| `<button>` (удаление, опасное) | `<Button variant="danger">` | R-13 |
| `<input type="text">` | `<Input>` | R-13 |
| `<textarea>` | `<Input as="textarea">` | R-13 |
| `<span>` как статусный бейдж | `<Badge variant="...">` | R-13 |
| `<div role="alert">` | `<ErrorMessage message={...} />` | R-23 |
| кастомный `ConversationEmptyState` | `<EmptyState>` + `<Button>` | R-22 |

> **Правило:** все кнопки, поля ввода, бейджи и сообщения об ошибках должны использовать DS-компоненты из [`docs/design/components/`](../../design/components/). Запрещён хардкод стилей (`bg-indigo-600`, `text-indigo-600`, `focus:ring-indigo-500`, `bg-red-50`).

---

### 2.2 Button: выбор варианта

| Контекст | Variant | Size | Комментарий |
|----------|---------|------|-------------|
| «Создать чат» (chats/page) | `primary` | `md` | Основное CTA |
| «Новый диалог» (ConversationList) | `primary` | `sm` | Компактное CTA в сайдбаре |
| «Написать сообщение» (EmptyState CTA) | `primary` | `md` | CTA пустого состояния |
| «Отмена» (формы) | `secondary` | `md` | |
| «Назад» (страницы) | `ghost` | `md` | Навигация |
| «Повторить» (retry в error) | `ghost` | `sm` | CTA при ошибке |
| «Удалить» (сообщение / тег) | `ghost` | `sm` | Опасное, но низкоприоритетное |
| Submit с загрузкой (создать/сохранить/отправить) | `primary` | `md` | `isLoading` вместо ручного спиннера |

**Специфика:**
- Все submit-кнопки с загрузкой используют `isLoading` prop DS-компонента, **не** рендерят SVG `<spinner>` вручную (план T10, T12, T15).
- Иконки (SVG в `children`) поддерживаются внутри `<Button>` — допустимо.
- `aria-label` сохраняется через проп, если `children` — только иконка.

---

### 2.3 Input: выбор поля

| Контекст | Компонент | Параметры |
|----------|-----------|-----------|
| Поиск диалогов (ConversationList) | `<Input>` | `placeholder`, `aria-label` |
| Поиск участников (ParticipantSelector) | `<Input>` | `placeholder` |
| Поиск пользователей (UserSelectorList) | `<Input>` | `placeholder` |
| Название чата (edit/new) | `<Input>` | `label="Название чата"`, `value`, `onChange` |
| Описание чата (edit/new) | `<Input as="textarea">` | `label="Описание"`, `value`, `onChange` |
| Сообщение (MessageInput) | `<Input as="textarea">` | `placeholder`, `onKeyDown`, `autoResize` |

**Специфика:**
- Поля без label — без обёртки `<label>`, только `<Input placeholder ... />`.
- Поля с ошибкой — `error` prop `<Input error="...">`, а не отдельный `<ErrorMessage>` (на уровне поля).
- `aria-required`, `disabled`, `maxLength` передаются как `...inputProps`.
- `focus:ring-indigo-500` НЕ добавлять — DS-компонент уже содержит корректный focus ring на токене.

---

### 2.4 Badge: выбор варианта (R-13 дополнение, M2)

Используется для статусных бейджей вместо `<span>` (минимум `MessageItem.tsx:155`):

| Семантика статуса | Variant Badge |
|-------------------|---------------|
| Deleting / danger-состояние сообщения | `danger` |
| (появление новых вариантов — по AC/US, по умолчанию `default`) | `default` |

> Иконка и текст — через `children`. Бейдж неинтерактивен.

---

### 2.5 ErrorMessage: применение (R-23)

| Ситуация | Компонент | Примечание |
|----------|-----------|------------|
| Ошибка без retry | `<ErrorMessage message={error} />` | План: T2, T3, T4, T6, T7 |
| Ошибка с retry («Повторить») | `<ErrorMessage message={error} />` + `<Button variant="ghost" size="sm">Повторить</Button>` | План T1, T5 |

**Специфика:**
- Сплошная обёртка `div[role="alert"]` с ручным `bg-red-*` заменяется на `<ErrorMessage>`.
- Если рядом нужна кнопка «Повторить» — `<ErrorMessage>` и `<Button>` внутри одного блока, без ручной стилизации блока (отступы — токены `space-*`).

---

### 2.6 EmptyState: применение (R-22)

| Компонент | Что рендерит |
|-----------|--------------|
| `ConversationEmptyState` | `<EmptyState title="Нет личных диалогов" description="Начните новый диалог" />` + `<Button variant="primary">Написать сообщение</Button>` |

**Специфика:**
- Иконка `<EmptyState>` по умолчанию — проверить, подходит ли для «диалогов/сообщений»; при необходимости передать кастомный `icon` (риск R5 плана).
- CTA-кнопка размещается под `<EmptyState>` через токен `space-4` (`mt-4`), центрируется через flex.

---

## 3. Спецификация расширения `<Input as="textarea">`

### 3.1 Цель

Поддержать замену `<textarea>` на `<Input as="textarea">` (план T10, T12, T15) единым подходом (решение M1).

### 3.2 Новый API (backward compatible)

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

- `as?: "textarea"` — рендер `<textarea>`.
- `as` не задан / `undefined` — рендер `<input>` (backward compatibility).
- `forwardRef` тип: `forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>`.

### 3.3 Условный рендер

```tsx
const Component = props.as === "textarea" ? "textarea" : "input";
// ...
<Component ref={ref} {...props} />
```

### 3.4 Атрибуты textarea

- Наследует `TextareaHTMLAttributes<HTMLTextAreaElement>` (поддержка `rows`, `cols`, `wrap` — не CSS, а HTML-атрибуты).
- `rows` — HTML-атрибут, передаётся как `{...props}`.
- `label`, `error`, `autoResize` НЕ передаются в DOM (должны быть исключены из `props` перед `{...props}`).

### 3.5 Backward compatibility

По умолчанию компонент рендерит `<input>` и типизируется как раньше — все существующие вызовы `<Input label error ... />` продолжают работать без изменений.

### 3.6 Использование в MessageInput (auto-resize)

Auto-resize функциональность сохраняется (ограничение — см. §5.3). Логика переносится через `ref` + `onInput`. Если `autoResize` не удаётся реализовать чисто — допускается оставить `<textarea>` для этого файла с обязательным комментарием-обоснованием (риск R3 плана).

---

## 4. Семантика состояний: loading / error / empty

### 4.1 Loading

| Компонент | DS-компонент | Поведение |
|-----------|--------------|-----------|
| Submit-кнопки (создать/сохранить/отправить) | `<Button isLoading>` | Спиннер внутри кнопки, `disabled` |
| Поиск (сетевой) в формах | `<Input disabled>` | Опционально |

> **В рамках B-019** loading для списков (скелетоны R-14) НЕ входит — это задача вне скоупа (R-14 отдельная). Здесь фиксируется только использование `isLoading` для кнопок. Индикаторы загрузки, оставшиеся вне B-019, должны иметь `role="status"`/`aria-live="polite"` (R-17/R-26) там, где затрагиваются файлы.

### 4.2 Error

| Тип | DS-компонент | Вариант | Иконка |
|-----|--------------|---------|--------|
| Сетевые ошибки списков/форм (с retry) | `<ErrorMessage>` + `<Button variant="ghost" size="sm">` | danger (по умолчанию шаблона) | danger-иконка предупреждения (встроена в ErrorMessage) |
| Ошибки полей (валидация) | `<Input error="...">` | danger | danger-иконка поля |

### 4.3 Empty

| Ситуация | DS-компонент | Вариант | Иконка |
|----------|--------------|---------|--------|
| Пустой список диалогов | `<EmptyState>` | default | по умолчанию / кастомная messages-иконка |
| Пустой результат поиска участников | `<EmptyState>` (второй уровень описания) | default | по умолчанию |
| Пустое поле чата / нет сообщений — не EmptyState-кейс B-019 | — | — | (вне скоупа, если не; см. макет) |

> **Иконка EmptyState:** проверить соответствие контексту «личные диалоги». Если дефолтная иконка документа не отражает мессенджер — передать кастомную (переопределение `icon`). План, риск R5.

---

## 5. Ограничения

### 5.1 Не менять бизнес-логику

- API-запросы, обработка ответов, `useEffect`/`useState`, обработчики событий (`onClick`/`onChange`), типизация доменных сущностей не изменяются.
- Меняется только presentation-слой (JSX + стили) и, где это необходимо, API пропсов DS-расширений.

### 5.2 Не менять состояние/эффекты

- Состояния и эффекты в COMMS-компонентах сохраняются как есть (план §«Что НЕ меняется»).

### 5.3 Auto-resize textarea в MessageInput

- Функциональность auto-resize обязана сохраниться.
- Реализация: перенести логику на `ref` поднятого `<Input as="textarea">` + `onInput`.
- При невозможности чистой реализации — оставить `<textarea>` в [`MessageInput.tsx`](../../../src/components/features/comms/MessageInput/MessageInput.tsx) с комментарием-обоснованием (риск R3). Это единственное санкционированное отступление.

### 5.4 De-дупликация inline UserSelectorList (R-16)

- Удалить инлайн-реализацию из [`messages/new/page.tsx`](../../../src/app/dashboard/comms/messages/new/page.tsx) (~строки 256–518).
- Использовать [`UserSelectorList.tsx`](../../../src/components/features/comms/UserSelectorList/UserSelectorList.tsx) как единственный источник.
- Расширить API `UserSelectorList` опциональными пропсами (`existingConversations`, `conversationsLoaded`) с **backward compatibility** (все новые пропсы опциональны).
- Не менять UX-поведение существующих диалогов: при наличии `existingConversations` показывать две кнопки («Открыть диалог» / «Написать»), иначе — одну.
- Кнопки внутри `UserSelectorList` использовать `<Button>` DS (R-13).

### 5.5 Кнопка «Повторить» и «Назад»

- Кнопки «Повторить» (retry) — `<Button variant="ghost" size="sm">`.
- Кнопки «Назад» — `<Button variant="ghost">` (без изменения навигации).

### 5.6 Запрет хардкода

- Цвета/размеры только через токены `color.*` / `space-*` / `text-*` / `radius-*`. Никаких `bg-indigo-600`, `text-emerald-600`, `bg-red-50`, `focus:ring-indigo-500`.
- De-дупликация иконок: не добавлять новые локации иконок без необходимости.

---

## 6. Визуальный check-list для 3 тем (Light / Dark / Green)

> Тема переключается через профиль (`/dashboard/settings`). Проверять каждую страницу в каждой теме.

### 6.1 Страницы

- [ ] `/comms/messages` — список диалогов, `ConversationList` инпут поиска, кнопка «Новый диалог», `<EmptyState>` при пустом списке.
- [ ] `/comms/messages/new` — `<UserSelectorList>` из features (без инлайн-версии), поля поиска, кнопки «Открыть диалог» / «Написать».
- [ ] `/comms/chats` — кнопка «Создать чат» (`<Button variant="primary">`).
- [ ] `/comms/chats/new` — `<Input>`, `<Input as="textarea">`, кнопки «Назад» (ghost), «Отмена» (secondary), «Создать чат» (primary + isLoading).
- [ ] `/comms/chats/:id/edit` — `<EditChatForm>`: Input, Input as=textarea, «Отмена» (secondary), «Сохранить» (primary + isLoading).
- [ ] `/comms/messages/:convId` — `<ErrorMessage>` при ошибке + «Повторить» `<Button ghost>`.

### 6.2 Состояния

- [ ] **Loading:** кнопки submit показывают спиннер (isLoading) и disabled.
- [ ] **Empty:** пустой список диалогов → `<EmptyState>` + CTA-`<Button primary>`.
- [ ] **Error:** сетевой сбой → `<ErrorMessage>` (danger), при наличии retry — `<Button ghost>` «Повторить».
- [ ] **Data:** нормальное отображение всех DS-компонентов.

### 6.3 Токены и артефакты

- [ ] Нет `bg-indigo-*`, `text-indigo-*`, `focus:ring-indigo-*`, `bg-emerald-*`, `text-emerald-*`.
- [ ] Нет `bg-red-50`, `text-red-*`, `border-red-*` (ошибки — только через `<ErrorMessage>` / `Input error`).
- [ ] Нет статусных `<span>` — только `<Badge>`.
- [ ] Нет `role="alert"` с ручной стилизацией (заменено на `<ErrorMessage>`).
- [ ] Input placeholders корректны во всех темах (контраст `color.input.placeholder`).

### 6.4 Доступность (затрагиваемое в B-019)

- [ ] Submit-кнопки: `aria-label` сохранён там, где дети — иконка.
- [ ] ErrorMessage несёт `role="alert"` автоматически.
- [ ] Индикаторы загрузки вне кнопок имеют `role="status"` `aria-live="polite"` (где файлы затрагиваются).

---

## 7. Трассировка: элемент → R-ID → задача плана → DS-компонент

| Элемент (UI) | R-ID | Задачи плана | DS-компонент |
|--------------|:----:|:-------------:|--------------|
| Кнопки страниц/форм | R-13 | T9–T17 | `<Button>` |
| Поля ввода текста | R-13 | T10, T12, T13, T15–T17 | `<Input>` |
| Textarea → textarea-поля | R-13 | T10, T12, T15 (T0) | `<Input as="textarea">` |
| Статусные бейджи `<span>` | R-13 | T14 (M2) | `<Badge>` |
| Ошибки `<div role="alert">` → ErrorMessage | R-23 | T1–T7 | `<ErrorMessage>` |
| `ConversationEmptyState` → EmptyState | R-22 | T8 | `<EmptyState>` + `<Button>` |
| De-дупликация `UserSelectorList` | R-16 | T18 | `<UserSelectorList>` + `<Button>` |

---

## 8. Связанные артефакты

- 📋 **План:** [`docs/plans/B-019-ds-components-migration-plan.md`](../../plans/B-019-ds-components-migration-plan.md)
- 📋 **Аудит:** [`docs/design/comms-ui-review.md`](../../design/comms-ui-review.md)
- 📋 **DS-компоненты:** [`docs/design/components/`](../../design/components/)
- 📋 **Токены:** [`docs/design/tokens/`](../../design/tokens/)
- 📋 **Макет:** [`docs/design/layouts/comms/layout.md`](../../design/layouts/comms/layout.md)
- 📋 **Паттерны:** [`docs/design/patterns/`](../../design/patterns/)
