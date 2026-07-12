'use client';

/**
 * @component ConfirmModal
 * @category ui
 * @description Модальное окно подтверждения с заголовком, сообщением и кнопками
 *
 * @example
 * ```tsx
 * <ConfirmModal
 *   isOpen={true}
 *   onClose={() => setIsOpen(false)}
 *   title="Удаление участника"
 *   message="Вы уверены, что хотите удалить этого участника?"
 *   confirmText="Удалить"
 *   onConfirm={() => handleDelete()}
 * />
 * ```
 *
 * @spec
 * - Отображается только при isOpen=true
 * - Блокирует фон при открытии
 * - Кнопка отмены закрывает модальное окно
 * - Кнопка подтверждения вызывает onConfirm и закрывает окно
 * - Кнопка подтверждения всегда красная (danger) для деструктивных действий
 */

import { Button } from '@/components/ui/Button';

export interface ConfirmModalProps {
  /** Показывать ли модальное окно */
  isOpen: boolean;
  /** Функция закрытия модального окна */
  onClose: () => void;
  /** Заголовок модального окна */
  title: string;
  /** Сообщение в модальном окне */
  message: string;
  /** Текст кнопки подтверждения */
  confirmText?: string;
  /** Обработчик подтверждения */
  onConfirm: () => void;
  /** Текст кнопки отмены */
  cancelText?: string;
}

/**
 * Модальное окно подтверждения
 */
export function ConfirmModal({
  isOpen,
  onClose,
  title,
  message,
  confirmText = 'Подтвердить',
  onConfirm,
  cancelText = 'Отмена',
}: ConfirmModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            {cancelText}
          </Button>
          <Button variant="danger" onClick={() => { onConfirm(); onClose(); }}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
