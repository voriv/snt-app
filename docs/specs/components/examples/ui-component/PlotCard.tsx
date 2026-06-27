import type { PlotDTO } from '@/types/plot';
import { PlotCardHeader } from './PlotCard.Header';
import { PlotCardBody } from './PlotCard.Body';
import { PlotCardFooter } from './PlotCard.Footer';

/**
 * Пропсы компонента карточки участка.
 *
 * @public
 */
export interface PlotCardProps {
  /** Данные участка. */
  plot: PlotDTO;
  /** Callback при нажатии на карточку. */
  onClick?: (id: string) => void;
}

/**
 * Карточка участка — основной контейнер.
 *
 * @remarks
 * Компонент-контейнер, собирающий подкомпоненты Header, Body, Footer.
 *
 * @public
 */
export function PlotCard({ plot, onClick }: PlotCardProps) {
  return (
    <article
      className="rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      role="article"
      aria-label={`Участок №${plot.number}`}
      onClick={() => onClick?.(plot.id)}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(plot.id)}
      tabIndex={0}
    >
      <PlotCardHeader number={plot.number} status={plot.status} />
      <PlotCardBody area={plot.area} address={plot.address} />
      <PlotCardFooter plotId={plot.id} />
    </article>
  );
}