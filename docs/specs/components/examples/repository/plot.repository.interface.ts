import type { Plot } from '@prisma/client';
import type {
  CreatePlotInput,
  UpdatePlotInput,
  PlotListQuery,
  PaginatedResult,
} from '../service-crud/plot.types';

/**
 * Интерфейс репозитория участков.
 *
 * @remarks
 * Абстрагирует доступ к базе данных от бизнес-логики сервиса.
 * Реализация должна быть предоставлена через DI.
 *
 * @public
 */
export interface PlotRepository {
  /** Находит участок по ID. */
  findById(id: string): Promise<Plot | null>;
  /** Создаёт новый участок. */
  create(data: CreatePlotInput): Promise<Plot>;
  /** Обновляет участок. */
  update(id: string, data: UpdatePlotInput): Promise<Plot>;
  /** Удаляет участок. */
  delete(id: string): Promise<void>;
  /** Возвращает пагинированный список участков. */
  list(query: PlotListQuery): Promise<PaginatedResult<Plot>>;
  /** Находит участок по номеру (уникальное поле). */
  findByNumber(number: string): Promise<Plot | null>;
}