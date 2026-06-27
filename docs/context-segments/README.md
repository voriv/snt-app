# Контекстные сегменты

> 📌 **AI: читай [`quick-reference.md`](../quick-reference.md) первым.** Сегменты читай только когда нужны детали по конкретной теме.

---

## Назначение

Контекстные сегменты — промежуточный слой между [`quick-reference.md`](../quick-reference.md) (~110 строк) и полными спецификациями. Каждый сегмент содержит выжимку по одной теме (~100-150 строк).

---

## Навигация

| Сегмент | Тема | Когда читать |
|---------|------|-------------|
| [`01-architecture.md`](01-architecture.md) | Стек, структура проекта, конфигурация | Вопросы по архитектуре, деплою, ресурсам |
| [`02-database.md`](02-database.md) | 19 сущностей, связи, индексы | Вопросы по модели данных, миграциям, БД |
| [`03-auth-security.md`](03-auth-security.md) | JWT, RBAC, WebSocket auth, защита | Вопросы по аутентификации, авторизации, безопасности |
| [`04-component-patterns.md`](04-component-patterns.md) | Service, Repository, DI, ошибки | Вопросы по паттернам компонентов, бизнес-логике |
| [`05-api-patterns.md`](05-api-patterns.md) | Route структура, ApiResponse, пагинация | Вопросы по API, endpoints, форматам ответов |
| [`06-websocket.md`](06-websocket.md) | Протокол, handlers, rooms, events | Вопросы по WebSocket, чатам, уведомлениям |
| [`07-monitoring.md`](07-monitoring.md) | Pino, PM2, логирование, алерты | Вопросы по логированию, мониторингу, ротации логов |
| [`08-file-storage.md`](08-file-storage.md) | bytea, MIME, валидация, бэкап | Вопросы по хранению файлов, загрузке, безопасности |

---

## Альтернативы: Lite спецификации

Для работы с компонентами лучше использовать **Lite спецификации** (`specs-lite/`) — они содержат ключевые паттерны без детальных примеров кода (~65-100 строк).

| Lite-версия | Тема |
|-------------|------|
| [`service-requirements-lite.md`](../specs-lite/service-requirements-lite.md) | Service паттерны |
| [`api-router-requirements-lite.md`](../specs-lite/api-router-requirements-lite.md) | API Router паттерны |
| [`websocket-client-lite.md`](../specs-lite/websocket-client-lite.md) | WS Client паттерны |
| [`ui-requirements-lite.md`](../specs-lite/ui-requirements-lite.md) | UI компоненты паттерны |
| [`repository-requirements-lite.md`](../specs-lite/repository-requirements-lite.md) | Repository паттерны |

---

## Принципы

1. **Один сегмент = одна тема** — не читать всё подряд
2. **Ссылки вместо дублирования** — полный код и детали в исходных документах
3. **Краткие примеры** — не более 30-40 строк кода на пример