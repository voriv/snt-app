# Auth Register API Endpoint

## Статус: На обсуждении

---

## 1. Описание

### 1.1 Назначение

POST `/api/auth/register` — endpoint для регистрации нового пользователя. Создаёт User запись с ролью GUEST и автоматически создаёт сессию.

### 1.2 Границы ответственности

| Входит | НЕ входит |
|--------|-----------|
| Приём и валидация входных данных | Бизнес-валидация (передана в Service) |
| Перенаправление ошибок Service | Email-уведомления |
| Создание сессии после регистрации | Роутинг/редирект на клиенте |

---

## 2. Операция POST /api/auth/register

### 2.1 Авторизация

| Требование | Значение |
|------------|----------|
| Аутентификация | НЕ требуется (публичный endpoint) |
| Роль | Нет требований |

### 2.2 Параметры

| Источник | Параметр | Тип | Обязательное | Описание |
|----------|----------|-----|--------------|----------|
| body | `email` | string | да | Email пользователя |
| body | `password` | string | да | Пароль (мин. 6 символов) |

### 2.3 Ответ

| Статус | Описание | Формат |
|--------|----------|--------|
| 201 | Пользователь успешно зарегистрирован | `{ success: true, data: { user: { id, email, role } } }` |
| 400 | Ошибка валидации | `{ success: false, error: { code: 'VALIDATION_ERROR', message: '...', details: [...] } }` |
| 409 | Email уже существует | `{ success: false, error: { code: 'CONFLICT', message: 'Пользователь с таким email уже существует' } }` |
| 500 | Внутренняя ошибка сервера | `{ success: false, error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' } }` |

### 2.4 Бизнес-правила

| ID | Правило | Описание | Ошибка |
|----|---------|----------|--------|
| BL-001 | Уникальность email | email не должен существовать в системе | `ConflictError` |
| BL-002 | Роль GUEST | Новый пользователь всегда получает роль GUEST | — |
| BL-003 | Активация | Новый пользователь активируется автоматически (`isActive = true`) | — |

---

## 3. Пример запроса/ответа

### 3.1 Успешная регистрация

**Запрос:**
```http
POST /api/auth/register HTTP/1.1
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "secure123"
}
```

**Ответ 201:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clxxx123",
      "email": "newuser@example.com",
      "role": "GUEST"
    }
  }
}
```

### 3.2 Ошибка валидации

**Запрос:**
```http
POST /api/auth/register HTTP/1.1
Content-Type: application/json

{
  "email": "invalid",
  "password": "12"
}
```

**Ответ 400:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Валидация не пройдена",
    "details": [
      { "field": "email", "message": "Неверный формат email" },
      { "field": "password", "message": "Пароль должен содержать минимум 6 символов" }
    ]
  }
}
```

### 3.3 Конфликт email

**Запрос:**
```http
POST /api/auth/register HTTP/1.1
Content-Type: application/json

{
  "email": "existing@example.com",
  "password": "secure123"
}
```

**Ответ 409:**
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Пользователь с таким email уже существует"
  }
}
```

---

## 4. Зависимости

### 4.1 Service зависимости

| Service | Методы | Назначение |
|---------|--------|------------|
| `AuthService` | `register()` | Создание пользователя |

### 4.2 Внутренние зависимости

| Компонент | Путь | Назначение |
|-----------|------|------------|
| Auth utility | `src/app/api/_lib/auth.ts` | Аутентификация (не требуется для этого endpoint) |
| Response utility | `src/app/api/_lib/response.ts` | Форматирование ответов |

---

## 5. Структура файлов

| Файл | Назначение |
|------|------------|
| `src/app/api/auth/register/route.ts` | Endpoint handler |

---

## 6. Чек-лист качества

- [ ] JSDoc документация на `POST` функцию
- [ ] Zod валидация входных данных (`registerSchema`)
- [ ] Нет проверки аутентификации (публичный endpoint)
- [ ] Единый формат ответов (`successResponse`, `errorResponse`)
- [ ] try/catch с `handleServiceError`
- [ ] Нет бизнес-логики в handler (только вызов `authService.register()`)
- [ ] Нет `any` в типах
- [ ] HTTP 201 при успешном создании

---

## История изменений

| Версия | Дата | Изменения | Автор |
|--------|------|-----------|-------|
| 0.1.0 | 2026-06-26 | Начальная версия | architect |
