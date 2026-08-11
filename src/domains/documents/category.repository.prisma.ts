import type { PrismaClient } from '@prisma/client';
import type {
  IDocumentCategoryRepository,
} from './category.repository.interface';
import type { DocumentCategory, CreateCategoryData, CategoryTreeItem } from './category.types';
import { CategoryNotFoundError, CategoryNameNotUniqueError } from './category.errors';

/**
 * @service DocumentCategoryRepositoryPrisma
 * @domain documents
 * @description Prisma-реализация интерфейса IDocumentCategoryRepository
 *
 * @spec
 * - DI через конструктор (опциональный PrismaClient)
 * - Преобразование Prisma-типов → доменные типы
 * - getTree() с рекурсивным include children
 * - Обработка P2002 → CategoryNameNotUniqueError
 *
 * @traces US-22-01 AC-1..5, US-22-02 AC-1..5
 * @task DOCS-T2.5.1
 */
export class DocumentCategoryRepositoryPrisma implements IDocumentCategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<DocumentCategory[]> {
    const records = await this.prisma.documentCategory.findMany({
      orderBy: [{ parent_id: 'asc' }, { name: 'asc' }],
    });
    return records.map(this.mapToDomain);
  }

  async findById(id: string): Promise<DocumentCategory | null> {
    const record = await this.prisma.documentCategory.findUnique({
      where: { id },
    });
    return record ? this.mapToDomain(record) : null;
  }

  async findByNameAndParent(name: string, parentId: string | null): Promise<DocumentCategory | null> {
    const record = await this.prisma.documentCategory.findFirst({
      where: {
        name,
        parent_id: parentId ?? null,
      },
    });
    return record ? this.mapToDomain(record) : null;
  }

  async findByParentId(parentId: string | null): Promise<DocumentCategory[]> {
    const records = await this.prisma.documentCategory.findMany({
      where: { parent_id: parentId ?? null },
      orderBy: { name: 'asc' },
    });
    return records.map(this.mapToDomain);
  }

  async create(data: CreateCategoryData): Promise<DocumentCategory> {
    try {
      const record = await this.prisma.documentCategory.create({
        data: {
          name: data.name,
          description: data.description ?? undefined,
          parent_id: data.parentId ?? undefined,
        },
      });
      return this.mapToDomain(record);
    } catch (err) {
      if (this.isUniqueConstraintError(err)) {
        throw new CategoryNameNotUniqueError(data.name, data.parentId ?? null);
      }
      throw err;
    }
  }

  async delete(id: string): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new CategoryNotFoundError(id);
    }
    await this.prisma.documentCategory.delete({
      where: { id },
    });
  }

  async getChildrenIds(parentId: string): Promise<string[]> {
    const children = await this.prisma.documentCategory.findMany({
      where: { parent_id: parentId },
      select: { id: true },
    });
    return children.map((c) => c.id);
  }

  async getTree(): Promise<CategoryTreeItem[]> {
    // Получаем все категории и строим дерево в памяти
    const allCats = await this.prisma.documentCategory.findMany({
      orderBy: { name: 'asc' },
    });
    return this.buildTree(allCats, null);
  }

  async updateParentIdByIds(categoryIds: string[], newParentId: string | null): Promise<void> {
    await this.prisma.documentCategory.updateMany({
      where: { id: { in: categoryIds } },
      data: { parent_id: newParentId ?? null },
    });
  }

  /**
   * Преобразовать Prisma-модель в доменную (snake_case → camelCase)
   */
  private mapToDomain(record: PrismaDocumentCategory): DocumentCategory {
    return {
      id: record.id,
      name: record.name,
      description: record.description,
      parentId: record.parent_id,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  /**
   * Рекурсивно построить дерево категорий
   */
  private buildTree(
    allCats: PrismaDocumentCategory[],
    parentId: string | null,
  ): CategoryTreeItem[] {
    return allCats
      .filter((c) => c.parent_id === parentId)
      .map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        children: this.buildTree(allCats, c.id),
      }));
  }

  /**
   * Проверить, является ли ошибка Prisma P2002 (unique constraint violation)
   */
  private isUniqueConstraintError(err: unknown): boolean {
    return (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === 'P2002'
    );
  }
}

/**
 * Вспомогательный тип для Prisma-записей DocumentCategory (snake_case поля)
 */
type PrismaDocumentCategory = {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  created_at: Date;
  updated_at: Date;
};
