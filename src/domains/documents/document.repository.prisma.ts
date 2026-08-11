import type { PrismaClient } from '@prisma/client';
import type { IDocumentRepository } from './document.repository.interface';
import type {
  Document,
  CreateDocumentData,
  UpdateDocumentData,
  UpdateMetadataData,
  DocumentFilter,
  DocumentWithDetails,
  PaginatedResult,
} from './document.types';

/**
 * @service DocumentRepositoryPrisma
 * @domain documents
 * @description Prisma-реализация интерфейса IDocumentRepository
 *
 * @spec
 * - DI через конструктор (опциональный PrismaClient)
 * - findMany с ролевой фильтрацией: visibleRoles @> [userRole]
 * - findByIdWithDetails include: category, tags (через DocumentTagLink), uploadedBy
 * - Поиск через ILIKE по title, description; по тегам через join
 * - Пагинация через skip/take
 *
 * @traces US-22-03..US-22-07
 * @task DOCS-T2.5.2
 */
export class DocumentRepositoryPrisma implements IDocumentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Document | null> {
    const record = await this.prisma.document.findUnique({
      where: { id },
    });
    return record ? this.mapToDomain(record) : null;
  }

  async findByIdWithDetails(id: string): Promise<DocumentWithDetails | null> {
    const record = await this.prisma.document.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    return record ? this.mapToDomainWithDetails(record) : null;
  }

  async findMany(
    filters: DocumentFilter,
    userRole: string,
  ): Promise<PaginatedResult<DocumentWithDetails>> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    // Строим условия where
    const where: Record<string, unknown> = {};

    // Ролевая фильтрация: если не ADMIN, показываем только published + доступные по роли
    if (userRole !== 'ADMIN') {
      where.status = 'PUBLISHED';
      where.visible_roles = {
        array_contains: userRole,
      };
    }

    // Фильтр по категории
    if (filters.categoryId) {
      where.category_id = filters.categoryId;
    }

    // Фильтр по типу документа
    if (filters.documentType) {
      where.document_type = filters.documentType;
    }

    // Фильтр по статусу (для ADMIN)
    if (filters.status && userRole === 'ADMIN') {
      where.status = this.mapStatusToPrisma(filters.status);
    }

    // Поиск по тексту
    if (filters.search) {
      const search = filters.search;
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        {
          tags: {
            some: {
              tag: {
                name: { contains: search, mode: 'insensitive' },
              },
            },
          },
        },
      ];
    }

    const [records, total] = await Promise.all([
      this.prisma.document.findMany({
        where: where as never,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          category: {
            select: { id: true, name: true },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          uploadedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.document.count({ where: where as never }),
    ]);

    return {
      items: records.map(this.mapToDomainWithDetails),
      total,
      page,
      limit,
    };
  }

  async create(data: CreateDocumentData): Promise<Document> {
    const record = await this.prisma.document.create({
      data: {
        title: data.originalName,
        original_name: data.originalName,
        storage_path: data.storagePath,
        file_size: data.fileSize,
        mime_type: data.mimeType,
        document_type: 'other',
        visible_roles: ['ADMIN'],
        status: 'DRAFT',
        uploaded_by_id: data.uploadedById,
      },
    });
    return this.mapToDomain(record);
  }

  async update(id: string, data: UpdateDocumentData): Promise<Document> {
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.categoryId !== undefined) updateData.category_id = data.categoryId;
    if (data.documentType !== undefined) updateData.document_type = data.documentType;
    if (data.visibleRoles !== undefined) updateData.visible_roles = data.visibleRoles;
    if (data.status !== undefined) updateData.status = this.mapStatusToPrisma(data.status);

    const record = await this.prisma.document.update({
      where: { id },
      data: updateData as never,
    });
    return this.mapToDomain(record);
  }

  async updateMetadata(id: string, data: UpdateMetadataData): Promise<Document> {
    const updateData: Record<string, unknown> = {
      title: data.title,
      description: data.description ?? null,
      document_type: data.documentType,
      visible_roles: data.visibleRoles,
      status: 'PUBLISHED',
    };

    if (data.categoryId !== undefined) {
      updateData.category_id = data.categoryId;
    }

    if (data.status) {
      updateData.status = this.mapStatusToPrisma(data.status);
    }

    const record = await this.prisma.document.update({
      where: { id },
      data: updateData as never,
    });
    return this.mapToDomain(record);
  }

  async updateCategoryIdByIds(docIds: string[], newCategoryId: string | null): Promise<void> {
    await this.prisma.document.updateMany({
      where: { id: { in: docIds } },
      data: { category_id: newCategoryId ?? null },
    });
  }

  async getByCategoryId(categoryId: string): Promise<Document[]> {
    const records = await this.prisma.document.findMany({
      where: { category_id: categoryId },
    });
    return records.map(this.mapToDomain);
  }

  /**
   * Преобразовать Prisma-модель в доменную (snake_case → camelCase)
   */
  private mapToDomain(record: Record<string, unknown>): Document {
    return {
      id: record.id as string,
      title: record.title as string,
      description: (record.description as string) ?? null,
      originalName: record.original_name as string,
      storagePath: (record.storage_path as string) ?? null,
      fileSize: record.file_size as number,
      mimeType: record.mime_type as string,
      categoryId: (record.category_id as string) ?? null,
      documentType: record.document_type as string,
      visibleRoles: record.visible_roles as string[],
      status: this.mapStatusToDomain(record.status as string),
      uploadedById: record.uploaded_by_id as string,
      createdAt: record.created_at as Date,
      updatedAt: record.updated_at as Date,
    };
  }

  /**
   * Преобразовать Prisma-модель в DocumentWithDetails
   * Используем Record<string, unknown> для гибкости с include
   */
  private mapToDomainWithDetails = (record: Record<string, unknown>): DocumentWithDetails => {
    const base = this.mapToDomain(record);

    // Извлекаем связанные данные
    const category = record.category as { id: string; name: string } | null;
    const tags = (record.tags as Array<{ tag: Record<string, unknown> }>) ?? [];
    const uploadedBy = record.uploadedBy as { id: string; name: string | null; email: string };

    return {
      ...base,
      category: category ? { id: category.id, name: category.name } : null,
      tags: tags.map((link) => ({
        id: link.tag.id as string,
        name: link.tag.name as string,
        createdAt: link.tag.created_at as Date,
      })),
      uploader: {
        id: uploadedBy.id,
        name: uploadedBy.name,
        email: uploadedBy.email,
      },
    };
  };

  /**
   * Маппинг доменного статуса → Prisma enum
   */
  private mapStatusToPrisma(status: string): 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' {
    switch (status) {
      case 'draft': return 'DRAFT';
      case 'published': return 'PUBLISHED';
      case 'archived': return 'ARCHIVED';
      default: return 'DRAFT';
    }
  }

  /**
   * Маппинг Prisma enum → доменный статус
   */
  private mapStatusToDomain(status: string): 'draft' | 'published' | 'archived' {
    switch (status) {
      case 'DRAFT': return 'draft';
      case 'PUBLISHED': return 'published';
      case 'ARCHIVED': return 'archived';
      default: return 'draft';
    }
  }
}
