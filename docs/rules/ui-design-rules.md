# 🎨 Правила работы UI Designer

> **Назначение:** Правила и конвенции для режима `ui-designer`
> **Статус:** `[ACTIVE]`

---

## 1. Общие принципы

| Принцип | Описание |
|---------|----------|
| **Токены — один источник правды** | Все цвета, размеры, шрифты — через токены |
| **Существующие компоненты** | Используй компоненты из `docs/design/components/` |
| **Ссылка на AC** | Каждый элемент макета ссылается на Acceptance Criteria |
| **Все состояния** | Loading, Error, Empty, Data — обязательные |
| **Тема-агностичность** | Макет работает во всех 3 темах |

---

## 2. Использование токенов

### 2.1 Обязательные правила

| Правило | Описание |
|---------|----------|
| **Цвета только через токены** | `color.text.primary`, а не `#111827` |
| **Размеры через токены** | `space-4`, а не `16px` |
| **Шрифты через токены** | `text.heading-1`, а не `2.25rem font-bold` |
| **Radius через токены** | `radius-md`, а не `8px` |
| **Тени через токены** | `shadow-sm`, а не `0 1px 2px...` |

### 2.2 Где искать токены

| Токен | Файл |
|-------|------|
| `color.*` | [`docs/design/tokens/colors.md`](../design/tokens/colors.md) |
| `text.*` | [`docs/design/tokens/typography.md`](../design/tokens/typography.md) |
| `space-*` | [`docs/design/tokens/spacing.md`](../design/tokens/spacing.md) |
| `radius-*` | [`docs/design/tokens/radius.md`](../design/tokens/radius.md) |
| `shadow-*` | [`docs/design/tokens/shadows.md`](../design/tokens/shadows.md) |

---

## 3. Формат макетов

### 3.1 ASCII/Text макет (простые экраны)

**Используй когда:**
- Форма с ≤5 полями
- Таблица с ≤5 колонками
- Список карточек
- Страница деталей (без сложного layout)

**Формат:** `docs/design/layouts/{feature}/layout.md`

```markdown
## Экран: {Название}
```ascii
┌─────────────────────────────────────┐
│ ...                                 │
└─────────────────────────────────────┘
```

### Компоненты и токены
| Элемент | Компонент | Токен | Состояния |
|---------|-----------|-------|-----------|
| ... | ... | ... | ... |

### Состояния
| Состояние | Поведение |
|-----------|-----------|
| Loading | ... |
| Error | ... |
| Empty | ... |
| Data | Макет выше |
```

### 3.2 HTML/CSS прототип (сложные экраны)

**Используй когда:**
- >5 состояний компонента
- Анимации или transitions
- Адаптивность (mobile/tablet/desktop)
- Нестандартный layout
- Новый паттерн (не в `docs/design/patterns/`)

**Формат:** `docs/prototypes/{feature}/index.html`

Используй шаблон: [`docs/templates/prototype-template.html`](../templates/prototype-template.html)

---

## 4. Компоненты

### 4.1 Существующие UI-компоненты

| Компонент | Файл spec | Описание |
|-----------|-----------|----------|
| Button | [`docs/design/components/button.md`](../design/components/button.md) | Кнопка |
| Input | [`docs/design/components/input.md`](../design/components/input.md) | Поле ввода |
| Card | [`docs/design/components/card.md`](../design/components/card.md) | Карточка |
| Badge | [`docs/design/components/badge.md`](../design/components/badge.md) | Бейдж |
| Select | [`docs/design/components/select.md`](../design/components/select.md) | Выпадающий список |
| Checkbox | [`docs/design/components/checkbox.md`](../design/components/checkbox.md) | Чекбокс |
| ConfirmDialog | [`docs/design/components/dialog.md`](../design/components/dialog.md) | Диалог подтверждения |
| EmptyState | [`docs/design/components/empty-state.md`](../design/components/empty-state.md) | Пустое состояние |
| ErrorMessage | [`docs/design/components/error-message.md`](../design/components/error-message.md) | Сообщение об ошибке |

### 4.2 Паттерны страниц

| Паттерн | Файл | Описание |
|---------|------|----------|
| List | [`docs/design/patterns/list-page.md`](../design/patterns/list-page.md) | Страница со списком |
| Detail | [`docs/design/patterns/detail-page.md`](../design/patterns/detail-page.md) | Страница деталей |
| Form | [`docs/design/patterns/form-page.md`](../design/patterns/form-page.md) | Страница с формой |

### 4.3 Когда компонента нет

Если нужен компонент, которого нет в списке:
1. Опиши его в макете (ASCII или HTML/CSS)
2. Укажи в spec: `TODO: Создать компонент {Name}`
3. Component Spec создаст spec для нового компонента

---

## 5. Состояния

### 5.1 Обязательные состояния

| Состояние | Когда | Компонент |
|-----------|-------|-----------|
| **Loading** | Данные загружаются | Скелетон (pulsing блоки) |
| **Error** | Ошибка загрузки | `<ErrorMessage>` + кнопка "Повторить" |
| **Empty** | Нет данных | `<EmptyState>` с описанием и CTA |
| **Data** | Данные загружены | Основной макет |

### 5.2 Опциональные состояния

| Состояние | Когда |
|-----------|-------|
| Hover | Для интерактивных элементов (кнопки, карточки) |
| Focus | Для form-элементов |
| Disabled | Для заблокированных элементов |
| Active | Для активного состояния (выбранная вкладка) |

---

## 6. Трассировка

### 6.1 Обязательные ссылки

Каждый элемент макета должен ссылаться на AC:

```markdown
<!-- AC-01: Пользователь видит кадастровый номер -->
```

или

```markdown
| Элемент | AC | US |
|---------|-----|-----|
| Кадастровый номер | AC-01 | US-12 |
```

### 6.2 Формат файла

**ASCII/Text:** `docs/design/layouts/{feature}/layout.md`
**HTML/CSS:** `docs/prototypes/{feature}/index.html`

---

## 7. Проверка перед отправкой

### 7.1 Чек-лист

- [ ] Все цвета — через токены `color.*`
- [ ] Все размеры — через токены `space-*`, `text.*`, `radius-*`
- [ ] Используются существующие компоненты из `docs/design/components/`
- [ ] Все 4 состояния описаны (Loading, Error, Empty, Data)
- [ ] Каждый элемент ссылается на AC
- [ ] Если HTML/CSS — проверь все 3 темы через переключатель
- [ ] Соответствует шаблону из `docs/templates/`

### 7.2 Что НЕ должен делать UI Designer

| ❌ Не делать | ✅ Вместо этого |
|-------------|-----------------|
| Хардкодить цвета (`#111827`) | Использовать токены (`color.text.primary`) |
| Создавать новые UI-компоненты | Использовать существующие из `docs/design/components/` |
| Описывать бизнес-логику | Только визуальное представление |
| Менять spec от Component Spec | Только создавать layout.md |

---

## 🔗 Связанные артефакты

- 🎨 **Токены:** [`docs/design/tokens/`](../design/tokens/)
- 🧩 **Компоненты:** [`docs/design/components/`](../design/components/)
- 📐 **Паттерны:** [`docs/design/patterns/`](../design/patterns/)
- 📋 **Шаблоны:** [`docs/templates/`](../templates/)
- 📋 **План реализации:** [`plans/ui-design-system-plan.md`](../../plans/ui-design-system-plan.md)
