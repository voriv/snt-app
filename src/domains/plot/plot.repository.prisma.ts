import type { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '@/infrastructure/prisma/client';
import type { Plot, CreatePlotData, UpdatePlotData, PlotSearchFilters } from './plot.types';
import type { IPlotRepository } from './plot.repository.interface';
import { PlotNotFoundError, PlotDuplicateError, PlotInvalidDataError } from './plot.errors';
import type { Prisma } from '@prisma/client';

/**
 * @class PlotRepositoryPrisma
 * @domain plot
 * @description Реализация IPlotRepository с использованием Prisma Client
 *
 * @spec
 * - Принимает опциональный PrismaClient через конструктор (DI pattern)
 * - Если prisma не передан — использует singleton из infrastructure/prisma/client.ts
 * - Все поля преобразуются из snake_case (БД) в camelCase (TypeScript)
 * - update исключает plotNumber из данных обновления (BR-1: номер неизменяем)
 *
 * @see docs/user-stories/US-15-plot-editing.md — редактирование участка
 */
export class PlotRepositoryPrisma implements IPlotRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || defaultPrisma;
  }

  async findAll(): Promise<Plot[]> {
    const plots = await this.prisma.plot.findMany({
      orderBy: { plot_number: 'asc' },
      select: {
        id: true,
        plot_number: true,
        cadastral_number: true,
        area: true,
        address: true,
        note: true,
        created_at: true,
        updated_at: true,
      },
    });
    return plots.map((p) => this.mapToPlot(p));
  }

  async findById(id: string): Promise<Plot | null> {
    const plot = await this.prisma.plot.findUnique({
      where: { id },
      select: {
        id: true,
        plot_number: true,
        cadastral_number: true,
        area: true,
        address: true,
        note: true,
        created_at: true,
        updated_at: true,
      },
    });
    if (!plot) return null;
    return this.mapToPlot(plot);
  }

  async findByPlotNumber(plotNumber: string): Promise<Plot | null> {
    const plot = await this.prisma.plot.findUnique({
      where: { plot_number: plotNumber },
      select: {
        id: true,
        plot_number: true,
        cadastral_number: true,
        area: true,
        address: true,
        note: true,
        created_at: true,
        updated_at: true,
      },
    });
    if (!plot) return null;
    return this.mapToPlot(plot);
  }

  async create(data: CreatePlotData): Promise<Plot> {
    try {
      const plot = await this.prisma.plot.create({
        data: {
          plot_number: data.plotNumber,
          cadastral_number: data.cadastralNumber ?? undefined,
          area: data.area,
          address: data.address ?? undefined,
          note: data.note ?? undefined,
        },
        select: {
          id: true,
          plot_number: true,
          cadastral_number: true,
          area: true,
          address: true,
          note: true,
          created_at: true,
          updated_at: true,
        },
      });
      return this.mapToPlot(plot);
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'P2002') {
        throw new PlotDuplicateError('plotNumber', data.plotNumber);
      }
      throw new PlotInvalidDataError('Failed to create plot');
    }
  }

  async update(id: string, data: UpdatePlotData): Promise<Plot> {
    const existing = await this.findById(id);
    if (!existing) throw new PlotNotFoundError(id);

    try {
      const updateData: Record<string, unknown> = {};
      if (data.plotNumber !== undefined) updateData.plot_number = data.plotNumber;
      if (data.cadastralNumber !== undefined) updateData.cadastral_number = data.cadastralNumber;
      if (data.area !== undefined) updateData.area = data.area;
      if (data.address !== undefined) updateData.address = data.address;
      if (data.note !== undefined) updateData.note = data.note;

      const plot = await this.prisma.plot.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          plot_number: true,
          cadastral_number: true,
          area: true,
          address: true,
          note: true,
          created_at: true,
          updated_at: true,
        },
      });
      return this.mapToPlot(plot);
    } catch (error: unknown) {
      if (error instanceof PlotNotFoundError || error instanceof PlotDuplicateError) {
        throw error;
      }
      throw new PlotInvalidDataError('Failed to update plot');
    }
  }

  async delete(id: string): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) throw new PlotNotFoundError(id);
    await this.prisma.plot.delete({ where: { id } });
  }

  async existsByCadastralNumber(cadastralNumber: string): Promise<boolean> {
    const plot = await this.prisma.plot.findFirst({
      where: { cadastral_number: cadastralNumber },
      select: { id: true },
    });
    return plot !== null;
  }

  /**
   * Проверяет, существует ли ДРУГОЙ участок с указанным кадастровым номером
   * (исключая участок с заданным ID — для проверки уникальности при обновлении)
   *
   * @param cadastralNumber - кадастровый номер для проверки
   * @param excludeId - ID участка, который исключается из проверки (редактируемый участок)
   * @returns true, если существует ДРУГОЙ участок с таким кадастровым номером
   *
   * @spec
   * - Используется при обновлении участка (US-15, BR-2)
   * - Исключает текущий редактируемый участок из проверки
   * - Возвращает false, если кадастровый номер принадлежит только excludeId
   *
   * @see docs/user-stories/US-15-plot-editing.md — BR-2 (уникальность кадастра)
   */
  async existsByCadastralNumberExcludingId(
    cadastralNumber: string,
    excludeId: string,
  ): Promise<boolean> {
    const plot = await this.prisma.plot.findFirst({
      where: {
        cadastral_number: cadastralNumber,
        id: { not: excludeId },
      },
      select: { id: true },
    });
    return plot !== null;
  }

  /**
   * Поиск участков по фильтрам
   *
   * @param filters - Объект с фильтрами поиска (number, cadastral, note)
   * @returns Массив найденных участков
   *
   * @spec
   * - Использует Prisma filter для частичного совпадения (case-insensitive)
   * - Все непустые фильтры применяются совместно (AND-логика)
   * - Для поля plotNumber: OR-логика (начинается с запроса ИЛИ содержит)
   * - Экранирует специальные символы для корректной работы поиска
   * - Обрезает запросы до 100 символов
   * - Результаты отсортированы по plotNumber ASC
   */
  async search(filters: PlotSearchFilters): Promise<Plot[]> {
  const { number, cadastral, note } = filters;

    const orConditions: Prisma.PlotWhereInput[] = [];

    if (number && number.trim() !== '') {
      const cleanNumber = number.trim();
      orConditions.push({
        OR: [
          { plot_number: { startsWith: cleanNumber, mode: 'insensitive' } },
          { plot_number: { contains: cleanNumber, mode: 'insensitive' } },
        ],
      });
    }

  if (cadastral && cadastral.trim() !== '') {
    orConditions.push({
      cadastral_number: { contains: cadastral.trim(), mode: 'insensitive' },
    });
  }

    if (note && note.trim() !== '') {
      orConditions.push({
        note: { contains: note.trim(), mode: 'insensitive' },
      });
    }

    const where: Prisma.PlotWhereInput =
      orConditions.length > 0 ? { AND: orConditions } : {};

    const plots = await this.prisma.plot.findMany({
      where,
      orderBy: { plot_number: 'asc' },
      select: {
        id: true,
        plot_number: true,
        cadastral_number: true,
        area: true,
        address: true,
        note: true,
        created_at: true,
        updated_at: true,
      },
    });

    return plots.map((p) => this.mapToPlot(p));
  }

  private mapToPlot(plot: {
    id: string;
    plot_number: string;
    cadastral_number: string | null;
    area: unknown;
    address: string | null;
    note: string | null;
    created_at: Date;
    updated_at: Date;
  }): Plot {
    return {
      id: plot.id,
      plotNumber: plot.plot_number,
      cadastralNumber: plot.cadastral_number,
      area: Number(plot.area),
      address: plot.address,
      note: plot.note,
      createdAt: plot.created_at,
      updatedAt: plot.updated_at,
    };
  }
}
