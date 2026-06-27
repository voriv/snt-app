# Модель данных

## Индекс доменов модели

| Домен | DBML файл | MD описание |
|-------|-----------|-------------|
| Core | [core.dbml](core.dbml) | [core.md](core.md) |
| Accounting | [accounting.dbml](accounting.dbml) | [accounting.md](accounting.md) |
| Publications | [publications.dbml](publications.dbml) | [publications.md](publications.md) |
| Voting | [voting.dbml](voting.dbml) | [voting.md](voting.md) |
| Communication | [communication.dbml](communication.dbml) | [communication.md](communication.md) |

---

## Междоменные связи

| Сущность A | Домен A | Связь | Сущность B | Домен B | Тип |
|------------|---------|-------|------------|---------|-----|
| User | Core | 1:1 | Member | Core | Прямая ссылка |
| User | Core | 1:N | Plot | Core | Прямая ссылка |
| Member | Core | 1:N | Payment | Accounting | Прямая ссылка |
| User | Core | 1:N | Notification | Communication | Прямая ссылка |

---

## Порядок изменения модели данных

См. [`../../.roo/rules/data-model-rules.md`](../../.roo/rules/data-model-rules.md)

### Процесс

1. Изменение DBML спецификации
2. Обновление MD описания сущностей
3. Обновление `prisma/schema.prisma`
4. Создание и применение миграции
5. Обновление TypeScript типов

---

## Связанные документы

| Документ | Назначение |
|----------|------------|
| [`../../.roo/rules/data-model-rules.md`](../../.roo/rules/data-model-rules.md) | Правила изменения модели данных |
| [`../component-spec-requirements.md`](../component-spec-requirements.md) | Требования к спецификациям |
| [`../../requirements/fr-change-management.md`](../../requirements/fr-change-management.md) | Управление изменениями FR |
