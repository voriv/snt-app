# File Storage — Хранение файлов

## Статус: На обсуждении

---

## 0. Общие положения

### 0.1 Назначение

Спецификация определяет правила хранения, загрузки, валидации и выдачи файлов в приложении СНТ. Все файлы хранятся в PostgreSQL с использованием типа `bytea`.

### 0.2 Обоснование выбора

Выбор хранения всех файлов в PostgreSQL обусловлен необходимостью:
- Единого механизма бэкапа (через `pg_dump`)
- Транзакционной целостности (файлы удаляются вместе с записями)
- Отсутствия зависимости от файловой системы сервера

### 0.3 Ограничения

| Параметр | Значение | Обоснование |
|----------|----------|-------------|
| Макс. размер одного файла | 10 MB | Лимит для документов и квитанций |
| Макс. размер `bytea` | 1 GB (теоретический) | Фактически ограничен диском VPS (10 GB) |
| Ожидаемый объём данных | ~8 GB | Аватары + документы + квитанции + вложения |

---

## 1. Модели данных

### 1.1 Сущность `File` (в PostgreSQL)

> 📄 Полный Prisma Schema: [`prisma/schema.prisma`](../../prisma/schema.prisma)

**Ключевые поля:** `id` (cuid), `originalName`, `mimeType`, `size` (bytes), `content` (bytea), `isDeleted` (мягкое удаление), `createdAt`, `updatedAt`

**Индексы:** `mimeType`, `createdAt`

**Таблица:** `files` (`@@map("files")`)

**File Storage — обобщённое хранилище.** Категоризация файлов выполняется на уровне сервиса, который хранит ссылку на файл. Например:
- Сервис `Document` хранит `fileId` в модели `Document`
- Сервис `User` хранит `avatarFileId` в модели `User`
- Сервис `Payment` хранит `receiptFileId` в модели `Payment`

### 1.2 Интеграция с существующими моделями

Все модели связаны через `@relation` с `File`:
- **User:** `avatarFileId` → `File` (1:1, опционально)
- **Document:** `fileId` → `File` (1:1, обязательно)
- **Payment:** `receiptFileId` → `File` (1:1, опционально)

> 📄 Полные определения моделей — в [`prisma/schema.prisma`](../../prisma/schema.prisma)

---

## 2. Правила загрузки файлов

### 2.1 Разрешённые MIME-типы

| Категория | MIME-типы | Расширения | Макс. размер |
|-----------|-----------|------------|-------------|
| Аватары | `image/jpeg`, `image/png`, `image/webp` | .jpg, .png, .webp | 2 MB |
| Документы | `application/pdf`, `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | .pdf, .xls, .xlsx, .doc, .docx | 10 MB |
| Квитанции | `image/jpeg`, `image/png`, `image/webp`, `application/pdf` | .jpg, .png, .webp, .pdf | 5 MB |
| Вложения объявлений | `image/jpeg`, `image/png`, `image/webp` | .jpg, .png, .webp | 5 MB |

### 2.2 Валидация файлов

**2.2.1 Валидация по MIME-типу (на уровне клиента и сервера)**

```typescript
// src/lib/validators.ts
import { z } from 'zod'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export const fileUploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.size > 0 && file.size <= MAX_FILE_SIZE,
    `Размер файла не должен превышать 10 MB`
  ),
  category: z.enum(['AVATAR', 'DOCUMENT', 'RECEIPT', 'ANNOUNCEMENT_ATTACHMENT']),
})
```

**2.2.2 Валидация по содержимому (magic bytes)**

```typescript
// src/lib/file-validator.ts

const MAGIC_BYTES = {
  JPEG: [0xFF, 0xD8, 0xFF],
  PNG: [0x89, 0x50, 0x4E, 0x47],
  WEBP: [0x52, 0x49, 0x46, 0x46],
  PDF: [0x25, 0x50, 0x44, 0x46],
  XLS: [0xD0, 0xCF, 0x11, 0xE0],
  DOC: [0xD0, 0xCF, 0x11, 0xE0],
} as const

export function validateMagicBytes(
  buffer: Buffer,
  expectedMime: string
): boolean {
  const magic = buffer.slice(0, 4)
  
  switch (expectedMime) {
    case 'image/jpeg':
      return magic[0] === MAGIC_BYTES.JPEG[0] &&
             magic[1] === MAGIC_BYTES.JPEG[1] &&
             magic[2] === MAGIC_BYTES.JPEG[2]
    case 'image/png':
      return magic[0] === MAGIC_BYTES.PNG[0] &&
             magic[1] === MAGIC_BYTES.PNG[1] &&
             magic[2] === MAGIC_BYTES.PNG[2] &&
             magic[3] === MAGIC_BYTES.PNG[3]
    // ... остальные MIME-типы
    default:
      return false
  }
}
```

### 2.3 Правила именования файлов

Все файлы переименовываются при загрузке:
- **Формат имени:** `{UUID}_{originalName}.{ext}`
- **Пример:** `a1b2c3d4-e5f6-7890-abcd-ef1234567890_document.pdf`
- **Цель:** предотвращение конфликтов имён, изоляция

### 2.4 Обработка ошибок при загрузке

| Сценарий | HTTP Status | Код ошибки | Сообщение |
|----------|-------------|------------|-----------|
| Файл превышает лимит | 413 | `FILE_TOO_LARGE` | "Размер файла не должен превышать X MB" |
| Запрещённый MIME-тип | 415 | `INVALID_FILE_TYPE` | "Тип файла не поддерживается" |
| Некорректное содержимое | 415 | `INVALID_FILE_CONTENT` | "Файл повреждён или содержимое не соответствует типу" |
| Файл пустой | 400 | `EMPTY_FILE` | "Файл не может быть пустым" |

---

## 3. API для работы с файлами

### 3.1 Загрузка файла

**POST `/api/files/upload`**

**Request:** `multipart/form-data`

```typescript
{
  file: File,
  category: 'AVATAR' | 'DOCUMENT' | 'RECEIPT' | 'ANNOUNCEMENT_ATTACHMENT'
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "clxxx123abc",
    "category": "DOCUMENT",
    "originalName": "uchred.pdf",
    "mimeType": "application/pdf",
    "size": 1048576,
    "createdAt": "2026-06-24T10:00:00.000Z"
  }
}
```

### 3.2 Получение файла

**GET `/api/files/:id/download`**

**Response (200):**

```
Content-Type: {mimeType}
Content-Disposition: attachment; filename="{originalName}"
Content-Length: {size}
{binary data}
```

**GET `/api/files/:id/view`**

**Response (200):**

```
Content-Type: {mimeType}
Content-Disposition: inline; filename="{originalName}"
Content-Length: {size}
{binary data}
```

### 3.3 Обновление файла

**PATCH `/api/files/:id`**

**Request:** `multipart/form-data`

```typescript
{
  file?: File  // Новый файл (заменяет содержимое)
  originalName?: string  // Новое оригинальное имя (опционально)
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "clxxx123abc",
    "originalName": "uchred_updated.pdf",
    "mimeType": "application/pdf",
    "size": 2097152,
    "updatedAt": "2026-06-24T11:00:00.000Z"
  }
}
```

**Правила обновления:**
- Обновляется только содержимое файла (`content`) и/или `originalName`
- При обновлении содержимого: те же правила валидации, что при загрузке
- `size` обновляется автоматически по новому размеру файла
- `updatedAt` обновляется автоматически
- ID файла не меняется
- Транзакционное обновление: старое содержимое удаляется, новое сохраняется

### 3.4 Удаление файла

**DELETE `/api/files/:id`**

Response (204): No Content

**Правила удаления:**
- **Мягкое удаление:** устанавливается `isDeleted = true`
- **Жёсткое удаление:** только для ADMIN через отдельный эндпоинт `DELETE /api/files/:id/hard`
- Файл помечается как удалённый, но содержимое сохраняется в течение 30 дней (возможность восстановления)
- После 30 дней — автоматическое жёсткое удаление (через cron job)
- Проверка прав доступа (только владелец или ADMIN)
- Cascade soft delete при удалении связанных записей (Document, Payment, User)

---

## 4. Безопасность

### 4.1 Валидация MIME-типа

**Обязательная двухуровневая проверка:**

1. **Клиентская:** проверка `file.type` при загрузке через `<input>`
2. **Серверная:** проверка magic bytes (первых байтов файла)

**Запрещено:** доверять MIME-типу от клиента без серверной валидации.

### 4.2 Rate Limiting

| Эндпоинт | Лимит | Период |
|----------|-------|--------|
| POST `/api/files/upload` | 10 запросов | 1 минута |
| GET `/api/files/:id/*` | 100 запросов | 1 минута |

### 4.3 Доступ к файлам

| Роль | Аватары | Документы | Квитанции | Вложения |
|------|---------|-----------|-----------|----------|
| ADMIN | Все | Все | Все (связанные) | Все |
| Пользователь | Свой | Публичные | Свои | Публичные |
| GUEST | - | Публичные | - | Публичные |

### 4.4 Защита от атак

- **Path traversal:** Имена файлов генерируются автоматически, пользовательское имя только для `originalName` в метаданных
- **Вредоносные файлы:** Проверка magic bytes перед сохранением
- **SQL Injection:** Prisma ORM (parameterized queries)
- **XSS:** При выдаче файлов с `Content-Type` установка `X-Content-Type-Options: nosniff`

---

## 5. Производительность

### 5.1 Оптимизация хранилища

**Рекомендации по ограничению объёма БД:**

| Мера | Экономия | Описание |
|------|----------|----------|
| Удаление старых квитанций | ~2 GB | Архивировать через 3 года, удалять через 7 |
| Сжатие изображений | ~30% | При загрузке аватаров сжимать до WebP |
| Лимит на кол-во файлов | Предотвращение злоупотреблений | Макс. 10 MB на пользователя для аватаров |

### 5.2 Выдача файлов

**Рекомендации:**

- Использовать `stream` для файлов >1 MB (не загружать весь файл в память)
- Кэширование через HTTP headers:
  ```
  Cache-Control: public, max-age=3600
  ETag: "{id}-{updatedAt}"
  ```
- Для аватаров: кэширование на 24 часа (`max-age=86400`)

---

## 6. Бэкап и восстановление

### 6.1 Бэкап

**pg_dump включает `bytea` данные автоматически:**

```bash
# Полный бэкап (включая файлы)
pg_dump -U snt_user -d snt_db | gzip > /backup/db-$(date +%Y%m%d).sql.gz

# Только структура (без данных)
pg_dump -U snt_user -d snt_db --schema-only > /backup/schema.sql
```

### 6.2 Восстановление

```bash
# Восстановление из бэкапа
gunzip -c /backup/db-20260624.sql.gz | psql -U snt_user -d snt_db
```

### 6.3 Мониторинг размера БД

**Запрос для мониторинга:**

```sql
SELECT 
  pg_size_pretty(pg_database_size('snt_db')) AS total_size,
  pg_size_pretty(pg_total_relation_size('files')) AS files_table_size,
  COUNT(*) AS total_files,
  pg_size_pretty(SUM(pg_column_size(content))) AS content_size
FROM files;
```

---

## 7. Чек-лист качества

> ℹ️ **Полный чек-лист** хранения файлов — в [`shared/checklists.md#7-хранение-файлов`](../../shared/checklists.md#7-хранение-файлов)

---

## 8. История изменений

> ℹ️ Единый журнал изменений — в [`CHANGELOG.md`](../../CHANGELOG.md)
