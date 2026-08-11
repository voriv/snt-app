# Document

## Описание

Документ — основная сущность модуля управления документами. Представляет собой файл (PDF, DOCX, изображение), загруженный администратором, с привязанными метаданными: название, описание, категория, тип, теги, статус и видимость по ролям. Документ хранится во внешнем хранилище, а в БД сохраняется только метаданные и ссылка на файл.

## Поля

| Поле | Тип | Обязательное | Описание | Бизнес-правила |
|------|-----|-------------|----------|----------------|
| id | String | Да | Уникальный идентификатор | Генерируется автоматически (cuid) |
| title | String | Да | Отображаемое название документа | До 255 символов, обязательно (заполняется при назначении метаданных) |
| description | String? | Нет | Описание документа | Text, опционально |
| original_name | String | Да | Исходное имя файла | До 255 символов, имя файла на диске пользователя |
| storage_path | String? | Нет | Путь к файлу в хранилище | До 500 символов. Null если файл не загружен |
| file_size | Int | Да | Размер файла в байтах | Должен быть > 0 |
| mime_type | String | Да | MIME-тип файла | До 100 символов. Белый список типов (BR-09) |
| category_id | String? | Нет | Ссылка на категорию | FK -> DocumentCategory.id. Null = Без категории |
| document_type | String | Да | Тип документа | До 50 символов. Free text (Договор, Протокол, Справка и т.д.) |
| visible_roles | Json | Да | Роли, имеющие доступ | JSON-массив строк. Default: ["ADMIN"]. Минимум 1 роль |
| status | String | Да | Статус документа | Enum: draft, published, archived. Default: draft |
| uploaded_by_id | String | Да | ID пользователя-загрузчика | FK -> User.id |
| created_at | DateTime | Да | Дата создания | Генерируется автоматически |
| updated_at | DateTime | Да | Дата последнего обновления | Обновляется при каждой записи |

## Связи

| Сущность | Тип связи | Описание |
|----------|-----------|----------|
| User | belongs_to через uploaded_by_id | Документ загружается одним пользователем (автором) |
| DocumentCategory | belongs_to через category_id | Документ принадлежит одной категории (BR-02) |
| DocumentTag | has_many через document_tags | Документ может иметь несколько тегов (M:N) |

## Индексы

| Поля | Тип | Описание |
|------|-----|----------|
| category_id | index | Ускорение фильтрации по категории |
| document_type | index | Ускорение фильтрации по типу |
| status | index | Ускорение фильтрации по статусу |
| (status, created_at) | index | Сортировка по дате в рамках статуса |
| uploaded_by_id | index | Поиск документов по автору |

## Бизнес-инварианты

- Документ может находиться только в одной категории (BR-02)
- Документ имеет один статус одновременно (BR-05): draft, published, archived
- Статус draft: документ виден только ADMIN (BR-07)
- Статус archived: документ недоступен для редактирования (BR-08), но доступен для просмотра
- visible_roles не может быть пустым массивом: минимум одна роль должна быть указана
- Файл хранится во внешнем хранилище (не в БД). В БД — только metadata и storage_path
- original_name и storage_path задаются при загрузке файла (US-22-03)
- title, description, category_id, document_type, visible_roles заполняются при назначении метаданных (US-22-04)
- При загрузке файла статус = draft. После сохранения метаданных статус = published

## Конвенции именования

- **БД (PostgreSQL):** documents, id, title, description, original_name, storage_path, file_size, mime_type, category_id, document_type, visible_roles, status, uploaded_by_id, created_at, updated_at
- **Prisma:** Document, id, title, description, originalName, storagePath, fileSize, mimeType, categoryId, documentType, visibleRoles, status, uploadedById, createdAt, updatedAt
- **TypeScript домен:** DocumentData, id: string, title: string, description: string | null, originalName: string, storagePath: string | null, fileSize: number, mimeType: string, categoryId: string | null, documentType: string, visibleRoles: string[], status: DocumentStatus, uploadedById: string, createdAt: Date, updatedAt: Date

@see docs/model/entities/document-category.md — сущность DocumentCategory
@see docs/model/entities/document-tag.md — сущность DocumentTag
@see docs/model/entities/document-tags.md — связь M:N documents <-> tags
