import type { Plot } from '@prisma/client';

/**
 * Базовый DTO участка, возвращаемый API.
 *
 * @public
 */
export interface PlotDTO {
  id: string;
  number: string;
  area: number;
  address: string | null;
  cadastralNum: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Данные для создания участка.
 *
 * @public
 */
export interface CreatePlotInput {
  number: string;
  area: number;
  address?: string | null;
  cadastralNum?: string | null;
}

/**
 * Данные для обновления участка.
 * Все поля необязательны, обновляются только переданные.
 *
 * @public
 */
export interface UpdatePlotInput {
  number?: string;
  area?: number;
  address?: string | null;
  cadastralNum?: string | null;
  status?: string;
}

/**
 * Параметры пагинированного запроса участков.
 *
 * @public
 */
export interface PlotListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string | null;
}

/**
 * Результат пагинированного запроса.
 *
 * @public
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Преобразует модель Prisma Plot в DTO.
 *
 * @param plot - Модель Prisma
 * @returns DTO участка
 */
export function mapToDTO(plot: Plot): PlotDTO {
  return {
    id: plot.id,
    number: plot.number,
    area: Number(plot.area),
    address: plot.address,
    cadastralNum: plot.cadastralNum,
    status: plot.status,
    createdAt: plot.createdAt,
    updatedAt: plot.updatedAt,
  };
}
