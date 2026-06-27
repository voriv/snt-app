# API Endpoint: POST /api/auth/logout

## Статус: На обсуждении

---

## 1. Описание

Выход из системы. Отзывает refresh token и очищает сессию пользователя.

## 2. Endpoint

### URL

`POST /api/auth/logout`

### Аутентификация

| Требование | Описание |
|------------|----------|
| Auth | 🔒 Требуется авторизация |

### Request Body

Пустое тело запроса. Token берётся из cookie.

### Response

#### Успешный ответ (200)

```json
{
  "success": true,
  "data": { "message": "Успешный выход из системы" }
}
```

#### Ошибки

| Код | HTTP | Тело | Описание |
|-----|------|------|-----------|
| UNAUTHORIZED | 401 | `{ "success": false, "error": { "code": "UNAUTHORIZED", "message": "Требуется авторизация" } }` | Нет авторизации |
| INTERNAL_ERROR | 500 | `{ "success": false, "error": { "code": "INTERNAL_ERROR", "message": "Внутренняя ошибка сервера" } }` | Серверная ошибка |

## 3. Бизнес-правила

- Очищает refresh token в БД
- Удаляет session cookie
- Удаляет refresh token cookie

## 4. Зависимости

### Внутренние

| Компонент | Тип | Описание |
|-----------|-----|----------|
| `AuthService` | Service | Не используется напрямую, logout — операция над cookie |

### Внешние

Нет.

## 5. Примеры

```bash
curl -X POST /api/auth/logout -H "Cookie: session-token=xxx"
# → 200 {"success":true,"data":{"message":"Успешный выход из системы"}}
```

---

## История изменений

| Версия | Дата | Изменения | Автор |
|--------|------|-----------|-------|
| 0.1.0 | 2026-06-26 | Начальная версия | architect |