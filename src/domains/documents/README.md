# Домен: Documents

> **Требование:** REQ-DOCS-001
> **User Stories:** US-22-01 — US-22-07
> **Статус:** ✅ Реализован

---

## Описание

Домен `documents` содержит всю бизнес-логику управления документами СНТ: загрузку файлов, категоризацию, управление метаданными, тегами и контролем доступа.

---

## Структура

```
src/domains/documents/
├── index.ts                        # Публичный API домена
├── document.types.ts               # Типы: Document, DocumentFilter, DocumentWithDetails
├── document.validators.ts          # Zod-схемы валидации документов
├── document.errors.ts              # Классы ошибок документов
├── document.repository.interface.ts    # Интерфейс IDocumentRepository
├── document.repository.prisma.ts       # Присма-реализация
├── document.service.ts             # Бизнес-логика документов
├── category.types.ts               # Типы: DocumentCategory, CategoryTreeItem
├── category.validators.ts          # Zod-схемы валидации категорий
├── category.errors.ts              # Классы ошибок категорий
├── category.repository.interface.ts    # Интерфейс IDocumentCategoryRepository
├── category.repository.prisma.ts       # Присма-реализация
├── category.service.ts             # Бизнес-логика категорий
├── tag.types.ts                    # Типы: DocumentTag, TagWithName
├── tag.validators.ts               # Zod-схемы валидации тегов
├── tag.repository.interface.ts     # Интерфейс IDocumentTagRepository
├── tag.repository.prisma.ts        # Присма-реализация
├── tag.service.ts                  # Бизнес-логика тегов
└── file.storage.ts                 # Утилита сохранения/чтения файлов
```

---

## Публичный API

### Экспорт из `index.ts`

Домен экспортирует три группы сущностей:

#### Документы

| Экспорт | Тип | Описание |
|---------|-----|----------|
| `DocumentService` | Class | Основной сервис документов |
| `DocumentRepositoryPrisma` | Class | Присма-реализация репозитория |
| `Document` | Interface | Тип документа |
| `DocumentFilter` | Interface | Фильтры поиска |
| `DocumentWithDetails` | Interface | Документ с категорией, тегами, автором |
| `DocumentStatus` | Type | `'draft' | 'published' | 'archived'` |
| `CreateDocumentData` | Interface | Данные для загрузки файла |
| `UpdateMetadataData` | Interface | Данные для сохранения метаданных |
| `UpdateDocumentData` | Interface | Данные для редактирования |
| `PaginatedResult<T>` | Interface | Тип пагинации |

**Доменные ошибки:**
- `DocumentNotFoundError` — документ не найден
- `DocumentAccessDeniedError` — нет прав доступа
- `DocumentArchivedError` — архивированный документ нельзя редактировать
- `FileTooLargeError` — размер файла превышает лимит
- `UnsupportedFileTypeError` — MIME-тип не поддерживается
- `EmptyFileError` — файл с нулевым размером

#### Категории

| Экспорт | Тип | Описание |
|---------|-----|----------|
| `DocumentCategoryService` | Class | Сервис управления категориями |
| `DocumentCategory` | Interface | Тип категории |
| `CreateCategoryData` | Interface | Данные для создания |
| `CategoryTreeItem` | Interface | Узел дерева категорий |

**Доменные ошибки:**
- `CategoryNotFoundError` — категория не найдена
- `CategoryNameNotUniqueError` — дубликат имени
- `ParentCategoryNotFoundError` — родитель не найден

#### Теги

| Экспорт | Тип | Описание |
|---------|-----|----------|
| `DocumentTagService` | Class | Сервис управления тегами |
| `DocumentTag` | Interface | Тип тега |
| `TagWithName` | Interface | Упрощённый тип (id, name) |

#### Хранилище

| Экспорт | Тип | Описание |
|---------|-----|----------|
| `FileStorage` | Class | Сохранение и чтение файлов на диск |

---

## Использование

### Создание экземпляра сервиса

```typescript
import {
  DocumentService,
  DocumentRepositoryPrisma,
  DocumentTagRepositoryPrisma,
  DocumentCategoryRepositoryPrisma,
  FileStorage,
} from '@/domains/documents';
import { prisma } from '@/infrastructure/prisma/client';

// Создаём репозитории
const documentRepo = new DocumentRepositoryPrisma(prisma);
const tagRepo = new DocumentTagRepositoryPrisma(prisma);
const categoryRepo = new DocumentCategoryRepositoryPrisma(prisma);
const fileStorage = new FileStorage();

// Создаём сервис с внедрением зависимостей
const documentService = new DocumentService(documentRepo, tagRepo, categoryRepo, fileStorage);
```

### Основные операции

#### Загрузка файла

```typescript
const doc = await documentService.uploadFile({
  originalName: 'document.pdf',
  storagePath: 'documents/abc123-document.pdf',
  fileSize: 524288,
  mimeType: 'application/pdf',
  uploadedById: 'user_123',
});
// doc.status === 'draft'
```

#### Сохранение метаданных (draft → published)

```typescript
const doc = await documentService.saveMetadata(doc.id, {
  title: 'Протокол собрания',
  description: 'Ежегодное собрание СНТ',
  documentType: 'Протокол',
  categoryId: 'cat_123',
  visibleRoles: ['ADMIN', 'MEMBER'],
  tags: ['2026', 'собрание'],
});
// doc.status === 'published'
```

#### Получение списка документов

```typescript
const result = await documentService.getDocuments(
  { categoryId: 'cat_123', page: 1, limit: 20 },
  'MEMBER', // роль пользователя
);
// result.items — массив DocumentWithDetails
// result.total — общее количество
```

#### Получение одного документа

```typescript
const doc = await documentService.getDocument('doc_abc123', 'MEMBER');
// Бросает DocumentAccessDeniedError, если нет прав
```

#### Редактирование

```typescript
const updated = await documentService.updateDocument('doc_abc123', {
  title: 'Новое название',
  status: 'archived',
});
```

#### Скачивание

```typescript
const info = await documentService.getDownloadInfo('doc_abc123', 'MEMBER');
// { path: string, originalName: string, mimeType: string }
const { buffer } = await fileStorage.getFile(info.path);
```

### Категории

```typescript
import {
  DocumentCategoryService,
  DocumentCategoryRepositoryPrisma,
  DocumentRepositoryPrisma,
} from '@/domains/documents';

const categoryService = new DocumentCategoryService(
  new DocumentCategoryRepositoryPrisma(prisma),
  new DocumentRepositoryPrisma(prisma),
);

// Создание
const cat = await categoryService.create({
  name: 'Договоры',
  description: 'Юридические договоры СНТ',
});

// Получение дерева
const tree = await categoryService.getTree();

// Удаление с переносом документов
await categoryService.delete('cat_123');
```

---

## Типы данных

### Document

```typescript
interface Document {
  id: string;
  title: string;
  description: string | null;
  originalName: string;
  storagePath: string | null;
  fileSize: number;
  mimeType: string;
  categoryId: string | null;
  documentType: string;
  visibleRoles: string[];
  status: DocumentStatus;
  uploadedById: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### DocumentFilter

```typescript
interface DocumentFilter {
  categoryId?: string;
  documentType?: string;
  status?: DocumentStatus;
  search?: string;
  page?: number;
  limit?: number;
}
```

### DocumentWithDetails

```typescript
interface DocumentWithDetails extends Document {
  category: { id: string; name: string } | null;
  tags: Array<{ id: string; name: string }>;
  uploader: { id: string; name: string; email: string };
}
```

---

## Валидация

Все входные данные валидируются через Zod-схемы. При ошибке валидации бросается ZodError с сообщениями на русском языке.

| Схема | Описание |
|-------|----------|
| `createCategorySchema` | Валидация создания категории |
| `fileValidationSchema` | Валидация файла (MIME, размер) |
| `documentMetadataSchema` | Валидация метаданных при публикации |
| `updateDocumentSchema` | Валидация редактирования |
| `documentFiltersSchema` | Валидация параметров поиска |
| `tagNameSchema` | Валидация имени тега |

---

## Доменные ошибки

Все ошибки наследуются из [`src/shared/errors/`](../shared/errors/):

| Класс | Родитель | HTTP-статус |
|-------|----------|-------------|
| `DocumentNotFoundError` | `NotFoundError` | 404 |
| `DocumentAccessDeniedError` | `ForbiddenError` | 403 |
| `DocumentArchivedError` | `BusinessRuleError` | 400 |
| `FileTooLargeError` | `ValidationError` | 413 |
| `UnsupportedFileTypeError` | `ValidationError` | 400 |
| `EmptyFileError` | `ValidationError` | 400 |
| `CategoryNotFoundError` | `NotFoundError` | 404 |
| `CategoryNameNotUniqueError` | `ConflictError` | 409 |
| `ParentCategoryNotFoundError` | `NotFoundError` | 404 |

---

## Бизнес-правила

| ID | Правило |
|----|---------|
| BR-01 | Типы документов настраиваемые (free text) |
| BR-02 | Документ — в одной категории |
| BR-03 | Категории могут быть вложенными |
| BR-04 | Видимость определяется visibleRoles |
| BR-05 | Один статус одновременно |
| BR-06 | Статусы: draft, published, archived |
| BR-07 | Draft виден только ADMIN |
| BR-08 | Archived — только просмотр |
| BR-09 | Максимальный размер файла — 100 МБ |
| BR-10 | Документ может иметь теги |
| BR-11 | Поиск по названию, описанию и тегам |

---

## Зависимости

| Зависимость | Описание |
|-------------|----------|
| `@/shared/errors` | Базовые классы ошибок |
| `@/infrastructure/prisma/client` | Prisma-клиент |
| `zod` | Валидация |
| Next.js | File API (formData) |

---

## Связанные документы

- [Требования](../../docs/requirements/REQ-DOCS-001.md)
- [API-документация](../../docs/docs/api/documents.md)
- [Руководство разработчика](../../docs/docs/guides/documents-development.md)
- [Руководство пользователя](../../docs/docs/guides/documents-user.md)
- [Модель данных](../../docs/model/entities/document.md)