# Спецификация компонент: Модуль управления документами

> **Назначение:** Спецификация компонент и скелетов кода для [REQ-DOCS-001](../../plans/REQ-DOCS-001-realization-plan.md)
> **Создано:** `component-spec` режим
> **Статус:** `[DRAFT]`

---

## 1. 📋 Метаданные

| Параметр | Значение |
|---|---|
| **Feature** | `documents` |
| **План реализации** | [`docs/plans/REQ-DOCS-001-realization-plan.md`](../../plans/REQ-DOCS-001-realization-plan.md) |
| **User Stories** | US-22-01, US-22-02, US-22-03, US-22-04, US-22-05, US-22-06, US-22-07 |
| **Требования** | REQ-DOCS-001 |
| **Модель данных** | [`docs/model/entities/document.md`](../../model/entities/document.md), [`document-category.md`](../../model/entities/document-category.md), [`document-tag.md`](../../model/entities/document-tag.md) |
| **Версия** | `v1.0` |
| **Дата** | `2026-07-22` |
| **Статус** | `[DRAFT]` |

---

## 2. 📊 Матрица трассировки

> Каждая строка связывает компонент с требованиями. Без строки в матрице — нет компонента.
> Действия: 🆕 — создать файл, ✏️ — добавить в существующий, 🔧 — изменить существующее.

### 2.1 Domain Layer

| # | Компонент | Слой | Действие | US | AC | Задача | Статус |
|---|---|---|---|---|---|---|---|
| 1 | `CategoryTypes` | Domain | 🆕 | US-22-01, US-22-02 | AC-1..5 | `DOCS-T2.1.1` | `[TODO]` |
| 2 | `DocumentTypes` | Domain | 🆕 | US-22-03..US-22-07 | AC-1..9 | `DOCS-T2.1.2` | `[TODO]` |
| 3 | `TagTypes` | Domain | 🆕 | US-22-04, US-22-07 | AC-1..5 | `DOCS-T2.1.3` | `[TODO]` |
| 4 | `CategoryValidators` | Domain | 🆕 | US-22-01 | AC-3, AC-4 | `DOCS-T2.2.1` | `[TODO]` |
| 5 | `DocumentValidators` | Domain | 🆕 | US-22-03, US-22-04, US-22-05, US-22-07 | AC-1..9 | `DOCS-T2.2.2` | `[TODO]` |
| 6 | `TagValidators` | Domain | 🆕 | US-22-04, US-22-07 | AC-3, AC-4 | `DOCS-T2.2.3` | `[TODO]` |
| 7 | `CategoryErrors` | Domain | 🆕 | US-22-01, US-22-02 | AC-4..5 | `DOCS-T2.3.1` | `[TODO]` |
| 8 | `DocumentErrors` | Domain | 🆕 | US-22-03, US-22-06, US-22-07 | AC-4..7 | `DOCS-T2.3.2` | `[TODO]` |
| 9 | `IDocumentCategoryRepository` | Domain | 🆕 | US-22-01, US-22-02 | AC-1..5 | `DOCS-T2.4.1` | `[TODO]` |
| 10 | `IDocumentRepository` | Domain | 🆕 | US-22-03..US-22-07 | AC-1..9 | `DOCS-T2.4.2` | `[TODO]` |
| 11 | `IDocumentTagRepository` | Domain | 🆕 | US-22-04, US-22-07 | AC-1..5 | `DOCS-T2.4.3` | `[TODO]` |
| 12 | `DocumentCategoryRepositoryPrisma` | Domain | 🆕 | US-22-01, US-22-02 | AC-1..5 | `DOCS-T2.5.1` | `[TODO]` |
| 13 | `DocumentRepositoryPrisma` | Domain | 🆕 | US-22-03..US-22-07 | AC-1..9 | `DOCS-T2.5.2` | `[TODO]` |
| 14 | `DocumentTagRepositoryPrisma` | Domain | 🆕 | US-22-04, US-22-07 | AC-1..5 | `DOCS-T2.5.3` | `[TODO]` |
| 15 | `FileStorage` | Domain | 🆕 | US-22-03, US-22-06 | AC-1..4 | `DOCS-T2.6.1` | `[TODO]` |
| 16 | `DocumentCategoryService` | Domain | 🆕 | US-22-01, US-22-02 | AC-1..5 | `DOCS-T2.7.1` | `[TODO]` |
| 17 | `DocumentService` | Domain | 🆕 | US-22-03..US-22-07 | AC-1..9 | `DOCS-T2.7.2` | `[TODO]` |
| 18 | `DocumentTagService` | Domain | 🆕 | US-22-04, US-22-07 | AC-1..5 | `DOCS-T2.7.3` | `[TODO]` |
| 19 | `DomainIndex` | Domain | 🆕 | Все | Все | `DOCS-T2.8.1` | `[TODO]` |

### 2.2 API Layer

| # | Компонент | Слой | Действие | US | AC | Задача | Статус |
|---|---|---|---|---|---|---|---|
| 20 | `CategoriesRoute` (GET, POST) | API | 🆕 | US-22-01, US-22-05 | AC-1..5 | `DOCS-T3.1.1`, `DOCS-T3.1.2` | `[TODO]` |
| 21 | `CategoryDetailRoute` (DELETE) | API | 🆕 | US-22-02 | AC-1..5 | `DOCS-T3.1.3` | `[TODO]` |
| 22 | `DocumentsRoute` (GET) | API | 🆕 | US-22-05 | AC-1..9 | `DOCS-T3.2.1` | `[TODO]` |
| 23 | `UploadRoute` (POST multipart) | API | 🆕 | US-22-03 | AC-1..6 | `DOCS-T3.2.2` | `[TODO]` |
| 24 | `MetadataRoute` (PUT) | API | 🆕 | US-22-04 | AC-1..5 | `DOCS-T3.2.3` | `[TODO]` |
| 25 | `DocumentDetailRoute` (GET, PUT) | API | 🆕 | US-22-06, US-22-07 | AC-1..7 | `DOCS-T3.2.4`, `DOCS-T3.2.5` | `[TODO]` |
| 26 | `DownloadRoute` (GET) | API | 🆕 | US-22-06 | AC-4 | `DOCS-T3.2.6` | `[TODO]` |

### 2.3 Hooks

| # | Компонент | Слой | Действие | US | AC | Задача | Статус |
|---|---|---|---|---|---|---|---|
| 27 | `useDocuments` | Hook | 🆕 | US-22-05 | AC-1..9 | `DOCS-T4.1.1` | `[TODO]` |
| 28 | `useDocumentUpload` | Hook | 🆕 | US-22-03 | AC-1..6 | `DOCS-T4.1.2` | `[TODO]` |
| 29 | `useCategories` | Hook | 🆕 | US-22-01, US-22-02 | AC-1..5 | `DOCS-T4.1.3` | `[TODO]` |
| 30 | `useDocumentDetail` | Hook | 🆕 | US-22-06 | AC-1..7 | `DOCS-T4.1.4` | `[TODO]` |

### 2.4 UI Layer

| # | Компонент | Слой | Действие | US | AC | Задача | Статус |
|---|---|---|---|---|---|---|---|
| 31 | `DocumentList` | UI | 🆕 | US-22-05 | AC-1..9 | `DOCS-T4.2.1` | `[TODO]` |
| 32 | `DocumentFilters` | UI | 🆕 | US-22-05 | AC-4, AC-5 | `DOCS-T4.2.2` | `[TODO]` |
| 33 | `DocumentSearch` | UI | 🆕 | US-22-05 | AC-6, AC-7 | `DOCS-T4.2.3` | `[TODO]` |
| 34 | `DocumentCard` | UI | 🆕 | US-22-05 | AC-9 | `DOCS-T4.2.4` | `[TODO]` |
| 35 | `DocumentDetail` | UI | 🆕 | US-22-06 | AC-1..7 | `DOCS-T4.2.5` | `[TODO]` |
| 36 | `DocumentPreview` | UI | 🆕 | US-22-06 | AC-2, AC-3 | `DOCS-T4.2.6` | `[TODO]` |
| 37 | `DocumentUploadZone` | UI | 🆕 | US-22-03 | AC-1..6 | `DOCS-T4.2.7` | `[TODO]` |
| 38 | `DocumentMetadataForm` | UI | 🆕 | US-22-04 | AC-1..5 | `DOCS-T4.2.8` | `[TODO]` |
| 39 | `DocumentEditForm` | UI | 🆕 | US-22-07 | AC-1..8 | `DOCS-T4.2.9` | `[TODO]` |
| 40 | `CategoryTree` | UI | 🆕 | US-22-01 | AC-1, AC-2 | `DOCS-T4.2.10` | `[TODO]` |
| 41 | `CategoryForm` | UI | 🆕 | US-22-01 | AC-1..5 | `DOCS-T4.2.11` | `[TODO]` |
| 42 | `DeleteCategoryDialog` | UI | 🆕 | US-22-02 | AC-1..5 | `DOCS-T4.2.12` | `[TODO]` |
| 43 | `TagInput` | UI | 🆕 | US-22-04, US-22-07 | AC-4 | `DOCS-T4.2.13` | `[TODO]` |
| 44 | `RoleVisibilitySelector` | UI | 🆕 | US-22-04, US-22-07 | AC-3, AC-5 | `DOCS-T4.2.14` | `[TODO]` |
| 45 | `UIIndex` | UI | 🆕 | Все | Все | `DOCS-T4.2.15` | `[TODO]` |

### 2.5 Pages

| # | Компонент | Слой | Действие | US | AC | Задача | Статус |
|---|---|---|---|---|---|---|---|
| 46 | `/dashboard/documents/page.tsx` | Page | 🆕 | US-22-05 | AC-1..9 | `DOCS-T4.3.1` | `[TODO]` |
| 47 | `/dashboard/documents/upload/page.tsx` | Page | 🆕 | US-22-03, US-22-04 | AC-1..6 | `DOCS-T4.3.2` | `[TODO]` |
| 48 | `/dashboard/documents/categories/page.tsx` | Page | 🆕 | US-22-01, US-22-02 | AC-1..5 | `DOCS-T4.3.3` | `[TODO]` |
| 49 | `/dashboard/documents/[id]/page.tsx` | Page | 🆕 | US-22-06 | AC-1..7 | `DOCS-T4.3.4` | `[TODO]` |
| 50 | `/dashboard/documents/[id]/edit/page.tsx` | Page | 🆕 | US-22-07 | AC-1..8 | `DOCS-T4.3.5` | `[TODO]` |

---

### Проверка покрытия AC

| US | AC | Покрыт в строке | Статус |
|---|---|---|---|
| US-22-01 | AC-1 (создание корневой) | #16, #20, #41, #48 | ✅ |
| US-22-01 | AC-2 (создание подкатегории) | #16, #20, #41 | ✅ |
| US-22-01 | AC-3 (валидация пустого name) | #4, #41 | ✅ |
| US-22-01 | AC-4 (уникальность name+parent) | #7, #16 | ✅ |
| US-22-01 | AC-5 (валидация parentId) | #7, #16 | ✅ |
| US-22-02 | AC-1 (удаление пустой) | #16, #21, #42 | ✅ |
| US-22-02 | AC-2 (перенос в родителя) | #16 | ✅ |
| US-22-02 | AC-3 (перенос в null) | #16 | ✅ |
| US-22-02 | AC-4 (перепривязка подкатегорий) | #16 | ✅ |
| US-22-02 | AC-5 (404 при повторном) | #7, #16, #21 | ✅ |
| US-22-03 | AC-1 (загрузка PDF) | #15, #17, #23, #37 | ✅ |
| US-22-03 | AC-2 (загрузка DOCX) | #5, #23 | ✅ |
| US-22-03 | AC-3 (загрузка изображений) | #5, #23 | ✅ |
| US-22-03 | AC-4 (отклонение типа) | #8, #23 | ✅ |
| US-22-03 | AC-5 (отклонение размера) | #8, #23 | ✅ |
| US-22-03 | AC-6 (отклонение пустого) | #8, #23 | ✅ |
| US-22-04 | AC-1 (сохранение метаданных) | #17, #24, #38 | ✅ |
| US-22-04 | AC-2 (валидация названия) | #5, #38 | ✅ |
| US-22-04 | AC-3 (ограниченная видимость) | #2, #17, #44 | ✅ |
| US-22-04 | AC-4 (привязка тегов) | #17, #18, #43 | ✅ |
| US-22-04 | AC-5 (draft → published) | #17 | ✅ |
| US-22-05 | AC-1 (список по роли) | #17, #22, #46 | ✅ |
| US-22-05 | AC-2 (ADMIN видит все) | #10, #17 | ✅ |
| US-22-05 | AC-3 (ADMIN видит draft) | #10, #17 | ✅ |
| US-22-05 | AC-4 (фильтр по категории) | #10, #17, #32 | ✅ |
| US-22-05 | AC-5 (фильтр по типу) | #10, #17, #32 | ✅ |
| US-22-05 | AC-6 (поиск по названию) | #10, #17, #33 | ✅ |
| US-22-05 | AC-7 (поиск по тегам) | #10, #17 | ✅ |
| US-22-05 | AC-8 (пустое состояние) | #31 | ✅ |
| US-22-05 | AC-9 (сортировка DESC) | #10 | ✅ |
| US-22-06 | AC-1 (метаданные в карточке) | #25, #35 | ✅ |
| US-22-06 | AC-2 (предпросмотр PDF) | #35, #36 | ✅ |
| US-22-06 | AC-3 (предпросмотр изображения) | #35, #36 | ✅ |
| US-22-06 | AC-4 (скачивание) | #26, #35 | ✅ |
| US-22-06 | AC-5 (403 без прав) | #17, #25 | ✅ |
| US-22-06 | AC-6 (draft не виден не-ADMIN) | #17, #25 | ✅ |
| US-22-06 | AC-7 (archived — только просмотр) | #17, #25 | ✅ |
| US-22-07 | AC-1 (редактирование названия) | #17, #25, #39 | ✅ |
| US-22-07 | AC-2 (изменение категории) | #17, #25 | ✅ |
| US-22-07 | AC-3 (добавление тега) | #17, #18, #25 | ✅ |
| US-22-07 | AC-4 (удаление тега) | #17, #18, #25 | ✅ |
| US-22-07 | AC-5 (изменение видимости) | #17, #25 | ✅ |
| US-22-07 | AC-6 (архивация) | #17, #25 | ✅ |
| US-22-07 | AC-7 (блокировка archived) | #8, #17, #50 | ✅ |
| US-22-07 | AC-8 (валидация названия) | #5, #39 | ✅ |

---

## 3. 🏗️ Спецификация по слоям

---

### 3.1 Domain Layer

---

#### 3.1.1 `CategoryTypes`

| Параметр | Значение |
|---|---|
| **Файл** | `src/domains/documents/category.types.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T2.1.1` |
| **Трассировка** | US-22-01 AC-1..5, US-22-02 AC-1..5 → FR-01, FR-02, FR-03 |

**Интерфейсы:**

| Интерфейс | Описание | Поля |
|---|---|---|
| `DocumentCategory` | Полная сущность категории | `id`, `name`, `description?`, `parentId?`, `createdAt`, `updatedAt` |
| `CreateCategoryData` | Данные для создания | `name`, `description?`, `parentId?` |
| `CategoryTreeItem` | Категория с детьми (для UI-дерева) | `id`, `name`, `description?`, `children: CategoryTreeItem[]` |

**Инварианты:**

- `name` уникально в рамках одного родителя (`@@unique([name, parentId])`)
- `parentId` — self-reference на `DocumentCategory.id`; `null` = корневая категория

---

#### 3.1.2 `DocumentTypes`

| Параметр | Значение |
|---|---|
| **Файл** | `src/domains/documents/document.types.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T2.1.2` |
| **Трассировка** | US-22-03..US-22-07 → FR-04..FR-18 |

**Интерфейсы:**

| Интерфейс | Описание | Поля |
|---|---|---|
| `Document` | Полная сущность документа | `id`, `title`, `description?`, `originalName`, `storagePath?`, `fileSize`, `mimeType`, `categoryId?`, `documentType`, `visibleRoles: string[]`, `status`, `uploadedById`, `createdAt`, `updatedAt` |
| `CreateDocumentData` | Данные для загрузки файла | `originalName`, `storagePath`, `fileSize`, `mimeType`, `uploadedById` |
| `UpdateMetadataData` | Метаданные после загрузки | `title`, `description?`, `categoryId?`, `documentType`, `visibleRoles`, `tags?`, `status?` |
| `UpdateDocumentData` | Данные для редактирования | Все поля UpdateMetadataData (опционально кроме title/documentType) |
| `DocumentFilter` | Фильтры поиска и пагинации | `categoryId?`, `documentType?`, `status?`, `search?`, `page?`, `limit?` |
| `DocumentWithDetails` | Document + category + tags + uploader | `Document` + `category?`, `tags: DocumentTag[]`, `uploader: { id, name, email }` |
| `PaginatedResult<T>` | Общий тип пагинации | `items: T[]`, `total: number`, `page: number`, `limit: number` |

**Типы (enum/union):**

| Тип | Значения | Описание |
|---|---|---|
| `DocumentStatus` | `'draft' | 'published' | 'archived'` | Статус документа (BR-06) |

**Инварианты:**

- `visibleRoles` всегда содержит минимум 1 роль (BR-04)
- `status` определяет видимость: draft — только ADMIN, archived — только просмотр (BR-07, BR-08)
- Документ может находиться только в одной категории (BR-02)

---

#### 3.1.3 `TagTypes`

| Параметр | Значение |
|---|---|
| **Файл** | `src/domains/documents/tag.types.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T2.1.3` |
| **Трассировка** | US-22-04 AC-4, US-22-07 AC-3, AC-4 → FR-17, FR-18 |

**Интерфейсы:**

| Интерфейс | Описание | Поля |
|---|---|---|
| `DocumentTag` | Полный тег | `id`, `name`, `createdAt` |
| `TagWithName` | Упрощённый тег (для UI) | `id`, `name` |

**Инварианты:**

- `name` уникален глобально (`@unique`)

---

#### 3.1.4 `CategoryValidators`

| Параметр | Значение |
|---|---|
| **Файл** | `src/domains/documents/category.validators.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T2.2.1` |
| **Трассировка** | US-22-01 AC-3, AC-4 → BR-03 |

**Схемы:**

| Схема | Валидирует | Правила |
|---|---|---|
| `createCategorySchema` | `CreateCategoryData` | name: min(1), max(100); description: max(500)?; parentId: string? |

**Правила валидации:**

| Поле | Правило | Сообщение об ошибке |
|---|---|---|
| `name` | trim, min 1, max 100, обязательное | "Название категории обязательно" / "Название не должно превышать 100 символов" |
| `description` | max 500, опционально, empty → null | "Описание не может превышать 500 символов" |
| `parentId` | string, опционально | — |

---

#### 3.1.5 `DocumentValidators`

| Параметр | Значение |
|---|---|
| **Файл** | `src/domains/documents/document.validators.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T2.2.2` |
| **Трассировка** | US-22-03 AC-1..6, US-22-04 AC-1..5, US-22-05 AC-1..9, US-22-07 AC-1..8 |

**Схемы:**

| Схема | Валидирует | Правила |
|---|---|---|
| `fileValidationSchema` | mimeType, fileSize | mimeType в белом списке, fileSize > 0 && <= MAX_FILE_SIZE |
| `documentMetadataSchema` | `UpdateMetadataData` | title обязательный, documentType обязательный, visibleRoles min(1), tags max(10) |
| `updateDocumentSchema` | `UpdateDocumentData` | Все поля опциональны |
| `documentFiltersSchema` | `DocumentFilter` | categoryId?, documentType?, status?, search?, page (1..100), limit (1..100)? |

**Константы:**

| Константа | Описание |
|---|---|
| `ALLOWED_MIME_TYPES` | Белый список MIME: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `image/jpeg`, `image/png`, `image/gif`, `image/bmp`, `image/webp` |
| `MAX_FILE_SIZE` | Максимальный размер (100 МБ = 104_857_600 байт) |

**Правила валидации:**

| Поле | Правило | Сообщение об ошибке |
|---|---|---|
| `title` | min 1, max 255, обязательное | "Название документа обязательно" |
| `description` | text, опционально, empty → null | — |
| `documentType` | min 1, max 50, обязательное | "Тип документа обязателен" |
| `visibleRoles` | array of strings, min 1 | "Выберите хотя бы одну роль для доступа" |
| `tags` | array of strings, max 10, each max 50 | "Максимум 10 тегов" / "Тег не может превышать 50 символов" |
| `mimeType` | in ALLOWED_MIME_TYPES | "Файлы этого типа не поддерживаются..." |
| `fileSize` | > 0 && <= MAX | "Файл не может быть пустым" / "Размер файла превышает допустимый лимит" |

---

#### 3.1.6 `TagValidators`

| Параметр | Значение |
|---|---|
| **Файл** | `src/domains/documents/tag.validators.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T2.2.3` |
| **Трассировка** | US-22-04 AC-4, US-22-07 AC-3 |

**Схемы:**

| Схема | Валидирует | Правила |
|---|---|---|
| `tagNameSchema` | `name: string` | string, min(1), max(50) |

---

#### 3.1.7 `CategoryErrors`

| Параметр | Значение |
|---|---|
| **Файл** | `src/domains/documents/category.errors.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T2.3.1` |
| **Трассировка** | US-22-01 AC-4, AC-5; US-22-02 AC-5 |

**Классы ошибок:**

| Класс | Наследуется от | Сценарий | HTTP Status | Сообщение |
|---|---|---|---|---|
| `CategoryNotFoundError` | `NotFoundError` | Категория не найдена по ID | 404 | `"Категория с id {id} не найдена"` |
| `CategoryNameNotUniqueError` | `ConflictError` | Дубликат name+parentId | 409 | `"Категория с таким названием уже существует на этом уровне"` |
| `ParentCategoryNotFoundError` | `NotFoundError` | Родительская категория не найдена | 404 | `"Родительская категория не найдена"` |

---

#### 3.1.8 `DocumentErrors`

| Параметр | Значение |
|---|---|
| **Файл** | `src/domains/documents/document.errors.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T2.3.2` |
| **Трассировка** | US-22-03 AC-4..6, US-22-06 AC-5..7, US-22-07 AC-7 |

**Классы ошибок:**

| Класс | Наследуется от | Сценарий | HTTP Status | Сообщение |
|---|---|---|---|---|
| `DocumentNotFoundError` | `NotFoundError` | Документ не найден по ID | 404 | `"Документ с id {id} не найден"` |
| `DocumentAccessDeniedError` | `ForbiddenError` | Нет прав доступа (роль не в visibleRoles) | 403 | `"У вас нет доступа к этому документу"` |
| `DocumentArchivedError` | `BusinessRuleError` | Архивный документ нельзя редактировать (BR-08) | 400 | `"Архивированные документы недоступны для редактирования"` |
| `FileTooLargeError` | `ValidationError` | Размер > лимита (BR-09) | 413 | `"Размер файла превышает допустимый лимит ({maxMB} МБ)"` |
| `UnsupportedFileTypeError` | `ValidationError` | MIME не в белом списке | 400 | `"Файлы этого типа не поддерживаются. Допустимые типы: PDF, DOCX, JPG, PNG, GIF, BMP, WEBP"` |
| `EmptyFileError` | `ValidationError` | Размер 0 | 400 | `"Файл не может быть пустым"` |

---

#### 3.1.9 `IDocumentCategoryRepository`

| Параметр | Значение |
|---|---|
| **Файл** | `src/domains/documents/category.repository.interface.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T2.4.1` |
| **Трассировка** | US-22-01 AC-1..5, US-22-02 AC-1..5 |

**Методы:**

| Метод | Параметры | Возврат | Описание |
|---|---|---|---|
| `findAll` | — | `Promise<DocumentCategory[]>` | Все категории |
| `findById` | `id: string` | `Promise<DocumentCategory \| null>` | Найти по ID |
| `findByNameAndParent` | `name: string, parentId: string \| null` | `Promise<DocumentCategory \| null>` | Проверка уникальности name+parentId |
| `findByParentId` | `parentId: string \| null` | `Promise<DocumentCategory[]>` | Дети родителя |
| `create` | `data: CreateCategoryData` | `Promise<DocumentCategory>` | Создать новую категорию |
| `delete` | `id: string` | `Promise<void>` | Hard delete категории |
| `getChildrenIds` | `parentId: string` | `Promise<string[]>` | ID подкатегорий (для каскадного удаления) |
| `getTree` | — | `Promise<CategoryTreeItem[]>` | Дерево категорий (рекурсивное) |
| `updateParentIdByIds` | `categoryIds: string[], newParentId: string \| null` | `Promise<void>` | Массовое обновление parentId подкатегорий |

---

#### 3.1.10 `IDocumentRepository`

| Параметр | Значение |
|---|---|
| **Файл** | `src/domains/documents/document.repository.interface.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T2.4.2` |
| **Трассировка** | US-22-03..US-22-07 |

**Методы:**

| Метод | Параметры | Возврат | Описание |
|---|---|---|---|
| `findById` | `id: string` | `Promise<Document \| null>` | Найти по ID |
| `findByIdWithDetails` | `id: string` | `Promise<DocumentWithDetails \| null>` | С category, tags, uploader |
| `findMany` | `filters: DocumentFilter, userRole: string` | `Promise<PaginatedResult<DocumentWithDetails>>` | С фильтрацией по роли |
| `create` | `data: CreateDocumentData` | `Promise<Document>` | Создать запись (черновик) |
| `update` | `id: string, data: UpdateDocumentData` | `Promise<Document>` | Полное обновление |
| `updateMetadata` | `id: string, data: UpdateMetadataData` | `Promise<Document>` | Partial update метаданных |
| `updateCategoryIdByIds` | `docIds: string[], newCategoryId: string \| null` | `Promise<void>` | Перенос документов при удалении категории |
| `getByCategoryId` | `categoryId: string` | `Promise<Document[]>` | Документы категории |

**Инварианты методов:**

- `findMany`: учитывает `visibleRoles @> [userRole]` и `status != 'draft'` (если role != 'ADMIN')
- `findByIdWithDetails`: включает category, tags[], uploader
- `updateCategoryIdByIds`: batch update (для US-22-02)

---

#### 3.1.11 `IDocumentTagRepository`

| Параметр | Значение |
|---|---|
| **Файл** | `src/domains/documents/tag.repository.interface.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T2.4.3` |
| **Трассировка** | US-22-04 AC-4, US-22-07 AC-3, AC-4 |

**Методы:**

| Метод | Параметры | Возврат | Описание |
|---|---|---|---|
| `findAll` | — | `Promise<DocumentTag[]>` | Все теги |
| `findByName` | `name: string` | `Promise<DocumentTag \| null>` | Найти по имени |
| `upsert` | `name: string` | `Promise<DocumentTag>` | Create or return existing |
| `linkDocument` | `documentId: string, tagIds: string[]` | `Promise<void>` | Установить связи (замена) |
| `unlinkTag` | `documentId: string, tagId: string` | `Promise<void>` | Удалить одну связь |

---

#### 3.1.12 `DocumentCategoryRepositoryPrisma`

| Параметр | Значение |
|---|---|
| **Файл** | `src/domains/documents/category.repository.prisma.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T2.5.1` |
| **Трассировка** | US-22-01, US-22-02 |

**Описание:** Prisma-реализация `IDocumentCategoryRepository`.

**Зависимости (DI):**

| Параметр | Тип | Описание |
|---|---|---|
| `prisma` | `PrismaClient` | Prisma-клиент (внедряется через конструктор) |

**Методы:** все методы из интерфейса (см. 3.1.9) с реализациями `throw new Error('[TODO] DOCS-T2.5.1')`.

**Особенности:**

- `getTree()` — рекурсивное построение дерева через include children
- `findByNameAndParent` использует `@@unique([name, parentId])`
- Обработка P2002 → `CategoryNameNotUniqueError`

---

#### 3.1.13 `DocumentRepositoryPrisma`

| Параметр | Значение |
|---|---|
| **Файл** | `src/domains/documents/document.repository.prisma.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T2.5.2` |
| **Трассировка** | US-22-03..US-22-07 |

**Описание:** Prisma-реализация `IDocumentRepository`.

**Зависимости (DI):**

| Параметр | Тип | Описание |
|---|---|---|
| `prisma` | `PrismaClient` | Prisma-клиент |

**Особенности:**

- `findMany` с ролевой фильтрацией: `visibleRoles @> [userRole]`
- `findByIdWithDetails` include: category, tags (через DocumentTagLink), uploadedBy
- Поиск по title ILIKE, description ILIKE, tags через join
- Пагинация через skip/take

---

#### 3.1.14 `DocumentTagRepositoryPrisma`

| Параметр | Значение |
|---|---|
| **Файл** | `src/domains/documents/tag.repository.prisma.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T2.5.3` |
| **Трассировка** | US-22-04, US-22-07 |

**Описание:** Prisma-реализация `IDocumentTagRepository`.

**Особенности:**

- `upsert` — findOrCreate
- `linkDocument` — транзакция: delete existing → createMany
- `unlinkTag` — delete

---

#### 3.1.15 `FileStorage`

| Параметр | Значение |
|---|---|
| **Файл** | `src/domains/documents/file.storage.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T2.6.1` |
| **Трассировка** | US-22-03 AC-1..4, US-22-06 AC-4 |

**Функции:**

| Функция | Параметры | Возврат | Описание |
|---|---|---|---|
| `saveFile` | `buffer: Buffer, originalName: string, mimeType: string` | `Promise<string>` | Сохранение в `public/uploads/documents/` |
| `getFile` | `filePath: string` | `Promise<{ buffer: Buffer; mimeType: string; originalName: string }>` | Чтение файла |
| `deleteFile` | `filePath: string` | `Promise<void>` | Удаление файла |

**Безопасность:**

- Защита от path traversal (`../` в путях)
- Уникальное имя файла (timestamp + random suffix)

---

#### 3.1.16 `DocumentCategoryService`

| Параметр | Значение |
|---|---|
| **Файл** | `src/domains/documents/category.service.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T2.7.1` |
| **Трассировка** | US-22-01 AC-1..5, US-22-02 AC-1..5 |

**Интерфейс сервиса:**

| Метод | Параметры | Возврат | Бизнес-правила |
|---|---|---|---|
| `create` | `data: CreateCategoryData` | `Promise<DocumentCategory>` | Валидация, проверка parentId, проверка уникальности name+parentId |
| `delete` | `id: string` | `Promise<void>` | Транзакция: перенос документов → перепривязка подкатегорий → удаление |
| `getTree` | — | `Promise<CategoryTreeItem[]>` | Дерево категорий |
| `getAll` | — | `Promise<DocumentCategory[]>` | Все категории |

**Зависимости (DI):**

| Параметр | Тип (Интерфейс) | Описание |
|---|---|---|
| `categoryRepo` | `IDocumentCategoryRepository` | Репозиторий категорий |
| `documentRepo` | `IDocumentRepository` | Для переноса документов при удалении |

**Бизнес-валидация:**

| Сценарий | Проверка | Действие при ошибке |
|---|---|---|
| Создание с дублирующим name+parent | `findByNameAndParent()` | `CategoryNameNotUniqueError` |
| Создание с несуществующим parentId | `findById(parentId)` | `ParentCategoryNotFoundError` |
| Удаление несуществующей | ID существует | `CategoryNotFoundError` |
| Удаление с документами | Перенос в родителя (или null) | Транзакция |

---

#### 3.1.17 `DocumentService`

| Параметр | Значение |
|---|---|
| **Файл** | `src/domains/documents/document.service.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T2.7.2` |
| **Трассировка** | US-22-03..US-22-07 |

**Интерфейс сервиса:**

| Метод | Параметры | Возврат | Бизнес-правила |
|---|---|---|---|
| `uploadFile` | `data: CreateDocumentData` | `Promise<Document>` | Валидация файла, сохранение в storage, создание draft |
| `saveMetadata` | `id: string, data: UpdateMetadataData` | `Promise<Document>` | Валидация, draft → published, связывание тегов |
| `getDocuments` | `filters: DocumentFilter, userRole: string` | `Promise<PaginatedResult<DocumentWithDetails>>` | Фильтрация + пагинация + роль |
| `getDocument` | `id: string, userRole: string` | `Promise<DocumentWithDetails>` | Проверка доступа |
| `updateDocument` | `id: string, data: UpdateDocumentData` | `Promise<Document>` | Проверка архива, валидация, обновление |
| `getDownloadInfo` | `id: string, userRole: string` | `Promise<{ path: string; originalName: string; mimeType: string }>` | Проверка доступа, возврат info |

**Зависимости (DI):**

| Параметр | Тип (Интерфейс) | Описание |
|---|---|---|
| `documentRepo` | `IDocumentRepository` | Репозиторий документов |
| `tagRepo` | `IDocumentTagRepository` | Репозиторий тегов |
| `categoryRepo` | `IDocumentCategoryRepository` | Для проверки existence categoryId |
| `fileStorage` | `FileStorage` | Утилита работы с файлами |

**Бизнес-валидация:**

| Сценарий | Проверка | Действие при ошибке |
|---|---|---|
| Доступ к документу без прав | visibleRoles @> [role] + status != draft | `DocumentAccessDeniedError` |
| Редактирование archived | status == 'archived' | `DocumentArchivedError` |
| Файл слишком большой | fileSize > MAX | `FileTooLargeError` |
| Неподдерживаемый тип | mimeType не в whitelist | `UnsupportedFileTypeError` |
| Пустой файл | fileSize == 0 | `EmptyFileError` |

---

#### 3.1.18 `DocumentTagService`

| Параметр | Значение |
|---|---|
| **Файл** | `src/domains/documents/tag.service.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T2.7.3` |
| **Трассировка** | US-22-04 AC-4, US-22-07 AC-3, AC-4 |

**Интерфейс сервиса:**

| Метод | Параметры | Возврат | Описание |
|---|---|---|---|
| `getAllTags` | — | `Promise<DocumentTag[]>` | Все теги для UI-автодополнения |
| `assignTags` | `documentId: string, tagNames: string[]` | `Promise<void>` | Upsert тегов + link |

**Зависимости (DI):**

| Параметр | Тип (Интерфейс) | Описание |
|---|---|---|
| `tagRepo` | `IDocumentTagRepository` | Репозиторий тегов |

---

#### 3.1.19 `DomainIndex`

| Параметр | Значение |
|---|---|
| **Файл** | `src/domains/documents/index.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T2.8.1` |
| **Трассировка** | Все US-22-xx |

**Re-export:** Все типы, схемы, ошибки, интерфейсы, реализации репозиториев, сервисы, утилиты.

---

### 3.2 API Layer

---

#### 3.2.1 `CategoriesRoute` (Collection)

| Параметр | Значение |
|---|---|
| **Файл** | `src/app/api/v1/documents/categories/route.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T3.1.1`, `DOCS-T3.1.2` |
| **Трассировка** | US-22-01 AC-1..5, US-22-05 |

**Endpoints:**

| Метод | Путь | Auth | Роль | Request Body | Response | Ошибки |
|---|---|---|---|---|---|---|
| `GET` | `/documents/categories` | ✅ | Все | — | `200: { success, data: CategoryTreeItem[] }` | `401` |
| `POST` | `/documents/categories` | ✅ | ADMIN | `CreateCategoryData` | `201: { success, data: DocumentCategory }` | `400, 401, 403, 409` |

**Поведение:**
- `GET`: возвращает дерево категорий через `categoryService.getTree()`
- `POST`: валидация через `createCategorySchema`, вызов `categoryService.create()`
- `CategoryNameNotUniqueError` → 409
- `ParentCategoryNotFoundError` → 404

---

#### 3.2.2 `CategoryDetailRoute` (Detail)

| Параметр | Значение |
|---|---|
| **Файл** | `src/app/api/v1/documents/categories/[id]/route.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T3.1.3` |
| **Трассировка** | US-22-02 AC-1..5 |

**Endpoints:**

| Метод | Путь | Auth | Роль | Response | Ошибки |
|---|---|---|---|---|---|
| `DELETE` | `/documents/categories/[id]` | ✅ | ADMIN | `200: { success: true }` | `401, 403, 404` |

**Поведение:**
- `DELETE`: `categoryService.delete(id)`
- `CategoryNotFoundError` → 404

---

#### 3.2.3 `DocumentsRoute` (Collection)

| Параметр | Значение |
|---|---|
| **Файл** | `src/app/api/v1/documents/route.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T3.2.1` |
| **Трассировка** | US-22-05 AC-1..9 |

**Endpoints:**

| Метод | Путь | Auth | Роль | Query | Response | Ошибки |
|---|---|---|---|---|---|---|
| `GET` | `/documents` | ✅ | Все | `DocumentFilter` | `200: { success, data: PaginatedResult }` | `401` |

**Поведение:**
- Извлечение query params → `documentFiltersSchema`
- `auth()` → получение userRole
- `documentService.getDocuments(filters, userRole)`
- ADMIN видит все (включая draft), остальные — только published + доступные по роли

---

#### 3.2.4 `UploadRoute` (File Upload)

| Параметр | Значение |
|---|---|
| **Файл** | `src/app/api/v1/documents/upload/route.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T3.2.2` |
| **Трассировка** | US-22-03 AC-1..6 |

**Endpoints:**

| Метод | Путь | Auth | Роль | Request | Response | Ошибки |
|---|---|---|---|---|---|---|
| `POST` | `/documents/upload` | ✅ | ADMIN | `multipart/form-data` | `201: { success, data: Document }` | `400, 401, 403, 413` |

**Поведение:**
- Чтение файла из FormData → Buffer
- Валидация: тип MIME (white list), размер (<= MAX_FILE_SIZE), не пустой
- `fileStorage.saveFile(buffer, name, mimeType)`
- `documentService.uploadFile({ ... })` → создаёт draft
- `EmptyFileError` → 400, `FileTooLargeError` → 413, `UnsupportedFileTypeError` → 400

---

#### 3.2.5 `MetadataRoute` (Save Metadata)

| Параметр | Значение |
|---|---|
| **Файл** | `src/app/api/v1/documents/[id]/metadata/route.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T3.2.3` |
| **Трассировка** | US-22-04 AC-1..5 |

**Endpoints:**

| Метод | Путь | Auth | Роль | Request Body | Response | Ошибки |
|---|---|---|---|---|---|---|
| `PUT` | `/documents/[id]/metadata` | ✅ | ADMIN | `UpdateMetadataData` | `200: { success, data: Document }` | `400, 401, 403, 404` |

**Поведение:**
- `documentMetadataSchema.parse(body)`
- Проверка существования categoryId
- `documentService.saveMetadata(id, data)` → draft → published + upsert тегов

---

#### 3.2.6 `DocumentDetailRoute` (Detail)

| Параметр | Значение |
|---|---|
| **Файл** | `src/app/api/v1/documents/[id]/route.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T3.2.4`, `DOCS-T3.2.5` |
| **Трассировка** | US-22-06 AC-1..7, US-22-07 AC-1..8 |

**Endpoints:**

| Метод | Путь | Auth | Роль | Request Body | Response | Ошибки |
|---|---|---|---|---|---|---|
| `GET` | `/documents/[id]` | ✅ | Все | — | `200: { success, data: DocumentWithDetails }` | `401, 403, 404` |
| `PUT` | `/documents/[id]` | ✅ | ADMIN | `UpdateDocumentData` | `200: { success, data: Document }` | `400, 401, 403, 404` |

**Поведение:**
- `GET`: `documentService.getDocument(id, userRole)`; `DocumentAccessDeniedError` → 403
- `PUT`: `documentService.updateDocument(id, data)`; `DocumentArchivedError` → 400

---

#### 3.2.7 `DownloadRoute` (Download File)

| Параметр | Значение |
|---|---|
| **Файл** | `src/app/api/v1/documents/[id]/download/route.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T3.2.6` |
| **Трассировка** | US-22-06 AC-4 |

**Endpoints:**

| Метод | Путь | Auth | Роль | Response | Ошибки |
|---|---|---|---|---|---|
| `GET` | `/documents/[id]/download` | ✅ | Все | Файл (stream) | `401, 403, 404` |

**Поведение:**
- `auth()` → userRole
- `documentService.getDownloadInfo(id, userRole)`
- Чтение файла из storage
- `new Response(buffer, { headers: { 'Content-Type': mimeType, 'Content-Disposition': 'attachment; filename="..."' } })`
- `DocumentAccessDeniedError` → 403

---

### 3.3 Hooks

---

#### 3.3.1 `useDocuments`

| Параметр | Значение |
|---|---|
| **Файл** | `src/hooks/useDocuments.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T4.1.1` |
| **Трассировка** | US-22-05 AC-1..9 |

**Возвращаемые поля:**

| Поле | Тип | Описание |
|---|---|---|
| `documents` | `DocumentWithDetails[]` | Список документов |
| `loading` | `boolean` | Состояние загрузки |
| `error` | `string \| null` | Сообщение об ошибке |
| `total` | `number` | Общее количество |
| `page` | `number` | Текущая страница |
| `setFilters` | `(filters: DocumentFilter) => void` | Установка фильтров |
| `setPage` | `(page: number) => void` | Смена страницы |
| `refetch` | `() => void` | Повторная загрузка |

**Поведение:**
- `apiClient.get('/api/v1/documents', { params })`
- Debounce для search (300ms)
- Автоматическая загрузка при mount и изменении фильтров

---

#### 3.3.2 `useDocumentUpload`

| Параметр | Значение |
|---|---|
| **Файл** | `src/hooks/useDocumentUpload.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T4.1.2` |
| **Трассировка** | US-22-03 AC-1..6 |

**Возвращаемые поля:**

| Поле | Тип | Описание |
|---|---|---|
| `uploading` | `boolean` | Состояние загрузки |
| `progress` | `number` | Прогресс (0..100) |
| `error` | `string \| null` | Сообщение об ошибке |
| `uploadedDocument` | `Document \| null` | Загруженный документ |
| `uploadFile` | `(file: File) => Promise<void>` | Загрузка файла |

**Поведение:**
- `FormData` + `fetch('/api/v1/documents/upload')`
- Валидация на клиенте: тип, размер
- Обработка ошибок с русскими сообщениями

---

#### 3.3.3 `useCategories`

| Параметр | Значение |
|---|---|
| **Файл** | `src/hooks/useCategories.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T4.1.3` |
| **Трассировка** | US-22-01 AC-1..5, US-22-02 AC-1..5 |

**Возвращаемые поля:**

| Поле | Тип | Описание |
|---|---|---|
| `categories` | `DocumentCategory[]` | Плоский список категорий |
| `tree` | `CategoryTreeItem[]` | Дерево категорий |
| `loading` | `boolean` | Состояние загрузки |
| `error` | `string \| null` | Сообщение об ошибке |
| `createCategory` | `(data: CreateCategoryData) => Promise<DocumentCategory>` | Создание |
| `deleteCategory` | `(id: string) => Promise<void>` | Удаление |
| `refetch` | `() => void` | Повторная загрузка |

---

#### 3.3.4 `useDocumentDetail`

| Параметр | Значение |
|---|---|
| **Файл** | `src/hooks/useDocumentDetail.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T4.1.4` |
| **Трассировка** | US-22-06 AC-1..7 |

**Возвращаемые поля:**

| Поле | Тип | Описание |
|---|---|---|
| `document` | `DocumentWithDetails \| null` | Документ с деталями |
| `loading` | `boolean` | Состояние загрузки |
| `error` | `string \| null` | Сообщение об ошибке |
| `refetch` | `() => void` | Повторная загрузка |

**Поведение:**
- `GET /api/v1/documents/:id`
- Обработка 403 → «Нет доступа»

---

### 3.4 UI Layer

---

#### 3.4.1 `DocumentList`

| Параметр | Значение |
|---|---|
| **Файл** | `src/components/features/documents/DocumentList.tsx` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T4.2.1` |
| **Трассировка** | US-22-05 AC-1..9 |

**Props Interface:**

| Пропс | Тип | Обязательный | Описание |
|---|---|---|---|
| `filter` | `DocumentFilter` | ❌ | Начальные фильтры |
| `onCardClick` | `(id: string) => void` | ❌ | Callback при клике на карточку |

**Состояния:**

| Состояние | Условие | Отображение |
|---|---|---|
| `loading` | Загрузка данных | Skeleton-заглушки + `role="status"` |
| `error` | Ошибка загрузки | `role="alert"` + сообщение |
| `empty` | Нет данных | `EmptyState` «Документы не найдены» |
| `data` | Данные загружены | Карточки документов + пагинация |

**Поведение:**
- Использует `useDocuments(filter)`
- Сортировка по createdAt DESC
- Клик по карточке → `onCardClick(doc.id)`
- Статус-бейджи (draft/published/archived)

**⚠️ Оценка:** ~60 строк — рекомендуется разбиение на DocumentList (координация) + DocumentCard (карточка)

---

#### 3.4.2 `DocumentFilters`

| Параметр | Значение |
|---|---|
| **Файл** | `src/components/features/documents/DocumentFilters.tsx` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T4.2.2` |
| **Трассировка** | US-22-05 AC-4, AC-5 |

**Props Interface:**

| Пропс | Тип | Обязательный | Описание |
|---|---|---|---|
| `onFilterChange` | `(filters: DocumentFilter) => void` | ✅ | Callback при изменении фильтров |

**Состояния:** loading, error, data

**Поведение:**
- Выпадающие списки: категория (с иерархией), тип, статус
- Кнопка «Сбросить»

---

#### 3.4.3 `DocumentSearch`

| Параметр | Значение |
|---|---|
| **Файл** | `src/components/features/documents/DocumentSearch.tsx` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T4.2.3` |
| **Трассировка** | US-22-05 AC-6, AC-7 |

**Props Interface:**

| Пропс | Тип | Обязательный | Описание |
|---|---|---|---|
| `onSearch` | `(query: string) => void` | ✅ | Callback при поиске (debounce 300ms) |

**Поведение:**
- Debounce input (300ms)
- Поле ввода с иконкой поиска

---

#### 3.4.4 `DocumentCard`

| Параметр | Значение |
|---|---|
| **Файл** | `src/components/features/documents/DocumentCard.tsx` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T4.2.4` |
| **Трассировка** | US-22-05 AC-9 |

**Props Interface:**

| Пропс | Тип | Обязательный | Описание |
|---|---|---|---|
| `document` | `DocumentWithDetails` | ✅ | Данные документа |

**Поведение:**
- Иконка по mimeType (PDF, DOCX, IMG)
- Название, дата создания, статус-бейдж
- Клик → Link `/dashboard/documents/:id`

---

#### 3.4.5 `DocumentDetail`

| Параметр | Значение |
|---|---|
| **Файл** | `src/components/features/documents/DocumentDetail.tsx` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T4.2.5` |
| **Трассировка** | US-22-06 AC-1..7 |

**Props Interface:**

| Пропс | Тип | Обязательный | Описание |
|---|---|---|---|
| `documentId` | `string` | ✅ | ID документа |

**Состояния:**

| Состояние | Условие | Отображение |
|---|---|---|
| `loading` | Загрузка | Skeleton |
| `error` | 403 | «У вас нет доступа к этому документу» |
| `error` | 404 | «Документ не найден» |
| `data` | Данные | Метаданные + предпросмотр + кнопки |

**Поведение:**
- Использует `useDocumentDetail(documentId)`
- Встроенный предпросмотр PDF (`<iframe>`), изображения (`<img>`)
- Скачивание через `/api/v1/documents/:id/download`
- Кнопка «Редактировать» — только ADMIN, не archived

**⚠️ Оценка:** ~80 строк — рекомендуется разбиение на DocumentDetail (координация) + DocumentPreview (предпросмотр)

---

#### 3.4.6 `DocumentPreview`

| Параметр | Значение |
|---|---|
| **Файл** | `src/components/features/documents/DocumentPreview.tsx` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T4.2.6` |
| **Трассировка** | US-22-06 AC-2, AC-3 |

**Props Interface:**

| Пропс | Тип | Обязательный | Описание |
|---|---|---|---|
| `mimeType` | `string` | ✅ | MIME-тип файла |
| `downloadUrl` | `string` | ✅ | URL для скачивания/предпросмотра |

**Поведение:**
- `application/pdf` → `<iframe src={downloadUrl}>`
- `image/*` → `<img src={downloadUrl}>`
- Остальное → заглушка «Предпросмотр недоступен»

---

#### 3.4.7 `DocumentUploadZone`

| Параметр | Значение |
|---|---|
| **Файл** | `src/components/features/documents/DocumentUploadZone.tsx` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T4.2.7` |
| **Трассировка** | US-22-03 AC-1..6 |

**Props Interface:**

| Пропс | Тип | Обязательный | Описание |
|---|---|---|---|
| `onUpload` | `(file: File) => Promise<void>` | ✅ | Callback для загрузки |

**Состояния:**

| Состояние | Условие | Отображение |
|---|---|---|
| `idle` | Нет файла | Drag-and-drop зона + кнопка |
| `selected` | Файл выбран | Информация о файле + кнопка «Загрузить» |
| `uploading` | Загрузка | Прогресс-бар |
| `error` | Ошибка валидации/загрузки | `role="alert"` + сообщение |
| `success` | Успех | Подтверждение |

**Поведение:**
- `onDragOver`, `onDrop` обработчики
- Валидация: тип (белый список), размер (<= 100MB), не пустой
- Прогресс-бар
- Список поддерживаемых форматов

**⚠️ Оценка:** ~70 строк — рекомендуется разбиение на DocumentUploadZone (координация) + UploadProgress (прогресс)

---

#### 3.4.8 `DocumentMetadataForm`

| Параметр | Значение |
|---|---|
| **Файл** | `src/components/features/documents/DocumentMetadataForm.tsx` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T4.2.8` |
| **Трассировка** | US-22-04 AC-1..5 |

**Props Interface:**

| Пропс | Тип | Обязательный | Описание |
|---|---|---|---|
| `documentId` | `string` | ✅ | ID загруженного документа |
| `onSuccess` | `(doc: Document) => void` | ❌ | Callback после сохранения |

**Состояния:** loading, error, data (success)

**Поведение:**
- Поля: название (обязательно), описание, категория (tree select), тип (обязательно), теги, видимость
- Inline-валидация с сообщениями на русском
- PUT `/api/v1/documents/:id/metadata`
- Кнопка «Сохранить и опубликовать»

**⚠️ Оценка:** ~90 строк — используется TagInput + RoleVisibilitySelector как подкомпоненты

---

#### 3.4.9 `DocumentEditForm`

| Параметр | Значение |
|---|---|
| **Файл** | `src/components/features/documents/DocumentEditForm.tsx` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T4.2.9` |
| **Трассировка** | US-22-07 AC-1..8 |

**Props Interface:**

| Пропс | Тип | Обязательный | Описание |
|---|---|---|---|
| `documentId` | `string` | ✅ | ID документа |
| `onSuccess` | `() => void` | ❌ | Callback после сохранения |

**Состояния:** loading, error, archived blocked

**Поведение:**
- Предзаполнение из `useDocumentDetail`
- Поля: все те же + статус (draft/published/archived)
- PUT `/api/v1/documents/:id`
- Подтверждение архивации

**⚠️ Оценка:** ~100 строк — используется TagInput + RoleVisibilitySelector как подкомпоненты

---

#### 3.4.10 `CategoryTree`

| Параметр | Значение |
|---|---|
| **Файл** | `src/components/features/documents/CategoryTree.tsx` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T4.2.10` |
| **Трассировка** | US-22-01 AC-1, AC-2 |

**Props Interface:**

| Пропс | Тип | Обязательный | Описание |
|---|---|---|---|
| `tree` | `CategoryTreeItem[]` | ✅ | Дерево категорий |
| `onAddChild` | `(parentId: string \| null) => void` | ❌ | Callback «Добавить подкатегорию» |
| `onDelete` | `(id: string) => void` | ❌ | Callback «Удалить» |

**Поведение:**
- Рекурсивный рендер children
- Expand/collapse состояние
- Каждый узел: название, кнопка «Добавить подкатегорию», кнопка «Удалить»

---

#### 3.4.11 `CategoryForm`

| Параметр | Значение |
|---|---|
| **Файл** | `src/components/features/documents/CategoryForm.tsx` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T4.2.11` |
| **Трассировка** | US-22-01 AC-1..5 |

**Props Interface:**

| Пропс | Тип | Обязательный | Описание |
|---|---|---|---|
| `parentCategoryId` | `string \| null` | ❌ | ID родительской категории (для подкатегории) |
| `onSuccess` | `(category: DocumentCategory) => void` | ❌ | Callback после создания |
| `onCancel` | `() => void` | ❌ | Callback «Отмена» |

**Поведение:**
- Поля: название (обязательно), описание, родительская категория (выбор из дерева)
- POST `/api/v1/documents/categories`
- Валидация: name обязательный, max 100

---

#### 3.4.12 `DeleteCategoryDialog`

| Параметр | Значение |
|---|---|
| **Файл** | `src/components/features/documents/DeleteCategoryDialog.tsx` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T4.2.12` |
| **Трассировка** | US-22-02 AC-1..5 |

**Props Interface:**

| Пропс | Тип | Обязательный | Описание |
|---|---|---|---|
| `isOpen` | `boolean` | ✅ | Видимость диалога |
| `categoryName` | `string` | ✅ | Название категории |
| `hasDocuments` | `boolean` | ✅ | Есть ли документы в категории |
| `onConfirm` | `() => void` | ✅ | Callback подтверждения |
| `onCancel` | `() => void` | ✅ | Callback отмены |

**Поведение:**
- Модальный диалог с предупреждением о переносе документов
- Текст на русском

---

#### 3.4.13 `TagInput`

| Параметр | Значение |
|---|---|
| **Файл** | `src/components/features/documents/TagInput.tsx` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T4.2.13` |
| **Трассировка** | US-22-04 AC-4, US-22-07 AC-3, AC-4 |

**Props Interface:**

| Пропс | Тип | Обязательный | Описание |
|---|---|---|---|
| `value` | `string[]` | ✅ | Текущие теги |
| `onChange` | `(tags: string[]) => void` | ✅ | Callback изменения |
| `maxTags` | `number` | ❌ | Максимум тегов (default: 10) |

**Поведение:**
- Enter для добавления, × для удаления
- max 10 тегов, max 50 символов
- Отображение тегов как чипсов

---

#### 3.4.14 `RoleVisibilitySelector`

| Параметр | Значение |
|---|---|
| **Файл** | `src/components/features/documents/RoleVisibilitySelector.tsx` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T4.2.14` |
| **Трассировка** | US-22-04 AC-3, US-22-07 AC-5 |

**Props Interface:**

| Пропс | Тип | Обязательный | Описание |
|---|---|---|---|
| `value` | `string[]` | ✅ | Выбранные роли |
| `onChange` | `(roles: string[]) => void` | ✅ | Callback изменения |

**Поведение:**
- Чекбоксы: GUEST, MEMBER, ADMIN
- Минимум 1 роль должна быть выбрана
- Описание каждой роли

---

#### 3.4.15 `UIIndex`

| Параметр | Значение |
|---|---|
| **Файл** | `src/components/features/documents/index.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T4.2.15` |
| **Трассировка** | Все UI |

Re-export всех 14 компонентов.

---

### 3.5 Pages

---

#### 3.5.1 `/dashboard/documents/page.tsx`

| Параметр | Значение |
|---|---|
| **Файл** | `src/app/dashboard/documents/page.tsx` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T4.3.1` |
| **Трассировка** | US-22-05 |

**Состав:**
- `DocumentFilters` + `DocumentSearch` сверху
- `DocumentList` снизу
- Кнопка «Загрузить документ» (ADMIN) → Link `/dashboard/documents/upload`
- Кнопка «Категории» (ADMIN) → Link `/dashboard/documents/categories`
- `useSession()` → redirect на `/login`

---

#### 3.5.2 `/dashboard/documents/upload/page.tsx`

| Параметр | Значение |
|---|---|
| **Файл** | `src/app/dashboard/documents/upload/page.tsx` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T4.3.2` |
| **Трассировка** | US-22-03, US-22-04 |

**Состав:**
- State machine: 'upload' → 'metadata' → 'done'
- Шаг 1: `DocumentUploadZone`
- Шаг 2: `DocumentMetadataForm`
- После успеха → redirect на `/dashboard/documents/:id`

---

#### 3.5.3 `/dashboard/documents/categories/page.tsx`

| Параметр | Значение |
|---|---|
| **Файл** | `src/app/dashboard/documents/categories/page.tsx` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T4.3.3` |
| **Трассировка** | US-22-01, US-22-02 |

**Состав:**
- `CategoryTree`
- Кнопка «Создать категорию» → `CategoryForm` (inline/modal)
- `DeleteCategoryDialog`
- `useSession()`, проверка ADMIN

---

#### 3.5.4 `/dashboard/documents/[id]/page.tsx`

| Параметр | Значение |
|---|---|
| **Файл** | `src/app/dashboard/documents/[id]/page.tsx` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T4.3.4` |
| **Трассировка** | US-22-06 |

**Состав:**
- `DocumentDetail`
- `useSession()`
- `useRouter` для params.id

---

#### 3.5.5 `/dashboard/documents/[id]/edit/page.tsx`

| Параметр | Значение |
|---|---|
| **Файл** | `src/app/dashboard/documents/[id]/edit/page.tsx` |
| **Действие** | 🆕 Создать |
| **Задача** | `DOCS-T4.3.5` |
| **Трассировка** | US-22-07 |

**Состав:**
- `DocumentEditForm`
- `useSession()`, проверка ADMIN
- Проверка status != 'archived' → сообщение

---

## 4. 📁 Дерево файлов скелетов

```
src/domains/documents/
├── index.ts                          # Re-export
├── category.types.ts                 # DocumentCategory, CreateCategoryData, CategoryTreeItem
├── category.validators.ts            # createCategorySchema
├── category.errors.ts                # CategoryNotFoundError, CategoryNameNotUniqueError, ParentCategoryNotFoundError
├── category.repository.interface.ts  # IDocumentCategoryRepository
├── category.repository.prisma.ts     # DocumentCategoryRepositoryPrisma
├── category.service.ts               # DocumentCategoryService
├── document.types.ts                 # Document, DocumentStatus, CreateDocumentData, UpdateMetadataData, UpdateDocumentData, DocumentFilter, DocumentWithDetails, PaginatedResult
├── document.validators.ts            # fileValidationSchema, documentMetadataSchema, updateDocumentSchema, documentFiltersSchema, ALLOWED_MIME_TYPES
├── document.errors.ts                # DocumentNotFoundError, DocumentAccessDeniedError, DocumentArchivedError, FileTooLargeError, UnsupportedFileTypeError, EmptyFileError
├── document.repository.interface.ts  # IDocumentRepository
├── document.repository.prisma.ts     # DocumentRepositoryPrisma
├── document.service.ts               # DocumentService
├── tag.types.ts                      # DocumentTag, TagWithName
├── tag.validators.ts                 # tagNameSchema
├── tag.repository.interface.ts       # IDocumentTagRepository
├── tag.repository.prisma.ts          # DocumentTagRepositoryPrisma
├── tag.service.ts                    # DocumentTagService
└── file.storage.ts                   # saveFile, getFile, deleteFile

src/app/api/v1/documents/
├── route.ts                          # GET (список)
├── upload/
│   └── route.ts                      # POST multipart
├── categories/
│   ├── route.ts                      # GET (дерево), POST (создание)
│   └── [id]/
│       └── route.ts                  # DELETE
├── [id]/
│   ├── route.ts                      # GET (детали), PUT (редактирование)
│   ├── metadata/
│   │   └── route.ts                  # PUT (сохранение метаданных)
│   └── download/
│       └── route.ts                  # GET (скачивание)

src/components/features/documents/
├── index.ts
├── DocumentList.tsx
├── DocumentFilters.tsx
├── DocumentSearch.tsx
├── DocumentCard.tsx
├── DocumentDetail.tsx
├── DocumentPreview.tsx
├── DocumentUploadZone.tsx
├── DocumentMetadataForm.tsx
├── DocumentEditForm.tsx
├── CategoryTree.tsx
├── CategoryForm.tsx
├── DeleteCategoryDialog.tsx
├── TagInput.tsx
└── RoleVisibilitySelector.tsx

src/hooks/
├── useDocuments.ts
├── useDocumentUpload.ts
├── useCategories.ts
└── useDocumentDetail.ts

src/app/dashboard/documents/
├── page.tsx
├── upload/
│   └── page.tsx
├── categories/
│   └── page.tsx
└── [id]/
    ├── page.tsx
    └── edit/
        └── page.tsx
```

---

## 5. ✅ Чек-лист валидации спецификации

### Spec-файл
- [x] Матрица трассировки покрывает все 44 AC из 7 US
- [x] Каждый компонент имеет TASK-ID (DOCS-T*)
- [x] Проверка покрытия AC: все ✅

### Архитектура
- [x] DDD соблюдена: types → validators → errors → repository interface → repository prisma → service → API → UI
- [x] DI через интерфейсы (IDocumentCategoryRepository, IDocumentRepository, IDocumentTagRepository)
- [x] API пути относительные (без /api/v1 в apiClient)
- [x] `'use client'` для UI-компонентов
- [x] `apiClient` для запросов в хуках

### Компоненты с оценкой >50 строк
| Компонент | Оценка | Разбиение |
|---|---|---|
| `DocumentList` | ~60 | DocumentList + DocumentCard |
| `DocumentDetail` | ~80 | DocumentDetail + DocumentPreview |
| `DocumentUploadZone` | ~70 | DocumentUploadZone (координация уже в компоненте) |
| `DocumentMetadataForm` | ~90 | DocumentMetadataForm + TagInput + RoleVisibilitySelector |
| `DocumentEditForm` | ~100 | DocumentEditForm + TagInput + RoleVisibilitySelector |
