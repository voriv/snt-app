import { usePlotActions } from './usePlotActions';

/**
 * Пропсы футера карточки участка.
 *
 * @public
 */
export interface PlotCardFooterProps {
  /** ID участка. */
  plotId: string;
}

/**
 * Футер карточки участка (кнопки действий).
 *
 * @public
 */
export function PlotCardFooter({ plotId }: PlotCardFooterProps) {
  const { isLoading, handleEdit, handleDelete } = usePlotActions(plotId);

  return (
    <div className="flex items-center gap-2 p-4 border-t bg-gray-50 rounded-b-lg">
      <button
        type="button"
        className="px-3 py-1.5 text-sm text-blue-700 bg-blue-50 rounded hover:bg-blue-100 transition-colors disabled:opacity-50"
        onClick={(e) => { e.stopPropagation(); handleEdit(); }}
        disabled={isLoading}
        aria-label={`Редактировать участок ${plotId}`}
      >
        Редактировать
      </button>
      <button
        type="button"
        className="px-3 py-1.5 text-sm text-red-700 bg-red-50 rounded hover:bg-red-100 transition-colors disabled:opacity-50"
        onClick={(e) => { e.stopPropagation(); handleDelete(); }}
        disabled={isLoading}
        aria-label={`Удалить участок ${plotId}`}
      >
        Удалить
      </button>
    </div>
  );
}