import type { Plot } from '@prisma/client';
import type {
  CreatePlotInput,
  UpdatePlotInput,
  PlotListQuery,
  PaginatedResult,
} from '../service-crud/plot.types';
import type { PlotRepository } from './plot.repository.interface';
import { prisma } from '@/lib/prisma';
import {
  RepositoryError,
  RepositoryNotFoundError,
  RepositoryConflictError,
} from './plot.repository.errors';

/**
 * Реализация репозитория участков через Prisma.
 *
 * @remarks
 * Преобразует ошибки Prisma в доменные ошибки репозитория.
 *
 * @public
 */
export class PrismaPlotRepository implements PlotRepository {
  async findById(id: string): Promise<Plot | null> {
    try {
      return await prisma.plot.findUnique({ where: { id } });
    } catch (error) {
      throw new RepositoryError('plot.findById', String(error));
    }
  }

  async create(data: CreatePlotInput): Promise<Plot> {
    try {
      return await prisma.plot.create({ data });
    } catch (error) {
      if ((error as Record<string, unknown>).code === 'P2002') {
        throw new RepositoryConflictError('plot', 'Участок с таким номером уже существует');
      }
      throw new RepositoryError('plot.create', String(error));
    }
  }

  async update(id: string, data: UpdatePlotInput): Promise<Plot> {
    try {
      return await prisma.plot.update({ where: { id }, data });
    } catch (error) {
      if ((error as Record<string, unknown>).code === 'P2025') {
        throw new RepositoryNotFoundError('Plot', id);
      }
      throw new RepositoryError('plot.update', String(error));
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await prisma.plot.delete({ where: { id } });
    } catch (error) {
      if ((error as Record<string, unknown>).code === 'P2025') {
        throw new RepositoryNotFoundError('Plot', id);
      }
      throw new RepositoryError('plot.delete', String(error));
    }
  }

  async list(query: PlotListQuery): Promise<PaginatedResult<Plot>> {
    const { page = 1, limit = 20, search, status } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { number: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const [items, total] = await prisma.$transaction([
      prisma.plot.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.plot.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByNumber(number: string): Promise<Plot | null> {
    try {
      return await prisma.plot.findUnique({ where: { number } });
    } catch (error) {
      throw new RepositoryError('plot.findByNumber', String(error));
    }
  }
}