# API: Управление документами

> **Модуль:** documents
> **Версия API:** v1
> **Базовый путь:** `/api/v1/documents`
> **Аутентификация:** NextAuth.js (session-based)
> **Дата обновления:** 2026-07-22

---

## Обзор

Модуль предоставляет REST API для управления документами СНТ: загрузка, просмотр, категоризация, фильтрация, поиск и скачивание.

### Endpoints

| Метод | Путь | Описание | Роли |
|-------|------|----------|------|
| GET | `/api/v1/documents` | Список документов | Все авторизованные |
| POST | `/api/v1/documents/upload` | Загрузка файла | ADMIN |
| PUT | `/api/v1/documents/[id]/metadata` | Сохранение метаданных | ADMIN |
| GET | `/api/v1/documents/[id]` | Детали документа | Все авторизованные |
| PUT | `/api/v1/documents/[id]` | Редактирование документа | ADMIN |
| GET | `/api/v1/documents/[id]/download` | Скачивание файла | Все авторизованные |
| GET | `/api/v1/documents/categories` | Дерево категорий | Все авторизованные |
| POST | `/api/v1/documents/categories` | Создание категории | ADMIN |
| DELETE | `/api/v1/documents/categories/[id]` | Удаление категории | ADMIN |

---

## 1. Список документов

### `GET /api/v1/documents`

Получить список документов с фильтрацией и пагинацией. ADMIN видит все документы (включая черновики). Остальные роли — только опубликованные документы, доступные по их роли.

#### Авторизация

Требуется активная сессия (любая роль).

#### Query Parameters

| Параметр | Тип | Обязательный | Описание |
|----------|-----|-------------|----------|
| `categoryId` | `string` | Нет | Фильтр по категории (включает подкатегории) |
| `documentType` | `string` | Нет | Фильтр по типу (Договор, Протокол и т.д.) |
| `status` | `'draft' \| 'published' \| 'archived'` | Нет | Фильтр по статусу |
| `search` | `string` | Нет | Поиск по названию, описанию и тегам |
| `page` | `number` | Нет | Номер страницы (по умолчанию: 1) |
| `limit` | `number` | Нет | Количество на странице (по умолчанию: 20, макс: 100) |

#### Пример запроса

```
GET /api/v1/documents?categoryId=cat123&documentType=Протокол&page=1&limit=10
```

#### Ответ 200 OK

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "doc_abc123",
        "title": "Протокол общего собрания",
        "description": "Протокол ежегодного собрания от 15.03.2026",
        "originalName": "Протокол_собрания.pdf",
        "fileSize": 524288,
        "mimeType": "application/pdf",
        "documentType": "Протокол",
        "status": "published",
        "visibleRoles": ["ADMIN", "MEMBER"],
        "createdAt": "2026-03-16T10:00:00Z",
        "updatedAt": "2026-03-16T10:00:00Z",
        "category": {
          "id": "cat123",
          "name": "Протоколы"
        },
        "tags": [
          { "id": "tag1", "name": "2026" },
          { "id": "tag2", "name": "собрание" }
        ],
        "uploader": {
          "id": "user_123",
          "name": "Иван Иванов",
          "email": "ivan@example.com"
        }
      }
    ],
    "total": 42,
    "page": 1,
    "limit": 10
  }
}
```

#### Ошибки

| Код | Статус | Описание |
|-----|--------|----------|
| `UNAUTHORIZED` | 401 | Пользователь не авторизован |
| `VALIDATION_ERROR` | 400 | Ошибка валидации параметров запроса |
| `INTERNAL_ERROR` | 500 | Внутренняя ошибка сервера |

---

## 2. Загрузка файла

### `POST /api/v1/documents/upload`

Загрузить файл документа и создать черновик (draft). Файл сохраняется в хранилище, в БД создаётся запись со статусом `draft`. После загрузки необходимо сохранить метаданные (название, тип, категорию).

#### Авторизация

Только роль **ADMIN**.

#### Body (multipart/form-data)

| Поле | Тип | Обязательный | Описание |
|------|-----|-------------|----------|
| `file` | File | Да | Файл документа |

**Поддерживаемые типы файлов:**

| MIME-тип | Расширение |
|----------|-----------|
| `application/pdf` | .pdf |
| `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | .docx |
| `image/jpeg` | .jpg, .jpeg |
| `image/png` | .png |
| `image/gif` | .gif |
| `image/bmp` | .bmp |
| `image/webp` | .webp |

**Максимальный размер:** 100 МБ (104 857 600 байт).

#### Пример запроса

```bash
curl -X POST /api/v1/documents/upload \
  -H "Cookie: next-auth.session-token=..." \
  -F "file=@/path/to/document.pdf"
```

#### Ответ 201 Created

```json
{
  "success": true,
  "data": {
    "id": "doc_new456",
    "title": "Untitled",
    "description": null,
    "originalName": "document.pdf",
    "storagePath": "documents/abc123-document.pdf",
    "fileSize": 524288,
    "mimeType": "application/pdf",
    "categoryId": null,
    "documentType": "Untitled",
    "visibleRoles": ["ADMIN"],
    "status": "draft",
    "uploadedById": "user_123",
    "createdAt": "2026-07-22T12:00:00Z",
    "updatedAt": "2026-07-22T12:00:00Z"
  }
}
```

#### Ошибки

| Код | Статус | Описание |
|-----|--------|----------|
| `UNAUTHORIZED` | 401 | Пользователь не авторизован |
| `FORBIDDEN` | 403 | Недостаточно прав (требуется ADMIN) |
| `BAD_REQUEST` | 400 | Файл не предоставлен / пустой файл / неподдерживаемый тип |
| `FILE_TOO_LARGE` | 413 | Размер файла превышает 100 МБ |
| `INTERNAL_ERROR` | 500 | Внутренняя ошибка сервера |

---

## 3. Сохранение метаданных

### `PUT /api/v1/documents/[id]/metadata`

Сохранить метаданные для загруженного документа: название, описание, категорию, тип, видимость по ролям и теги. После сохранения статус меняется с `draft` на `published`.

#### Авторизация

Только роль **ADMIN**.

#### Path Parameters

| Параметр | Тип | Описание |
|----------|-----|----------|
| `id` | `string` | ID документа (черновика) |

#### Body (JSON)

| Поле | Тип | Обязательный | Описание |
|------|-----|-------------|----------|
| `title` | `string` | Да | Название документа (1-255 символов) |
| `description` | `string` | Нет | Описание документа |
| `categoryId` | `string` | Нет | ID категории |
| `documentType` | `string` | Да | Тип документа: Договор, Протокол, Справка и т.д. |
| `visibleRoles` | `string[]` | Да | Роли, имеющие доступ (минимум 1) |
| `tags` | `string[]` | Нет | Теги (максимум 10, до 50 символов каждый) |

**Доступные роли:** `ADMIN`, `MEMBER`, `GUEST`, `ACCOUNTANT` и др.

#### Пример запроса

```bash
curl -X PUT /api/v1/documents/doc_new456/metadata \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "title": "Протокол общего собрания",
    "description": "Ежегодное собрание от 15.03.2026",
    "categoryId": "cat123",
    "documentType": "Протокол",
    "visibleRoles": ["ADMIN", "MEMBER"],
    "tags": ["2026", "собрание", "ежегодное"]
  }'
```

#### Ответ 200 OK

```json
{
  "success": true,
  "data": {
    "id": "doc_new456",
    "title": "Протокол общего собрания",
    "description": "Ежегодное собрание от 15.03.2026",
    "originalName": "document.pdf",
    "storagePath": "documents/abc123-document.pdf",
    "fileSize": 524288,
    "mimeType": "application/pdf",
    "categoryId": "cat123",
    "documentType": "Протокол",
    "visibleRoles": ["ADMIN", "MEMBER"],
    "status": "published",
    "uploadedById": "user_123",
    "createdAt": "2026-07-22T12:00:00Z",
    "updatedAt": "2026-07-22T12:05:00Z"
  }
}
```

#### Ошибки

| Код | Статус | Описание |
|-----|--------|----------|
| `UNAUTHORIZED` | 401 | Пользователь не авторизован |
| `FORBIDDEN` | 403 | Недостаточно прав |
| `NOT_FOUND` | 404 | Документ не найден |
| `VALIDATION_ERROR` | 400 | Ошибка валидации (Zod) |
| `BAD_REQUEST` | 400 | Некорректный JSON |
| `INTERNAL_ERROR` | 500 | Внутренняя ошибка сервера |

---

## 4. Детали документа

### `GET /api/v1/documents/[id]`

Получить детали одного документа с категорией, тегами и информацией о загрузчике. Доступ проверяется по роли пользователя.

#### Авторизация

Требуется активная сессия. Документ должен быть доступен по роли пользователя.

#### Path Parameters

| Параметр | Тип | Описание |
|----------|-----|----------|
| `id` | `string` | ID документа |

#### Пример запроса

```
GET /api/v1/documents/doc_abc123
```

#### Ответ 200 OK

```json
{
  "success": true,
  "data": {
    "id": "doc_abc123",
    "title": "Протокол общего собрания",
    "description": "Протокол ежегодного собрания от 15.03.2026",
    "originalName": "Протокол_собрания.pdf",
    "storagePath": "documents/xyz789-protocol.pdf",
    "fileSize": 524288,
    "mimeType": "application/pdf",
    "categoryId": "cat123",
    "documentType": "Протокол",
    "visibleRoles": ["ADMIN", "MEMBER"],
    "status": "published",
    "uploadedById": "user_123",
    "createdAt": "2026-03-16T10:00:00Z",
    "updatedAt": "2026-03-16T10:00:00Z",
    "category": {
      "id": "cat123",
      "name": "Протоколы",
      "description": null
    },
    "tags": [
      { "id": "tag1", "name": "2026" },
      { "id": "tag2", "name": "собрание" }
    ],
    "uploader": {
      "id": "user_123",
      "name": "Иван Иванов",
      "email": "ivan@example.com"
    }
  }
}
```

#### Ошибки

| Код | Статус | Описание |
|-----|--------|----------|
| `UNAUTHORIZED` | 401 | Пользователь не авторизован |
| `NOT_FOUND` | 404 | Документ не найден |
| `FORBIDDEN` | 403 | Нет доступа к документу |
| `INTERNAL_ERROR` | 500 | Внутренняя ошибка сервера |

---

## 5. Редактирование документа

### `PUT /api/v1/documents/[id]`

Редактировать метаданные и теги документа. Все поля опциональны. Нельзя редактировать документы со статусом `archived`.

#### Авторизация

Только роль **ADMIN**.

#### Path Parameters

| Параметр | Тип | Описание |
|----------|-----|----------|
| `id` | `string` | ID документа |

#### Body (JSON) — все поля опциональны

| Поле | Тип | Описание |
|------|-----|----------|
| `title` | `string` | Новое название (1-255 символов) |
| `description` | `string` | Новое описание |
| `categoryId` | `string` | Новая категория |
| `documentType` | `string` | Новый тип |
| `visibleRoles` | `string[]` | Новая видимость по ролям |
| `tags` | `string[]` | Новые теги (замена существующих) |
| `status` | `'draft' \| 'published' \| 'archived'` | Новый статус |

#### Пример запроса

```bash
curl -X PUT /api/v1/documents/doc_abc123 \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "title": "Протокол общего собрания (редакция)",
    "status": "archived"
  }'
```

#### Ответ 200 OK

```json
{
  "success": true,
  "data": {
    "id": "doc_abc123",
    "title": "Протокол общего собрания (редакция)",
    "description": "Протокол ежегодного собрания от 15.03.2026",
    "originalName": "Протокол_собрания.pdf",
    "fileSize": 524288,
    "mimeType": "application/pdf",
    "documentType": "Протокол",
    "visibleRoles": ["ADMIN", "MEMBER"],
    "status": "archived",
    "updatedAt": "2026-07-22T13:00:00Z"
  }
}
```

#### Ошибки

| Код | Статус | Описание |
|-----|--------|----------|
| `UNAUTHORIZED` | 401 | Пользователь не авторизован |
| `FORBIDDEN` | 403 | Недостаточно прав |
| `NOT_FOUND` | 404 | Документ не найден |
| `BAD_REQUEST` | 400 | Документ архивирован (нельзя редактировать) |
| `VALIDATION_ERROR` | 400 | Ошибка валидации |
| `BAD_REQUEST` | 400 | Некорректный JSON |
| `INTERNAL_ERROR` | 500 | Внутренняя ошибка сервера |

---

## 6. Скачивание файла

### `GET /api/v1/documents/[id]/download`

Скачать файл документа. Доступ проверяется по роли.

#### Авторизация

Требуется активная сессия. Документ должен быть доступен по роли пользователя.

#### Path Parameters

| Параметр | Тип | Описание |
|----------|-----|----------|
| `id` | `string` | ID документа |

#### Пример запроса

```bash
curl -O -J /api/v1/documents/doc_abc123/download \
  -H "Cookie: next-auth.session-token=..."
```

#### Ответ 200 OK

Файл возвращается как поток с заголовками:

| Заголовок | Значение |
|-----------|----------|
| `Content-Type` | MIME-тип файла |
| `Content-Disposition` | `attachment; filename="Протокол_собрания.pdf"` |
| `Content-Length` | Размер файла в байтах |

#### Ошибки

| Код | Статус | Описание |
|-----|--------|----------|
| `UNAUTHORIZED` | 401 | Пользователь не авторизован |
| `NOT_FOUND` | 404 | Документ не найден |
| `FORBIDDEN` | 403 | Нет доступа к документу |
| `INTERNAL_ERROR` | 500 | Внутренняя ошибка сервера |

---

## 7. Дерево категорий

### `GET /api/v1/documents/categories`

Получить дерево категорий документов.

#### Авторизация

Требуется активная сессия.

#### Пример запроса

```
GET /api/v1/documents/categories
```

#### Ответ 200 OK

```json
{
  "success": true,
  "data": [
    {
      "id": "cat1",
      "name": "Договоры",
      "description": "Юридические договоры",
      "children": [
        {
          "id": "cat1a",
          "name": "Договоры аренды",
          "description": null,
          "children": []
        },
        {
          "id": "cat1b",
          "name": "Договоры обслуживания",
          "description": null,
          "children": []
        }
      ]
    },
    {
      "id": "cat2",
      "name": "Протоколы",
      "description": "Протоколы собраний",
      "children": []
    }
  ]
}
```

#### Ошибки

| Код | Статус | Описание |
|-----|--------|----------|
| `UNAUTHORIZED` | 401 | Пользователь не авторизован |
| `INTERNAL_ERROR` | 500 | Внутренняя ошибка сервера |

---

## 8. Создание категории

### `POST /api/v1/documents/categories`

Создать новую категорию документа. Поддерживается создание корневых категорий и подкатегорий.

#### Авторизация

Только роль **ADMIN**.

#### Body (JSON)

| Поле | Тип | Обязательный | Описание |
|------|-----|-------------|----------|
| `name` | `string` | Да | Название категории (1-100 символов) |
| `description` | `string` | Нет | Описание (до 500 символов) |
| `parentId` | `string` | Нет | ID родительской категории |

#### Пример запроса (корневая категория)

```bash
curl -X POST /api/v1/documents/categories \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "name": "Договоры",
    "description": "Юридические договоры СНТ"
  }'
```

#### Пример запроса (подкатегория)

```bash
curl -X POST /api/v1/documents/categories \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "name": "Договоры аренды",
    "parentId": "cat1"
  }'
```

#### Ответ 201 Created

```json
{
  "success": true,
  "data": {
    "id": "cat_new",
    "name": "Договоры",
    "description": "Юридические договоры СНТ",
    "parentId": null,
    "createdAt": "2026-07-22T12:00:00Z",
    "updatedAt": "2026-07-22T12:00:00Z"
  }
}
```

#### Ошибки

| Код | Статус | Описание |
|-----|--------|----------|
| `UNAUTHORIZED` | 401 | Пользователь не авторизован |
| `FORBIDDEN` | 403 | Недостаточно прав |
| `CONFLICT` | 409 | Категория с таким именем уже существует у данного родителя |
| `NOT_FOUND` | 404 | Родительская категория не найдена |
| `VALIDATION_ERROR` | 400 | Ошибка валидации |
| `INTERNAL_ERROR` | 500 | Внутренняя ошибка сервера |

---

## 9. Удаление категории

### `DELETE /api/v1/documents/categories/[id]`

Удалить категорию документа. Документы переносятся в родительскую категорию (или без категории). Подкатегории привязываются к родителю удаляемой категории.

#### Авторизация

Только роль **ADMIN**.

#### Path Parameters

| Параметр | Тип | Описание |
|----------|-----|----------|
| `id` | `string` | ID категории |

#### Пример запроса

```bash
curl -X DELETE /api/v1/documents/categories/cat1a \
  -H "Cookie: next-auth.session-token=..."
```

#### Ответ 200 OK

```json
{
  "success": true
}
```

#### Ошибки

| Код | Статус | Описание |
|-----|--------|----------|
| `UNAUTHORIZED` | 401 | Пользователь не авторизован |
| `FORBIDDEN` | 403 | Недостаточно прав |
| `NOT_FOUND` | 404 | Категория не найдена |
| `INTERNAL_ERROR` | 500 | Внутренняя ошибка сервера |

---

## Структура ответов

Все ответы API имеют единую структуру:

### Успешный ответ

```json
{
  "success": true,
  "data": { ... }
}
```

### Ответ с ошибкой

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Описание ошибки на русском языке"
  }
}
```

### Коды ошибок

| Код | HTTP Статус | Описание |
|-----|------------|----------|
| `UNAUTHORIZED` | 401 | Не авторизован |
| `FORBIDDEN` | 403 | Недостаточно прав |
| `NOT_FOUND` | 404 | Ресурс не найден |
| `BAD_REQUEST` | 400 | Неверный запрос |
| `VALIDATION_ERROR` | 400 | Ошибка валидации данных |
| `FILE_TOO_LARGE` | 413 | Файл слишком большой |
| `CONFLICT` | 409 | Конфликт данных |
| `INTERNAL_ERROR` | 500 | Внутренняя ошибка сервера |

---

## Статусы документов

| Статус | Описание | Видимость | Редактирование |
|--------|----------|-----------|----------------|
| `draft` | Черновик (файл загружен, метаданные не назначены) | Только ADMIN | Да |
| `published` | Опубликован (метаданные назначены) | По visibleRoles | Да |
| `archived` | Архивирован | По visibleRoles | Нет (только просмотр) |

---

## Роли и видимость

| Роль | Описание | Доступ к документам |
|------|----------|---------------------|
| `ADMIN` | Администратор | Все документы, включая draft |
| `MEMBER` | Член СНТ | Опубликованные документы с visibleRoles включающими MEMBER |
| `GUEST` | Гость | Опубликованные документы с visibleRoles включающими GUEST |
| `ACCOUNTANT` | Бухгалтер | Опубликованные документы с visibleRoles включающими ACCOUNTANT |

---

## Лимиты и ограничения

| Параметр | Значение |
|----------|---------|
| Максимальный размер файла | 100 МБ |
| Максимум тегов на документ | 10 |
| Максимальная длина тега | 50 символов |
| Максимальная длина названия | 255 символов |
| Максимальная длины категории | 100 символов |
| Пагинация: limit по умолчанию | 20 |
| Пагинация: limit максимум | 100 |