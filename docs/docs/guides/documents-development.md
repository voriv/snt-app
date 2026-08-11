# Руководство разработчика: Модуль управления документами

> **Модуль:** documents
> **Требование:** REQ-DOCS-001
> **User Stories:** US-22-01 — US-22-07
> **Дата обновления:** 2026-07-22

---

## Обзор

Модуль управления документами обеспечивает загрузку, хранение, категоризацию, поиск и скачивание документов в приложении СНТ. Модуль реализован в соответствии с архитектурой Clean Architecture, с чётким разделением на доменный слой, API-слой и UI-слой.

---

## 1. Архитектура

Модуль состоит из трёх слоёв:

### Доменный слой (`src/domains/documents/`)

Содержит всю бизнес-логику модуля:

| Файл | Описание |
|------|----------|
| [`document.types.ts`](src/domains/documents/document.types.ts) | Типы Document, DocumentFilter, DocumentWithDetails |
| [`document.validators.ts`](src/domains/documents/document.validators.ts) | Zod-схемы валидации документов |
| [`document.errors.ts`](src/domains/documents/document.errors.ts) | Классы ошибок: DocumentNotFound, AccessDenied, Archived и др. |
| [`document.repository.interface.ts`](src/domains/documents/document.repository.interface.ts) | Интерфейс IDocumentRepository |
| [`document.repository.prisma.ts`](src/domains/documents/document.repository.prisma.ts) | Присма-реализация репозитория |
| [`document.service.ts`](src/domains/documents/document.service.ts) | Бизнес-логика документов |
| [`category.types.ts`](src/domains/documents/category.types.ts) | Типы DocumentCategory, CategoryTreeItem |
| [`category.validators.ts`](src/domains/documents/category.validators.ts) | Zod-схемы валидации категорий |
| [`category.errors.ts`](src/domains/documents/category.errors.ts) | Классы ошибок категорий |
| [`category.repository.interface.ts`](src/domains/documents/category.repository.interface.ts) | Интерфейс IDocumentCategoryRepository |
| [`category.repository.prisma.ts`](src/domains/documents/category.repository.prisma.ts) | Присма-реализация для категорий |
| [`category.service.ts`](src/domains/documents/category.service.ts) | Бизнес-логика категорий |
| [`tag.types.ts`](src/domains/documents/tag.types.ts) | Типы DocumentTag |
| [`tag.validators.ts`](src/domains/documents/tag.validators.ts) | Zod-схемы валидации тегов |
| [`tag.repository.interface.ts`](src/domains/documents/tag.repository.interface.ts) | Интерфейс IDocumentTagRepository |
| [`tag.repository.prisma.ts`](src/domains/documents/tag.repository.prisma.ts) | Присма-реализация для тегов |
| [`tag.service.ts`](src/domains/documents/tag.service.ts) | Бизнес-логика тегов |
| [`file.storage.ts`](src/domains/documents/file.storage.ts) | Утилита сохранения/чтения файлов |
| [`index.ts`](src/domains/documents/index.ts) | Публичный API домена |

### API слой (`src/app/api/v1/documents/`)

REST-эндпоинты Next.js App Router:

| Файл | Метод | Описание |
|------|-------|----------|
| [`route.ts`](src/app/api/v1/documents/route.ts) | GET | Список документов с фильтрацией |
| [`upload/route.ts`](src/app/api/v1/documents/upload/route.ts) | POST | Загрузка файла (multipart) |
| [`[id]/route.ts`](src/app/api/v1/documents/[id]/route.ts) | GET, PUT | Детали / редактирование документа |
| [`[id]/metadata/route.ts`](src/app/api/v1/documents/[id]/metadata/route.ts) | PUT | Сохранение метаданных |
| [`[id]/download/route.ts`](src/app/api/v1/documents/[id]/download/route.ts) | GET | Скачивание файла |
| [`categories/route.ts`](src/app/api/v1/documents/categories/route.ts) | GET, POST | Дерево / создание категории |
| [`categories/[id]/route.ts`](src/app/api/v1/documents/categories/[id]/route.ts) | DELETE | Удаление категории |

### UI слой (`src/components/features/documents/`)

React-компоненты:

| Компонент | Описание |
|-----------|----------|
| `DocumentList` | Список документов (карточки) |
| `DocumentCard` | Карточка одного документа |
| `DocumentFilters` | Фильтры по категории и типу |
| `DocumentSearch` | Поле поиска с debounce |
| `DocumentDetail` | Страница деталей документа |
| `DocumentPreview` | Предпросмотр PDF/изображения |
| `DocumentUploadZone` | Drag-and-drop зона загрузки |
| `DocumentMetadataForm` | Форма метаданных |
| `DocumentEditForm` | Форма редактирования |
| `CategoryTree` | Дерево категорий |
| `CategoryForm` | Форма создания категории |
| `DeleteCategoryDialog` | Диалог удаления категории |
| `TagInput` | Ввод тегов |
| `RoleVisibilitySelector` | Чекбоксы видимости по ролям |

### Страницы (`src/app/dashboard/documents/`)

| Страница | Путь | Описание |
|----------|------|----------|
| [`page.tsx`](src/app/dashboard/documents/page.tsx) | `/dashboard/documents` | Список документов |
| [`upload/page.tsx`](src/app/dashboard/documents/upload/page.tsx) | `/dashboard/documents/upload` | Загрузка файла + метаданные |
| [`categories/page.tsx`](src/app/dashboard/documents/categories/page.tsx) | `/dashboard/documents/categories` | Управление категориями |
| [`[id]/page.tsx`](src/app/dashboard/documents/[id]/page.tsx) | `/dashboard/documents/:id` | Детали документа |
| [`[id]/edit/page.tsx`](src/app/dashboard/documents/[id]/edit/page.tsx) | `/dashboard/documents/:id/edit` | Редактирование |

### Хуки (`src/hooks/`)

| Хук | Описание |
|-----|----------|
| [`useDocuments.ts`](src/hooks/useDocuments.ts) | Загрузка и фильтрация списка |
| [`useDocumentUpload.ts`](src/hooks/useDocumentUpload.ts) | Загрузка файлов |
| [`useCategories.ts`](src/hooks/useCategories.ts) | Работа с категориями |
| [`useDocumentDetail.ts`](src/hooks/useDocumentDetail.ts) | Загрузка одного документа |

---

## 2. Модель данных

### Сущности

#### Document

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | `String` | Уникальный ID (cuid) |
| `title` | `String` | Название (1-255 символов) |
| `description` | `String?` | Описание |
| `originalName` | `String` | Имя исходного файла |
| `storagePath` | `String?` | Путь к файлу на диске |
| `fileSize` | `Int` | Размер в байтах |
| `mimeType` | `String` | MIME-тип файла |
| `categoryId` | `String?` | FK → DocumentCategory |
| `documentType` | `String` | Тип: Договор, Протокол и т.д. |
| `visibleRoles` | `Json` | JSON-массив ролей |
| `status` | `Enum` | draft, published, archived |
| `uploadedById` | `String` | FK → User |

**Связи:**
- belongs_to: User (через uploadedById)
- belongs_to: DocumentCategory (через categoryId)
- has_many: DocumentTag (через junction table)

#### DocumentCategory

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | `String` | Уникальный ID (cuid) |
| `name` | `String` | Название (1-100) |
| `description` | `String?` | Описание |
| `parentId` | `String?` | Self-ref → DocumentCategory |

**Ограничения:** @@unique([name, parentId])

#### DocumentTag

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | `String` | Уникальный ID (cuid) |
| `name` | `String` | Название (уникально, 1-50) |

---

## 3. Жизненный цикл документа

```
┌──────────┐     ┌─────────────┐     ┌──────────┐
│  UPLOAD  │ ──► │    DRAFT    │ ──► │  PUBLISHED │
│  Файл    │     │  Черновик   │     │ Опубликован│
└──────────┘     └─────────────┘     └──────────┘
                         │                   │
                         │                   │ status=archived
                         │                   ▼
                         │            ┌─────────────┐
                         │            │  ARCHIVED   │
                         │            │ Архивирован │
                         │            └─────────────┘
                         │
            visibleRoles: ["ADMIN"]
            только для администратора
```

1. **Загрузка файла** — файл сохраняется на диск, создаётся запись Document со статусом `draft`. Метаданные (title, category и т.д.) заполняются значениями по умолчанию.
2. **Сохранение метаданных** — администратор заполняет title, description, category, documentType, visibleRoles, tags. Статус меняется на `published`.
3. **Редактирование** — можно менять любые метаданные и теги. Статус можно перевести в `archived`.
4. **Архивация** — документ в статусе `archived` недоступен для редактирования, но доступен для просмотра и скачивания.

---

## 4. Валидация

### Файлы

| Правило | Описание |
|---------|----------|
| MIME-тип | Белый список: PDF, DOCX, JPG, PNG, GIF, BMP, WEBP |
| Размер | 0 < fileSize <= 100 МБ |
| Не пустой | fileSize > 0 |

### Метаданные

| Поле | Правило |
|------|---------|
| `title` | Обязательное, 1-255 символов |
| `description` | Опциональное |
| `documentType` | Обязательное, 1-50 символов |
| `visibleRoles` | Обязательное, минимум 1 роль |
| `tags` | Опциональное, максимум 10 тегов, до 50 символов каждый |

### Категории

| Поле | Правило |
|------|---------|
| `name` | Обязательное, trim, 1-100 символов, уникально в рамках родителя |
| `description` | Опциональное, до 500 символов |
| `parentId` | Опциональное, должна существовать |

---

## 5. Доступ и безопасность

### Роли и видимость

| Роль | Видит draft | Видит published | Видит archived |
|------|-------------|-----------------|----------------|
| ADMIN | ✅ | ✅ (все) | ✅ |
| MEMBER | ❌ | ✅ (свое visibleRoles) | ✅ (свое visibleRoles) |
| GUEST | ❌ | ✅ (свое visibleRoles) | ✅ (свое visibleRoles) |

### Проверка доступа

При каждом запросе к документу выполняется проверка:

1. **Аутентификация** — проверка сессии NextAuth
2. **Авторизация по роли** — для admin-операций проверяется role === 'ADMIN'
3. **Видимость документа** — проверяется visibleRoles и status:
   - `draft` — только ADMIN
   - `published` — роли из visibleRoles
   - `archived` — роли из visibleRoles

---

## 6. Хранение файлов

Файлы хранятся в директории `public/uploads/documents/` на диске. В БД сохраняется только `storagePath` (относительный путь).

### Формат имени файла

```
{cuid}-{originalName}
```

Пример: `abc123xyz-Протокол_собрания.pdf`

### FileStorage API

```typescript
class FileStorage {
  saveFile(buffer: Buffer, originalName: string, mimeType: string): Promise<string>
  getFile(path: string): Promise<{ buffer: Buffer }>
}
```

---

## 7. Как расширить модуль

### Добавление нового типа валидации

1. Определите константы в [`document.validators.ts`](src/domains/documents/document.validators.ts)
2. Обновите Zod-схемы
3. Добавьте сообщения об ошибках на русском

### Добавление нового статуса

1. Обновите тип `DocumentStatus` в [`document.types.ts`](src/domains/documents/document.types.ts)
2. Обновите enum в `prisma/schema.prisma`
3. Реализуйте бизнес-правила в [`document.service.ts`](src/domains/documents/document.service.ts)
4. Обновите логику видимости в API-роутах

### Добавление нового фильтра

1. Расширьте тип `DocumentFilter` в [`document.types.ts`](src/domains/documents/document.types.ts)
2. Добавьте поле в [`documentFiltersSchema`](src/domains/documents/document.validators.ts)
3. Реализуйте фильтрацию в [`document.repository.prisma.ts`](src/domains/documents/document.repository.prisma.ts)
4. Добавьте UI-компонент фильтра

---

## 8. Тестирование

### Unit-тесты

```
tests/unit/domains/documents/
├── document.service.test.ts
├── category.service.test.ts
└── tag.service.test.ts
```

Тестируют бизнес-логику сервисов в изоляции от БД.

### API-тесты

[`tests/api/documents.test.ts`](tests/api/documents.test.ts) — интеграционные тесты API-эндпоинтов.

### E2E-тесты

```
tests/e2e/documents/
├── documents-list.e2e.spec.ts       # Список документов
├── documents-upload.e2e.spec.ts     # Загрузка файлов
├── documents-detail.e2e.spec.ts     # Детали и скачивание
├── documents-edit.e2e.spec.ts       # Редактирование
├── documents-categories.e2e.spec.ts # Категории
└── fixtures.ts                      # Фикстуры
```

---

## 9. Зависимости

| Зависимость | Описание |
|-------------|----------|
| `REQ-AUTH-001` | Аутентификация и роли (NextAuth) |
| `Prisma` | ORM для работы с БД |
| `Zod` | Валидация данных |
| Next.js App Router | API Routes |

---

## 10. Связанные документы

- [Требования (REQ-DOCS-001)](../../requirements/REQ-DOCS-001.md)
- [Спецификация компонент](../../specs/documents/component-spec.md)
- [План реализации](../../plans/REQ-DOCS-001-realization-plan.md)
- [API-документация](../api/documents.md)
- [Модель данных: Document](../../model/entities/document.md)
- [Модель данных: DocumentCategory](../../model/entities/document-category.md)
- [Модель данных: DocumentTag](../../model/entities/document-tag.md)
