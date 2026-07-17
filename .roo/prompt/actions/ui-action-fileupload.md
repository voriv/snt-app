# FileUpload Action Extension

> **Расширение для:** `.roo/prompt/ui-component-prompt.md`  
> **Паттерн:** Загрузка файла с drag-and-drop, валидацией, превью и удалением  
> **Пример в проекте:** `src/components/features/userProfile/AvatarUpload/AvatarUpload.tsx`

---

## 🎯 КОГДА ИСПОЛЬЗОВАТЬ

Используй этот паттерн, когда компонент требует:

- Загрузки файла (аватар, документы, изображения)
- Drag-and-drop поддержки
- Клиентской валидации (размер, тип)
- Превью файла перед загрузкой
- Удаления файла с подтверждением

---

## 📦 PROPS-ИНТЕРФЕЙС

```typescript
/**
 * @interface FileUploadProps
 * @description Общие props для компонента загрузки файла
 *
 * @spec
 * - currentFile: URL текущего файла (null если нет)
 * - onUpload: callback для загрузки нового файла (File → void)
 * - onDelete: callback для удаления файла (void → void)
 * - isUploading: блокировка UI при загрузке
 * - isDeleting: блокировка UI при удалении
 * - maxFileSize: максимальный размер файла в байтах (default: 5MB)
 * - acceptedTypes: массив MIME-типов для валидации
 */
export interface FileUploadProps {
  /** URL текущего файла (null если нет) */
  currentFile: string | null;
  /** Callback при успешной загрузке нового файла */
  onUpload: (file: File) => void;
  /** Callback при удалении файла */
  onDelete: () => void;
  /** Флаг загрузки файла */
  isUploading: boolean;
  /** Флаг удаления файла */
  isDeleting: boolean;
  /** Максимальный размер файла в байтах @default 5*1024*1024 */
  maxFileSize?: number;
  /** Допустимые MIME-типы @default ['image/jpeg', 'image/png', 'image/gif'] */
  acceptedTypes?: string[];
  /** CSS классы для обёртки */
  className?: string;
}
```

---

## 🏗️ ШАБЛОН КОМПОНЕНТА

```typescript
'use client';

/**
 * @component <ComponentName>
 * @category features/<domain>
 * @description Компонент загрузки <файла/аватара/документа> с drag-and-drop поддержкой
 *
 * @example
 * ```tsx
 * <FileUpload
 *   currentFile={currentUrl}
 *   onUpload={handleUpload}
 *   onDelete={handleDelete}
 *   isUploading={isLoading}
 *   isDeleting={isDeleting}
 * />
 * ```
 *
 * @spec
 * - Поддерживает drag-and-drop и клик для выбора файла
 * - Клиентская валидация: размер, формат
 * - Показывает превью выбранного файла
 * - Блокировка UI при загрузке/удалении
 * - Подтверждение удаления через ConfirmDialog
 *
 * @see US-XX: <User Story>
 */
import { useState, useCallback, useRef, DragEvent, ChangeEvent, useEffect } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export interface <ComponentName>Props {
  // ... см. FileUploadProps выше
}

/** Константы валидации */
const MAX_FILE_SIZE = <bytes>;
const ACCEPTED_FILE_TYPES = [<mime_types>];

export function <ComponentName>({
  currentFile,
  onUpload,
  onDelete,
  isUploading,
  isDeleting,
  maxFileSize = MAX_FILE_SIZE,
  acceptedTypes = ACCEPTED_FILE_TYPES,
  className = '',
}: <ComponentName>Props) {
  // === СОСТОЯНИЕ ===
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Очистка preview URL при размонтировании
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // === ВАЛИДАЦИЯ ===
  /**
   * Валидация файла
   *
   * @param file - Файл для проверки
   * @returns Сообщение об ошибке или null если валиден
   */
  const validateFile = useCallback((file: File): string | null => {
    // Проверка размера
    if (file.size > maxFileSize) {
      return `Размер файла превышает ${maxFileSize / (1024 * 1024)} МБ`;
    }

    // Проверка формата
    if (!acceptedTypes.includes(file.type)) {
      return 'Неподдерживаемый формат файла';
    }

    // Проверка пустого файла
    if (file.size === 0) {
      return 'Файл не может быть пустым';
    }

    return null;
  }, [maxFileSize, acceptedTypes]);

  // === ОБРАБОТЧИКИ ФАЙЛА ===
  /**
   * Обработка выбора файла
   *
   * @param file - Выбранный файл
   */
  const handleFileSelect = useCallback(
    (file: File) => {
      setError(null);

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Создание превью
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Вызов callback загрузки
      onUpload(file);
    },
    [validateFile, onUpload]
  );

  // === DRAG-AND-DROP ===
  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // === INPUT ===
  const handleAreaClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
      // Сброс значения для повторной загрузки того же файла
      e.target.value = '';
    },
    [handleFileSelect]
  );

  // === УДАЛЕНИЕ ===
  const handleDeleteClick = useCallback(() => {
    setShowDeleteDialog(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    setShowDeleteDialog(false);
    await onDelete();
    setPreviewUrl(null);
  }, [onDelete]);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteDialog(false);
  }, []);

  // === РЕНДЕР ===
  const displayUrl = previewUrl || currentFile || null;
  const isDisabled = isUploading || isDeleting;

  return (
    <div className={className}>
      {/* Область загрузки */}
      <div
        onClick={handleAreaClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed cursor-pointer
          transition-colors duration-200
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isUploading ? 'opacity-70' : ''}
        `}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleAreaClick();
          }
        }}
        aria-label="Загрузить файл"
        aria-disabled={isUploading}
      >
        {/* Превью файла */}
        {displayUrl && (
          <img src={displayUrl} alt="Превью" className="object-cover" />
        )}

        {/* Оверлей при hover */}
        <div className={`absolute inset-0 bg-black/50 transition-opacity ${!currentFile || isDragging ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}>
          <span>{isUploading ? 'Загрузка...' : 'Загрузить'}</span>
        </div>

        {/* Спиннер загрузки */}
        {isUploading && <Spinner />}

        {/* Кнопка удаления */}
        {!isUploading && currentFile && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick();
            }}
            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full"
            aria-label="Удалить файл"
            disabled={isDeleting}
          >
            X
          </button>
        )}

        {/* Скрытый input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          className="hidden"
          disabled={isUploading}
        />
      </div>

      {/* Информация */}
      <div>
        <p className="text-sm text-gray-600">
          Поддерживаемые форматы: {acceptedTypes.map(t => t.split('/')[1]).join(', ')}
        </p>
        {error && <ErrorMessage message={error} />}
      </div>

      {/* ConfirmDialog для удаления */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={handleDeleteCancel}
        title="Удаление файла"
        message="Вы уверены, что хотите удалить файл? Это действие необратимо."
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
```

---

## 🔑 КЛЮЧЕВЫЕ ПРАВИЛА

| Правило | Описание |
|---------|----------|
| **Клиентская валидация** | Проверяй размер и тип файла перед отправкой |
| **Preview URL** | Используй `URL.createObjectURL()` для превью |
| **Очистка preview** | Вызывай `URL.revokeObjectURL()` в `useEffect` cleanup |
| **Сброс input** | Очищай `e.target.value = ''` после выбора файла |
| **Drag-and-drop** | Всегда `e.preventDefault()` + `e.stopPropagation()` |
| **ARIA** | `role="button"`, `tabIndex={0}`, `aria-label`, `aria-disabled` |
| **Подтверждение удаления** | Только через [`ConfirmDialog`](../../src/components/ui/ConfirmDialog/ConfirmDialog.tsx) |
| **Блокировка UI** | `isUploading` и `isDeleting` блокируют взаимодействие |

---

## ✅ ЧЕК-ЛИСТ

- [ ] Валидация файла (размер, тип, пустота)
- [ ] Drag-and-drop обработчики с `preventDefault`
- [ ] Preview URL через `URL.createObjectURL()`
- [ ] Cleanup preview URL в `useEffect`
- [ ] Сброс `e.target.value = ''` после выбора
- [ ] ConfirmDialog для удаления (НЕ ConfirmModal)
- [ ] `aria-label` и `aria-disabled` для доступности
- [ ] Блокировка UI при `isUploading`/`isDeleting`
- [ ] `useCallback` для всех обработчиков

---

## 🔗 РЕФЕРЕНСЫ

| Ресурс | Файл |
|--------|------|
| Реальный пример | [`AvatarUpload.tsx`](../../src/components/features/userProfile/AvatarUpload/AvatarUpload.tsx) |
| ConfirmDialog | [`ConfirmDialog.tsx`](../../src/components/ui/ConfirmDialog/ConfirmDialog.tsx) |
| apiClient.postFormData | [`api-client.ts`](../../src/lib/api-client.ts) |

---

**Последнее обновление:** 2026-07-16
