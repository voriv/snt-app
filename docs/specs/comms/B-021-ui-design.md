# B-021 UI Design справка: Рефакторинг globals.css и доступность индикаторов загрузки (R-17, R-25, R-26, R-27)

> **Задача:** B-021 — COMMS UI: Рефакторинг globals.css и доступность R-17, R-25, R-26, R-27
> **Тип:** UI-ремедиация (миграция на токены + очистка CSS + a11y индикаторов загрузки)
> **Тип документа:** Дизайн-справка / Design guidelines (слой дизайна, без реализации)
> **Версия:** v1.0
> **Дата:** 2026-08-07
> **Статус:** `[ACTIVE]`
> **Автор:** UI Designer (режим `ui-designer`)

---

## 1. Назначение документа

Этот документ — **источник требований для UI-слоя** задачи B-021. Он описывает **как должны выглядеть** и **как должны вести себя** четыре направления рефакторинга:

1. **R-27 — Токенизация бейджей:** новые CSS-токены `--theme-badge-*` и их конкретные значения для 3 тем (Light/Dark/Green), миграция 5 компонентов с сырых badge-классов, а потом удаление `!important`-блоков из [`globals.css`](../../src/app/globals.css).
2. **R-25 — Устранение `dark:`-префикса** (только COMMS): замена scrollbar-thumb на токен `--theme-border-color`.
3. **R-17/R-26 — Доступность индикаторов загрузки:** единый `aria-pattern` (`role="status"` + `aria-live="polite"`) для 10 оставшихся спиннеров COMMS.

> **Входные артефакты:**
> - [`docs/plans/B-021-globals-a11y-plan.md`](../../plans/B-021-globals-a11y-plan.md) (v1.1, PASS)
> - [`src/app/globals.css`](../../src/app/globals.css) (существующие `--theme-*` и badge-блоки 228–287)
> - [`docs/design/tokens/colors.md`](../../design/tokens/colors.md)
> - [`docs/design/components/badge.md`](../../design/components/badge.md)
> - [`docs/specs/comms/B-020-ui-design.md`](B-020-ui-design.md) (образец формата + связанные решения)

---

## 2. Обзор дизайн-решений

| # | R-ID | Дизайн-решение | Визуальный эффект |
|---|:----:|----------------|-------------------|
| 1 | R-27 | Новые токены `--theme-badge-*` (5 семантик) для 3 тем | Статус-бейджи и иконки статусов корректно выглядят во всех темах, без `!important` |
| 2 | R-27 | Миграция 5 компонентов с `.bg-*-100` на токены | Бейджи документов, иконки ошибок/предупреждений перестают ломаться в Dark/Green |
| 3 | R-25 | Замена `dark:scrollbar-thumb-gray-600` на `--theme-border-color` | Полоса прокрутки сообщений корректна в 3 темах без `dark:` |
| 4 | R-17/R-26 | Контейнер-обёртка `role="status"` + `aria-live="polite"` для 10 спиннеров | Скринридеры сообщают о загрузке; визуально спиннер не меняется |

**Ключевой принцип B-021:** это **чисто визуально/структурная** миграция. Логика загрузки, API, обработчики, пропсы компонентов — **не меняются**. Изменяется только presentation-слой (классы → токены, добавление семантических атрибутов).

---

## 3. Блок 1a (R-27): Токены `--theme-badge-*`

### 3.1 Назначение

Бейджи статусов используют **семантические цвета** (default/success/warning/danger/info), которым соответствуют фоновые/текстовые пары. Вместо удалённых впоследствии `!important`-блоков значения задаются **напрямую через CSS-переменные темы** в `:root` / `[data-theme='dark']` / `[data-theme='green']` блоках [`globals.css`](../../src/app/globals.css).

### 3.2 Наименование токенов

Единая конвенция: `--theme-badge-{semantic}-{bg|color}`.

| Семантика | Вариант Badge | Назначение |
|-----------|---------------|-----------|
| `default` | `default` | Нейтральные статусы/роли (Черновик) |
| `success` | `success` | Положительные статусы (Опубликован/Активен) |
| `warning` | `warning` | Ожидающие статусы (Архив/В ожидании) |
| `danger` | `danger` | Ошибочные/истёкшие статусы, иконки ошибок/предупреждений |
| `info` | `info` | Информационные метки/статусы (В обработке) |

### 3.3 Значения токенов для 3 тем

| Токен | Light | Dark | Green |
|-------|-------|------|-------|
| `--theme-badge-default-bg` | `#f3f4f6` (gray-100) | `#374151` (gray-700) | `#374151` |
| `--theme-badge-default-color` | `#1f2937` (gray-800) | `#f9fafb` (gray-50) | `#f9fafb` |
| `--theme-badge-success-bg` | `#d1fae5` (green-100) | `#065f46` (green-900) | `#065f46` |
| `--theme-badge-success-color` | `#065f46` (green-800) | `#6ee7b7` (green-300) | `#6ee7b7` |
| `--theme-badge-warning-bg` | `#fef3c7` (yellow-100) | `#78350f` (amber-900) | `#78350f` |
| `--theme-badge-warning-color` | `#92400e` (yellow-800) | `#fde68a` (amber-300) | `#fde68a` |
| `--theme-badge-danger-bg` | `#fee2e2` (red-100) | `#7f1d1d` (red-900) | `#7f1d1d` |
| `--theme-badge-danger-color` | `#991b1b` (red-800) | `#fca5a5` (red-300) | `#fca5a5` |
| `--theme-badge-info-bg` | `#dbeafe` (blue-100) | `#1e3a8a` (blue-900) | `#1e3a8a` |
| `--theme-badge-info-color` | `#1e40af` (blue-800) | `#93c5fd` (blue-300) | `#93c5fd` |

> **Примечание по Green-теме:** Green-тема тёмная (`color-scheme: dark`), поэтому значения `--theme-badge-*` совпадают с Dark. Подтверждено планом v1.1.

### 3.4 Контрастность (обоснование значений)

Значения повторяют уже проверенные `!important`-пары из [`globals.css`](../../src/app/globals.css) (строки 228–287), поэтому контраст между `*-bg` и `*-color` уже выверен:

| Пара | Фон | Текст | Контраст результат |
|------|-----|-------|--------------------|
| default (Light) | `#f3f4f6` | `#1f2937` | Тёмный текст на светлом фоне — высокий контраст |
| default (Dark/Green) | `#374151` | `#f9fafb` | Светлый текст на сером-700 — читаемо на тёмном |
| success (Dark) | `#065f46` | `#6ee7b7` | Светло-зелёный на тёмно-зелёном — контрастно |
| danger (Dark) | `#7f1d1d` | `#fca5a5` | Светло-красный на тёмно-красном — заметно |

> **Правило:** цвет текста и фона любой пары **всегда берётся из одной темы** (оба из Light, либо оба из Dark/Green). Миксовать пары между темами запрещено — сломает контраст.

### 3.5 Карта миграции 5 компонентов (визуальная)

| Компонент | Семантика / Контекст | Было (класс) | Стало (токен) |
|-----------|----------------------|---------------|----------------|
| [`DocumentCard.tsx`](../../src/components/features/documents/DocumentCard.tsx) | Статус «Черновик» | `bg-gray-100 text-gray-800` | `--theme-badge-default-bg` / `--theme-badge-default-color` |
| [`DocumentCard.tsx`](../../src/components/features/documents/DocumentCard.tsx) | Статус «Опубликован» | `bg-green-100 text-green-800` | `--theme-badge-success-bg` / `--theme-badge-success-color` |
| [`DocumentCard.tsx`](../../src/components/features/documents/DocumentCard.tsx) | Статус «Архив» | `bg-yellow-100 text-yellow-800` | `--theme-badge-warning-bg` / `--theme-badge-warning-color` |
| [`DocumentDetail.tsx`](../../src/components/features/documents/DocumentDetail.tsx) | те же 3 статуса | те же 3 класса | те же 3 пары токенов |
| [`ChatList.tsx`](../../src/components/features/chats/ChatList/ChatList.tsx) | Иконка ошибки (круг) | `bg-red-100` | `--theme-badge-danger-bg` |
| [`UserList.tsx`](../../src/components/features/users/UserList/UserList.tsx) | Иконка ошибки (круг) | `bg-red-100` | `--theme-badge-danger-bg` |
| [`DeleteCategoryDialog.tsx`](../../src/components/features/documents/DeleteCategoryDialog.tsx) | Иконка предупреждения (круг) | `bg-red-100` | `--theme-badge-danger-bg` |

### 3.6 Выравнивание с Badge-компонентом

В [`docs/design/components/badge.md`](../../design/components/badge.md) варианты Badge описаны через семантические токены (`color.success`/`warning`/`danger`/`info` с `opacity-10` фоном). Токены `--theme-badge-*` — это **более насыщенная пара** для статус-бейджей, используемых именно как **статус** (не как декоративная метка). Оба набора допустимы:

| Вариант | Badge-компонент (существует) | Новые статус-токены B-021 |
|---------|------------------------------|---------------------------|
| default | `color.bg.secondary` + `color.text.secondary` | `--theme-badge-default-*` |
| success | `color.success` (opacity-10) + `color.success` | `--theme-badge-success-*` |
| warning | `color.warning` (opacity-10) + `color.warning` | `--theme-badge-warning-*` |
| danger | `color.danger` (opacity-10) + `color.danger` | `--theme-badge-danger-*` |
| info | `color.info` (opacity-10) + `color.info` | `--theme-badge-info-*` |

> **Рекомендация Component Spec:** мигрируемые бейджи в `DocumentCard`/`DocumentDetail` — это **статусные** (пара фона/текста сильнее контрастна), поэтому им подходят `--theme-badge-*`. В `ChatList`/`UserList`/`DeleteCategoryDialog` мигрируется только фон круга-иконки → `--theme-badge-danger-bg`.

### 3.7 ASCII-эскиз (статус-бейдж документа в 3 темах)

```ascii
ТЕМА LIGHT:
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Черновик    │  │  Опубликован │  │    Архив     │
│  bg:#f3f4f6  │  │  bg:#d1fae5  │  │  bg:#fef3c7  │
│  color:#1f29 │  │  color:#065f4 │  │  color:#92400 │
└──────────────┘  └──────────────┘  └──────────────┘

ТЕМА DARK (и GREEN — идентично):
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Черновик    │  │  Опубликован │  │    Архив     │
│  bg:#374151  │  │  bg:#065f46  │  │  bg:#78350f  │
│  color:#f9fa │  │  color:#6ee7  │  │  color:#fde68 │
└──────────────┘  └──────────────┘  └──────────────┘
```

> Форма бейджа неизменна: овал `radius-full` (`rounded-full`), padding `space-0.5 × space-2.5`, шрифт `text.caption` (12px medium) — по Badge-spec. Меняются **только bg/color** пары.

---

## 4. Блок 1 (R-27): Удаление `!important` из globals.css

После миграции (Блок 1a) удаляются badge-блоки с `!important` (строки 228–287) в [`globals.css`](../../src/app/globals.css).

### 4.1 Что удаляется (визуально)

Это блоки, принудительно переопределявшие `.bg-gray-100`, `.bg-green-100`, `.bg-yellow-100`, `.bg-red-100`, `.bg-blue-100` в Dark/Green темах через `!important`.

### 4.2 Визуальный эффект после удаления

- **Бейджи статусов** (`DocumentCard`, `DocumentDetail`) теперь полностью управляются `--theme-badge-*` — в `globals.css` не остаётся «обходных» переопределений.
- **Иконки-круги** (`ChatList`, `UserList`, `DeleteCategoryDialog`) получают фон из `--theme-badge-danger-bg` напрямую.
- **Badge-компонент ролей** (если использует `bg-*-100`) — проверяется отдельно (см. §6): если потребуется, его тоже мигрируют, но это вне цикла `!important`, т.к. `Badge` не полагается на эти блоки после собственной миграции (B-019).

> **Ограничение:** `divide-y`/`divide-gray-200` блоки (строки 289–297, 212–220) **не удаляются** — они используют `--theme-border-color` и корректны.

---

## 5. Блок 2 (R-25): Устранение `dark:` (только COMMS)

### 5.1 Что и где

Единственный оставшийся `dark:` в COMMS — полоса прокрутки в [`ConversationMessagesList.tsx`](../../src/components/features/comms/ConversationMessagesList/ConversationMessagesList.tsx) (стр. 157).

### 5.2 Визуальное решение

| Было (класс) | Стало (токен) |
|--------------|---------------|
| `scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600` | `scrollbar-thumb-[var(--theme-border-color)]` |

### 5.3 Визуальный эффект

- Полоса прокрутки (`::-webkit-scrollbar-thumb`) использует `--theme-border-color`, который уже адаптирован под тему:
  - Light: `#e5e7eb`
  - Dark: `#374151`
  - Green: `#047857`
- Перестаёт требоваться `dark:`-префикс — цвет следует за `data-theme` автоматически = **тема-агностичность** достигается через токен.

> **Scope:** это **только COMMS**. `dark:` в `ThemeToggle.tsx`, `PlotUserForm.tsx` и др. — вне B-021 (отдельная задача глобальной миграции). Визуально их вид не меняется в этой задаче.

---

## 6. Блок 3 (R-17/R-26): Индикаторы загрузки — aria-pattern

### 6.1 Цель

Скринридеры должны сообщать о начале/завершении загрузки контента. Визуально спиннеры **не меняются** — только добавляется семантическая обёртка.

### 6.2 Единый aria-pattern для спиннера

Каждый спиннер загрузки оборачивается в контейнер с двумя атрибутами:

| Атрибут | Значение | Назначение |
|---------|----------|------------|
| `role="status"` | compound role | Отмечает регион, отражающий статус/прогресс |
| `aria-live="polite"` | polite | Анонсирует изменения, не перебивая пользователя немедленно |

```tsx
// Паттерн (структурный ориентир, НЕ реализация):
<div role="status" aria-live="polite">
  <Spinner ... />
</div>
```

### 6.3 Дополнительные требования

- **`aria-label`** желателен для контекста (например: «Загрузка диалога», «Загрузка чата»), если спиннер не имеет видимого текста, и **`aria-hidden="true"`** для внутренней вращающейся иконки/декоративных элементов, чтобы дублирующий лейбл не читался дважды.
- **Не блокировать остальной контент:** `aria-live="polite"` (не `assertive`) — загрузка не критична по времени.
- **Убирать атрибуты** при завершении загрузки (спиннер исчезает вместе с регионом) — регион существует только пока идёт загрузка.
- **Кнопки (`<Button isLoading>`) не трогать:** спиннер внутри кнопки (`MessageInput.tsx:116`, отправка/сохранение) объявлен вне scope — доступность кнопки обрабатывает сам Button (см. B-020 §5, ограничение P-04).

### 6.4 Map индикаторов (10 спиннеров)

Все строки из плана v1.1 — это **страницы-обёртки загрузки сессии/данных** и **спиннер поиска**:

| # | Файл | Строка | Контекст | Тип |
|---|------|:------:|----------|-----|
| 1 | `messages/[conversationId]/page.tsx` | 71 | Загрузка сессии | Страница |
| 2 | `chats/[chatId]/page.tsx` | 247 | Загрузка сессии | Страница |
| 3 | `chats/[chatId]/page.tsx` | 275 | Загрузка чата | Страница |
| 4 | `chats/new/page.tsx` | 133 | Загрузка сессии | Страница |
| 5 | `chats/[chatId]/edit/page.tsx` | 113 | Загрузка сессии | Страница |
| 6 | `chats/[chatId]/edit/page.tsx` | 140 | Загрузка чата | Страница |
| 7 | `announcements/page.tsx` | 108 | Загрузка данных | Страница |
| 8 | `announcements/[id]/page.tsx` | 132 | Загрузка сессии | Страница |
| 9 | `announcements/[id]/page.tsx` | 160 | Загрузка данных | Страница |
| 10 | `ParticipantSelector.tsx` | 291 | Поиск участников | Компонент |

### 6.5 Категории состояния индикатора (для тестирования)

| Категория | Пример | Ожидание role/aria |
|-----------|--------|-------------------|
| Загрузка страницы/сессии | page.tsx спиннеры | `role="status" aria-live="polite"` на обёртке |
| Загрузка деталей | спиннер чата/данных | `role="status" aria-live="polite"` |
| Поиск (динамич.) | `ParticipantSelector` | `role="status" aria-live="polite"` (обновление при вводе) |
| Кнопка отправки | `MessageInput` | НЕ меняется (есть у Button) |

> **Правило:** один и тот же спиннер не должен быть анонсирован дважды — либо `aria-label` на ролевом регионе, либо видимый текст, но не оба одновременно.

### 6.6 ASCII-эскиз (пример: спиннер загрузки страницы)

```ascii
┌─────────────────────────────────────────────┐
│ [ раздел загрузки: role="status"            │
│   aria-live="polite" ]                     │
│                                           │
│       ◠   (Spinner, animate-spin)         │
│       Загрузка… (aria-label, если есть)    │
│                                           │
└─────────────────────────────────────────────┘
```

- Спиннер: `animate-spin`, акцентный цвет — `color.accent.default` (существующий вид, не менять).
- Обёртка: `flex justify-center items-center`, `color.text.secondary` для подписи (если есть).

---

## 7. Ограничения

| # | Ограничение | Детали |
|---|-------------|--------|
| 1 | **Не менять реализацию/логику** | Загрузка, API, `useEffect`/`useState`, обработчики, пропсы — не изменяются. Только presentation (классы → токены, добавление a11y-атрибутов). |
| 2 | **Не создавать компоненты** | Токены добавляются в `globals.css`; компоненты используют существующие классы Tailwind через `var()`; a11y — через атрибуты, без новых UI-компонентов. |
| 3 | **Scope R-25 — только COMMS** | `dark:` в ThemeToggle/PlotUserForm/Auth/UserProfile — вне B-021. |
| 4 | **Кнопки с `isLoading` не трогать** | `MessageInput` спиннер отправки — вне scope (управляется Button). |
| 5 | **Порядок обязателен** | T1a (миграция компонентов) строго ПЕРЕД T1 (удаление `!important`). Иначе бейджи сломаются в Dark/Green. |
| 6 | **Токены — единственный источник** | Все цвета через `var(--theme-*)`. Запрещён хардкод `bg-*-100`, `dark:*`, `!important` в затрагиваемых файлах. |
| 7 | **Не менять вид спиннеров** | Любые изменения — только добавление `role`/`aria`, не изменение стилей спиннера. |

---

## 8. Чек-листы визуальной проверки (3 темы)

> Тема переключается через профиль (`/dashboard/settings`): Light, Dark, Green. Проверять каждый экран в каждой теме.

### 8.1 Токенизация бейджей (R-27, T1a)

- [ ] **DocumentCard** — статусы «Черновик» (default), «Опубликован» (success), «Архив» (warning) видны и контрастны во всех 3 темах.
- [ ] **DocumentDetail** — те же 3 статуса корректны в 3 темах.
- [ ] **ChatList** — иконка ошибки (красный круг) видна на тёмных темах (Dark/Green) — `--theme-badge-danger-bg`.
- [ ] **UserList** — иконка ошибки (красный круг) видна на тёмных темах.
- [ ] **DeleteCategoryDialog** — иконка предупреждения (красный круг) корректна во всех темах.
- [ ] В Light-теме бейджи имеют светлый фон и тёмный текст (`#d1fae5`/`#065f46` и т.д.).
- [ ] В Dark/Green бейджи тёмные с светлым текстом (`#065f46`/`#6ee7b7` и т.д.).
- [ ] Нет остатков `.bg-gray-100`, `.bg-green-100`, `.bg-yellow-100`, `.bg-red-100`, `.bg-blue-100` в `src/components/features/` (grep → 0).

### 8.2 Очистка globals.css от !important (R-27, T1)

- [ ] Бейджи ролей (Badge-компонент) корректны в Dark и Green (не сломались после удаления `!important`).
- [ ] Мигрированные бейджи статусов корректны в 3 темах.
- [ ] В [`globals.css`](../../src/app/globals.css) нет `!important` (grep → 0).
- [ ] `divide-y`/`divide-gray-200` блоки сохранены (границы `--theme-border-color` работают).

### 8.3 Устранение `dark:` (R-25, T2)

- [ ] Полоса прокрутки в списке сообщений корректна в 3 темах (следует `--theme-border-color`).
- [ ] В COMMS-компонентах нет `dark:`-префиксов (grep `dark:` по `src/components/features/comms/` → 0).
- [ ] Скролл беседы не «рассыпается» при переключении темы на лету.

### 8.4 Доступность индикаторов (R-17/R-26, T3)

- [ ] 10 спиннеров (см. §6.4) обёрнуты в `role="status"` + `aria-live="polite"`.
- [ ] Спиннер страницы сессии (`messages/[conversationId]`, `chats/[chatId]`, `chats/new`, `chats/[chatId]/edit`, `announcements/[id]`) — анонсируется.
- [ ] Спиннер данных (`chats/[chatId]`, `announcements/page`, `announcements/[id]`) — анонсируется.
- [ ] Спиннер поиска участников (`ParticipantSelector`) — анонсируется при каждом обновлении.
- [ ] Визуально спиннеры **не изменились** (та же анимация и цвет).
- [ ] Кнопки `isLoading` (`MessageInput`) — **не** получили дополнительных role/aria (вне scope) и работают как прежде.

### 8.5 Регрессия 3 тем (D-5)

- [ ] Переключение Light/Dark/Green не «прыгает» и не ломает layout на всех затрагиваемых страницах (document, chats, messages, announcements, users).
- [ ] Нет белых/нечитаемых областей в тёмных темах из-за удалённых `!important`.

---

## 9. Трассировка: элемент → R-ID → задача плана → компонент/токен

| Элемент (UI) | R-ID | Задача | Компонент / Токен |
|--------------|:----:|:------:|------------------|
| Токены статус-бейджей (5 семантик × 3 темы) | R-27 | B-021-T1a | `--theme-badge-{default,success,warning,danger,info}-{bg,color}` |
| DocumentCard статус-бейджи | R-27 | B-021-T1a | `bg-[var(--theme-badge-*)] text-[var(--theme-badge-*-color)]` |
| DocumentDetail статус-бейджи | R-27 | B-021-T1a | `bg-[var(--theme-badge-*)] text-[var(--theme-badge-*-color)]` |
| ChatList иконка ошибки | R-27 | B-021-T1a | `bg-[var(--theme-badge-danger-bg)]` |
| UserList иконка ошибки | R-27 | B-021-T1a | `bg-[var(--theme-badge-danger-bg)]` |
| DeleteCategoryDialog иконка предупреждения | R-27 | B-021-T1a | `bg-[var(--theme-badge-danger-bg)]` |
| Удаление !important-блоков badge | R-27 | B-021-T1 | `globals.css` (строки 228–287) |
| Полоса прокрутки сообщений | R-25 | B-021-T2 | `scrollbar-thumb-[var(--theme-border-color)]` |
| Спиннеры страниц/сессий | R-17/R-26 | B-021-T3 | контейнер `role="status" aria-live="polite"` |
| Спиннер поиска участников | R-17/R-26 | B-021-T3 | `ParticipantSelector` контейнер `role="status" aria-live="polite"` |

---

## 10. Связанные артефакты

- 📋 **План:** [`docs/plans/B-021-globals-a11y-plan.md`](../../plans/B-021-globals-a11y-plan.md) (v1.1)
- 🎨 **CSS-переменные:** [`src/app/globals.css`](../../src/app/globals.css)
- 🎨 **Токены цветов:** [`docs/design/tokens/colors.md`](../../design/tokens/colors.md)
- 🧩 **Badge-компонент:** [`docs/design/components/badge.md`](../../design/components/badge.md)
- 📋 **Предыдущая справка (формат):** [`docs/specs/comms/B-020-ui-design.md`](B-020-ui-design.md)
- 🎨 **Правила UI:** [`docs/rules/ui-design-rules.md`](../../rules/ui-design-rules.md)
- 📋 **Аудит:** [`docs/design/comms-ui-review.md`](../../design/comms-ui-review.md) (R-17, R-25, R-26, R-27)
