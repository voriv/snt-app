import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DocumentService } from '@/domains/documents/document.service';
import { DocumentRepositoryPrisma } from '@/domains/documents/document.repository.prisma';
import { DocumentTagRepositoryPrisma } from '@/domains/documents/tag.repository.prisma';
import { DocumentCategoryRepositoryPrisma } from '@/domains/documents/category.repository.prisma';
import { FileStorage } from '@/domains/documents/file.storage';
import { prisma } from '@/infrastructure/prisma/client';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
} from '@/domains/documents/document.validators';
import {
  EmptyFileError,
  FileTooLargeError,
  UnsupportedFileTypeError,
} from '@/domains/documents/document.errors';

/**
 * @route POST /api/v1/documents/upload
 * @auth admin
 * @body multipart/form-data (file)
 * @response 201 { success: true, data: Document }
 * @description Загрузить файл документа и создать черновик
 *
 * @spec
 * - Авторизация: только ADMIN
 * - Чтение файла из FormData → Buffer
 * - Валидация: тип MIME, размер, не пустой
 * - Сохранение в storage, создание draft записи
 *
 * @traces US-22-03 AC-1..6
 * @task DOCS-T3.2.2
 */
export async function POST(request: Request) {
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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Файл не предоставлен' } },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileSize = buffer.length;
    const mimeType = file.type;
    const originalName = file.name;

    // Валидация: пустой файл
    if (fileSize === 0) {
      throw new EmptyFileError();
    }

    // Валидация: MIME тип
    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)) {
      throw new UnsupportedFileTypeError(mimeType);
    }

    // Валидация: размер
    if (fileSize > MAX_FILE_SIZE) {
      throw new FileTooLargeError(fileSize, MAX_FILE_SIZE);
    }

    const fileStorage = new FileStorage();
    const documentRepo = new DocumentRepositoryPrisma(prisma);
    const tagRepo = new DocumentTagRepositoryPrisma(prisma);
    const categoryRepo = new DocumentCategoryRepositoryPrisma(prisma);
    const documentService = new DocumentService(documentRepo, tagRepo, categoryRepo, fileStorage);

    // Сохраняем файл на диск
    const storagePath = await fileStorage.saveFile(buffer, originalName, mimeType);

    // Создаём запись в БД (draft)
    const doc = await documentService.uploadFile({
      originalName,
      storagePath,
      fileSize,
      mimeType,
      uploadedById: session.user.id,
    });

    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch (err) {
    if (err instanceof EmptyFileError) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: err.message } },
        { status: 400 },
      );
    }
    if (err instanceof UnsupportedFileTypeError) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: err.message } },
        { status: 400 },
      );
    }
    if (err instanceof FileTooLargeError) {
      return NextResponse.json(
        { success: false, error: { code: 'FILE_TOO_LARGE', message: err.message } },
        { status: 413 },
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' } },
      { status: 500 },
    );
  }
}
