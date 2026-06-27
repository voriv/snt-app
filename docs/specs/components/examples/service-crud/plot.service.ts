import type { PlotRepository } from '../repository/plot.repository.interface';
import type {
  CreatePlotInput,
  UpdatePlotInput,
  PlotListQuery,
  PlotDTO,
  PaginatedResult,
} from './plot.types';
import { mapToDTO } from './plot.types';
import { NotFoundError, ConflictError } from '@/services/_lib/errors';

/**
 * Сервис управления участками.
 *
 * @remarks
 * Содержит всю бизнес-логику работы с участками.
 * Использует внедрение зависимостей для получения репозитория.
 *
 * @public
 */
export class PlotService {
  constructor(private readonly plotRepository: PlotRepository) {}

  /**
   * Создаёт новый участок.
   *
   * @param input - Данные для создания
   * @returns Созданный участок в формате DTO
   * @throws ConflictError если участок с таким номером уже существует
   */
  async create(input: CreatePlotInput): Promise<PlotDTO> {
    const existing = await this.plotRepository.findByNumber(input.number);
    if (existing) {
      throw new ConflictError(
        'plot',
        `Участок с номером ${input.number} уже существует`,
      );
    }

    const plot = await this.plotRepository.create(input);
    return mapToDTO(plot);
  }

  /**
   * Получает участок по ID.
   *
   * @param id - ID участка
   * @returns DTO участка
   * @throws NotFoundError если участок не найден
   */
  async getById(id: string): Promise<PlotDTO> {
    const plot = await this.plotRepository.findById(id);
    if (!plot) {
      throw new NotFoundError('Plot', id);
    }
    return mapToDTO(plot);
  }

  /**
   * Обновляет участок.
   *
   * @param id - ID участка
   * @param input - Данные для обновления
   * @returns Обновлённый участок в формате DTO
   * @throws NotFoundError если участок не найден
   */
  async update(id: string, input: UpdatePlotInput): Promise<PlotDTO> {
    const existing = await this.plotRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Plot', id);
    }

    // Если меняется номер — проверяем уникальность
    if (input.number && input.number !== existing.number) {
      const duplicate = await this.plotRepository.findByNumber(input.number);
      if (duplicate) {
        throw new ConflictError(
          'plot',
          `Участок с номером ${input.number} уже существует`,
        );
      }
    }

    const plot = await this.plotRepository.update(id, input);
    return mapToDTO(plot);
  }

  /**
   * Удаляет участок.
   *
   * @param id - ID участка
   * @throws NotFoundError если участок не найден
   */
  async delete(id: string): Promise<void> {
    const existing = await this.plotRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Plot', id);
    }
    await this.plotRepository.delete(id);
  }

  /**
   * Получает пагинированный список участков.
   *
   * @param query - Параметры фильтрации и пагинации
   * @returns Пагинированный результат
   */
  async list(query: PlotListQuery): Promise<PaginatedResult<PlotDTO>> {
    const result = await this.plotRepository.list(query);
    return {
      ...result,
      items: result.items.map(mapToDTO),
    };
  }
}
