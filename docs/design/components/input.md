# Input

> **Назначение:** Базовый компонент поля ввода с поддержкой label, ошибок, accessibility и textarea.
> **Статус:** `[ACTIVE]`
> **Файл:** `src/components/ui/Input/Input.tsx`

---

## Props

| Prop | Тип | По умолчанию | Описание |
|------|-----|-------------|----------|
| `as` | `"textarea"` | — | При `"textarea"` рендерит `<textarea>` вместо `<input>` |
| `label` | `string` | — | Label над полем |
| `error` | `string` | — | Сообщение об ошибке |
| `autoResize` | `boolean` | — | Авто-высота textarea по содержимому (только при `as="textarea"`) |
| `id` | `string` | — | ID для label/for (если не задан — генерируется из label) |
| `className` | `string` | — | Дополнительные CSS-классы |
| `onChange` | `ChangeEventHandler<Input \| Textarea>` | — | Обработчик изменения |
| `onKeyDown` / `onKeyUp` | `KeyboardEventHandler` | — | Клавиатурные события |
| `onBlur` / `onFocus` | `FocusEventHandler` | — | Фокус |
| `onInput` | `FormEventHandler` | — | Событие input (для autoResize) |
| ... | `InputHTMLAttributes \| TextareaHTMLAttributes` | — | Стандартные атрибуты input / textarea |

---

## Стили

Компонент использует CSS-переменные дизайн-системы (совместим с 3 темами Light/Dark/Green после B-017/B-018):

| Элемент | CSS-переменная | Описание |
|---------|----------------|----------|
| Фон | `--theme-input-bg` | Фон поля |
| Текст | `--theme-input-text` | Цвет текста |
| Placeholder | `--theme-input-placeholder` | Цвет placeholder |
| Граница | `--theme-input-border` | Стандартная граница |
| Граница (focus) | `--theme-input-focus-border` | Граница в фокусе |
| Граница (error) | `--theme-danger` | Граница при ошибке |
| Label | `--theme-text-primary` | Цвет label |
| Error message | `--theme-danger` | Цвет сообщения об ошибке |

---

## Состояния

| State | Фон | Граница | Текст | Placeholder |
|-------|-----|---------|-------|-------------|
| Default | `--theme-input-bg` | `--theme-input-border` | `--theme-input-text` | `--theme-input-placeholder` |
| Focus | `--theme-input-bg` | `--theme-input-focus-border` | `--theme-input-text` | `--theme-input-placeholder` |
| Error | `--theme-input-bg` | `--theme-danger` | `--theme-input-text` | `--theme-input-placeholder` |
| Disabled | `--theme-input-bg` (opacity) | `--theme-input-border` (opacity) | `--theme-input-text` (opacity) | — |

---

## Режим `as="textarea"` (B-019)

С версии B-019 компонент поддерживает рендер `<textarea>` через проп `as="textarea"`. Это единая точка входа для однострочных полей ввода и многострочных textarea:

```tsx
// Фиксированная высота (rows)
<Input as="textarea" label="Описание" rows={4} />

// Авто-высота по содержимому
<Input as="textarea" autoResize placeholder="Введите сообщение..." />
```

**Особенности:**
- `autoResize` автоматически подстраивает `height` textarea под `scrollHeight` при каждом вводе
- `forwardRef` возвращает `HTMLInputElement | HTMLTextAreaElement` в зависимости от `as`
- `InputProps` объединяет `InputHTMLAttributes<HTMLInputElement>` и `TextareaHTMLAttributes<HTMLTextAreaElement>`
- `rows`, `cols`, `wrap` — доступны только при `as="textarea"`
- `onChange` / `onKeyDown` / `onKeyUp` / `onBlur` / `onFocus` / `onInput` принимают объединённые типы для backward compatibility

---

## Accessibility

| Функция | Реализация |
|---------|-----------|
| Label | `<label htmlFor={id}>` при наличии `label` |
| Error | `aria-invalid="true"` + `aria-describedby` → `<p role="alert">` |
| ID | Авто-генерация из `label` (lowercase, пробелы → дефисы) |

---

## Миграция (B-017/B-018)

✅ **Выполнено.** Все хардкод-классы Tailwind (`text-gray-700`, `border-gray-300`, `text-red-600`, `border-red-300`) заменены на CSS-переменные дизайн-системы. Компонент совместим с 3 темами (Light/Dark/Green).

---

## 🔗 Связанные артефакты

- 📋 **Цвета:** [`tokens/colors.md`](../tokens/colors.md)
- 📋 **Radius:** [`tokens/radius.md`](../tokens/radius.md)
- ✅ **Миграция токенов:** B-017, B-018
- ✅ **Расширение `as="textarea"`:** [план B-019](../../plans/B-019-ds-components-migration-plan.md), [валидация B-019](../../plans/B-019-ds-components-migration-plan-validation.md), [component-spec B-019](../../specs/comms/B-019-component-spec.md)
