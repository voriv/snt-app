# UI Component: ThemeProvider (ThemeWrapper)

## Статус: На обсуждении

---

## 1. Описание

React Context Provider для управления темой оформления. Поддерживает 3 темы (light, dark, garden), сохраняет выбор в localStorage и применяет CSS-класс к корневому элементу.

## 2. Публичный API

### Props

| Параметр | Тип | Обязательный | По умолчанию | Описание |
|----------|-----|--------------|--------------|----------|
| children | `ReactNode` | да | — | Дочерние компоненты |
| defaultTheme | `Theme` | нет | `light` | Тема по умолчанию |

### Context API

```typescript
interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}

type Theme = 'light' | 'dark' | 'garden'
```

### Поведение

| Действие | Результат |
|----------|-----------|
| Инициализация | Чтение темы из localStorage или использование defaultTheme |
| setTheme(theme) | Сохранение в localStorage, применение CSS-класса к `<html>` |
| Изменение localStorage | Не отслеживается (одна вкладка) |

### CSS-классы

| Тема | Класс на `<html>` |
|------|-------------------|
| light | `theme-light` |
| dark | `theme-dark` |
| garden | `theme-garden` |

## 3. Примеры использования

```tsx
// В layout.tsx
import { ThemeWrapper } from '@/components/providers/theme-wrapper'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeWrapper defaultTheme="light">
          {children}
        </ThemeWrapper>
      </body>
    </html>
  )
}
```

## 4. Зависимости

### Внутренние (проект)

Нет.

### Внешние (пакеты)

Нет.

## 5. Стилизация

Компонент не имеет собственного UI. Применяет CSS-класс к `<html>` элементу.

### Цветовые переменные по темам

#### Светлая (light)

```css
.theme-light {
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f9fafb;
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;
  --color-accent: #3b82f6;
}
```

#### Тёмная (dark)

```css
.theme-dark {
  --color-bg-primary: #1f2937;
  --color-bg-secondary: #111827;
  --color-text-primary: #f9fafb;
  --color-text-secondary: #9ca3af;
  --color-accent: #60a5fa;
}
```

#### Садовая (garden)

```css
.theme-garden {
  --color-bg-primary: #f5f5dc;
  --color-bg-secondary: #fafaf0;
  --color-text-primary: #2d5016;
  --color-text-secondary: #556b2f;
  --color-accent: #4caf50;
}
```

## 6. Доступность (a11y)

- `prefers-color-scheme` уважается при первой загрузке (если нет сохранённой темы)
- `prefers-reduced-motion` — без анимаций перехода

## 7. Адаптивность

Не применимо (Provider без UI).

---

## История изменений

| Версия | Дата | Изменения | Автор |
|--------|------|-----------|-------|
| 0.1.0 | 2026-06-26 | Начальная версия | architect |