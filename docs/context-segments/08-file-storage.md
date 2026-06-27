# Хранение файлов

> 📌 Контекстный сегмент. Полная версия: [`file-storage.md`](../specs/file-storage.md)

---

## Архитектура

Все файлы хранятся в **PostgreSQL** (тип `bytea`).

**Обоснование:**
- Единый бэкап через `pg_dump`
- Транзакционная целостность (файлы удаляются вместе с записями)
- Нет зависимости от файловой системы

---

## Ограничения

| Параметр | Значение |
|----------|----------|
| Макс. размер файла | 10 MB |
| Ожидаемый объём данных | ~8 GB |

---

## Модель данных

**Сущность `File`:** `id`, `originalName`, `mimeType`, `size`, `content` (bytea), `isDeleted`, `createdAt`, `updatedAt`

**Интеграция с другими моделями:** через `avatarFileId` (User), `fileId` (Document), `receiptFileId` (Payment)

> 📄 Полный Prisma Schema: [`prisma/schema.prisma`](../../prisma/schema.prisma)

---

## Разрешённые MIME-типы

| Категория | MIME-типы | Макс. размер |
|-----------|-----------|-------------|
| Аватары | image/jpeg, image/png, image/webp | 2 MB |
| Документы | application/pdf, .xls, .xlsx, .doc, .docx | 10 MB |
| Квитанции | image/jpeg, image/png, image/webp, application/pdf | 5 MB |
| Вложения объявлений | image/jpeg, image/png, image/webp | 5 MB |

---

## API

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/files/upload` | Загрузка файла (multipart/form-data) |
| GET | `/api/files/:id/download` | Скачивание (attachment) |
| GET | `/api/files/:id/view` | Просмотр (inline) |
| PATCH | `/api/files/:id` | Обновление содержимого/имени |
| DELETE | `/api/files/:id` | Мягкое удаление (`isDeleted=true`) |
| DELETE | `/api/files/:id/hard` | Жёсткое удаление (только ADMIN) |

---

## Валидация

**Двухуровневая:**
1. Клиент: проверка `file.type`
2. Сервер: проверка **magic bytes** (первых байтов файла)

**Именование:** `{UUID}_{originalName}.{ext}`

---

## Безопасность

| Мера | Описание |
|------|----------|
| Rate limiting | 10 upload/мин, 100 download/мин |
| Magic bytes | Проверка содержимого файла |
| Path traversal | Имена генерируются автоматически |
| XSS защита | `X-Content-Type-Options: nosniff` |
| SQL Injection | Prisma (parameterized queries) |

**Доступ:** ADMIN — все файлы; MEMBER — свои + публичные; GUEST — только публичные

---

## Производительность

- **Stream** для файлов >1 MB (не загружать в память)
- **HTTP-кеширование:** `Cache-Control: public, max-age=3600`, `ETag: "{id}-{updatedAt}"`
- **Аватары:** кэширование 24 часа
- **Сжатие:** аватары → WebP при загрузке (~30% экономия)

---

## Бэкап

```bash
pg_dump -U snt_user -d snt_db | gzip > /backup/db-$(date +%Y%m%d).sql.gz  # Файлы включены автоматически
```

---

📄 Полная спецификация: [`file-storage.md`](../specs/file-storage.md)