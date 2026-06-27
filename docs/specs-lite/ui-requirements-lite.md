# Lite-спецификация: UI Component

> 📄 Полная версия: [`../specs/components/ui/ui-component-requirements.md`](../specs/components/ui/ui-component-requirements.md)

---

## Структура файла

```
src/components/ui/<name>.tsx
```

---

## Базовый паттерн компонента

```tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// ================================
// 1. Типы и интерфейсы
// ================================
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

// ================================
// 2. Константы
// ================================
const VARIANT_CLASSES = {
  primary: 'bg-blue-500 text-white',
  secondary: 'bg-gray-200 text-gray-800',
  danger: 'bg-red-500 text-white',
} as const;

const SIZE_CLASSES = {
  sm: 'px-2 py-1 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
} as const;

// ================================
// 3. Компонент
// ================================
/**
 * Кнопка с вариантами стилей.
 * @public
 */
export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(VARIANT_CLASSES[variant], SIZE_CLASSES[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
```

---

## Обязательные элементы

| Элемент | Описание |
|---------|----------|
| **'use client'** | Директива для Client Components |
| **TSDoc** | `@description`, `@param`, `@returns`, `@public` |
| **cn()** | Для условных классов (clsx + tailwind-merge) |
| **Export по имени** | Primary export = имя компонента |

---

## Размещение компонентов

| Файл | Расположение |
|------|-------------|
| Базовые UI | `src/components/ui/<name>.tsx` |
| Layout | `src/components/layout/<name>.tsx` |
| Формы | `src/components/forms/<entity>-form.tsx` |
| Доменные | `src/components/features/<entity>-<type>.tsx` |
| Провайдеры | `src/components/providers/<context>-provider.tsx` |

---

## Правило 50 строк

> ⚠️ Функция-компонент не должна превышать 50 строк. При превышении — разбить на подкомпоненты.

```
Страница → Layout → Feature-контейнеры → Feature-компоненты → Базовые UI → Хуки
```

---

## Доступность (a11y)

| Требование | Реализация |
|------------|------------|
| ARIA атрибуты | `aria-label`, `aria-expanded`, `aria-hidden` |
| Навигация | `tabIndex`, `onKeyDown`, `onFocus`, `onBlur` |
| Семантика | `<button>` вместо `<div onClick>` |

---

📄 Полная спецификация: [`../specs/components/ui/ui-component-requirements.md`](../specs/components/ui/ui-component-requirements.md)
