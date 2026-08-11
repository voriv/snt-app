# EmptyState

> **Назначение:** Компонент для отображения пустого состояния списков и форм.
> **Статус:** `[ACTIVE]`
> **Файл:** `src/components/ui/EmptyState/EmptyState.tsx`

---

## Props

| Prop | Тип | По умолчанию | Описание |
|------|-----|-------------|----------|
| `title` | `string` | — | Заголовок |
| `description` | `string` | — | Описание |
| `icon` | `ReactNode` | default icon | Кастомная иконка |

---

## Стили

| Элемент | Токен |
|---------|-------|
| Фон иконки | `color.bg.secondary` |
| Иконка | `color.text.secondary` |
| Заголовок | `text.heading-4` + `color.text.primary` |
| Описание | `text.body-sm` + `color.text.secondary` |
| Border-radius (иконка) | `radius-full` |
| Padding | `space-12` vertical |

---

## ⚠️ Текущая проблема

- `bg-gray-100` вместо `var(--theme-bg-secondary)`
- `text-gray-400` вместо `var(--theme-text-secondary)`
- `text-gray-900` вместо `var(--theme-text-primary)`
- `text-gray-500` вместо `var(--theme-text-secondary)`

---

## Миграция

Заменить хардкод-классы на CSS-переменные.

---

## 🔗 Связанные артефакты

- 📋 **Цвета:** [`tokens/colors.md`](../tokens/colors.md)
- 📋 **Типографика:** [`tokens/typography.md`](../tokens/typography.md)
- 📋 **Radius:** [`tokens/radius.md`](../tokens/radius.md)
- 📋 **Отступы:** [`tokens/spacing.md`](../tokens/spacing.md)
