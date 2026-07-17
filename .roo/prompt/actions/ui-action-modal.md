# ModalAction Extension

> **Расширение для:** `.roo/prompt/ui-component-prompt.md`  
> **Паттерн:** Действие с блоком ввода данных + подтверждением в модалке  
> **Пример в проекте:** `src/components/features/auth/LogoutButton/LogoutButton.tsx`

---

## 🎯 КОГДА ИСПОЛЬЗОВАТЬ

Используй этот паттерн, когда компонент требует:

- Блокировки/бан пользователя с вводом причины
- Выдачи предупреждения с текстом
- Назначения роли с выбором
- Двухшагового действия: сбор данных → подтверждение → мутация

---

## 📦 PROPS-ИНТЕРФЕЙС

```typescript
/**
 * @interface ModalActionProps
 * @description Общие props для компонента действия в модалке
 *
 * @spec
 * - target: объект, над которым выполняется действие
 * - isOpen: управление видимостью модалки
 * - onClose: закрытие модалки
 * - onSubmit: отправка формы внутри модалки
 * - isLoading: блокировка при запросе
 */
export interface ModalActionProps<Target> {
  /** Объект, над которым выполняется действие */
  target: Target;
  /** Управление видимостью модалки */
  isOpen: boolean;
  /** Закрытие модалки */
  onClose: () => void;
  /** Отправка формы */
  onSubmit: (data: FormData) => void;
  /** Блокировка при запросе */
  isLoading?: boolean;
  /** CSS классы для обёртки */
  className?: string;
}

/**
 * @interface ModalFormData
 * @description Данные формы внутри модалки
 *
 * @spec
 * - cause: обязательная причина действия
 * - note: опциональная заметка
 */
export interface ModalFormData {
  /** Причина действия */
  cause: string;
  /** Опциональная заметка */
  note?: string;
}
```

---

## 🏗️ ШАБЛОН КОМПОНЕНТА

```typescript
'use client';

/**
 * @component <ComponentName>
 * @category features/<domain>
 * @description Компонент <действия> с формой в модалке
 *
 * @example
 * ```tsx
 * <ModalAction
 *   target={user}
 *   isOpen={isBanModalOpen}
 *   onClose={() => setIsBanModalOpen(false)}
 *   onSubmit={handleBanUser}
 *   isLoading={isBanning}
 * />
 * ```
 *
 * @spec
 * - При isOpen=true отображает модалку с формой
 * - Валидация данных внутри модалки
 * - Подтверждение через ConfirmDialog перед отправкой
 * - Блокировка UI при isLoading
 *
 * @see US-XX: <User Story>
 */
import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export interface <ComponentName>Props {
  // ... см. ModalActionProps выше
}

export function <ComponentName>({
  target,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  className = '',
}: <ComponentName>Props) {
  // === СОСТОЯНИЕ ===
  const [cause, setCause] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // === ВАЛИДАЦИЯ ===
  const validateForm = useCallback((): string | null => {
    if (!cause.trim()) {
      return 'Укажите причину';
    }
    if (cause.trim().length < 10) {
      return 'Причина должна содержать минимум 10 символов';
    }
    return null;
  }, [cause]);

  // === ОБРАБОТЧИКИ ===
  const handleClose = useCallback(() => {
    setCause('');
    setNote('');
    setError(null);
    onClose();
  }, [onClose]);

  const handleRequestSubmit = useCallback(() => {
    setError(null);
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setShowConfirmDialog(true);
  }, [validateForm]);

  const handleConfirm = useCallback(() => {
    setShowConfirmDialog(false);
    onSubmit({
      cause: cause.trim(),
      note: note.trim() || undefined,
    });
    handleClose();
  }, [cause, note, onSubmit, handleClose]);

  const handleCancel = useCallback(() => {
    setShowConfirmDialog(false);
  }, []);

  // Если модалка закрыта — не рендерить
  if (!isOpen) {
    return null;
  }

  // === РЕНДЕР ===
  return (
    <>
      {/* Модалка с формой */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50"
          onClick={handleClose}
        />

        {/* Content */}
        <div className="relative z-10 w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
          {/* Заголовок */}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {/* Динамический заголовок */}
          </h2>

          {/* Информация о target */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
            {/* Информация о целевом объекте */}
          </div>

          {/* Форма */}
          <div className="space-y-4">
            {/* Причина */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Причина *
              </label>
              <textarea
                value={cause}
                onChange={(e) => setCause(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 p-2"
                rows={3}
                disabled={isLoading}
                placeholder="Укажите причину..."
              />
            </div>

            {/* Заметка */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Заметка
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 p-2"
                rows={2}
                disabled={isLoading}
                placeholder="Опциональная заметка..."
              />
            </div>

            {/* Ошибка */}
            {error && (
              <div className="text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Кнопки */}
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={handleClose}
                disabled={isLoading}
              >
                Отмена
              </Button>
              <Button
                variant="primary"
                onClick={handleRequestSubmit}
                disabled={isLoading}
              >
                Далее
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ConfirmDialog для подтверждения */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={handleCancel}
        title="Подтверждение"
        message="Вы уверены, что хотите выполнить это действие?"
        confirmLabel="Подтвердить"
        cancelLabel="Отмена"
        onConfirm={handleConfirm}
        isLoading={isLoading}
        variant="danger"
      />
    </>
  );
}
```

---

## 🔑 КЛЮЧЕВЫЕ ПРАВИЛА

| Правило | Описание |
|---------|----------|
| **Двухшаговый процесс** | Форма → ConfirmDialog → Мутация |
| **Валидация в модалке** | Проверяй данные перед показом ConfirmDialog |
| **Очистка формы** | При закрытии сбрасывай состояние |
| **Backdrop** | Клик вне модалки закрывает её |
| **Подтверждение** | Всегда через [`ConfirmDialog`](../../src/components/ui/ConfirmDialog/ConfirmDialog.tsx) |
| **Блокировка** | При `isLoading` — блокируй form + кнопки |
| **useCallback** | Все обработчики обернуты |

---

## ✅ ЧЕК-ЛИСТ

- [ ] isOpen управляет видимостью модалки
- [ ] Валидация формы перед ConfirmDialog
- [ ] ConfirmDialog для финального подтверждения
- [ ] Очистка формы при закрытии
- [ ] Backdrop кликабельный
- [ ] `useCallback` для всех обработчиков
- [ ] Блокировка UI при `isLoading`
- [ ] Escape/blur закрывает модалку

---

## 🔗 РЕФЕРЕНСЫ

| Ресурс | Файл |
|--------|------|
| LogoutButton | [`LogoutButton.tsx`](../../src/components/features/auth/LogoutButton/LogoutButton.tsx) |
| ConnectionModal | [`ConnectionModal.tsx`](../../src/components/features/plotUser/ConnectionModal.tsx) |
| ConfirmDialog | [`ConfirmDialog.tsx`](../../src/components/ui/ConfirmDialog/ConfirmDialog.tsx) |

---

**Последнее обновление:** 2026-07-16
