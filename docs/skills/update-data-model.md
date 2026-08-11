# Skill: Обновление модели данных (Update Data Model)

> **Исполнитель:** `data-architect` mode
> **Вход:** `docs/user-stories/US-*.md`, `docs/model/entities/*.md`, `prisma/schema.prisma`
> **Выход:** Обновлённые `docs/model/entities/*.md`, `docs/model/schema.dbml`, `prisma/schema.prisma`

---

## Алгоритм

1. **Прочитать US** — открой User Stories из сообщения Orchestrator
2. **Прочитать модель** — изучи существующие сущности в `docs/model/entities/`
3. **Определить изменения** — какие сущности создать, какие изменить
4. **Для каждой сущности:**
   - Проверь, существует ли уже описание в `docs/model/entities/{entity}.md`
   - Если нет — создай по аналогии с существующими
   - Если да — обнови поля, связи, инварианты
5. **Обновить DBML** — отредактируй `docs/model/schema.dbml`
6. **Обновить Prisma** — отредактируй `prisma/schema.prisma`
7. **Проверить** — выполни `npx prisma generate` (должно быть без ошибок)
8. **Запросить approve**

## Правила

- Следуй конвенциям из [`docs/model/conventions.md`](docs/model/conventions.md)
- Все изменения должны быть обратимы (документируй breaking changes)
