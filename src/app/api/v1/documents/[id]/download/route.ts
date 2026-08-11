import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DocumentService } from '@/domains/documents/document.service';
import { DocumentRepositoryPrisma } from '@/domains/documents/document.repository.prisma';
import { DocumentTagRepositoryPrisma } from '@/domains/documents/tag.repository.prisma';
import { DocumentCategoryRepositoryPrisma } from '@/domains/documents/category.repository.prisma';
import { FileStorage } from '@/domains/documents/file.storage';
import { prisma } from '@/infrastructure/prisma/client';
import {
  DocumentNotFoundError,
  DocumentAccessDeniedError,
} from '@/domains/documents/document.errors';

/**
 * @route GET /api/v1/documents/[id]/download
 * @auth authenticated
 * @response 200 File (streaming)
 * @description Скачать файл документа
 *
 * @spec
 * - Проверка доступа по роли
 * - Чтение файла из storage
 * - Content-Disposition: attachment; filename="..."
 *
 * @traces US-22-06 AC-4
 * @task DOCS-T3.2.6
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

    // Получаем информацию о файле (с проверкой доступа)
    const info = await documentService.getDownloadInfo(id, userRole);

    // Читаем файл из хранилища
    const fileData = await fileStorage.getFile(info.path);

    // Возвращаем файл как response
    return new NextResponse(fileData.buffer, {
      status: 200,
      headers: {
        'Content-Type': info.mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(info.originalName)}"`,
        'Content-Length': String(fileData.buffer.length),
      },
    });
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
