# DocumentTagLink (Junction Table)

## Описание

Junction table для связи M:N между Document и DocumentTag. Реализует отношение многие-ко-многим: один документ может иметь несколько тегов, один тег может быть привязан к нескольким документам.

## Поля

| Поле | Тип | Обязательное | Описание | Бизнес-правила |
|------|-----|-------------|----------|----------------|
| document_id | String | Да | Ссылка на документ | FK -> Document.id |
| tag_id | String | Да | Ссылка на тег | FK -> DocumentTag.id |

## Связи

| Сущность | Тип связи | Описание |
|----------|-----------|----------|
| Document | belongs_to | Связь с документом (M:N) |
| DocumentTag | belongs_to | Связь с тегом (M:N) |

## Индексы

| Поля | Тип | Описание |
|------|-----|----------|
| (document_id, tag_id) | unique | Уникальность пары: нельзя добавить один тег дважды к одному документу |
| tag_id | index | Ускорение поиска документов по тегу |

## Бизнес-инварианты

- Пара (document_id, tag_id) уникальна: один тег не может быть добавлен дважды к одному документу
- При удалении документа связи удаляются каскадно (CASCADE)
- При удалении тега связи удаляются каскадно (CASCADE)

## Конвенции именования

- **БД (PostgreSQL):** document_tag_links, document_id, tag_id
- **Prisma:** DocumentTagLink, documentId, tagId

@see docs/model/entities/document.md — сущность Document
@see docs/model/entities/document-tag.md — сущность DocumentTag
