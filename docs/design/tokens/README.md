# 🎨 Токены дизайн-системы

> **Назначение:** Базовые значения для визуального оформления.
> **Слой:** Базовый (1 уровень). Семантический будет добавлен позже.
> **Маппинг:** Токен → CSS-переменная → Значение для каждой темы

---

## 📖 Как читать токены

Каждый токен имеет:
1. **Имя** — используется в макетах и spec'ах
2. **CSS-переменная** — используется в коде
3. **Значения по темам** — реальные цвета/размеры

### Пример

| Токен | CSS-переменная | Light | Dark | Green |
|-------|---------------|-------|------|-------|
| `color.accent.default` | `var(--theme-accent)` | `#3b82f6` | `#8b5cf6` | `#10b981` |

- **В макете:** `color.accent.default`
- **В коде:** `style={{ backgroundColor: 'var(--theme-accent)' }}`
- **Light тема:** `#3b82f6`
- **Dark тема:** `#8b5cf6`
- **Green тема:** `#10b981`

---

## 📂 Структура токенов

| Файл | Токены | Описание |
|------|--------|----------|
| [`colors.md`](colors.md) | `color.*` | Цвета (базовые + семантические) |
| [`typography.md`](typography.md) | `text.*` | Типографика (размер, weight, line-height) |
| [`spacing.md`](spacing.md) | `space-*` | Отступы |
| [`radius.md`](radius.md) | `radius-*` | Border-radius |
| [`shadows.md`](shadows.md) | `shadow-*` | Тени |

---

## 🎯 Правила использования

| Правило | Описание |
|---------|----------|
| **Не хардкодь цвета** | Используй токены `color.*` |
| **Не хардкоди размеры** | Используй токены `space-*`, `text.*`, `radius-*` |
| **Маппинг 1:1** | Один токен = одна CSS-переменная |
| **Тема-агностично** | Не пиши `#3b82f6` — пиши `color.accent.default` |

---

## 🔄 Поддержка тем

Все цветовые токены автоматически переключаются между темами через CSS-переменные.

```css
/* globals.css */
[data-theme='light'] { --theme-accent: #3b82f6; }
[data-theme='dark']  { --theme-accent: #8b5cf6; }
[data-theme='green'] { --theme-accent: #10b981; }
```

Токен `color.accent.default` автоматически примет нужное значение.

---

## 🚀 Семантический слой (TODO)

Когда порог достигнут (>15 компонентов, >5 тем или >5 фич):

| Базовый | Семантический |
|---------|---------------|
| `color.accent.default` | `color.button.primary.bg → color.accent.default` |
| `color.bg.secondary` | `color.card.header.bg → color.bg.secondary` |

---

## 🔗 Связанные артефакты

- 📁 **CSS-переменные:** [`src/app/globals.css`](../../../src/app/globals.css)
- 📋 **План реализации:** [`plans/ui-design-system-plan.md`](../../../plans/ui-design-system-plan.md)
