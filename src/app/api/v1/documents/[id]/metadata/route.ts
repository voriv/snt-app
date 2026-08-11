import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DocumentService } from '@/domains/documents/document.service';
import { DocumentRepositoryPrisma } from '@/domains/documents/document.repository.prisma';
import { DocumentTagRepositoryPrisma } from '@/domains/documents/tag.repository.prisma';
import { DocumentCategoryRepositoryPrisma } from '@/domains/documents/category.repository.prisma';
import { FileStorage } from '@/domains/documents/file.storage';
import { prisma } from '@/infrastructure/prisma/client';
import { documentMetadataSchema } from '@/domains/documents/document.validators';
import type { UpdateMetadataData } from '@/domains/documents';
import { DocumentNotFoundError } from '@/domains/documents/document.errors';

/**
 * @route PUT /api/v1/documents/[id]/metadata
 * @auth admin
 * @body UpdateMetadataData
 * @response 200 { success: true, data: Document }
 * @description Сохранить метаданные загруженного документа (draft → published)
 *
 * @spec
 * - Авторизация: ADMIN
 * - Валидация через documentMetadataSchema
 * - draft → published + связывание тегов
 *
 * @traces US-22-04 AC-1..5
 * @task DOCS-T3.2.3
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Пожалуйста, авторизуйтесь' } },
        { status: 401 },
      );
    }

    if (!session.user.roles?.includes('ADMIN')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Недостаточно прав' } },
        { status: 403 },
      );
    }

    const { id } = params;
    const body = await request.json();
    const parsed = documentMetadataSchema.parse(body);

    const documentRepo = new DocumentRepositoryPrisma(prisma);
    const tagRepo = new DocumentTagRepositoryPrisma(prisma);
    const categoryRepo = new DocumentCategoryRepositoryPrisma(prisma);
    const fileStorage = new FileStorage();
    const documentService = new DocumentService(documentRepo, tagRepo, categoryRepo, fileStorage);

    const doc = await documentService.saveMetadata(id, parsed as UpdateMetadataData);

    return NextResponse.json({ success: true, data: doc });
  } catch (err) {
    if (err instanceof DocumentNotFoundError) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: err.message } },
        { status: 404 },
      );
    }
    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Некорректный JSON' } },
        { status: 400 },
      );
    }
    // Zod validation error
    if (typeof err === 'object' && err !== null && 'issues' in err) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Ошибка валидации', details: (err as { issues: unknown }).issues },
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' } },
      { status: 500 },
    );
  }
}
