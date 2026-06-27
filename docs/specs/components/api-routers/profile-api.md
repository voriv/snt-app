# API Endpoint: GET/PATCH /api/profile/[id]

## Статус: На обсуждении

---

## 1. Описание

Управление профилем пользователя по ID. Получение и обновление данных профиля.

## 2. Endpoint: GET /api/profile/[id]

### URL

`GET /api/profile/:id`

### Аутентификация

| Требование | Описание |
|------------|----------|
| Auth | 🔒 Требуется авторизация |

### Path Parameters

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| id | string | да | ID пользователя (cuid) |

### Query Parameters

Нет.

### Response

#### Успешный ответ (200)

```json
{
  "success": true,
  "data": {
    "id": "clxxxx",
    "email": "user@example.com",
    "name": "Иван",
    "phone": "+79001234567",
    "avatarUrl": "https://example.com/avatar.jpg",
    "role": "MEMBER",
    "isActive": true,
    "member": {
      "surname": "Иванов",
      "firstName": "Иван",
      "patronymic": "Иванович",
      "address": "Участок 15",
      "snn": null
    }
  }
}
```

#### Ошибки

| Код | HTTP | Описание |
|-----|------|----------|
| VALIDATION_ERROR | 400 | Неверный формат ID |
| UNAUTHORIZED | 401 | Требуется авторизация |
| NOT_FOUND | 404 | Профиль не найден |
| INTERNAL_ERROR | 500 | Внутренняя ошибка сервера |

---

## 3. Endpoint: PATCH /api/profile/[id]

### URL

`PATCH /api/profile/:id`

### Аутентификация

| Требование | Описание |
|------------|----------|
| Auth | 🔒 Требуется авторизация |
| Owner | 👤 Только владелец профиля или ADMIN |

### Path Parameters

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| id | string | да | ID пользователя (cuid) |

### Request Body

| Поле | Тип | Обязательный | Описание |
|------|-----|--------------|----------|
| name | string | нет | Имя/ник пользователя (макс. 100) |
| phone | string | нет | Контактный телефон (+7XXXXXXXXXX) |
| avatarUrl | string | нет | URL аватара |
| surname | string | нет | Фамилия (макс. 100) |
| firstName | string | нет | Имя (макс. 100) |
| patronymic | string | нет | Отчество (макс. 100) |
| address | string | нет | Адрес (макс. 300) |

### Response

#### Успешный ответ (200)

```json
{
  "success": true,
  "data": {
    "id": "clxxxx",
    "email": "user@example.com",
    "name": "Иван Обновлённый",
    "phone": "+79001234567",
    "avatarUrl": "https://example.com/avatar.jpg",
    "role": "MEMBER",
    "isActive": true,
    "member": {
      "surname": "Иванов",
      "firstName": "Иван",
      "patronymic": null,
      "address": "Участок 15",
      "snn": null
    }
  }
}
```

#### Ошибки

| Код | HTTP | Описание |
|-----|------|----------|
| VALIDATION_ERROR | 400 | Неверные входные данные |
| UNAUTHORIZED | 401 | Требуется авторизация |
| FORBIDDEN | 403 | Доступ запрещён (не владелец и не ADMIN) |
| NOT_FOUND | 404 | Профиль не найден |
| INTERNAL_ERROR | 500 | Внутренняя ошибка сервера |

## 4. Бизнес-правила

- GET возвращает профиль любого пользователя по ID (для авторизованных)
- PATCH обновляет только переданные поля (partial update)
- PATCH доступен только владельцу профиля или пользователю с ролью ADMIN
- Поля surname, firstName, patronymic, address обновляют связанные данные Member
- Если Member не существует, поля Member игнорируются

## 5. Зависимости

### Внутренние

| Компонент | Тип | Описание |
|-----------|-----|----------|
| `ProfileService` | Service | Бизнес-логика профиля |
| `requireAuth()` | Utility | Проверка авторизации |

### Внешние

Нет.

## 6. Примеры

```bash
# Получить профиль по ID
curl -X GET /api/profile/clxxxx123 -H "Cookie: session-token=xxx"
# → 200 {"success":true,"data":{...}}

# Обновить профиль по ID
curl -X PATCH /api/profile/clxxxx123 \
  -H "Content-Type: application/json" \
  -H "Cookie: session-token=xxx" \
  -d '{"name":"Иван Новое Имя","phone":"+79001112233"}'
# → 200 {"success":true,"data":{...}}
```

---

## История изменений

| Версия | Дата | Изменения | Автор |
|--------|------|-----------|-------|
| 0.1.0 | 2026-06-26 | Начальная версия | architect |