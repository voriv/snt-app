# Badge

> **Назначение:** Маленький бейдж для статусов, меток, ролей.
> **Статус:** `[ACTIVE]`
> **Файл:** `src/components/ui/Badge/Badge.tsx`

---

## Props

| Prop | Тип | По умолчанию | Описание |
|------|-----|-------------|----------|
| `children` | `ReactNode` | — | Содержимое |
| `variant` | `'default' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'default'` | Цветовая схема |
| `className` | `string` | — | CSS-классы |

---

## Варианты

| Variant | Фон | Текст |
|---------|-----|-------|
| default | `color.bg.secondary` | `color.text.secondary` |
| success | `color.success` (opacity-10) | `color.success` |
| warning | `color.warning` (opacity-10) | `color.warning` |
| danger | `color.danger` (opacity-10) | `color.danger` |
| info | `color.info` (opacity-10) | `color.info` |

---

## Стили

| Свойство | Значение | Токен |
|----------|----------|-------|
| Padding | 2px 10px | `space-0.5 × space-2.5` |
| Font | 12px medium | `text.caption` |
| Border-radius | 9999px | `radius-full` |

---

## ⚠️ Текущая проблема

- `bg-gray-100 text-gray-800` вместо токенов
- `bg-green-100 text-green-800` вместо `color.success`
- `bg-yellow-100 text-yellow-800` вместо `color.warning`
- `bg-red-100 text-red-800` вместо `color.danger`
- `bg-blue-100 text-blue-800` вместо `color.info`

**Полностью не работает с темами.**

---

## Миграция

Заменить все хардкод-классы на CSS-переменные через токены.

---

## 🔗 Связанные артефакты

- 📋 **Цвета:** [`tokens/colors.md`](../tokens/colors.md)
- 📋 **Типографика:** [`tokens/typography.md`](../tokens/typography.md)
- 📋 **Radius:** [`tokens/radius.md`](../tokens/radius.md)
