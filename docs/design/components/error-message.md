# ErrorMessage

> **Назначение:** Компонент для отображения сообщений об ошибках.
> **Статус:** `[ACTIVE]`
> **Файл:** `src/components/ui/ErrorMessage/ErrorMessage.tsx`

---

## Props

| Prop | Тип | По умолчанию | Описание |
|------|-----|-------------|----------|
| `message` | `string \| null` | — | Текст ошибки (null = скрыт) |
| `className` | `string` | — | CSS-классы |

---

## Стили

| Элемент | Токен |
|---------|-------|
| Фон | `color.danger` (opacity-10) |
| Текст | `color.danger` |
| Иконка | `color.danger` |
| Border-radius | `radius-sm` |
| Padding | `space-3 × space-4` |
| Font | `text.body-sm` medium |

---

## Состояния

| State | Поведение |
|-------|-----------|
| message=null | Компонент скрыт (пустой фрагмент) |
| message="..." | Отображает иконку + текст |

---

## Доступность

- `role="alert"`
- `aria-live="polite"`
- Иконка с `aria-hidden="true"`

---

## ⚠️ Текущая проблема

- `bg-red-50` вместо `color.danger` (opacity-10)
- `text-red-700` вместо `color.danger`

---

## Миграция

Заменить хардкод-классы на CSS-переменные.

---

## 🔗 Связанные артефакты

- 📋 **Цвета:** [`tokens/colors.md`](../tokens/colors.md)
- 📋 **Типографика:** [`tokens/typography.md`](../tokens/typography.md)
- 📋 **Radius:** [`tokens/radius.md`](../tokens/radius.md)
- 📋 **Отступы:** [`tokens/spacing.md`](../tokens/spacing.md)
