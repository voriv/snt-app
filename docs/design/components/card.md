# Card

> **Назначение:** Контейнер для группировки контента с заголовком, телом и футером.
> **Статус:** `[ACTIVE]`
> **Файл:** `src/components/ui/Card/Card.tsx`

---

## Компоненты

| Компонент | Описание |
|-----------|----------|
| `Card` | Основная обёртка |
| `CardHeader` | Заголовочная секция |
| `CardTitle` | Заголовок |
| `CardBody` | Основной контент |
| `CardFooter` | Нижняя секция |

---

## Props

| Компонент | Prop | Тип | Описание |
|-----------|------|-----|----------|
| Card | `children` | `ReactNode` | Содержимое |
| Card | `className` | `string` | CSS-классы |
| CardHeader | `children` | `ReactNode` | Содержимое |
| CardHeader | `className` | `string` | CSS-классы |
| CardTitle | `children` | `ReactNode` | Текст заголовка |
| CardTitle | `className` | `string` | CSS-классы |
| CardBody | `children` | `ReactNode` | Содержимое |
| CardBody | `className` | `string` | CSS-классы |
| CardFooter | `children` | `ReactNode` | Содержимое |
| CardFooter | `className` | `string` | CSS-классы |

---

## Стили

| Компонент | Фон | Граница | Тень | Padding |
|-----------|-----|---------|------|---------|
| Card | `color.bg.primary` | `color.border.default` | `shadow-sm` | — |
| CardHeader | `color.bg.primary` | bottom: `color.border.default` | — | `space-6 × space-4` |
| CardTitle | — | — | — | — |
| CardBody | `color.bg.primary` | — | — | `space-6` |
| CardFooter | `color.bg.secondary` | top: `color.border.default` | — | `space-6 × space-4` |

---

## Текст

| Элемент | Токен |
|---------|-------|
| CardTitle | `text.heading-3` |
| CardBody | `text.body` |

---

## ⚠️ Текущая проблема

- `bg-white` вместо `var(--theme-bg-primary)`
- `border-gray-200` вместо `var(--theme-border-color)`
- `text-gray-900` вместо `var(--theme-text-primary)`
- `bg-gray-50` вместо `var(--theme-bg-secondary)`

**Не работает с темами dark и green.**

---

## Миграция

Заменить:
- `bg-white` → `bg-[var(--theme-bg-primary)]`
- `border-gray-200` → `border-[var(--theme-border-color)]`
- `text-gray-900` → `text-[var(--theme-text-primary)]`
- `bg-gray-50` → `bg-[var(--theme-bg-secondary)]`
- `shadow` → `shadow-sm`

---

## 🔗 Связанные артефакты

- 📋 **Цвета:** [`tokens/colors.md`](../tokens/colors.md)
- 📋 **Типографика:** [`tokens/typography.md`](../tokens/typography.md)
- 📋 **Отступы:** [`tokens/spacing.md`](../tokens/spacing.md)
- 📋 **Тени:** [`tokens/shadows.md`](../tokens/shadows.md)
