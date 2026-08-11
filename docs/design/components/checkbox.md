# Checkbox

> **Назначение:** Чекбокс с label.
> **Статус:** `[ACTIVE]`
> **Файл:** `src/components/ui/Checkbox/Checkbox.tsx`

---

## Props

| Prop | Тип | По умолчанию | Описание |
|------|-----|-------------|----------|
| `label` | `string` | — | Текст рядом с чекбоксом |
| `error` | `string` | — | Сообщение об ошибке |
| `id` | `string` | — | ID |
| `className` | `string` | — | CSS-классы |

---

## Стили

| Элемент | Токен |
|---------|-------|
| Граница | `color.input.border` |
| Акцент (checked) | `color.accent.default` |
| Label | `text.body-sm` + `color.text.primary` |

---

## ⚠️ Текущая проблема

- `border-gray-300` вместо `var(--theme-input-border)`
- `text-indigo-600` вместо `var(--theme-accent)`
- `text-gray-900` вместо `var(--theme-text-primary)`

---

## Миграция

Заменить хардкод-классы на CSS-переменные.

---

## 🔗 Связанные артефакты

- 📋 **Цвета:** [`tokens/colors.md`](../tokens/colors.md)
- 📋 **Типографика:** [`tokens/typography.md`](../tokens/typography.md)
