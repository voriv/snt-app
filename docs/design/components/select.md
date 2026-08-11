# Select

> **Назначение:** Выпадающий список с поддержкой label и ошибок.
> **Статус:** `[ACTIVE]`
> **Файл:** `src/components/ui/Select/Select.tsx`

---

## Props

| Prop | Тип | По умолчанию | Описание |
|------|-----|-------------|----------|
| `label` | `string` | — | Label над полем |
| `error` | `string` | — | Сообщение об ошибке |
| `children` | `ReactNode` | — | `<option>` элементы |
| `id` | `string` | — | ID |
| `className` | `string` | — | CSS-классы |

---

## Стили

| Элемент | Токен |
|---------|-------|
| Фон | `color.input.bg` |
| Текст | `color.input.text` |
| Граница | `color.input.border` |
| Граница (focus) | `color.input.focus` |
| Граница (error) | `color.danger` |
| Label | `text.label` + `color.text.primary` |
| Error | `color.danger` |

---

## Состояния

| State | Граница | Текст |
|-------|---------|-------|
| Default | `color.input.border` | `color.input.text` |
| Focus | `color.input.focus` | `color.input.text` |
| Error | `color.danger` | `color.input.text` |

---

## ⚠️ Текущая проблема

- `text-gray-700` вместо `var(--theme-text-primary)`
- `border-gray-300` вместо `var(--theme-input-border)`
- `focus:border-indigo-500` вместо `var(--theme-accent)`
- `text-red-600` вместо `var(--theme-danger)`

---

## Миграция

Заменить все хардкод-классы на CSS-переменные.

---

## 🔗 Связанные артефакты

- 📋 **Цвета:** [`tokens/colors.md`](../tokens/colors.md)
- 📋 **Radius:** [`tokens/radius.md`](../tokens/radius.md)
