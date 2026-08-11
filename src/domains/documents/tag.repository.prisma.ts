import type { PrismaClient } from '@prisma/client';
import type { IDocumentTagRepository } from './tag.repository.interface';
import type { DocumentTag } from './tag.types';

/**
 * @service DocumentTagRepositoryPrisma
 * @domain documents
 * @description Prisma-реализация интерфейса IDocumentTagRepository
 *
 * @spec
 * - DI через конструктор (опциональный PrismaClient)
 * - upsert: findOrCreate
 * - linkDocument: транзакция delete existing → createMany
 * - unlinkTag: delete
 *
 * @traces US-22-04 AC-4, US-22-07 AC-3, AC-4
 * @task DOCS-T2.5.3
 */
export class DocumentTagRepositoryPrisma implements IDocumentTagRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<DocumentTag[]> {
    const records = await this.prisma.documentTag.findMany({
      orderBy: { name: 'asc' },
    });
    return records.map(this.mapToDomain);
  }

  async findByName(name: string): Promise<DocumentTag | null> {
    const record = await this.prisma.documentTag.findUnique({
      where: { name },
    });
    return record ? this.mapToDomain(record) : null;
  }

  async upsert(name: string): Promise<DocumentTag> {
    const record = await this.prisma.documentTag.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    return this.mapToDomain(record);
  }

  async linkDocument(documentId: string, tagIds: string[]): Promise<void> {
    // Транзакция: удалить существующие связи → создать новые
    await this.prisma.$transaction(async (tx) => {
      await tx.documentTagLink.deleteMany({
        where: { document_id: documentId },
      });

      if (tagIds.length > 0) {
        await tx.documentTagLink.createMany({
          data: tagIds.map((tagId) => ({
            document_id: documentId,
            tag_id: tagId,
          })),
        });
      }
    });
  }

  async unlinkTag(documentId: string, tagId: string): Promise<void> {
    await this.prisma.documentTagLink.delete({
      where: {
        document_id_tag_id: {
          document_id: documentId,
          tag_id: tagId,
        },
      },
    });
  }

  /**
   * Преобразовать Prisma-модель в доменную (snake_case → camelCase)
   */
  private mapToDomain(record: PrismaDocumentTagRecord): DocumentTag {
    return {
      id: record.id,
      name: record.name,
      createdAt: record.created_at,
    };
  }
}

/**
 * Вспомогательный тип для Prisma-записей DocumentTag (snake_case поля)
 */
type PrismaDocumentTagRecord = {
  id: string;
  name: string;
  created_at: Date;
};
