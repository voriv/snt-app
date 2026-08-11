import * as fs from 'fs/promises';
import * as path from 'path';
import { randomBytes } from 'crypto';

/**
 * @type FileStorageResult
 * @domain documents
 * @description Результат чтения файла из хранилища
 *
 * @traces US-22-06 AC-4
 * @task DOCS-T2.6.1
 */
export interface FileStorageResult {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
}

/**
 * @type FileStorage
 * @domain documents
 * @description Утилита для сохранения, чтения и удаления файлов документов
 *
 * @spec
 * - Файлы хранятся в public/uploads/documents/
 * - Уникальное имя файла: timestamp + random suffix
 * - Защита от path traversal (проверка на ../)
 *
 * @traces US-22-03 AC-1..4, US-22-06 AC-4
 * @task DOCS-T2.6.1
 */
export class FileStorage {
  private readonly uploadDir: string;

  constructor(uploadDir?: string) {
    this.uploadDir = uploadDir ?? path.join(process.cwd(), 'public', 'uploads', 'documents');
  }

  /**
   * Сохранить файл в хранилище
   *
   * @param buffer - Буфер с содержимым файла
   * @param originalName - Оригинальное имя файла
   * @param mimeType - MIME-тип файла
   * @returns Путь к сохранённому файлу (storagePath)
   *
   * @traces US-22-03 AC-1..4
   * @task DOCS-T2.6.1
   */
  async saveFile(buffer: Buffer, originalName: string, _mimeType: string): Promise<string> {
    // Генерируем уникальное имя файла: timestamp + random suffix + расширение
    const ext = path.extname(originalName) || '.bin';
    const timestamp = Date.now();
    const suffix = randomBytes(8).toString('hex');
    const uniqueName = `${timestamp}-${suffix}${ext}`;

    // Убеждаемся, что директория существует
    await fs.mkdir(this.uploadDir, { recursive: true });

    const filePath = path.join(this.uploadDir, uniqueName);

    // Защита от path traversal: проверяем, что итоговый путь внутри uploadDir
    const resolvedPath = path.resolve(filePath);
    const resolvedDir = path.resolve(this.uploadDir);
    if (!resolvedPath.startsWith(resolvedDir)) {
      throw new Error('Обнаружена попытка path traversal');
    }

    await fs.writeFile(resolvedPath, buffer);

    // Возвращаем относительный путь для хранения в БД
    return path.join('uploads', 'documents', uniqueName).replace(/\\/g, '/');
  }

  /**
   * Получить файл из хранилища
   *
   * @param filePath - Путь к файлу (storagePath)
   * @returns Буфер, MIME-тип и оригинальное имя
   *
   * @traces US-22-06 AC-4
   * @task DOCS-T2.6.1
   */
  async getFile(filePath: string): Promise<FileStorageResult> {
    // Защита от path traversal
    const safePath = this.sanitizePath(filePath);
    const resolvedPath = path.resolve(process.cwd(), 'public', safePath);
    const resolvedDir = path.resolve(process.cwd(), 'public', 'uploads', 'documents');

    if (!resolvedPath.startsWith(resolvedDir)) {
      throw new Error('Обнаружена попытка path traversal');
    }

    const buffer = await fs.readFile(resolvedPath);
    return {
      buffer,
      mimeType: this.getMimeTypeFromPath(filePath),
      originalName: path.basename(filePath),
    };
  }

  /**
   * Удалить файл из хранилища
   *
   * @param filePath - Путь к файлу (storagePath)
   *
   * @task DOCS-T2.6.1
   */
  async deleteFile(filePath: string): Promise<void> {
    const safePath = this.sanitizePath(filePath);
    const resolvedPath = path.resolve(process.cwd(), 'public', safePath);
    const resolvedDir = path.resolve(process.cwd(), 'public', 'uploads', 'documents');

    if (!resolvedPath.startsWith(resolvedDir)) {
      throw new Error('Обнаружена попытка path traversal');
    }

    await fs.unlink(resolvedPath);
  }

  /**
   * Санитизировать путь: удалить возможные path traversal атаки
   */
  private sanitizePath(filePath: string): string {
    // Убираем возможные ../ и подобные конструкции
    const normalized = path.normalize(filePath).replace(/\\/g, '/');
    // Убираем префиксы типа uploads/ если они есть (storagePath уже содержит uploads/documents/...)
    return normalized;
  }

  /**
   * Определить MIME-тип по расширению файла
   */
  private getMimeTypeFromPath(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.webp': 'image/webp',
    };
    return mimeMap[ext] || 'application/octet-stream';
  }
}
