import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DocumentService } from '@/domains/documents/document.service';
import { DocumentRepositoryPrisma } from '@/domains/documents/document.repository.prisma';
import { DocumentTagRepositoryPrisma } from '@/domains/documents/tag.repository.prisma';
import { DocumentCategoryRepositoryPrisma } from '@/domains/documents/category.repository.prisma';
import { FileStorage } from '@/domains/documents/file.storage';
import { prisma } from '@/infrastructure/prisma/client';
import { updateDocumentSchema } from '@/domains/documents/document.validators';
import {
  DocumentNotFoundError,
  DocumentAccessDeniedError,
  DocumentArchivedError,
} from '@/domains/documents/document.errors';

/**
 * @route GET /api/v1/documents/[id]
 * @auth authenticated
 * @response 200 { success: true, data: DocumentWithDetails }
 * @description Получить детали документа с проверкой доступа
 *
 * @spec
 * - Проверка доступа по роли
 * - DocumentAccessDeniedError → 403
 * - DocumentNotFoundError → 404
 *
 * @traces US-22-06 AC-1..7
 * @task DOCS-T3.2.4
 */
export async function GET(
  _request: Request,
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

    const userRoles = session.user.roles ?? [];
    const userRole = userRoles.includes('ADMIN') ? 'ADMIN' : (userRoles[0] ?? 'USER');
    const { id } = params;

    const documentRepo = new DocumentRepositoryPrisma(prisma);
    const tagRepo = new DocumentTagRepositoryPrisma(prisma);
    const categoryRepo = new DocumentCategoryRepositoryPrisma(prisma);
    const fileStorage = new FileStorage();
    const documentService = new DocumentService(documentRepo, tagRepo, categoryRepo, fileStorage);

    const doc = await documentService.getDocument(id, userRole);

    return NextResponse.json({ success: true, data: doc });
  } catch (err) {
    if (err instanceof DocumentNotFoundError) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: err.message } },
        { status: 404 },
      );
    }
    if (err instanceof DocumentAccessDeniedError) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: err.message } },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' } },
      { status: 500 },
    );
  }
}

/**
 * @route PUT /api/v1/documents/[id]
 * @auth admin
 * @body UpdateDocumentData
 * @response 200 { success: true, data: Document }
 * @description Редактировать метаданные документа
 *
 * @spec
 * - Авторизация: ADMIN
 * - Проверка: status != 'archived'
 * - DocumentArchivedError → 400
 *
 * @traces US-22-07 AC-1..8
 * @task DOCS-T3.2.5
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
    const parsed = updateDocumentSchema.parse(body);

    const documentRepo = new DocumentRepositoryPrisma(prisma);
    const tagRepo = new DocumentTagRepositoryPrisma(prisma);
    const categoryRepo = new DocumentCategoryRepositoryPrisma(prisma);
    const fileStorage = new FileStorage();
    const documentService = new DocumentService(documentRepo, tagRepo, categoryRepo, fileStorage);

    const doc = await documentService.updateDocument(id, parsed);

    return NextResponse.json({ success: true, data: doc });
  } catch (err) {
    if (err instanceof DocumentNotFoundError) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: err.message } },
        { status: 404 },
      );
    }
    if (err instanceof DocumentArchivedError) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: err.message } },
        { status: 400 },
      );
    }
    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Некорректный JSON' } },
        { status: 400 },
      );
    }
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
