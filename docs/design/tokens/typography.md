# Типографические токены

> **Назначение:** Размеры шрифтов, жирность, межстрочный интервал.
> **Статус:** `[ACTIVE]`

---

## 1. Заголовки

| Токен | Размер | Weight | Line-height | Использование | Пример |
|-------|--------|--------|-------------|---------------|--------|
| `text.heading-1` | 2.25rem (36px) | 700 | 1.2 | Заголовок страницы | `# Заголовок` |
| `text.heading-2` | 1.875rem (30px) | 700 | 1.25 | Заголовок секции | `## Секция` |
| `text.heading-3` | 1.5rem (24px) | 600 | 1.3 | Заголовок карточки | `### Карточка` |
| `text.heading-4` | 1.25rem (20px) | 600 | 1.4 | Заголовок секции в карточке | `#### Подсекция` |

---

## 2. Основной текст

| Токен | Размер | Weight | Line-height | Использование | Пример |
|-------|--------|--------|-------------|---------------|--------|
| `text.body-lg` | 1.125rem (18px) | 400 | 1.5 | Основной текст (крупный) | Описание, абзацы |
| `text.body` | 1rem (16px) | 400 | 1.5 | Основной текст | Текст по умолчанию |
| `text.body-sm` | 0.875rem (14px) | 400 | 1.4 | Вторичный текст | Подписи, метаданные |
| `text.body-xs` | 0.75rem (12px) | 400 | 1.33 | Мелкий текст | Временные метки, водяные знаки |

---

## 3. Элементы интерфейса

| Токен | Размер | Weight | Line-height | Использование | Пример |
|-------|--------|--------|-------------|---------------|--------|
| `text.label` | 0.875rem (14px) | 500 | 1.25 | Label форм | `<label>` |
| `text.button` | 0.875rem (14px) | 500 | 1 | Текст кнопок | `<button>` |
| `text.caption` | 0.75rem (12px) | 400 | 1.33 | Подсказки, help text | Подсказка в форме |
| `text.overline` | 0.625rem (10px) | 600 | 1 | Заголовки секций (uppercase) | "Скоро" на карточке |

---

## 4. Использование

### В макетах

```markdown
| Элемент | Токен |
|---------|-------|
| Заголовок | `text.heading-1` |
| Текст карточки | `text.body` |
| Подпись | `text.body-sm` |
| Кнопка | `text.button` |
| Label | `text.label` |
```

### В Tailwind

| Токен | Tailwind-классы |
|-------|-----------------|
| `text.heading-1` | `text-3xl font-bold leading-tight` |
| `text.heading-2` | `text-2xl font-bold leading-snug` |
| `text.heading-3` | `text-xl font-semibold leading-normal` |
| `text.heading-4` | `text-lg font-semibold leading-normal` |
| `text.body-lg` | `text-lg leading-normal` |
| `text.body` | `text-base leading-normal` |
| `text.body-sm` | `text-sm leading-normal` |
| `text.body-xs` | `text-xs leading-tight` |
| `text.label` | `text-sm font-medium leading-snug` |
| `text.button` | `text-sm font-medium` |
| `text.caption` | `text-xs leading-tight` |
| `text.overline` | `text-[10px] font-semibold uppercase` |

---

## 🔗 Связанные артефакты

- 📋 **Цвета:** [`colors.md`](colors.md)
- 📋 **Отступы:** [`spacing.md`](spacing.md)
