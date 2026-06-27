# Спецификации Lite — Сокращённые версии

> 📌 **AI: используй эти файлы вместо полных спецификаций для экономии контекста.** Полные версии — только когда нужны детали.

---

## Назначение

Lite-версии содержат ключевые требования, паттерны и интерфейсы без детальных примеров кода. Экономия: **~70-80% контекста** по сравнению с полными спецификациями.

---

## Навигация

| Lite-версия | Строк | Полная версия | Строк | Экономия |
|-------------|-------|---------------|-------|----------|
| [`service-requirements-lite.md`](service-requirements-lite.md) | ~100 | [`service-component-requirements.md`](../specs/components/services/service-component-requirements.md) | 931 | ~89% |
| [`api-router-requirements-lite.md`](api-router-requirements-lite.md) | ~100 | [`api-router-requirements.md`](../specs/components/api-routers/api-router-requirements.md) | 871 | ~89% |
| [`websocket-client-lite.md`](websocket-client-lite.md) | ~80 | [`websocket-client.md`](../specs/components/websocket-client.md) | 631 | ~87% |
| [`ui-requirements-lite.md`](ui-requirements-lite.md) | ~65 | [`ui-component-requirements.md`](../specs/components/ui/ui-component-requirements.md) | 311 | ~79% |
| [`repository-requirements-lite.md`](repository-requirements-lite.md) | ~75 | [`repository-component-requirements.md`](../specs/components/repositories/repository-component-requirements.md) | 330 | ~77% |

---

## Принципы

1. **Ключевые паттерны** — только то, что нужно для написания кода
2. **Ссылки вместо дублирования** — полные примеры в исходных документах
3. **Таблицы вместо кода** — где возможно, использовать таблицы вместо блоков кода