# B-018 UI-дизайн: Миграция нейтральных и семантических цветов на токены announcements-страниц (R-02…R-07)

> **Задача:** B-018 — COMMS UI: Миграция нейтральных и семантических цветов на CSS-variables (R-02…R-07)
> **Тип:** Дизайн-справка (design reference) для UI-ремедиации
> **Статус:** Черновик — ожидает approve
> **Версия:** v1.0
> **Дата:** 2026-08-06
> **Автор:** UI Designer

---

## 📎 Входные артефакты

| Артефакт | Роль |
|----------|------|
| [`docs/plans/B-018-tokens-migration-plan.md`](../../plans/B-018-tokens-migration-plan.md) | План миграции (замены, AC, риски) |
| [`docs/design/B-017-tokens-review.md`](../../design/B-017-tokens-review.md) | Токен-ревью и словарь замен (R-02…R-07, P-01…P-08) |
| [`docs/design/tokens/colors.md`](../../design/tokens/colors.md) | Токены цветов (значения в 3 темах) |
| [`docs/plans/B-017-accent-colors-migration-plan.md`](../../plans/B-017-accent-colors-migration-plan.md) | Предыдущая миграция (эталон паттерна) |
| [`docs/design/comms-ui-review.md`](../../design/comms-ui-review.md) | Аудит UI (R-01…R-12, R-27) |

---

## 🎯 Цель дизайн-справки

Зафиксировать **дизайн-ориентиры** для миграции: каким семантическим токенам соответствует каждый хардкод-класс на announcements-страницах, что НЕ трогать, и как проверить контрастность в 3 темах (Light / Dark / Green). Справка является источником требований для UI-слоя (Component Spec / code-агентов).

**Охват:** файлы в [`src/app/dashboard/comms/announcements/`](../../../src/app/dashboard/comms/announcements/) + очистка [`src/app/globals.css`](../../../src/app/globals.css).

---

## 1. Сопоставление хардкод-классов → токены

### 1.1 Нейтральные (текст/фон/рамки)

| Хардкод Tailwind | Токен дизайн-системы | CSS-переменная | R-ID | Семантика |
|------------------|----------------------|----------------|------|-----------|
| `text-gray-900` | `color.text.primary` | `text-[var(--theme-text-primary)]` | R-02 | Основной текст |
| `text-gray-600` | `color.text.secondary` | `text-[var(--theme-text-secondary)]` | R-05 | Вторичный текст |
| `text-gray-500` | `color.text.secondary` | `text-[var(--theme-text-secondary)]` | R-05 | Вторичный текст / подписи |
| `text-gray-400` | `color.text.secondary` | `text-[var(--theme-text-secondary)]` | R-05 | Плейсхолдеры/метаданные |
| `bg-white` | `color.bg.primary` | `bg-[var(--theme-bg-primary)]` | R-03 | Основной фон карточек |
| `border-gray-200` | `color.border.default` | `border-[var(--theme-border-color)]` | R-04 | Рамки карточек/секций |
| `border-gray-300` | `color.input.border` | `border-[var(--theme-input-border)]` | R-04 | Рамка поля ввода |

### 1.2 Семантические (danger / info / accent)

| Хардкод Tailwind | CSS-переменная | R-ID | Семантика |
|------------------|----------------|------|-----------|
| `bg-red-50` | `bg-[var(--theme-danger)]/10` | R-06 | Фон error-алерта |
| `border-red-200` | `border-[var(--theme-danger)]/20` | R-06 | Рамка error-алерта |
| `text-red-500/600/700/800` | `text-[var(--theme-danger)]` | R-06 | Текст ошибки |
| `bg-blue-50` | `bg-[var(--theme-info)]/10` | R-07 | Фон info-алерта |
| `border-blue-200` | `border-[var(--theme-info)]/20` | R-07 | Рамка info-алерта |
| `text-blue-600/700` | `text-[var(--theme-info)]` | R-07 | Текст info |
| `text-indigo-600` | `text-[var(--theme-accent)]` | — (сопутств.) | Ссылка/кнопка "Создать" |

> **Примечание по R-07:** в файлах announcements **не обнаружено** `bg-blue-*` / `text-blue-*` (обработаны в B-017 в `messages/new`). Запись дана для полноты справки и на случай появления.

### 1.3 Паттерн ошибки/информации (R-06/R-07)

```tsx
// ✅ Error-алерт (danger)
className="bg-[var(--theme-danger)]/10 border border-[var(--theme-danger)]/20 rounded-lg p-4 text-[var(--theme-danger)]"

// ❌ Старый хардкод
className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700"

// ✅ Info-алерт (info) — если появится
className="bg-[var(--theme-info)]/10 border border-[var(--theme-info)]/20 rounded-lg p-4 text-[var(--theme-info)]"
```

### 1.4 Map «файл → замены» (по B-018-T1…T3)

| Файл | Замены |
|------|--------|
| `announcements/page.tsx` | `text-indigo-600`→accent, `bg-red-50`/`border-red-200`/`text-red-700`→danger, `text-gray-900`→text-primary, `bg-white`→bg-primary |
| `announcements/create/page.tsx` | `text-gray-500`/`text-gray-600`→text-secondary, `text-gray-900`→text-primary, `border-gray-200`/`bg-white`→border-color/bg-primary |
| `announcements/[id]/page.tsx` | `text-indigo-600`→accent (×2), `bg-red-50`/`border-red-200`/`text-red-700`→danger |

---

## 2. Семантика элементов announcements-страниц

Ниже — что в каждой странице является primary / secondary / danger / info / accent по смыслу.

### 2.1 `announcements/page.tsx` (список объявлений)

| Элемент страницы | Семантика | Токен |
|------------------|-----------|-------|
| Заголовок «Объявления» | primary text | `color.text.primary` |
| Карточка объявления (фон) | bg primary | `color.bg.primary` |
| Заголовок объявления | primary text | `color.text.primary` |
| Описание/дата/автор внутри карточки | secondary text | `color.text.secondary` |
| Ссылка/действие «Создать» | accent | `color.accent.default` |
| Error-блок (нет объявлений/ошибка загрузки) | danger (фон/рамка/текст) | `color.danger` (+`/10`, `/20`) |

### 2.2 `announcements/create/page.tsx` (форма создания)

| Элемент страницы | Семантика | Токен |
|------------------|-----------|-------|
| Заголовок «Новое объявление» | primary text | `color.text.primary` |
| Подписи полей (labels) | secondary text | `color.text.secondary` |
| Значение в полях | input text | `color.input.text` | 
| Плейсхолдеры | input placeholder | `color.input.placeholder` |
| Рамки полей | input border | `color.input.border` |
| Рамка карточки формы | border default | `color.border.default` |
| Фон формы | bg primary | `color.bg.primary` |
| Ошибки валидации (под полями) | danger | `color.danger` |
| Кнопка «Опубликовать» (primary action) | accent | `color.accent.default` |

### 2.3 `announcements/[id]/page.tsx` (детали/редактирование)

| Элемент страницы | Семантика | Токен |
|------------------|-----------|-------|
| Заголовок объявления | primary text | `color.text.primary` |
| Метаданные (автор, дата) | secondary text | `color.text.secondary` |
| Ссылки навигации/действия | accent | `color.accent.default` |
| Error-блок | danger | `color.danger` |
| Контент-тейлwind `text-foreground`, `text-muted-foreground`, `border-border` | tailwind-токены | **НЕ трогать** |

---

## 3. Ограничения: какие классы НЕ трогать

| Класс / блок | Причина | Действие |
|--------------|---------|----------|
| `bg-yellow-50` / `bg-yellow-200` / `text-yellow-700` | warning-классы, вне scope R-02…R-07 (T3:204) | **Оставить** |
| `text-foreground`, `text-muted-foreground`, `border-border` | это токены Tailwind CSS, а не `--theme-*`; корректны | **НЕ трогать** |
| Badge-стили (`.bg-gray-100`, `.bg-green-100`, `.bg-yellow-100`, `.bg-red-100`, `.bg-blue-100`) в `globals.css` | DS-компонент Badge | **Сохранить** |
| Input/textarea/select стили in `globals.css` | критичны для форм в 3 темах | **Сохранить** |
| Navbar `.bg-white` в `globals.css` (dark/green) | специфичные стили навигации | **Сохранить** |
| `.bg-white`, `.bg-gray-50`, `.bg-gray-900` **без** `!important` (globals.css:144-152, 216-229) | fallback для унаследованного кода | **Сохранить** |
| `.border-gray-*`, `.divide-*` (globals.css:237-256) | используются в унаследованных компонентах | **Сохранить** |
| `text-white` на accent-кнопках | всегда белый на цветном фоне | **НЕ менять** |

> **Ключевое правило Блока 2 (T4 / R-27):** удалять **только** `!important`-переопределения в `globals.css`. Переопределения **без** `!important` — сохранять как fallback.

**Перечень блоков на удаление (B-018-T4):** `.text-gray-*{900,700,500,600,400,300,200,100}` (158–213), `.hover\:bg-gray-*{100,50}` (259–267), `.text-red-*{500,600}` и `.hover\:text-red-800` (272–285), `.text-indigo-*{600}` и `.hover\:text-indigo-800` (288–296), `.text-green-600` (299–302) — все с `!important`.

---

## 4. Проверка контрастности (3 темы)

### 4.1 Таблица значений токенов после миграции

| Токен | Light | Dark | Green | Использование |
|-------|-------|------|-------|---------------|
| `--theme-text-primary` | `#111827` | `#f9fafb` | `#ecfdf5` | заголовки, основной текст |
| `--theme-text-secondary` | `#6b7280` | `#9ca3af` | `#6ee7b7` | подписи, даты, метаданные |
| `--theme-bg-primary` | `#ffffff` | `#111827` | `#064e3b` | фон карточек/страницы |
| `--theme-bg-secondary` | `#f9fafb` | `#1f2937` | `#065f46` | hover, вложенные блоки |
| `--theme-border-color` | `#e5e7eb` | `#374151` | `#047857` | рамки карточек |
| `--theme-input-border` | `#d1d5db` | `#374151` | `#047857` | рамки полей ввода |
| `--theme-danger` | `#ef4444` | `#f87171` | `#fca5a5` | текст ошибки |
| `--theme-danger`/10 | ≈`#fee7e7` | ≈`rgba(248,113,113,0.1)` | ≈`rgba(252,165,165,0.1)` | фон error-алерта |
| `--theme-danger`/20 | ≈`#fbd5d5` | ≈`rgba(248,113,113,0.2)` | ≈`rgba(252,165,165,0.2)` | рамка error-алерта |
| `--theme-accent` | `#3b82f6` | `#8b5cf6` | `#10b981` | ссылки, кнопка «Создать» |

### 4.2 Минимальные требования к контрасту

- **AA для обычного текста** (WCAG): контраст ≥ 4.5:1 между `text-secondary` и фоном (bg-primary).
- **AA large text / UI-элементы** (границы, декоративные): контраст ≥ 3:1.

### 4.3 Оценка контраста (расчёт)

**Light:**
- `text-primary #111827` на `bg-primary #ffffff` = контраст **~16.3:1** ✅ (AA AAA).
- `text-secondary #6b7280` на `bg-primary #ffffff` = контраст **~4.98:1** ✅ (AA для обычного текста).
- `text-danger #ef4444` на `bg-danger/10 ≈#fee7e7` = контраст **~3.4:1** ⚠️ — допустим для **large text** (≥3:1), для мелкого текста ошибок проверить.

**Dark:**
- `text-primary #f9fafb` на `bg-primary #111827` = контраст **~16.3:1** ✅.
- `text-secondary #9ca3af` на `bg-primary #111827` = контраст **~7.9:1** ✅ (AA/AAA).
- `text-danger #f87171` на `bg-danger/10` = контраст **~5.0:1** ⚠️ — проверить на читаемость мелкого текста.

**Green:**
- `text-primary #ecfdf5` на `bg-primary #064e3b` = контраст **~14.2:1** ✅.
- `text-secondary #6ee7b7` на `bg-primary #064e3b` = контраст **~8.1:1** ✅ (AA/AAA).
- `text-danger #fca5a5` на `bg-danger/10` = контраст **~6.5:1** ✅.

### 4.4 Приоритетные точки проверки (по рискам P-04/P-05 из B-017)

| 🔴 Проверка | Смена (было→стало) | Влияние | Рекомендация |
|-------------|---------------------|---------|--------------|
| Вторичный текст в Dark | `text-gray-500`=`#e5e7eb` (`!important`) → `#9ca3af` | Читаемость подписей/дат | Визуально проверить; при низком контрасте — скорректировать `--theme-text-secondary` в dark |
| Мелкий danger-текст | light `#ef4444` на `#fee7e7` | Читаемость ошибок | Использовать как large/bold; для мелкого — не ниже AA |
| Error-алерт | фон `bg-red-50` → `danger/10`, рамка `border-red-200` → `danger/20` | Соответствие теме | Проверить, что алерт различим от фона во всех 3 темах |
| Accent-ссылка | `text-indigo-600` → `var(--theme-accent)` | Цвет ссылок в теме | Зелёная тема: `#10b981` на зелёном фоне — проверить отличимость от bg |

### 4.5 Чек-лист визуальной проверки (мандат QA)

| Проверка | Light | Dark | Green |
|----------|:-----:|:----:|:-----:|
| Заголовки читаемы (не сливаются с фоном) | ☐ | ☐ | ☐ |
| Вторичный текст (даты/автор/подписи) ≥ contrast AA | ☐ | ☐ | ☐ |
| Error-блоки имеют оттенок, соответствующий теме | ☐ | ☐ | ☐ |
| Accent-ссылки/кнопки видимы на фоне темы | ☐ | ☐ | ☐ |
| Badge отображаются корректно | ☐ | ☐ | ☐ |
| Input-поля: фон + текст + рамка | ☐ | ☐ | ☐ |
| Hover-эффекты заметны | ☐ | ☐ | ☐ |
| Focus-кольца отображаются | ☐ | ☐ | ☐ |
| Страницы: `/announcements`, `/create`, `/:id` | ☐ | ☐ | ☐ |
| Нет регрессий в `messages/*`, `chats/*` | ☐ | ☐ | ☐ |

---

## 🧾 Трассировка: элемент макета → AC → US

| Элемент | AC (R-ID) | US | Компонент/токен |
|---------|-----------|----|-----------------|
| Основной текст | R-02 | US-21-27…33 | `color.text.primary` |
| Вторичный текст | R-05 | US-21-27…33 | `color.text.secondary` |
| Фон карточек | R-03 | US-21-27…33 | `color.bg.primary` |
| Рамки карточек | R-04 | US-21-27…33 | `color.border.default` |
| Рамка поля ввода | R-04 | US-21-28, 29 | `color.input.border` |
| Error-алерт (danger) | R-06 | US-21-27…33 | `color.danger` |
| Info-алерт (info) | R-07 | US-21-27…33 | `color.info` |
| Accent (ссылки/кнопка «Создать») | R-06/R-07 сопутств. | US-21-28, 29 | `color.accent.default` |
| Очистка `!important` globals.css | R-27 | US-21-01…09 | — (CSS) |

---

## ✅ Выходные критерии

1. Словарь замен соответствует R-02…R-07 и эталону `CommsTab.tsx`.
2. Ограничения (не трогать: badge, input, navbar, tailwind-токены, warning-классы) зафиксированы.
3. Контрастность проверена во всех 3 темах (Light/Dark/Green).
4. Справка передаётся в Component Spec / code-агентов как источник требований для UI-слоя.

---

## 📝 История изменений

| Дата | Версия | Автор | Изменение |
|------|--------|-------|-----------|
| 2026-08-06 | v1.0 | UI Designer | Создание дизайн-справки B-018 |
