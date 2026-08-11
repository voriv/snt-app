# API: Смена пароля

## Overview

Endpoint `PUT /api/v1/auth/password` позволяет авторизованному пользователю сменить пароль, подтвердив текущий. Пароль хешируется с помощью bcrypt перед сохранением. Все активные сессии пользователя сохраняются после успешной смены (BR-11).

**Реализация:** [`src/app/api/v1/auth/password/route.ts`](src/app/api/v1/auth/password/route.ts)

---

## Endpoint

| Параметр | Значение |
|----------|----------|
| **Method** | `PUT` |
| **Path** | `/api/v1/auth/password` |
| **Auth** | Required (NextAuth session) |
| **Content-Type** | `application/json` |

---

## Authorization

Endpoint требует активной NextAuth-сессии. Сессия проверяется через [`auth()`](src/lib/auth.ts) вызов в начале обработчика. Если сессия отсутствует или не содержит `user.email`, возвращается `401 Unauthorized`.

---

## Request

### Body

| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| `currentPassword` | `string` | ✅ | Текущий пароль пользователя |
| `newPassword` | `string` | ✅ | Новый пароль (мин. 6 символов) |
| `confirmPasswordNew` | `string` | ✅ | Подтверждение нового пароля |

### Пример запроса

```json
{
  "currentPassword": "СтарыйПароль123",
  "newPassword": "НовыйПароль456",
  "confirmPasswordNew": "НовыйПароль456"
}
```

---

## Validation Schema

Валидация выполняется через Zod-схему [`changePasswordSchema`](src/domains/auth/auth.validators.ts:74):

| Поле | Правило | Сообщение об ошибке |
|------|---------|---------------------|
| `currentPassword` | `z.string()` (min 1) | «Текущий пароль обязателен» |
| `newPassword` | `z.string().min(6)` | «Пароль должен содержать минимум 6 символов» |
| `confirmPasswordNew` | `z.string()` (min 1) + `.refine(newPassword === confirmPasswordNew)` | «Подтверждение пароля обязательно» / «Пароли не совпадают» |

---

## Responses

### 200 OK — Успешная смена пароля

```json
{
  "success": true,
  "message": "Пароль успешно изменён"
}
```

### 400 Bad Request — Новый пароль совпадает с текущим

```json
{
  "success": false,
  "error": {
    "code": "NEW_PASSWORD_MATCHES_CURRENT",
    "message": "Новый пароль не может совпадать с текущим"
  }
}
```

### 401 Unauthorized

**Отсутствует сессия:**

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Unauthorized"
  }
}
```

**Неверный текущий пароль:**

```json
{
  "success": false,
  "error": {
    "code": "BUSINESS_RULE_ERROR",
    "message": "Неверный текущий пароль"
  }
}
```

### 422 Unprocessable Entity — Ошибка валидации

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Ошибка валидации данных",
    "fields": [
      {
        "code": "too_small",
        "minimum": 6,
        "type": "string",
        "inclusive": true,
        "exact": false,
        "message": "Пароль должен содержать минимум 6 символов",
        "path": ["newPassword"]
      }
    ]
  }
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Ошибка сервера"
  }
}
```

---

## Бизнес-правила

| ID | Правило | Описание |
|----|---------|----------|
| **BR-08** | Подтверждение текущего пароля | Для смены пароля требуется ввод корректного текущего пароля (защита от несанкционированной смены) |
| **BR-09** | Новый пароль ≠ текущему | Новый пароль не может совпадать с текущим |
| **BR-10** | Минимальная длина пароля | Новый пароль: минимум 6 символов |
| **BR-11** | Сохранение сессий | При успешной смене пароля все активные сессии пользователя сохраняются |
| **BR-12** | Хеширование паролей | Пароли хранятся только в зашифрованном виде (bcrypt) |

---

## Примеры curl

### Успешная смена пароля

```bash
curl -X PUT http://localhost:3000/api/v1/auth/password \
  -H "Content-Type: application/json" \
  -b "next-auth.session-token=..." \
  -d '{
    "currentPassword": "СтарыйПароль123",
    "newPassword": "НовыйПароль456",
    "confirmPasswordNew": "НовыйПароль456"
  }'
```

### Ошибка: неверный текущий пароль (401)

```bash
curl -X PUT http://localhost:3000/api/v1/auth/password \
  -H "Content-Type: application/json" \
  -b "next-auth.session-token=..." \
  -d '{
    "currentPassword": "НеверныйПароль",
    "newPassword": "НовыйПароль456",
    "confirmPasswordNew": "НовыйПароль456"
  }'
# → 401 { success: false, error: { code: "BUSINESS_RULE_ERROR", message: "Неверный текущий пароль" } }
```

### Ошибка: пароль слишком короткий (422)

```bash
curl -X PUT http://localhost:3000/api/v1/auth/password \
  -H "Content-Type: application/json" \
  -b "next-auth.session-token=..." \
  -d '{
    "currentPassword": "СтарыйПароль123",
    "newPassword": "12345",
    "confirmPasswordNew": "12345"
  }'
# → 422 { success: false, error: { code: "VALIDATION_ERROR", message: "Ошибка валидации данных", fields: [...] } }
```

---

## Алгоритм обработки

1. **Проверка сессии** — `auth()` → если нет `session.user.email`, возврат `401`
2. **Чтение тела** — `request.json()` → `body`
3. **Валидация + бизнес-логика** — `authService.changePassword(email, body)`:
   - Zod-валидация `changePasswordSchema` → при ошибке `ZodError` → `422`
   - Проверка текущего пароля (`bcrypt.compare`) → при ошибке `InvalidCurrentPasswordError` → `401`
   - Проверка совпадения нового с текущим → при ошибке `NewPasswordMatchesCurrentError` → `400`
   - Хеширование нового пароля (`bcrypt.hash`, cost=10)
   - Обновление в БД через `repository.updatePassword()`
4. **Ответ** — `200 { success: true, message: "Пароль успешно изменён" }`

---

## Связанные артефакты

| Документ | Путь |
|----------|------|
| Требования | [`docs/requirements/REQ-AUTH-001.md`](docs/requirements/REQ-AUTH-001.md) |
| User Story | [`docs/user-stories/US-12-активная-смена-пароля-пользователем.md`](docs/user-stories/US-12-активная-смена-пароля-пользователем.md) |
| План реализации | [`docs/plans/B-015-change-password-plan.md`](docs/plans/B-015-change-password-plan.md) |
| Спецификация компонента | [`docs/specs/auth/change-password-component-spec.md`](docs/specs/auth/change-password-component-spec.md) |
| Руководство пользователя | [`docs/guides/change-password-user.md`](docs/guides/change-password-user.md) |

---

## История изменений

| Версия | Дата | Описание |
|--------|------|----------|
| 1.0 | 2026-07-27 | Первоначальное создание документации |
