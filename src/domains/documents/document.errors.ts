import { NotFoundError } from '@/shared/errors/NotFoundError';
import { ForbiddenError } from '@/shared/errors/ForbiddenError';
import { BusinessRuleError } from '@/shared/errors/BusinessRuleError';
import { ValidationError } from '@/shared/errors/ValidationError';

/**
 * @error DocumentNotFoundError
 * @domain documents
 * @description Ошибка, когда документ не найден по ID
 *
 * @spec
 * - Возвращается при findById, getDocument, updateDocument, getDownloadInfo
 * - HTTP 404
 *
 * @traces US-22-03..US-22-07
 * @task DOCS-T2.3.2
 */
export class DocumentNotFoundError extends NotFoundError {
  constructor(id: string) {
    super('Документ', id);
    this.name = 'DocumentNotFoundError';
  }
}

/**
 * @error DocumentAccessDeniedError
 * @domain documents
 * @description Ошибка, когда у пользователя нет прав на просмотр документа
 *
 * @spec
 * - Проверка: userRole ∈ visibleRoles (BR-04)
 * - Проверка: status != 'draft' OR userRole = 'ADMIN' (BR-07)
 * - HTTP 403
 *
 * @traces US-22-06 AC-5, AC-6
 * @task DOCS-T2.3.2
 */
export class DocumentAccessDeniedError extends ForbiddenError {
  constructor(documentId: string, userRole: string) {
    super(`У вас нет доступа к этому документу`);
    this.name = 'DocumentAccessDeniedError';
  }
}

/**
 * @error DocumentArchivedError
 * @domain documents
 * @description Ошибка при попытке редактировать архивированный документ
 *
 * @spec
 * - Архивированный документ недоступен для редактирования (BR-08)
 * - Только просмотр и скачивание
 * - HTTP 400
 *
 * @traces US-22-07 AC-7
 * @task DOCS-T2.3.2
 */
export class DocumentArchivedError extends BusinessRuleError {
  constructor(id: string) {
    super('Архивированные документы недоступны для редактирования');
    this.name = 'DocumentArchivedError';
  }
}

/**
 * @error FileTooLargeError
 * @domain documents
 * @description Ошибка, когда размер файла превышает максимально допустимый
 *
 * @spec
 * - Настраиваемый лимит в конфигурации (BR-09)
 * - HTTP 413
 *
 * @traces US-22-03 AC-5
 * @task DOCS-T2.3.2
 */
export class FileTooLargeError extends ValidationError {
  constructor(actualSize: number, maxSize: number) {
    super(`Размер файла превышает допустимый лимит (${maxSize / 1_048_576} МБ)`);
    this.name = 'FileTooLargeError';
  }
}

/**
 * @error UnsupportedFileTypeError
 * @domain documents
 * @description Ошибка, когда MIME-тип файла не в белом списке
 *
 * @spec
 * - Поддерживаются: PDF, DOCX, JPG, PNG, GIF, BMP, WEBP
 * - HTTP 400
 *
 * @traces US-22-03 AC-4
 * @task DOCS-T2.3.2
 */
export class UnsupportedFileTypeError extends ValidationError {
  constructor(mimeType: string) {
    super(
      'Файлы этого типа не поддерживаются. Допустимые типы: PDF, DOCX, JPG, PNG, GIF, BMP, WEBP',
    );
    this.name = 'UnsupportedFileTypeError';
  }
}

/**
 * @error EmptyFileError
 * @domain documents
 * @description Ошибка, когда загружаемый файл имеет нулевой размер
 *
 * @spec
 * - fileSize должен быть > 0
 * - HTTP 400
 *
 * @traces US-22-03 AC-6
 * @task DOCS-T2.3.2
 */
export class EmptyFileError extends ValidationError {
  constructor() {
    super('Файл не может быть пустым');
    this.name = 'EmptyFileError';
  }
}
