# Skill: Создание тестов (Create Tests)

> **Исполнитель:** `qa-engineer` mode
> **Вход:** `docs/user-stories/US-{NN}-{slug}.md`, `src/`
> **Выход:** Тесты в `tests/`

---

## Алгоритм

1. **Прочитать US** — открой User Story для тестирования
2. **Прочитать код** — изучи реализацию в `src/`
3. **Создать unit-тесты** — для каждого сервиса, валидатора, ошибок
4. **Создать API-тесты** — для каждого endpoint (supertest)
5. **Создать E2E-тесты** — для критических сценариев (Playwright)
6. **Запустить тесты:** `npm test`
7. **Если тесты падают — исправь тесты** (не продакшен-код)
8. **Запросить approve**

## Типы тестов

| Тип | Инструмент | Папка | Что покрываем |
|---|---|---|---|
| Unit | vitest | `tests/unit/domains/{service}/` | service, validators, errors |
| API | vitest + supertest | `tests/api/` | endpoints (HTTP) |
| Component | vitest + RTL | `tests/components/` | UI rendering |
| E2E | Playwright | `tests/e2e/{feature}/` | Критические сценарии |
