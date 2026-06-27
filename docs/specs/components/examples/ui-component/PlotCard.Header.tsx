/**
 * Пропсы заголовка карточки участка.
 *
 * @public
 */
export interface PlotCardHeaderProps {
  /** Номер участка. */
  number: string;
  /** Статус участка. */
  status: string;
}

/** Цвет статуса для badge. */
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  ABANDONED: 'bg-red-100 text-red-800',
};

/** Человекочитаемый статус. */
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Активен',
  INACTIVE: 'Неактивен',
  ABANDONED: 'Заброшен',
};

/**
 * Заголовок карточки участка (номер + статус).
 *
 * @public
 */
export function PlotCardHeader({ number, status }: PlotCardHeaderProps) {
  const colorClass = STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-800';
  const label = STATUS_LABELS[status] ?? status;

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <h3 className="text-lg font-semibold">Участок №{number}</h3>
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>
        {label}
      </span>
    </div>
  );
}