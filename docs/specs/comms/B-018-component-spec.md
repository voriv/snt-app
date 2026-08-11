# Спецификация компонент: B-018 «COMMS UI: Миграция нейтральных и семантических цветов на токены (R-02…R-07)»

> **Назначение:** Спецификация компонент для UI-ремедиации — замена хардкод-классов Tailwind на CSS-переменные дизайн-системы  
> **Создано:** `component-spec` режим  
> **Статус:** `[TODO]`

---

## 1. 📋 Метаданные

| Параметр | Значение |
|---|---|
| **Feature** | `comms-tokens-migration-B018` |
| **Тип** | UI-ремедиация (search/replace на CSS-переменные + очистка globals.css) |
| **План реализации** | [`docs/plans/B-018-tokens-migration-plan.md`](../../plans/B-018-tokens-migration-plan.md) |
| **Дизайн-справка** | [`docs/specs/comms/B-018-ui-design.md`](./B-018-ui-design.md) |
| **Токен-ревью** | [`docs/design/B-017-tokens-review.md`](../../design/B-017-tokens-review.md) |
| **Словарь токенов** | [`docs/design/tokens/colors.md`](../../design/tokens/colors.md) |
| **User Stories** | [US-21-27](../../user-stories/US-21-27-просмотр-списка-объявлений.md), [US-21-28](../../user-stories/US-21-28-создание-объявления.md), [US-21-29](../../user-stories/US-21-29-редактирование-объявления.md) |
| **Требования** | REQ-COMMS-001 |
| **Модель данных** | Без изменений |
| **Эталон компонента** | [`src/components/features/comms/CommsTab/CommsTab.tsx`](../../../src/components/features/comms/CommsTab/CommsTab.tsx) (B-017) |
| **Версия** | `v1.0` |
| **Дата** | `2026-08-06` |
| **Статус** | `[TODO]` |

> **Охват:** 3 страницы announcements + очистка `!important` из `globals.css`. Без изменения структуры компонентов и бизнес-логики.

---

## 2. 📊 Матрица трассировки

> Действия: 🆕 — создать файл, ✏️ — добавить в существующий, 🔧 — изменить существующее.

| # | Компонент | Слой | Действие | US | REQ-AC | R-ID | Задача | Статус |
|---|---|---|---|---|---|---|---|---|
| 1 | `announcements/page.tsx` — замена 6 классов на токены | Page | 🔧 | US-21-27 | — | R-02, R-03, R-04, R-06 | B-018-T1 | `[TODO]` |
| 2 | `announcements/create/page.tsx` — замена 5 классов на токены | Page | 🔧 | US-21-28 | — | R-02, R-03, R-04, R-05 | B-018-T2 | `[TODO]` |
| 3 | `announcements/[id]/page.tsx` — замена 4 классов на токены | Page | 🔧 | US-21-29 | — | R-06 | B-018-T3 | `[TODO]` |
| 4 | `globals.css` — удаление `!important`-блоков | CSS | 🔧 | — | — | R-27 | B-018-T4 | `[TODO]` |

### Проверка покрытия R-ID

| R-ID | Описание | Покрыт в строке | Статус |
|---|---|---|---|
| **R-02** | `text-gray-900` → `text-[var(--theme-text-primary)]` | #1, #2 | ✅ |
| **R-03** | `bg-white` → `bg-[var(--theme-bg-primary)]` | #1, #2 | ✅ |
| **R-04** | `border-gray-200` → `border-[var(--theme-border-color)]` | #2 | ✅ |
| **R-05** | `text-gray-500/600` → `text-[var(--theme-text-secondary)]` | #2 | ✅ |
| **R-06** | `bg-red-50/border-red-200/text-red-700` → danger-токены | #1, #3 | ✅ |
| **R-07** | `bg-blue-*` / `text-blue-*` → info-токены | — (не обнаружено в announcements) | ✅ |
| **R-27** | Очистка `!important` из globals.css | #4 | ✅ |

**Покрытие: 100%.**

> **Примечание:** R-07 (info-токены) формально покрыт — классы `bg-blue-*`/`text-blue-*` отсутствуют в целевых файлах announcements (обработаны ранее в B-017 в `messages/new`). Запись сохранена для полноты спецификации.

---

## 3. 🏗️ Спецификация по слоям

---

### 3.1 Page Layer — Миграция токенов

> **Важно:** данные задачи — чистый search/replace классов в `className` атрибутах. Структура JSX, логика, импорты, состояния и обработчики **не изменяются**.

---

#### 3.1.1 `announcements/page.tsx` — Миграция нейтральных и danger-токенов (T1)

| Параметр | Значение |
|---|---|
| **Файл** | [`src/app/dashboard/comms/announcements/page.tsx`](../../../src/app/dashboard/comms/announcements/page.tsx) |
| **Действие** | 🔧 Заменить хардкод-классы на CSS-переменные |
| **Задача** | B-018-T1 |
| **Трассировка** | R-02, R-03, R-04, R-06 |

**Карта замен:**

| Строка | Было (класс) | Стало (класс) | Tокен | R-ID |
|:------:|---|---|---|---|
| 108 | `text-indigo-600` | `text-[var(--theme-accent)]` | `color.accent.default` | R-06 (сопутств.) |
| 134 | `bg-red-50 border border-red-200 ... text-red-700` | `bg-[var(--theme-danger)]/10 border border-[var(--theme-danger)]/20 ... text-[var(--theme-danger)]` | `color.danger` | R-06 |
| 144 | `text-gray-900` | `text-[var(--theme-text-primary)]` | `color.text.primary` | R-02 |
| 147 | `bg-white` | `bg-[var(--theme-bg-primary)]` | `color.bg.primary` | R-03 |

**Контекстные сниппеты (до → после):**

```tsx
// СТРОКА 108 — спиннер loading
// ДО:
className="animate-spin h-8 w-8 text-indigo-600"
// ПОСЛЕ:
className="animate-spin h-8 w-8 text-[var(--theme-accent)]"
```

```tsx
// СТРОКА 134 — error-алерт
// ДО:
className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700"
// ПОСЛЕ:
className="bg-[var(--theme-danger)]/10 border border-[var(--theme-danger)]/20 rounded-lg p-4 text-[var(--theme-danger)]"
```

```tsx
// СТРОКА 144 — заголовок «Объявления»
// ДО:
className="text-2xl font-bold text-gray-900 mb-6"
// ПОСЛЕ:
className="text-2xl font-bold text-[var(--theme-text-primary)] mb-6"
```

```tsx
// СТРОКА 147 — фон карточки
// ДО:
className="bg-white rounded-lg shadow"
// ПОСЛЕ:
className="bg-[var(--theme-bg-primary)] rounded-lg shadow"
```

**Чек-лист T1:**

- [ ] Строка 108: `text-indigo-600` → `text-[var(--theme-accent)]`
- [ ] Строка 134: `bg-red-50` → `bg-[var(--theme-danger)]/10`
- [ ] Строка 134: `border-red-200` → `border-[var(--theme-danger)]/20`
- [ ] Строка 134: `text-red-700` → `text-[var(--theme-danger)]`
- [ ] Строка 144: `text-gray-900` → `text-[var(--theme-text-primary)]`
- [ ] Строка 147: `bg-white` → `bg-[var(--theme-bg-primary)]`
- [ ] Нет хардкод-классов `text-gray-*`, `bg-red-*`, `border-red-*`, `text-indigo-*` в файле после замены

---

#### 3.1.2 `announcements/create/page.tsx` — Миграция нейтральных токенов (T2)

| Параметр | Значение |
|---|---|
| **Файл** | [`src/app/dashboard/comms/announcements/create/page.tsx`](../../../src/app/dashboard/comms/announcements/create/page.tsx) |
| **Действие** | 🔧 Заменить хардкод-классы на CSS-переменные |
| **Задача** | B-018-T2 |
| **Трассировка** | R-02, R-03, R-04, R-05 |

**Карта замен:**

| Строка | Было (класс) | Стало (класс) | Токен | R-ID |
|:------:|---|---|---|---|
| 46 | `text-gray-500` | `text-[var(--theme-text-secondary)]` | `color.text.secondary` | R-05 |
| 55 | `text-gray-900` | `text-[var(--theme-text-primary)]` | `color.text.primary` | R-02 |
| 56 | `text-gray-600` | `text-[var(--theme-text-secondary)]` | `color.text.secondary` | R-05 |
| 62 | `border-gray-200` | `border-[var(--theme-border-color)]` | `color.border.default` | R-04 |
| 62 | `bg-white` | `bg-[var(--theme-bg-primary)]` | `color.bg.primary` | R-03 |

**Контекстные сниппеты (до → после):**

```tsx
// СТРОКА 46 — loading-текст
// ДО:
className="text-gray-500"
// ПОСЛЕ:
className="text-[var(--theme-text-secondary)]"
```

```tsx
// СТРОКА 55 — заголовок «Создание объявления»
// ДО:
className="text-2xl font-bold text-gray-900"
// ПОСЛЕ:
className="text-2xl font-bold text-[var(--theme-text-primary)]"
```

```tsx
// СТРОКА 56 — подзаголовок
// ДО:
className="mt-1 text-sm text-gray-600"
// ПОСЛЕ:
className="mt-1 text-sm text-[var(--theme-text-secondary)]"
```

```tsx
// СТРОКА 62 — карточка формы
// ДО:
className="rounded-lg border border-gray-200 bg-white p-6"
// ПОСЛЕ:
className="rounded-lg border border-[var(--theme-border-color)] bg-[var(--theme-bg-primary)] p-6"
```

**Чек-лист T2:**

- [ ] Строка 46: `text-gray-500` → `text-[var(--theme-text-secondary)]`
- [ ] Строка 55: `text-gray-900` → `text-[var(--theme-text-primary)]`
- [ ] Строка 56: `text-gray-600` → `text-[var(--theme-text-secondary)]`
- [ ] Строка 62: `border-gray-200` → `border-[var(--theme-border-color)]`
- [ ] Строка 62: `bg-white` → `bg-[var(--theme-bg-primary)]`
- [ ] Нет хардкод-классов `text-gray-*`, `border-gray-*`, `bg-white` в файле после замены

---

#### 3.1.3 `announcements/[id]/page.tsx` — Миграция accent и danger-токенов (T3)

| Параметр | Значение |
|---|---|
| **Файл** | [`src/app/dashboard/comms/announcements/[id]/page.tsx`](../../../src/app/dashboard/comms/announcements/[id]/page.tsx) |
| **Действие** | 🔧 Заменить хардкод-классы на CSS-переменные |
| **Задача** | B-018-T3 |
| **Трассировка** | R-06 |

**Карта замен:**

| Строка | Было (класс) | Стало (класс) | Токен | R-ID |
|:------:|---|---|---|---|
| 133 | `text-indigo-600` | `text-[var(--theme-accent)]` | `color.accent.default` | R-06 (сопутств.) |
| 161 | `text-indigo-600` | `text-[var(--theme-accent)]` | `color.accent.default` | R-06 (сопутств.) |
| 188 | `bg-red-50 border border-red-200 ... text-red-700` | `bg-[var(--theme-danger)]/10 border border-[var(--theme-danger)]/20 ... text-[var(--theme-danger)]` | `color.danger` | R-06 |

**Контекстные сниппеты (до → после):**

```tsx
// СТРОКА 133 — спиннер unauthenticated
// ДО:
className="animate-spin h-8 w-8 text-indigo-600"
// ПОСЛЕ:
className="animate-spin h-8 w-8 text-[var(--theme-accent)]"
```

```tsx
// СТРОКА 161 — спиннер isLoading
// ДО:
className="animate-spin h-8 w-8 text-indigo-600"
// ПОСЛЕ:
className="animate-spin h-8 w-8 text-[var(--theme-accent)]"
```

```tsx
// СТРОКА 188 — error-алерт
// ДО:
className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700"
// ПОСЛЕ:
className="bg-[var(--theme-danger)]/10 border border-[var(--theme-danger)]/20 rounded-lg p-4 text-[var(--theme-danger)]"
```

**⚠️ Что НЕ менять в этом файле:**

| Строка | Класс | Причина |
|:------:|---|---|
| 204 | `bg-yellow-50 border border-yellow-200 ... text-yellow-700` | warning-классы — вне scope R-02…R-07 |
| 226-228 | `bg-white`, `border-border` | `border-border` — это корректный tailwind-токен; `bg-white` на стр. 226 уже в контексте карточки, но план указывает не трогать `bg-white` в `[id]/page.tsx` (только danger/accent) |
| 230 | `text-foreground` | tailwind-токен, не хардкод |
| 239 | `text-muted-foreground` | tailwind-токен, не хардкод |

> **Ключевое правило:** `text-foreground`, `text-muted-foreground`, `border-border` — это токены Tailwind CSS (не `--theme-*`), они корректны и НЕ требуют миграции.

**Чек-лист T3:**

- [ ] Строка 133: `text-indigo-600` → `text-[var(--theme-accent)]`
- [ ] Строка 161: `text-indigo-600` → `text-[var(--theme-accent)]`
- [ ] Строка 188: `bg-red-50` → `bg-[var(--theme-danger)]/10`
- [ ] Строка 188: `border-red-200` → `border-[var(--theme-danger)]/20`
- [ ] Строка 188: `text-red-700` → `text-[var(--theme-danger)]`
- [ ] Строка 204: `bg-yellow-*` / `text-yellow-*` — НЕТ изменений
- [ ] `text-foreground` / `text-muted-foreground` / `border-border` — НЕТ изменений

---

### 3.2 CSS Layer — Очистка globals.css (T4)

| Параметр | Значение |
|---|---|
| **Файл** | [`src/app/globals.css`](../../../src/app/globals.css) |
| **Действие** | 🔧 Удалить `!important`-блоки нейтральных и семантических цветов |
| **Задача** | B-018-T4 |
| **Трассировка** | R-27 |

> **Ключевое правило:** удалять **только** блоки, содержащие `!important`. Переопределения **без** `!important` — сохранять как fallback для унаследованного кода.

---

#### 3.2.1 Блоки на удаление (с `!important`)

| Строки | Селекторы | `!important` | Действие |
|:------:|---|---|---|
| 177–186 | `.text-gray-{900,800,700,600}` (dark/green) | ✅ | **Удалить** |
| 189–192 | `.text-gray-500` (dark/green) | ✅ | **Удалить** |
| 195–198 | `.text-gray-400` (dark/green) | ✅ | **Удалить** |
| 200–203 | `.text-gray-300` (dark/green) | ✅ | **Удалить** |
| 205–208 | `.text-gray-200` (dark/green) | ✅ | **Удалить** |
| 210–213 | `.text-gray-100` (dark/green) | ✅ | **Удалить** |
| 259–267 | `.hover\:bg-gray-{100,50}` (dark/green) | ✅ | **Удалить** |
| 272–285 | `.text-red-{500,600}`, `.hover\:text-red-800` (dark/green) | ✅ | **Удалить** |
| 288–296 | `.text-indigo-600`, `.hover\:text-indigo-800` (dark/green) | ✅ | **Удалить** |
| 299–302 | `.text-green-600` (dark/green) | ✅ | **Удалить** |

#### 3.2.2 Блоки на сохранение (без `!important` или критичные)

| Строки | Селекторы | Причинa |
|:------:|---|---|
| 144–152 | `.bg-white`, `.bg-gray-50`, `.bg-gray-900` | Без `!important` — fallback для унаследованных классов |
| 158–166 | `.text-gray-900`, `.text-gray-700`, `.text-gray-500` (без `!important`) | Без `!important` — fallback |
| 216–229 | `.bg-white`, `.bg-gray-50`, `.bg-gray-900` (dark/green) | Без `!important` — navbar, унаследованные элементы |
| 237–256 | `.border-gray-*`, `.divide-*` (dark/green) | Без `!important` — унаследованные компоненты |
| 304–308 | `.shadow-sm` (dark/green) | Без `!important` — тени |
| 312–369 | Badge-стили (`.bg-gray-100`, `.bg-green-100`, `.bg-yellow-100`, `.bg-red-100`, `.bg-blue-100`) | DS-компонент Badge — критичны |
| 385–426 | Input/textarea/select стили | Критичны для корректной работы форм в 3 темах |
| 435–443 | Navbar `.bg-white` (dark/green) | Специфичные стили навигации |

**Чек-лист T4:**

- [ ] Удалены блоки `!important` для `text-gray-*` (177–213)
- [ ] Удалены блоки `!important` для `hover:bg-gray-*` (259–267)
- [ ] Удалены блоки `!important` для `text-red-*` (272–285)
- [ ] Удалены блоки `!important` для `text-indigo-*` (288–296)
- [ ] Удалены блоки `!important` для `text-green-*` (299–302)
- [ ] Сохранены блоки **без** `!important` (144–152, 158–170, 216–308)
- [ ] Сохранены Badge-стили (312–369)
- [ ] Сохранены Input-стили (385–426)
- [ ] Сохранены Navbar-стили (435–443)
- [ ] В файле `globals.css` после очистки отсутствует `!important` в блоках нейтральных/семантических цветов

---

## 4. 🚫 Ограничения

### 4.1 Что НЕ менять

| Объект | Причина |
|--------|---------|
| `bg-yellow-50` / `border-yellow-200` / `text-yellow-700` | Warning-классы — вне scope R-02…R-07 |
| `text-foreground`, `text-muted-foreground`, `border-border` | Tailwind CSS токены (не `--theme-*`), корректны |
| Badge-стили в `globals.css` | DS-компонент Badge — критичны |
| Input/textarea/select стили в `globals.css` | Критичны для форм в 3 темах |
| Navbar `.bg-white` в `globals.css` (dark/green) | Специфичные стили навигации |
| Переопределения **без** `!important` в `globals.css` | Fallback для унаследованного кода |
| `text-white` на accent-кнопках | Всегда белый на цветном фоне |
| Структура JSX, логика, импорты, состояния | Задача — только замена классов в `className` |

### 4.2 Правило синтаксиса

Все замены используют **arbitrary-value** синтаксис Tailwind CSS v3:

```
text-[var(--theme-NAME)]           — для цветов текста
bg-[var(--theme-NAME)]             — для фонов
border-[var(--theme-NAME)]         — для рамок
bg-[var(--theme-NAME)]/10          — фон с opacity 10%
border-[var(--theme-NAME)]/20      — рамка с opacity 20%
```

### 4.3 Правило `dark:`-префиксов

После миграции `dark:`-префиксы **не добавляются**, так как CSS-переменные `--theme-*` автоматически меняют значение в зависимости от темы (определяются в `globals.css` для `[data-theme='dark']` и `[data-theme='green']`).

---

## 5. 📝 Словарь замен (Lookup Table)

| Хардкод | CSS-переменная | Токен | R-ID |
|---------|---------------|-------|------|
| `text-gray-900` | `text-[var(--theme-text-primary)]` | `color.text.primary` | R-02 |
| `bg-white` | `bg-[var(--theme-bg-primary)]` | `color.bg.primary` | R-03 |
| `border-gray-200` | `border-[var(--theme-border-color)]` | `color.border.default` | R-04 |
| `text-gray-500` | `text-[var(--theme-text-secondary)]` | `color.text.secondary` | R-05 |
| `text-gray-600` | `text-[var(--theme-text-secondary)]` | `color.text.secondary` | R-05 |
| `bg-red-50` | `bg-[var(--theme-danger)]/10` | `color.danger` | R-06 |
| `border-red-200` | `border-[var(--theme-danger)]/20` | `color.danger` | R-06 |
| `text-red-700` | `text-[var(--theme-danger)]` | `color.danger` | R-06 |
| `text-indigo-600` | `text-[var(--theme-accent)]` | `color.accent.default` | R-06 (сопутств.) |

---

## 6. ✅ Критерии приёмки для code-агентов

### 6.1 Автоматические проверки (code-level)

| # | Проверка | Команда / Метод | Ожидаемый результат |
|---|---|---|---|
| AC-1 | Нет хардкод `text-gray-900` в announcements-страницах | `grep -r "text-gray-900" src/app/dashboard/comms/announcements/` | 0 совпадений |
| AC-2 | Нет хардкод `text-gray-500` в `create/page.tsx` | `grep "text-gray-500" src/app/dashboard/comms/announcements/create/page.tsx` | 0 совпадений |
| AC-3 | Нет хардкод `text-gray-600` в `create/page.tsx` | `grep "text-gray-600" src/app/dashboard/comms/announcements/create/page.tsx` | 0 совпадений |
| AC-4 | Нет хардкод `bg-red-50` в announcements-страницах | `grep -r "bg-red-50" src/app/dashboard/comms/announcements/` | 0 совпадений |
| AC-5 | Нет хардкод `border-red-200` в announcements-страницах | `grep -r "border-red-200" src/app/dashboard/comms/announcements/` | 0 совпадений |
| AC-6 | Нет хардкод `text-red-700` в announcements-страницах | `grep -r "text-red-700" src/app/dashboard/comms/announcements/` | 0 совпадений |
| AC-7 | Нет хардкод `text-indigo-600` в announcements-страницах | `grep -r "text-indigo-600" src/app/dashboard/comms/announcements/` | 0 совпадений |
| AC-8 | Нет `!important` в блоках нейтральных цветов `globals.css` | `grep "!important" src/app/globals.css` | Только Badge/Input/Navbar блоки |
| AC-9 | `bg-yellow-*` в `announcements/[id]/page.tsx` не изменены | визуальный diff строки 204 | Без изменений |
| AC-10 | `text-foreground`, `text-muted-foreground`, `border-border` не изменены | `grep -E "text-foreground\|text-muted-foreground\|border-border" announcements/[id]/page.tsx` | Сохранены |

### 6.2 Визуальные проверки (QA)

| # | Проверка | Темы | Статус |
|---|---|---|---|
| V-1 | Заголовки читаемы (не сливаются с фоном) | Light, Dark, Green | ☐ |
| V-2 | Вторичный текст (даты/подписи) ≥ contrast AA | Light, Dark, Green | ☐ |
| V-3 | Error-блоки имеют оттенок, соответствующий теме | Light, Dark, Green | ☐ |
| V-4 | Accent-ссылки/спиннеры видимы на фоне темы | Light, Dark, Green | ☐ |
| V-5 | Badge отображаются корректно | Light, Dark, Green | ☐ |
| V-6 | Нет регрессий в `messages/*`, `chats/*` | Light, Dark, Green | ☐ |

---

## 7. 📁 Список файлов

### Изменяемые

| Файл | Действие | Задача | R-ID | Описание |
|---|---|---|---|---|
| [`src/app/dashboard/comms/announcements/page.tsx`](../../../src/app/dashboard/comms/announcements/page.tsx) | 🔧 | B-018-T1 | R-02, R-03, R-04, R-06 | 4 замены классов в className |
| [`src/app/dashboard/comms/announcements/create/page.tsx`](../../../src/app/dashboard/comms/announcements/create/page.tsx) | 🔧 | B-018-T2 | R-02, R-03, R-04, R-05 | 5 замен классов в className |
| [`src/app/dashboard/comms/announcements/[id]/page.tsx`](../../../src/app/dashboard/comms/announcements/[id]/page.tsx) | 🔧 | B-018-T3 | R-06 | 4 замены классов в className |
| [`src/app/globals.css`](../../../src/app/globals.css) | 🔧 | B-018-T4 | R-27 | Удаление `!important`-блоков (стр. 177–302) |

### Не изменяются (явно исключено)

| Файл | Причина |
|---|---|
| API-слой (`/api/v1/announcements/*`) | Без изменений |
| Service-слой | Без изменений |
| Repository-слой | Без изменений |
| Типы/валидаторы домена announcement | Без изменений |
| UI-компоненты (`AnnouncementList`, `AnnouncementForm` и т.д.) | Без изменений |
| `src/components/features/comms/MessageItem/MessageItem.tsx` | Уже мигрирован в B-017 |
| `src/components/features/comms/ConversationDetailPage/ConversationDetailPage.tsx` | Уже мигрирован в B-017 |
| `src/components/features/comms/MessageInput/MessageInput.tsx` | Уже мигрирован в B-017 |
| `messages/*` страницы | Уже мигрированы в B-017 |
| `chats/*` страницы | Уже мигрированы в B-017 |

---

## 8. 📎 Связанные артефакты

| Артефакт | Ссылка |
|---|---|
| План реализации | [`docs/plans/B-018-tokens-migration-plan.md`](../../plans/B-018-tokens-migration-plan.md) |
| Дизайн-справка | [`docs/specs/comms/B-018-ui-design.md`](./B-018-ui-design.md) |
| Токен-ревью | [`docs/design/B-017-tokens-review.md`](../../design/B-017-tokens-review.md) |
| Словарь токенов | [`docs/design/tokens/colors.md`](../../design/tokens/colors.md) |
| План B-017 (эталон) | [`docs/plans/B-017-accent-colors-migration-plan.md`](../../plans/B-017-accent-colors-migration-plan.md) |
| CSS-переменные | [`src/app/globals.css`](../../../src/app/globals.css) |
| Эталон компонента | [`src/components/features/comms/CommsTab/CommsTab.tsx`](../../../src/components/features/comms/CommsTab/CommsTab.tsx) |
| Правила дизайн-системы | [`docs/rules/ui-design-rules.md`](../../rules/ui-design-rules.md) |

---

## 📝 История изменений

| Дата | Версия | Автор | Изменение |
|------|--------|-------|-----------|
| 2026-08-06 | v1.0 | Component Spec | Создание спецификации B-018 |
