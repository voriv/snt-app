# ToggleAction Extension

> **Расширение для:** `.roo/prompt/ui-component-prompt.md`  
> **Паттерн:** Переключение между вариантами (тема, статус, active/inactive)  
> **Пример в проекте:** `src/components/features/userProfile/ThemeSelector/ThemeSelector.tsx`

---

## 🎯 КОГДА ИСПОЛЬЗОВАТЬ

Используй этот паттерн, когда компонент требует:

- Переключения между фиксированными вариантами (тема, статус)
- Визуальной подсветки активного варианта
- Делегирования состояния родителю через callback
- Опционального подтверждения через ConfirmDialog (если критичное действие)

---

## 📦 PROPS-ИНТЕРФЕЙС

```typescript
/**
 * @interface ToggleActionProps
 * @description Общие props для компонента переключения между вариантами
 *
 * @spec
 * - options: массив доступных вариантов с метаданными
 * - activeValue: текущее активное значение
 * - onChange: callback при переключении
 * - isLoading: блокировка при запросе
 * - requireConfirmation: требует ли подтверждение через ConfirmDialog
 */
export interface ToggleActionProps<T extends string> {
  /** Доступные варианты переключения */
  options: ToggleOption<T>[];
  /** Текущее активное значение */
  activeValue: T;
  /** Callback при переключении */
  onChange: (value: T) => void;
  /** Блокировка при запросе */
  isLoading?: boolean;
  /** Требует ли подтверждение через ConfirmDialog */
  requireConfirmation?: boolean;
  /** Текст подтверждения (если requireConfirmation=true) */
  confirmationMessage?: string;
  /** CSS классы для обёртки */
  className?: string;
}

/**
 * @interface ToggleOption
 * @description Опция переключения
 */
export interface ToggleOption<T extends string> {
  /** Уникальное значение */
  value: T;
  /** Отображаемое название */
  label: string;
  /** Описание (опционально) */
  description?: string;
  /** Классы для превью/иконки (опционально) */
  previewClasses?: string;
}
```

---

## 🏗️ ШАБЛОН КОМПОНЕНТА

```typescript
'use client';

/**
 * @component <ComponentName>
 * @category features/<domain>
 * @description Компонент переключения <темы/статуса/активности>
 *
 * @example
 * ```tsx
 * <ToggleAction
 *   options={THEME_OPTIONS}
 *   activeValue={currentTheme}
 *   onChange={handleThemeChange}
 *   isLoading={isSaving}
 * />
 * ```
 *
 * @spec
 * - Отображает варианты как карточки/кнопки
 * - Активный вариант выделен border/badge
 * - При клике вызывает onChange с новым значением
 * - Опционально: подтверждение через ConfirmDialog
 *
 * @see US-XX: <User Story>
 */
import { useState, useCallback } from 'react';
import { cn } from '@/shared/utils/cn';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export interface <ComponentName>Props {
  // ... см. ToggleActionProps выше
}

export function <ComponentName>({
  options,
  activeValue,
  onChange,
  isLoading = false,
  requireConfirmation = false,
  confirmationMessage = 'Вы уверены?',
  className = '',
}: <ComponentName>Props) {
  // === СОСТОЯНИЕ ===
  const [pendingValue, setPendingValue] = useState<T | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // === ОБРАБОТЧИКИ ===
  /**
   * Обработка клика по варианту
   *
   * @param value - Новый выбранный вариант
   */
  const handleClick = useCallback(
    (value: string) => {
      if (isLoading) return;

      if (requireConfirmation) {
        setPendingValue(value as T);
        setShowConfirmDialog(true);
      } else {
        onChange(value as T);
      }
    },
    [isLoading, requireConfirmation, onChange]
  );

  const handleConfirm = useCallback(() => {
    if (pendingValue) {
      onChange(pendingValue);
    }
    setPendingValue(null);
    setShowConfirmDialog(false);
  }, [pendingValue, onChange]);

  const handleCancel = useCallback(() => {
    setPendingValue(null);
    setShowConfirmDialog(false);
  }, []);

  // === РЕНДЕР ===
  return (
    <div className={cn('space-y-4', className)}>
      {/* Варианты */}
      <div className="grid grid-cols-1 md:grid-cols-<N> gap-4">
        {options.map((option) => {
          const isActive = activeValue === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleClick(option.value)}
              aria-label={`Выбрать ${option.label}`}
              aria-pressed={isActive}
              disabled={isLoading}
              className={cn(
                'relative p-4 rounded-lg border-2 transition-all duration-200 text-left',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                isActive
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600',
                isLoading && 'opacity-50 cursor-not-allowed'
              )}
            >
              {/* Индикатор активного */}
              {isActive && (
                <div className="absolute top-2 right-2">
                  <CheckIcon className="w-5 h-5 text-indigo-600" />
                </div>
              )}

              {/* Превью */}
              {option.previewClasses && (
                <div className={option.previewClasses} />
              )}

              {/* Информация */}
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {option.label}
                </div>
                {option.description && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {option.description}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ConfirmDialog для подтверждения (опционально) */}
      {requireConfirmation && (
        <ConfirmDialog
          isOpen={showConfirmDialog}
          onClose={handleCancel}
          title="Подтверждение"
          message={confirmationMessage}
          confirmLabel="Подтвердить"
          cancelLabel="Отмена"
          onConfirm={handleConfirm}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
```

---

## 🔑 КЛЮЧЕВЫЕ ПРАВИЛА

| Правило | Описание |
|---------|----------|
| **Делегирование** | Состояние управляется родителем через `activeValue` |
| **Callback** | `onChange(value)` — единственный способ уведомления |
| **aria-pressed** | Обязателен для accessibility |
| **Визуальная подсветка** | Border + badge/glyph для активного варианта |
| **Подтверждение** | Опционально через [`ConfirmDialog`](../../src/components/ui/ConfirmDialog/ConfirmDialog.tsx) |
| **Блокировка** | При `isLoading` — `opacity-50 cursor-not-allowed` + `disabled` |
| **useCallback** | Все обработчики обернуты в `useCallback` |

---

## ✅ ЧЕК-ЛИСТ

- [ ] `activeValue` управляется родителем
- [ ] `onChange(value)` — callback при переключении
- [ ] Активный вариант выделен (border + индикатор)
- [ ] `aria-pressed={isActive}` для accessibility
- [ ] `useCallback` для всех обработчиков
- [ ] Опциональное подтверждение через ConfirmDialog
- [ ] Блокировка UI при `isLoading`

---

## 🔗 РЕФЕРЕНСЫ

| Ресурс | Файл |
|--------|------|
| Реальный пример | [`ThemeSelector.tsx`](../../src/components/features/userProfile/ThemeSelector/ThemeSelector.tsx) |
| ConfirmDialog | [`ConfirmDialog.tsx`](../../src/components/ui/ConfirmDialog/ConfirmDialog.tsx) |

---

**Последнее обновление:** 2026-07-16
