# Button

> **Назначение:** Базовый компонент кнопки для всех действий: submit, delete, edit и т.д.
> **Статус:** `[ACTIVE]`
> **Файл:** `src/components/ui/Button/Button.tsx`

---

## Props

| Prop | Тип | По умолчанию | Описание |
|------|-----|-------------|----------|
| `variant` | `'primary' \| 'secondary' \| 'danger' \| 'ghost'` | `'primary'` | Стиль кнопки |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Размер |
| `isLoading` | `boolean` | `false` | Показывает спиннер |
| `className` | `string` | — | Дополнительные CSS-классы |
| `disabled` | `boolean` | `false` | Отключает кнопку |

---

## Варианты

| Variant | Фон | Текст | Граница | Hover |
|---------|-----|-------|---------|-------|
| primary | `color.accent.default` | white | — | opacity-90 |
| secondary | transparent | `color.text.primary` | `color.border.default` | `color.bg.secondary` |
| danger | `color.danger` | white | — | opacity-90 |
| ghost | transparent | `color.text.primary` | — | `color.bg.secondary` |

---

## Размеры

| Size | Height | Padding X | Font |
|------|--------|-----------|------|
| sm | 32px | 12px | text.body-sm |
| md | 40px | 16px | text.body-sm |
| lg | 48px | 24px | text.body |

---

## Состояния

| State | Эффект |
|-------|--------|
| Hover | cursor-pointer + variant-specific hover |
| Disabled | opacity-50, cursor-not-allowed |
| Focus | focus-ring-2 + focus-ring-accent |
| Loading | children скрыты, показан спиннер |

---

## ⚠️ Текущая проблема

Использует хардкод Tailwind-классов:
- `bg-indigo-600` вместо `var(--theme-accent)`
- `text-gray-700` вместо `var(--theme-text-primary)`
- `hover:bg-indigo-700` вместо CSS transition

**Не работает с темами dark и green.**

---

## Миграция

Заменить в `Button.tsx`:
- `bg-indigo-600` → `bg-[var(--theme-accent)]`
- `hover:bg-indigo-700` → `hover:opacity-90`
- `text-gray-700` → `text-[var(--theme-text-primary)]`
- `border-gray-300` → `border-[var(--theme-border-color)]`
- `hover:bg-gray-50` → `hover:bg-[var(--theme-bg-secondary)]`
- `bg-red-600` → `bg-[var(--theme-danger)]`
- `hover:bg-red-700` → `hover:opacity-90`
- `focus:ring-indigo-500` → `focus:ring-[var(--theme-accent)]`
- `focus:ring-red-500` → `focus:ring-[var(--theme-danger)]`
- `focus:ring-gray-500` → `focus:ring-[var(--theme-accent)]`

---

## 🔗 Связанные артефакты

- 📋 **Цвета:** [`tokens/colors.md`](../tokens/colors.md)
- 📋 **Типографика:** [`tokens/typography.md`](../tokens/typography.md)
- 📋 **Отступы:** [`tokens/spacing.md`](../tokens/spacing.md)
- 📋 **Radius:** [`tokens/radius.md`](../tokens/radius.md)
