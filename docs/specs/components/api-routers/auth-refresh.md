# API Endpoint: POST /api/auth/refresh

## Статус: На обсуждении

---

## 1. Описание

Обновление access и refresh токенов. Реализует Refresh Token Flow с ротацией токенов.

## 2. Endpoint

### URL

`POST /api/auth/refresh`

### Аутентификация

| Требование | Описание |
|------------|----------|
| Auth | 🔓 Не требуется (публичный endpoint) |

### Request Body

| Поле | Тип | Обязательный | Описание |
|------|-----|--------------|----------|
| refreshToken | string | да | Refresh token для обновления |

### Response

#### Успешный ответ (200)

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "new-refresh-token..."
  }
}
```

#### Ошибки

| Код | HTTP | Тело | Описание |
|-----|------|------|-----------|
| VALIDATION_ERROR | 400 | `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Неверный запрос" } }` | Нет refreshToken в теле |
| UNAUTHORIZED | 401 | `{ "success": false, "error": { "code": "UNAUTHORIZED", "message": "Невалидный refresh token" } }` | Токен отозван/истёк/невалиден |
| INTERNAL_ERROR | 500 | `{ "success": false, "error": { "code": "INTERNAL_ERROR", "message": "Внутренняя ошибка сервера" } }` | Серверная ошибка |

## 3. Бизнес-правила

- Проверяет подпись refresh token
- Проверяет, что token не отозван и не истёк
- Генерирует новую пару access + refresh токенов
- Старый refresh token помечается как отозванный
- Новый refresh token сохраняется в БД

## 4. Зависимости

### Внутренние

| Компонент | Тип | Описание |
|-----------|-----|----------|
| `AuthService` | Service | Валидация refresh token |

### Внешние

Нет.

## 5. Примеры

```bash
curl -X POST /api/auth/refresh -H "Content-Type: application/json" -d '{"refreshToken":"abc123..."}'
# → 200 {"success":true,"data":{"accessToken":"eyJ...","refreshToken":"new-token..."}}
```

---

## История изменений

| Версия | Дата | Изменения | Автор |
|--------|------|-----------|-------|
| 0.1.0 | 2026-06-26 | Начальная версия | architect |