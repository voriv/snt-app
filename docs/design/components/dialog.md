# ConfirmDialog

> **Назначение:** Модальный диалог подтверждения действий.
> **Статус:** `[ACTIVE]`
> **Файл:** `src/components/ui/ConfirmDialog/ConfirmDialog.tsx`

---

## Props

| Prop | Тип | По умолчанию | Описание |
|------|-----|-------------|----------|
| `isOpen` | `boolean` | — | Показывать диалог |
| `onClose` | `() => void` | — | Закрыть (отмена) |
| `title` | `string` | — | Заголовок |
| `message` | `string` | — | Текст сообщения |
| `confirmLabel` | `string` | `'Подтвердить'` | Текст кнопки подтверждения |
| `cancelLabel` | `string` | `'Отмена'` | Текст кнопки отмены |
| `onConfirm` | `() => void` | — | Действие при подтверждении |
| `isLoading` | `boolean` | `false` | Спиннер на кнопке |
| `variant` | `'primary' \| 'danger'` | `'primary'` | Стиль кнопки подтверждения |

---

## Стили

| Элемент | Токен |
|---------|-------|
| Backdrop | `rgba(0,0,0,0.5)` |
| Фон диалога | `color.bg.primary` |
| Заголовок | `text.heading-3` + `color.text.primary` |
| Сообщение | `text.body` + `color.text.secondary` |
| Кнопка подтверждения | `Button` с variant |
| Кнопка отмены | `Button` variant="secondary" |
| Border-radius | `radius-md` |
| Тень | `shadow-md` |

---

## Состояния

| State | Поведение |
|-------|-----------|
| isOpen=true | Диалог отображается, backdrop блокирует |
| isOpen=false | Диалог скрыт |
| isLoading | Кнопка подтверждения заблокирована, спиннер |
| Escape | Закрытие через onClose |
| Click outside | Закрытие через onClose |

---

## Доступность

- `role="dialog"` + `aria-modal="true"`
- `aria-labelledby` → title
- `aria-describedby` → message
- Focus trap внутри диалога
- Escape закрывает

---

## 🔗 Связанные артефакты

- 📋 **Цвета:** [`tokens/colors.md`](../tokens/colors.md)
- 📋 **Типографика:** [`tokens/typography.md`](../tokens/typography.md)
- 📋 **Button:** [`button.md`](button.md)
