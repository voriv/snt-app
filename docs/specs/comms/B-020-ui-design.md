# B-020 UI Design справка: Скелетоны, breadcrumbs и кнопка удаления сообщения (R-14, R-15, R-19, R-20)

> **Задача:** B-020 — COMMS UI: Скелетоны, breadcrumbs и кнопка удаления сообщения
> **Тип:** UI-ремедиация (улучшение UX: состояния загрузки, навигация, действия)
> **Тип документа:** Дизайн-справка / Design guidelines (слой дизайна, без реализации)
> **Версия:** v1.0
> **Дата:** 2026-08-07
> **Статус:** `[ACTIVE]`
> **Автор:** UI Designer (режим `ui-designer`)

---

## 1. Назначение документа

Этот документ — **источник требований для UI-слоя** задачи B-020. Он описывает, **как должны выглядеть** скелетоны (загрузка), breadcrumbs (навигация) и кнопка удаления сообщения с ConfirmDialog согласно ревью-замечаниям R-14, R-15, R-19, R-20.

Назначение:
1. Дать единое руководство по визуальному виду скелетонов (pulsing блоки) вместо спиннеров.
2. Зафиксировать структуру breadcrumbs на подстраницах COMMS и их токены.
3. Задать дизайн кнопки удаления сообщения и поведение ConfirmDialog (danger), включая миграцию ConfirmDialog на токены.
4. Проверить кнопку отправки (R-20) — уже `variant="primary"`.
5. Зафиксировать ограничения (не менять логику отправки/удаления).
6. Дать визуальный check-list для проверки в 3 темах (Light/Dark/Green).

> **Входные артефакты:**
> - [`docs/plans/B-020-skeletons-breadcrumbs-plan.md`](../../plans/B-020-skeletons-breadcrumbs-plan.md) (v1.1)
> - [`docs/design/comms-ui-review.md`](../../design/comms-ui-review.md) (R-14, R-15, R-19, R-20)
> - [`docs/design/components/`](../../design/components/) (Button, ConfirmDialog)
> - [`docs/design/tokens/`](../../design/tokens/) (colors, typography, spacing, radius, shadows)
> - [`docs/design/patterns/`](../../design/patterns/) (list-page, detail-page)

---

## 2. Скелетоны для Loading (R-14)

### 2.1 Что это

Скелетон (skeleton) — статичный каркас макета с пульсирующей прозрачностью поверхности, имитирующий структуру контента до его загрузки. Заменяет спиннер + текст, чтобы пользователь заранее понимал форму будущего контента.

### 2.2 Визуальные характеристики (единый стандарт)

| Характеристика | Значение | Токен / класс |
|----------------|----------|---------------|
| Цвет поверхности блока | Фон вторичный, нейтральный | `color.bg.secondary` → `var(--theme-bg-secondary)` |
| Анимация пульсации | Плавное мигание прозрачности | `animate-pulse` (Tailwind) |
| Скругление блоков | `radius-sm` (кнопки/строки), `radius-md` (карточки/пузырьки), `radius-full` (аватары) | `rounded` / `rounded-lg` / `rounded-full` |
| Контраст | Светлее основного контента, заметно, но не вызывает считывания текста | `color.bg.secondary` |
| Количество блоков | Имитирует реальное количество элементов списка (3–4) | — |

### 2.3 Структура скелетона (общие принципы)

- **Состав** повторяет реальный макет данных (аватар + имя + превью, пузырёк сообщения, заголовок + карточки).
- **Контейнер** несёт `role="status"` и `aria-live="polite"` (R-17/R-26 — доступность).
- **Блоки** прямоугольные/круглые, заполнены `color.bg.secondary`, все с `animate-pulse`.
- **Не** использовать спиннеры (`animate-spin`), не показывать текст «Загрузка…».

> **Примечание:** Спиннер внутри `<Button isLoading>` (состояние «отправка/сохранение») НЕ относится к скелетонам страниц и в B-020 остаётся нетронутым (ограничение P-04 плана). Скелетоны применяются только к загрузке списков/страниц.

### 2.4 Применение по сущностям

| Компонент / Страница | Тип скелетона | Кол-во блоков | Структура блоков |
|----------------------|---------------|:----:|------------------|
| `ConversationList` (T1) | Скелетон-карточки диалога | 4 | Аватар (radius-full, space-10×space-10) + две строки текста + время |
| `ConversationMessagesList` (T2) | Скелетон-сообщения | 3 | Аватар (radius-full) + пузырёк (radius-md) |
| `messages/page.tsx` (T3) | Скелетон страницы | — | Заголовок (h-8, w-48) + карточка со списком (4 блока) |
| `chats/page.tsx` (T4) | Скелетон страницы | — | Заголовок (h-8, w-48) + кнопка («Создать чат») + карточки (4 блока) |

### 2.5 ASCII-эскиз скелетона списка диалогов (ConversationList)

```ascii
┌────────────────────────────────────────────┐
│ [ Скелетон  ]  role="status" aria-live="polite"
├────────────────────────────────────────────┤
│ (◯)  ▬▬▬▬▬▬▬▬▬▬        ▬▬▬▬      │  ← animate-pulse
│      ▬▬▬▬▬▬▬▬▬▬▬▬▬▬                │
├────────────────────────────────────────────┤
│ (◯)  ▬▬▬▬▬▬▬▬▬▬        ▬▬▬▬      │
│      ▬▬▬▬▬▬▬▬▬▬▬▬▬▬                │
├────────────────────────────────────────────┤
│ (◯)  ▬▬▬▬▬▬▬▬▬▬        ▬▬▬▬      │
│      ▬▬▬▬▬▬▬▬▬▬▬▬▬▬                │
├────────────────────────────────────────────┤
│ (◯)  ▬▬▬▬▬▬▬▬▬▬        ▬▬▬▬      │
│      ▬▬▬▬▬▬▬▬▬▬▬▬▬▬                │
└────────────────────────────────────────────┘
```

- `(◯)` — круглый аватар `bg-[var(--theme-bg-secondary)] rounded-full animate-pulse` (`radius-full`)
- `▬▬▬` — строки `bg-[var(--theme-bg-secondary)] rounded animate-pulse`
- Разделители между карточками — `divide-[var(--theme-border-color)]`
- Все блоки пульсируют синхронно (один `animate-pulse` на карточку).

### 2.6 ASCII-эскиз скелетона сообщений (ConversationMessagesList)

```ascii
┌────────────────────────────────────────────┐
│ role="status" aria-live="polite"            │
│ (◯)  ▬▬▬▬▬▬                                │
│      ┌──────────────────────────────┐      │
│      │ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬      │      │  ← пузырёк radius-md
│      └──────────────────────────────┘      │
│ (◯)  ▬▬▬▬▬▬                                │
│      ┌──────────────────────────────┐      │
│      │ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬          │      │
│      └──────────────────────────────┘      │
│ (◯)  ▬▬▬▬▬▬                                │
│      ┌──────────────────────────────┐      │
│      │ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬              │      │
│      └──────────────────────────────┘      │
└────────────────────────────────────────────┘
```

### 2.7 Правила токенизации скелетона

| Элемент | Tailwind-класс | Токен |
|---------|----------------|-------|
| Блок-поверхность | `bg-[var(--theme-bg-secondary)]` | `color.bg.secondary` |
| Анимация | `animate-pulse` | — |
| Аватар | `rounded-full` | `radius-full` |
| Пузырёк/карточка | `rounded-lg` | `radius-md` |
| Строка текста | `rounded` | `radius-sm` |
| Разделители | `divide-[var(--theme-border-color)]` | `color.border.default` |

> Запрещено: `bg-gray-*`, `bg-white`, `text-indigo-*` внутри скелетонов — только через `var(--theme-*)`.

---

## 3. Breadcrumbs (R-15)

### 3.1 Формат

Компонент [`Breadcrumbs.tsx`](../../../src/components/layouts/Breadcrumbs.tsx) существует и авто-генерирует цепочку из pathname через `generateBreadcrumbs()`. На подстраницах COMMS добавляется `<Breadcrumbs />` перед заголовком страницы.

Формат — «Дашборд › Общение › Сообщения › [текущий уровень]».

### 3.2 Разделители

| Элемент | Значение | Примечание |
|---------|----------|------------|
| Разделитель | `›` | Единственный символ между уровнями |
| Размещение | между `<li>` | `aria-hidden="true"`, `select-none` |

### 3.3 Активный / неактивный пункт

| Пункт | Поведение | Токен (после миграции) |
|-------|-----------|------------------------|
| Все уровни, кроме последнего | Кликабельная ссылка (`<Link>`), hover → текстовый цвет primary, focus ring | текст `color.text.secondary`; hover/focus `color.text.primary`; ring `color.accent.default` |
| Последний уровень (текущая страница) | Не кликабелен (`<span>`), `aria-current="page"`, `font-medium` | `color.text.primary` |

### 3.4 Токены и миграция хардкод-классов (B-020-T5b)

> Текущий компонент содержит хардкод `text-gray-*` / `focus:ring-blue-500`, ломающий Dark/Green. Требуется замена (план T5b).

| Текущий класс | Токен-замена | Tailwind |
|---------------|--------------|----------|
| `text-gray-500` (nav контейнер) | `color.text.secondary` | `text-[var(--theme-text-secondary)]` |
| `text-gray-900` (последний элемент) | `color.text.primary` | `text-[var(--theme-text-primary)]` |
| `hover:text-gray-900` (ссылки) | `color.text.primary` | `hover:text-[var(--theme-text-primary)]` |
| `focus:ring-blue-500` (focus ring) | `color.accent.default` | `focus:ring-[var(--theme-accent)]` |
| `text-gray-400` (разделитель `›`) | `color.text.secondary` | `text-[var(--theme-text-secondary)]` |

**Прочее (не менять):**
- Видимость на десктопе: `hidden md:flex` (на мобильных скрыты — критерий R-15 №6 плана).
- Типографика: `text-xs` (`text.caption` / `text.body-xs`, 12px).
- Размер шрифта ссылок/текущего — `text-xs`; текущий — `font-medium`.
- Ограничение ширины ярлыка: `max-w-[30ch]` (ссылок), `max-w-[40ch]` (текущего), `truncate`, `title`.

### 3.5 Карта подстраниц (R-15 №2 плана)

| Страница | Путь | Ожидаемая цепочка |
|----------|------|-------------------|
| `messages/page.tsx` | `/comms/messages` | Дашборд › Общение › Сообщения |
| `messages/new/page.tsx` | `/comms/messages/new` | Дашборд › Общение › Сообщения › Новое сообщение |
| `messages/[conversationId]/page.tsx` | `/comms/messages/:id` | Дашборд › Общение › Сообщения › [имя диалога] |
| `chats/page.tsx` | `/comms/chats` | Дашборд › Общение › Групповые чаты |
| `chats/new/page.tsx` | `/comms/chats/new` | Дашборд › Общение › Групповые чаты › Создать чат |
| `chats/[chatId]/page.tsx` | `/comms/chats/:id` | Дашборд › Общение › Групповые чаты › [имя чата] |
| `chats/[chatId]/edit/page.tsx` | `/comms/chats/:id/edit` | Дашборд › Общение › Групповые чаты › [имя чата] › Редактирование |

### 3.6 ASCII-эскиз (пример: chats/:id/edit)

```ascii
┌────────────────────────────────────────────────────────────┐
│ Дашборд › Общение › Групповые чаты › [Имя чата] › Редактирование
│   [link]   [link]   [link]        [link]        [aria-current]  │
│   text-xs, text-secondary  hover→primary      font-medium      │
└────────────────────────────────────────────────────────────┘
```

> Каждый уровень разделён `›`; последний — `span` с `aria-current="page"`, без ссылки.

---

## 4. Кнопка удаления сообщения + ConfirmDialog (R-19)

### 4.1 Расположение в MessageItem

Кнопка «Удалить» отображается в блоке действий сообщения (рядом с данными о времени/статусе) **только для собственных сообщений**.

**Критическое условие видимости (P-01a):** кнопка показывается **только если** `onDelete` передан **и** `isCurrentUser === true`. Для чужих сообщений кнопка скрыта независимо от наличия `onDelete`.

```tsx
{onDelete && isCurrentUser && (
  <Button variant="ghost" size="sm" type="button"
    onClick={() => setShowDeleteConfirm(true)}
    aria-label="Удалить сообщение">
    Удалить
  </Button>
)}
```

| Аспект | Значение |
|--------|----------|
| Компонент | `<Button variant="ghost" size="sm">` |
| Размер | `sm` (32px; `text.body-sm`) |
| Текст | «Удалить» |
| Доступность | `aria-label="Удалить сообщение"` |
| Видимость | `{onDelete && isCurrentUser && ...}` (только свои сообщения) |
| Действие | Открывает ConfirmDialog (НЕ вызывает `onDelete()` напрямую) |

### 4.2 ASCII-эскиз MessageItem (вид для своего сообщения)

```ascii
┌────────────────────────────────────────────────────────────┐
│ Имя отправителя        [Статус]                             │
│ Текст сообщения                                             │
│ ───────────────────────────────────────────                 │
│ [🕒 время]  [✓✓ прочитано]  [ ··· ]  [Удалить]  ← ghost sm  │
└────────────────────────────────────────────────────────────┘
```

- «Удалить» — `Button variant="ghost" size="sm"`, `color.text.primary`, hover `color.bg.secondary`.
- Для чужих сообщений (`isCurrentUser === false`) — этот блок действий отсутствует.

### 4.3 Поведение и тексты ConfirmDialog

Клик по «Удалить» → открывается `ConfirmDialog` с `variant="danger"`.

| Параметр | Значение |
|----------|----------|
| `title` | «Удаление сообщения» |
| `message` | «Вы действительно хотите удалить это сообщение? Это действие нельзя отменить.» |
| `confirmLabel` | «Удалить» |
| `cancelLabel` | «Отмена» |
| `variant` | `danger` (красная кнопка подтверждения) |
| `onConfirm` | Вызвать `onDelete(message.id)` затем закрыть диалог |

**Fluent-поведение (P-01b):**
1. Клик «Удалить» → `setShowDeleteConfirm(true)`
2. «Отмена» / Escape / клик вне → `onClose()` → `setShowDeleteConfirm(false)`, сообщение остаётся
3. «Удалить» в диалоге → `onDelete(message.id)` + `setShowDeleteConfirm(false)`

### 4.4 ASCII-эскиз ConfirmDialog (danger)

```ascii
┌────────────────────────────────────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  (overlay)         │
│  ┌──────────────────────────────────────┐                 │
│  │     ( ! )  Удаление сообщения         │                 │
│  │     Вы действительно хотите удалить    │                 │
│  │     это сообщение? Это действие нельзя │                 │
│  │     отменить.                          │                 │
│  │     [Отмена (secondary)] [Удалить (danger)]             │
│  └──────────────────────────────────────┘                 │
└────────────────────────────────────────────────────────────┘
```

- Overlay: `color.bg.overlay` (после миграции) / `rgba(0,0,0,0.5)`.
- Модал: `color.bg.primary`, `radius-md`, `shadow-md`.
- Заголовок: `text.heading-3` + `color.text.primary`.
- Сообщение: `text.body` + `color.text.secondary`.
- Иконка-предупреждение в круге: `bg-[var(--theme-bg-secondary)]` + `text-[var(--theme-text-secondary)]`.

### 4.5 Миграция ConfirmDialog на токены (B-020-T6b)

> Текущий [`ConfirmDialog.tsx`](../../../src/components/ui/ConfirmDialog/ConfirmDialog.tsx) содержит хардкод, ломающий Dark/Green. Требуется замена.

| Текущий класс | Строка | Токен-замена |
|---------------|:------:|--------------|
| `bg-indigo-600` (confirm primary) | ~108 | `bg-[var(--theme-accent)]` |
| `hover:bg-indigo-700` | ~108 | `hover:opacity-90` |
| `focus:ring-indigo-500` | ~108 | `focus:ring-[var(--theme-accent)]` |
| `bg-red-600` (confirm danger) | ~109 | `bg-[var(--theme-danger)]` |
| `hover:bg-red-700` | ~109 | `hover:opacity-90` |
| `focus:ring-red-500` | ~109 | `focus:ring-[var(--theme-danger)]` |
| `bg-gray-500` (backdrop) | ~121 | `bg-[var(--theme-bg-overlay)]` |
| `bg-white` (modal) | ~129 | `bg-[var(--theme-bg-primary)]` |
| `bg-gray-100` (icon bg) | ~133 | `bg-[var(--theme-bg-secondary)]` |
| `text-gray-600` (icon) | ~135 | `text-[var(--theme-text-secondary)]` |
| `text-gray-900` (title) | ~150 | `text-[var(--theme-text-primary)]` |
| `text-gray-500` (message) | ~152 | `text-[var(--theme-text-secondary)]` |

> **Примечание:** токен `--theme-bg-overlay`, `--theme-accent-hover`, `--theme-danger-hover` упомянуты в плане как целевые. Проверить их наличие в [`globals.css`](../../../src/app/globals.css); если отсутствуют — использовать существующие эквиваленты (`color.bg.overlay`, `opacity-90` для hover) в рамках миграции B-021.

---

## 5. Кнопка отправки (R-20) — верификация

Кнопка отправки в [`MessageInput.tsx`](../../../src/components/features/comms/MessageInput/MessageInput.tsx) **уже** использует `<Button variant="primary" size="md">` (B-019). Изменения не требуются — только визуальная верификация.

| Проверка | Ожидание | Токен |
|----------|----------|-------|
| Фон кнопки | Акцентный цвет | `bg-[var(--theme-accent)]` (`color.accent.default`) |
| Иконка отправки | Белая, контрастная на фоне | `text-white` (внутри primary Button) |
| Отключённое состояние | `disabled` блокирует, opacity-50 | Button `disabled` |
| Загрузка | `<Button isLoading>` (спиннер внутри кнопки) | — |
| Три темы | Фон и иконка корректны в Light/Dark/Green | `var(--theme-accent)` |

> **Ограничение (P-04):** спиннер `<Spinner>` в состоянии отправки (внутри Button) НЕ заменяется скелетоном в B-020 — это индикатор действия кнопки, а не загрузки страницы.

---

## 6. Ограничения

| # | Ограничение | Детали |
|---|-------------|--------|
| 1 | **Не менять логику отправки** | Обработчики `onSubmit`/`handleSubmit`, `onKeyDown`, состояние ввода в MessageInput не изменяются. |
| 2 | **Не менять логику удаления** | Порядок: подтверждение → `onDelete(message.id)`. Вызов `onDelete` происходит только после подтверждения; диалог закрывается после. `onDelete`-проп API сохраняется. |
| 3 | **Не менять состояния/эффекты данных** | `useEffect`/`useState`, загрузка данных (`isLoading`), API-запросы не затрагиваются — меняется только presentation-слой (скелетоны вместо спиннеров). |
| 4 | **Скелетоны только для загрузки списков/страниц** | Спиннер внутри `<Button isLoading>` (отправка/сохранение) остаётся — вне скоупа B-020 (P-04 плана). |
| 5 | **API MessageItem не расширяется** | Используются существующие пропсы (`onDelete`, `isCurrentUser`). Меняется только внутренняя логика видимости и подтверждения. |
| 6 | **Типографика/доступность Breadcrumbs** | Без изменения семантики `nav/ol/li`, `aria-current`, разделителя `›`, скрытия на мобильных (`hidden md:flex`). |
| 7 | **Токены — единственный источник** | Цвета `color.*`, размеры `space-*`/`text.*`/`radius-*`. Запрещён хардкод `bg-gray-*`, `bg-indigo-*`, `text-gray-*`, `bg-white`, `border-*-gray`. |

---

## 7. Визуальный check-list для 3 тем (Light / Dark / Green)

> Тема переключается через профиль (`/dashboard/settings`). Проверять каждую страницу/состояние в каждой теме.

### 7.1 Скелетоны (R-14)

- [ ] **ConversationList** — 4 pulsing-карточки (аватар+строки) при загрузке, `animate-pulse`, `role="status" aria-live="polite"`.
- [ ] **ConversationMessagesList** — 3 pulsing-сообщения (аватар+пузырёк) при пагинации.
- [ ] **messages/page** — скелетон страницы (заголовок + карточки) при `status === 'loading'`.
- [ ] **chats/page** — скелетон страницы (заголовок + кнопка + карточки).
- [ ] Во всех темах блоки скелетона заметны на фоне `color.bg.secondary`, контраст адекватен (Light/Dark/Green).
- [ ] Нет спиннеров (`animate-spin`) на месте скелетонов.

### 7.2 Breadcrumbs (R-15)

- [ ] Видны на всех 7 подстраницах COMMS, строго перед заголовком `<h1>`.
- [ ] Цепочка совпадает с таблицей §3.5 (Дашборд › Общение › …).
- [ ] Родительские уровни — ссылки, кликабельны, hover → `color.text.primary`, focus ring `color.accent.default`.
- [ ] Последний уровень — `span` с `aria-current="page"`, `font-medium`, `color.text.primary`.
- [ ] Разделитель `›` — `color.text.secondary`, `aria-hidden="true"`.
- [ ] Корректны в 3 темах (нет `text-gray-*` хардкода в [`Breadcrumbs.tsx`](../../../src/components/layouts/Breadcrumbs.tsx)).
- [ ] На мобильных скрыты (`hidden md:flex`) — не ломают layout.

### 7.3 Кнопка удаления + ConfirmDialog (R-19)

- [ ] «Удалить» видна только на своих сообщениях (`isCurrentUser=true`), стиль `ghost sm`.
- [ ] **Негативный сценарий:** на чужих сообщениях кнопка СКРЫТА даже при переданном `onDelete` (P-01a).
- [ ] Клик «Удалить» → открывается ConfirmDialog (`variant="danger"`, заголовок «Удаление сообщения», текст предупреждения).
- [ ] Кнопка подтверждения — красная (`color.danger`), «Отмена» — `secondary`.
- [ ] «Отмена» / Escape / клик вне → диалог закрывается, сообщение остаётся.
- [ ] Подтверждение → `onDelete(message.id)` + диалог закрывается.
- [ ] ConfirmDialog корректен в 3 темах (нет `bg-white`, `bg-gray-*`, `bg-indigo-600`, `bg-red-600` хардкода в [`ConfirmDialog.tsx`](../../../src/components/ui/ConfirmDialog/ConfirmDialog.tsx)).

### 7.4 Кнопка отправки (R-20)

- [ ] `<Button variant="primary" size="md">` в MessageInput.
- [ ] Фон акцентный (`color.accent.default`) в 3 темах, иконка белая и видна.
- [ ] `disabled` блокирует кнопку при пустом/невалидном вводе.
- [ ] Загрузка отправки — `isLoading` на кнопке.

### 7.5 Сводные токены (после миграции)

- [ ] Нет `text-gray-*`, `bg-gray-*`, `bg-white`, `bg-indigo-*`, `bg-red-600`, `text-red-*`, `focus:ring-blue-500` в затрагиваемых файлах.
- [ ] Все цвета через `var(--theme-*)`.

---

## 8. Трассировка: элемент → R-ID → задача плана → компонент/токен

| Элемент (UI) | R-ID | Задача плана | Компонент / Токен |
|--------------|:----:|:------------:|------------------|
| Скелетон списка диалогов | R-14 | B-020-T1 | `animate-pulse` + `color.bg.secondary` |
| Скелетон сообщений | R-14 | B-020-T2 | `animate-pulse` + `color.bg.secondary` |
| Скелетон messages/page | R-14 | B-020-T3 | `animate-pulse` + `color.bg.secondary` |
| Скелетон chats/page | R-14 | B-020-T4 | `animate-pulse` + `color.bg.secondary` |
| Breadcrumbs на подстраницах | R-15 | B-020-T5 | `<Breadcrumbs />` |
| Миграция Breadcrumbs на токены | R-15 | B-020-T5b | `color.text.primary/secondary`, `color.accent.default` |
| Кнопка «Удалить» (свои сообщения) | R-19 | B-020-T6 | `<Button variant="ghost" size="sm">` |
| Подтверждение удаления | R-19 | B-020-T6 | `<ConfirmDialog variant="danger">` |
| Миграция ConfirmDialog на токены | R-19 | B-020-T6b | `color.danger`, `color.bg.primary`, `color.text.*` |
| Кнопка отправки (верификация) | R-20 | B-020-T7 | `<Button variant="primary">` |

---

## 9. Связанные артефакты

- 📋 **План:** [`docs/plans/B-020-skeletons-breadcrumbs-plan.md`](../../plans/B-020-skeletons-breadcrumbs-plan.md)
- 📋 **Аудит:** [`docs/design/comms-ui-review.md`](../../design/comms-ui-review.md)
- 📋 **DS-компоненты:** [`docs/design/components/`](../../design/components/) (button, dialog)
- 📋 **Токены:** [`docs/design/tokens/`](../../design/tokens/) (colors, typography, spacing, radius, shadows)
- 📋 **Паттерны:** [`docs/design/patterns/`](../../design/patterns/) (list-page, detail-page)
- 📋 **Источник UI:** [`docs/specs/comms/B-019-ui-design.md`](B-019-ui-design.md)
