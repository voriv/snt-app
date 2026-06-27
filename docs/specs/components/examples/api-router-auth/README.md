# Пример: API Router с авторизацией

Пример демонстрирует стандартный паттерн API-роутера в архитектуре проекта `snt-app`.

## Архитектурные слои

```
Запрос → auth.utils.ts (проверка авторизации)
      → route.ts (валидация параметров через Zod)
      → Service (бизнес-логика)
      → response.utils.ts (форматирование ответа)
```

## Ключевые паттерны

| Паттерн | Реализация |
|---------|-----------|
| **Единый формат ответов** | `successResponse()` / `errorResponse()` — консистентная структура JSON |
| **Middleware авторизации** | `requireAuth()` / `requireRole()` — проверка сессии и ролей |
| **Zod валидация** | Валидация query params, request body, path params |
| **Error handling** | `ServiceError` → HTTP статус маппинг |
| **Пагинация** | Стандартные `page`, `limit` параметры |

## Связанные спецификации

- [`api-router-requirements.md`](../../api-routers/api-router-requirements.md)
- [`auth.md`](../../../auth.md)