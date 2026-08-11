# B-023 Layout Review: Sticky-низ контрола ввода сообщений

> **Тип:** Bug fix — layout review
> **Дата:** 2026-07-28
> **Версия:** v1.0
> **Автор:** UI Designer
> **Статус:** Готов к утверждению

---

## 1. Проверка layout-стратегии (flex-цепочка AppLayout → main → page)

### 1.1 Текущее состояние AppLayout

```tsx
// src/components/layouts/AppLayout.tsx:82-99
<div className="min-h-screen bg-gray-50">        {/* ← НЕТ flex, НЕТ dvh */}
  <Navbar ... />                                    {/* h-16 = 64px */}
  <div className="flex">                            {/* flex-row */}
    <Sidebar />                                      {/* hidden md:block w-60 flex-shrink-0 */}
    <div className="flex-1 min-w-0">
      <Breadcrumbs />
      <main className="py-6">                        {/* ← НЕТ flex-1, НЕТ min-h-0 */}
        {children}
      </main>
    </div>
  </div>
</div>
```

**Проблемы текущей структуры:**

| Проблема | Строка | Описание |
|----------|--------|----------|
| `min-h-screen` | 82 | Позволяет контенту расти выше viewport, дети не могут использовать `h-full` |
| Нет `flex flex-col` | 82 | Flex-цепочка не работает, `flex-1` на детях не срабатывает |
| `<main>` без `flex-1` | 94 | Страницы внутри `<main>` не могут наследовать оставшуюся высоту |
| Нет `min-h-0` | 82, 90, 94 | Flex-дети могут переполнять контейнер (Firefox особенно чувствителен) |

### 1.2 Предлагаемая структура (из плана T1-2)

```tsx
<div className="h-[100dvh] bg-gray-50 flex flex-col">   {/* dvh + flex-col */}
  <Navbar ... />                                           {/* h-16 = 64px */}
  <div className="flex flex-1 min-h-0">                    {/* flex-1 + min-h-0 */}
    <Sidebar />                                            {/* hidden md:block w-60 flex-shrink-0 */}
    <div className="flex-1 min-w-0 flex flex-col">         {/* +flex flex-col */}
      <Breadcrumbs />
      <main className="flex-1 min-h-0 py-6">               {/* +flex-1 + min-h-0 */}
        {children}                                          {/* h-full работает */}
      </main>
    </div>
  </div>
</div>
```

### 1.3 Вердикт по стратегии

✅ **Стратегия корректна.** Flex-цепочка `h-[100dvh] → flex flex-col → flex-1 → flex flex-col → flex-1` гарантирует, что:

1. Корневой контейнер занимает ровно 100dvh viewport
2. Navbar занимает свою естественную высоту (64px)
3. Оставшееся пространство распределяется через `flex-1`
4. `<main>` занимает всё доступное место под Navbar + Breadcrumbs
5. Страницы с `h-full` наследуют правильную высоту
6. `min-h-0` предотвращает переполнение flex-детей

**Замечание:** Предлагаю заменить `h-[100dvh]` на кастомный класс `.h-dvh-full` (см. раздел 2) для правильного fallback.

---

## 2. dvh fallback — рекомендация

### 2.1 Проверка поддержки браузерами

Проект использует:
- **Next.js 15** (требует Node 18+, современные браузеры)
- **Tailwind CSS 3.4**
- **React 19**
- **No browserslist** в `package.json`

| Браузер | dvh поддержка | Версия |
|---------|---------------|--------|
| Chrome | ✅ с 108+ (Nov 2022) | ~3 года стабильности |
| Safari | ✅ с 15.4+ (Mar 2022) | iOS 15.4+ |
| Firefox | ✅ с 107+ (Nov 2022) | |
| Edge | ✅ с 108+ (Nov 2022) | |
| Samsung Internet | ✅ с 21+ | |
| Opera | ✅ с 94+ | |

**Вывод:** dvh поддерживается всеми современными браузерами с конца 2022 года. Однако:
- Пользователи с iOS <15.4 (~3% всех iOS-устройств в РФ) не получат dvh
- Некоторые WebView (встроенные браузеры) могут не поддерживать dvh
- `100vh` сам по себе проблемен на iOS Safari (адресная строка)

### 2.2 Варианты реализации

#### Вариант A: `.h-dvh-full` кастомный класс в globals.css (РЕКОМЕНДУЕТСЯ)

```css
/* globals.css — добавить в :root или на уровне utilities */
@layer utilities {
  .h-dvh-full {
    height: 100vh;      /* fallback для старых браузеров */
    height: 100dvh;     /* dynamic viewport height */
  }
}
```

**Плюсы:**
- Правильный CSS cascade: старые браузеры используют `100vh`, современные переопределяют через `100dvh`
- Многоразовый класс — можно использовать в других местах
- Нет inline-стилей, лучше для SSR и hydration
- Можно комбинировать с другими Tailwind-классами

**Минусы:**
- Требует добавления в globals.css

#### Вариант B: Inline style (предложен в валидации)

```tsx
<div style={{ height: '100vh', height: '100dvh' }} className="bg-gray-50 flex flex-col">
```

**Плюсы:**
- Не требует изменений в CSS
- Локальное решение

**Минусы:**
- ❌ `100vh` будет переопределён `100dvh` только в современных браузерах (то же самое)
- ❌ Inline-стили сложнее поддерживать
- ❌ Next.js может issue hydration mismatch из-за SSR
- ❌ Невозможно переиспользовать

#### Вариант C: Tailwind arbitrary `h-[100dvh]` (из плана)

```tsx
<div className="h-[100dvh] bg-gray-50 flex flex-col">
```

**Плюсы:**
- Простота

**Минусы:**
- ❌ **НЕТ fallback** — старые браузеры просто проигнорируют `height` целиком
- ❌ `h-[100dvh]` компилируется в `height: 100dvh` без `100vh` перед ним

### 2.3 Вердикт по dvh

✅ **Рекомендуется Вариант A: кастомный класс `.h-dvh-full`**

Использование:
```tsx
// AppLayout.tsx
<div className="h-dvh-full bg-gray-50 flex flex-col">
```

```css
// globals.css — @layer utilities секция (после line 422)
@layer utilities {
  .h-dvh-full {
    height: 100vh;
    height: 100dvh;
  }
}
```

---

## 3. `--navbar-height` — значение и место определения

### 3.1 Реальная высота Navbar

Проверка [`Navbar.tsx:92`](../../src/components/layouts/Navbar.tsx:92):

```tsx
<div className="flex justify-between h-16">
```

`h-16` в Tailwind = `4rem` = **64px**. Высота не меняется в зависимости от темы (нет темо-зависимых классов размера).

**Подтверждение:** `--navbar-height: 64px` ✅

### 3.2 Место определения

```css
/* globals.css — в :root секцию (после line 10, до data-theme блоков) */
:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
  --navbar-height: 64px;     /* ← добавить */
  color-scheme: light;
}
```

---

## 4. overflow-anchor — проверка

### 4.1 Tailwind arbitrary property

`[overflow-anchor:none]` в Tailwind v3 компилируется в CSS-свойство `overflow-anchor: none`.

Поддержка `overflow-anchor`:
| Chrome | 56+ ✅ |
|--------|-------|
| Firefox | 66+ ✅ |
| Safari | ❌ НЕ ПОДДЕРЖИВАЕТ |
| Edge | 56+ ✅ |

### 4.2 Safari concern

Safari не поддерживает `overflow-anchor`, но это не вызывает ошибок — свойство просто игнорируется. Для Safari IntersectionObserver (который уже реализован) является достаточным механизмом для контроля скролла при пагинации.

✅ **Рекомендуется:** Использовать оба подхода для максимальной совместимости:

```tsx
<div
  ref={scrollContainerRef}
  className={cn(
    'flex-1 overflow-y-auto px-4 py-6',
    'scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600',
    'scrollbar-track-transparent',
    '[overflow-anchor:none]'               // Tailwind arbitrary
  )}
  style={{ overflowAnchor: 'none' as any }}  // Inline для SSR/гидрации
>
```

---

## 5. WARNING-2: дублирование T2-2 / T5-1

### 5.1 Анализ

| Задача | Файл | Что делает |
|--------|------|------------|
| **T2-2** | `ConversationDetailPage.tsx` | Добавляет `flex-shrink-0` на обёртку MessageInput |
| **T5-1** | `MessageInput.tsx` | Добавляет `flex-shrink-0` в корневой div компонента |

T5-1 решает проблему на **обоих** экранах сразу (личный диалог + групповой чат), так как:
- ConversationDetailPage уже рендерит MessageInput
- chats/[chatId]/page.tsx тоже рендерит MessageInput напрямую

✅ **Принять WARNING-2: Исключить T2-2. Оставить только T5-1.**

---

## 6. Адаптивность — влияние flex-цепочки

### 6.1 Sidebar ([`Sidebar.tsx:107`](../../src/components/layouts/Sidebar.tsx:107))

```tsx
className="hidden md:block w-60 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto p-4"
```

- `hidden md:block` — скрыт на мобильных, показан на desktop
- `flex-shrink-0` — не сжимается в flex-контейнере
- `overflow-y-auto` — внутренний скролл при переполнении

**Влияние flex-цепочки:** Никакого. Sidebar остаётся в flex-row, его поведение не меняется. ✅

### 6.2 MobileDrawer ([`MobileDrawer.tsx`](../../src/components/layouts/MobileDrawer.tsx:65))

- Рендерится внутри Navbar (вне основного flex-потока)
- Использует `position: fixed` с overlay
- Не зависит от flex-цепочки AppLayout

**Влияние flex-цепочки:** Никакого. MobileDrawer — абсолютно спозиционированный overlay. ✅

### 6.3 Mobile viewport

На мобильных устройствах (`<md`):
- Sidebar скрыт (`hidden`)
- MobileDrawer открывается по гамбургеру
- `<main>` занимает всю ширину (`flex-1 min-w-0`)

`dvh` на корневом контейнере критически важен для iOS Safari, где адресная строка скрывается/показывается при скролле. ✅

---

## 7. Покрытие тем

### 7.1 Анализ темо-зависимых стилей

Изменения в `AppLayout.tsx`:
- `min-h-screen` → `.h-dvh-full` — структурный класс, не темо-зависимый
- `bg-gray-50` — **ОСТАЁТСЯ**, темизируется через globals.css:115-118
- `flex flex-col` / `flex-1` / `min-h-0` — структурные классы

Текущая темизация `min-h-screen` (globals.css:115-118):
```css
[data-theme] .min-h-screen {
  background-color: var(--theme-bg-secondary);
  color: var(--theme-text-primary);
}
```

После замены на `.h-dvh-full`:
```css
[data-theme] .h-dvh-full {
  background-color: var(--theme-bg-secondary);
  color: var(--theme-text-primary);
}
```

Альтернативно, `bg-gray-50` уже темизируется:
```css
[data-theme] .bg-gray-50 {
  background-color: var(--theme-bg-secondary);
  color: var(--theme-text-primary);
}
```

✅ **Вердикт:** Никакие изменения не затрагивают 3 темы (Light/Dark/Green). Все цвета остаются через `var(--theme-*)`. ✅

**Рекомендация:** Добавить темизацию для `.h-dvh-full` по аналогии с `min-h-screen` в globals.css:

```css
[data-theme] .h-dvh-full {
  background-color: var(--theme-bg-secondary);
  color: var(--theme-text-primary);
}
```

---

## 8. Риски регрессий

### 8.1 Критичность изменений

Изменение `AppLayout.tsx` — **единственный источник риска**, так как он затрагивает ВСЕ страницы dashboard.

### 8.2 Страницы под риском

| Страница | Маршрут | Риск | Комментарий |
|----------|---------|------|-------------|
| Профиль | `/dashboard/profile` | 🟢 Низкий | Стандартный контент, min-h-0 решит переполнение |
| Пользователи | `/dashboard/users` | 🟢 Низкий | Таблица, скролл через контейнер |
| Участки | `/dashboard/plots` | 🟢 Низкий | Card layout, flex не влияет |
| Список диалогов | `/dashboard/comms/messages` | 🟢 Низкий | Список без h-screen |
| **Личный диалог** | `/dashboard/comms/messages/[id]` | 🟡 Средний | **Целевой экран** — убрать h-screen |
| **Групповой чат** | `/dashboard/comms/chats/[id]` | 🟡 Средний | **Целевой экран** — убрать calc |
| Список чатов | `/dashboard/comms/chats` | 🟢 Низкий | Список без фикс. высоты |
| Объявления | `/dashboard/comms/announcements` | 🟢 Низкий | Стандартный layout |

### 8.3 Специфичные риски

| Риск | Описание | Митигация |
|------|----------|-----------|
| **R1: `py-6` на main** | После `h-full` страницы чатов получат 24px padding сверху/снизу. `ConversationDetailPage` тоже имеет `flex flex-col h-full` — может создать двойной скролл | Убедиться, что `ConversationDetailPage` использует `h-full` от `<main>`, а не от viewport |
| **R2: Breadcrumbs без `flex-shrink-0`** | Если breadcrumbs длинные, они могут сжиматься | Добавить `flex-shrink-0` на Breadcrumbs, если нужно |
| **R3: DashboardLayout** | DashboardLayout — SSR, просто рендерит `AppLayout`, не затрагивается | Нет изменений |
| **R4: min-h-screen override** | В globals.css:115 `[data-theme] .min-h-screen` — перестанет применяться | Заменить на `[data-theme] .h-dvh-full` |

### 8.4 Smoke-тест после изменений

1. `/dashboard/profile` — отображение, скролл
2. `/dashboard/users` — таблица, пагинация
3. `/dashboard/plots` — карточки, скролл
4. `/dashboard/comms/messages` — список диалогов
5. `/dashboard/comms/messages/:id` — **MessageInput внизу** (основная проверка)
6. `/dashboard/comms/chats` — список чатов
7. `/dashboard/comms/chats/:id` — **MessageInput внизу** (основная проверка)
8. Все 3 темы (Light/Dark/Green) — визуально
9. Mobile (375px) — гамбургер, drawer, dvh

---

## 9. Рекомендованные изменения в AppLayout.tsx

```tsx
// Было (line 82-98):
<div className="min-h-screen bg-gray-50">
  <Navbar ... />
  <div className="flex">
    <Sidebar />
    <div className="flex-1 min-w-0">
      <Breadcrumbs />
      <main className="py-6">
        {children}
      </main>
    </div>
  </div>
</div>

// Стало:
<div className="h-dvh-full bg-gray-50 flex flex-col">
  <Navbar ... />
  <div className="flex flex-1 min-h-0">
    <Sidebar />
    <div className="flex-1 min-w-0 flex flex-col">
      <Breadcrumbs />
      <main className="flex-1 min-h-0 py-6">
        {children}
      </main>
    </div>
  </div>
</div>
```

---

## 10. Итоговый вердикт

### ✅ APPROVED (стратегия корректна, можно к code)

| Проверка | Статус |
|----------|--------|
| Layout-стратегия `h-full` через flex-цепочку | ✅ Корректна |
| dvh fallback | ✅ Использовать `.h-dvh-full` класс (Вариант A) |
| `--navbar-height: 64px` | ✅ Подтверждено |
| overflow-anchor | ✅ `[overflow-anchor:none]` + inline fallback |
| WARNING-2 (T2-2/T5-1) | ✅ Принято — исключить T2-2, оставить T5-1 |
| Адаптивность (sidebar/mobile) | ✅ Не затрагивается |
| Покрытие 3 тем | ✅ Не затрагивается |
| Регрессии | 🟡 Smoke test обязателен (8 страниц) |

### Ключевые корректировки плана

1. **AppLayout.tsx:** Заменить `h-[100dvh]` на `.h-dvh-full` (кастомный класс)
2. **globals.css:** Добавить `.h-dvh-full` в `@layer utilities` и `[data-theme] .h-dvh-full` для темизации
3. **T2-2:** Удалить из плана (дублирует T5-1)
4. **overflow-anchor:** Добавить inline style в дополнение к Tailwind arbitrary property

### Порядок выполнения (скорректированный)

```
T1-1 (globals.css: --navbar-height + .h-dvh-full) ──┐
                                                     ├─→ T1-2 (AppLayout restructuring)
T5-1 (MessageInput: flex-shrink-0) ──────────────────┤
                                                     ├─→ T2-1 (личный page: h-screen → h-full)
T4-1 (ConversationMessagesList: overflow-anchor) ────┤
                                                     └─→ T3-1 (групповой page: calc → h-full)
```

---

*Документ создан в рамках пайплайна B-023 (E2E Spec). После утверждения передаётся в Component Spec для детализации.*
