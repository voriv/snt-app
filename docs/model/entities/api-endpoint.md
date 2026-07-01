# ApiEndpoint

## Описание

Реестр API endpoints приложения, к которым настраивается ролевой доступ. Каждый endpoint однозначно идентифицируется комбинацией HTTP-метода и пути. Путь может содержать параметры в формате `:param` (например `/members/:id`).

Категория доступа (`access_type`) определяет механизм проверки:
- `public` — доступен без авторизации (health check, регистрация, NextAuth)
- `owner` — доступ только к своим данным (`auth()` + проверка владельца ресурса в handler)
- `role` — доступ по ролям через `role_api_endpoints`
- `super_admin` — доступ только SUPER_ADMIN (управление ролями, pages, api_endpoints)

Реестр полностью управляется в БД (через UI администрирования). Новый endpoint без записей в `role_api_endpoints` (при `access_type=role`) недоступен всем, кроме SUPER_ADMIN.

## Поля

| Поле | Тип | Обязательное | Описание | Бизнес-правила |
|------|-----|-------------|----------|----------------|
| `id` | String | Да | Уникальный идентификатор | Генерируется автоматически (cuid) |
| `method` | String | Да | HTTP-метод | GET, POST, PATCH, PUT, DELETE |
| `path` | String | Да | URL-путь (относительный, без `/api/v1`) | Начинается с `/`, может содержать `:param`; уникален в комбинации с method |
| `description` | String? | Нет | Текстовое описание | Опциональное, до 500 символов |
| `access_type` | String | Да | Категория доступа | `public`, `owner`, `role`, `super_admin`; по умолчанию `role` |
| `is_active` | Boolean | Да | Признак активного endpoint | По умолчанию `true`. При `false` endpoint недоступен всем, кроме SUPER_ADMIN |
| `created_at` | DateTime | Да | Дата создания записи | Генерируется автоматически |
| `updated_at` | DateTime | Да | Дата последнего обновления | Обновляется при каждой записи |

## Связи

| Сущность | Тип связи | Описание |
|----------|-----------|----------|
| Role | has_many через `role_api_endpoints` | Endpoint назначается ролям (M:N) — только при `access_type=role` |

## Индексы

| Поля | Тип | Описание |
|------|-----|----------|
| (`method`, `path`) | unique | Уникальная комбинация метод+путь |

## Бизнес-инварианты

- Комбинация (`method`, `path`) уникальна в системе
- `path` обязан начинаться с `/`
- При `access_type=public` записи в `role_api_endpoints` игнорируются — доступ без авторизации
- При `access_type=owner` записи в `role_api_endpoints` игнорируются — доступ через `auth()` + проверка владельца в handler
- При `access_type=role`: endpoint без записей в `role_api_endpoints` недоступен всем, кроме SUPER_ADMIN
- При `access_type=super_admin`: endpoint доступен только SUPER_ADMIN, записи в `role_api_endpoints` игнорируются
- При `is_active=false` endpoint недоступен всем, включая SUPER_ADMIN
- SUPER_ADMIN имеет полный доступ ко всем активным endpoint с `access_type=role` или `super_admin` через runtime-правило, без обращений к `role_api_endpoints`
- Удаление endpoint каскадно удаляет все записи в `role_api_endpoints`, связанные с этим endpoint
- Сопоставление пути запроса с шаблоном `:param` выполняется через path-matcher (см. `src/lib/path-matcher.ts`)

## Категории доступа

| access_type | auth() | role_api_endpoints | SUPER_ADMIN | Примеры |
|-------------|--------|-------------------|-------------|---------|
| `public` | ❌ | игнор | игнор | `/api/v1` (health), `/api/v1/auth/register`, `/api/v1/auth/[...nextauth]` |
| `owner` | ✅ → 401 | игнор | игнор | `/api/v1/profile`, `/api/v1/profile/theme` |
| `role` | ✅ → 401 | проверка | runtime-доступ | `/api/v1/members`, `/api/v1/plots` |
| `super_admin` | ✅ → 401 | игнор | только SUPER_ADMIN | `/api/v1/roles/*`, `/api/v1/pages/*`, `/api/v1/api-endpoints/*` |

## Seed данные (при начальной инициализации)

| method | path | access_type | description |
|--------|------|-------------|-------------|
| GET | `/` | public | Health check |
| POST | `/auth/register` | public | Регистрация нового пользователя |
| GET | `/auth/[...nextauth]` | public | NextAuth |
| POST | `/auth/[...nextauth]` | public | NextAuth |
| GET | `/profile` | owner | Профиль текущего пользователя |
| POST | `/profile` | owner | Создание/обновление аватара профиля |
| DELETE | `/profile` | owner | Удаление аватара профиля |
| PATCH | `/profile/theme` | owner | Смена темы пользователя |
| GET | `/members` | role | Список членов СНТ |
| POST | `/members` | role | Создание члена СНТ |
| GET | `/members/:id` | role | Просмотр члена СНТ |
| PUT | `/members/:id` | role | Редактирование члена СНТ |
| DELETE | `/members/:id` | role | Удаление члена СНТ |
| GET | `/plots` | role | Список участков |
| POST | `/plots` | role | Создание участка |
| GET | `/roles` | super_admin | Список ролей |
| POST | `/roles` | super_admin | Создать роль |
| GET | `/roles/:id` | super_admin | Получить роль |
| PATCH | `/roles/:id` | super_admin | Обновить роль |
| DELETE | `/roles/:id` | super_admin | Удалить роль |
| GET | `/roles/:id/users` | super_admin | Участники роли |
| POST | `/roles/:id/users` | super_admin | Добавить участника |
| DELETE | `/roles/:id/users/:userId` | super_admin | Исключить участника |
| GET | `/roles/:id/pages` | super_admin | Страницы роли |
| POST | `/roles/:id/pages` | super_admin | Назначить страницу |
| DELETE | `/roles/:id/pages/:pageId` | super_admin | Снять страницу |
| GET | `/roles/:id/api-endpoints` | super_admin | API endpoints роли |
| POST | `/roles/:id/api-endpoints` | super_admin | Назначить API endpoint |
| DELETE | `/roles/:id/api-endpoints/:endpointId` | super_admin | Снять API endpoint |
| GET | `/pages` | super_admin | Список страниц |
| POST | `/pages` | super_admin | Создать страницу |
| PATCH | `/pages/:id` | super_admin | Обновить страницу |
| DELETE | `/pages/:id` | super_admin | Удалить страницу |
| GET | `/api-endpoints` | super_admin | Список API endpoints |
| POST | `/api-endpoints` | super_admin | Создать endpoint |
| PATCH | `/api-endpoints/:id` | super_admin | Обновить endpoint |
| DELETE | `/api-endpoints/:id` | super_admin | Удалить endpoint |

> Путь указан относительно `/api/v1`. Например, `GET /members` → полный URL `/api/v1/members`.

## Конвенции именования

- **БД (PostgreSQL):** `api_endpoints`, `id`, `method`, `path`, `description`, `access_type`, `is_active`, `created_at`, `updated_at`
- **Prisma:** `ApiEndpoint`, `id`, `method`, `path`, `description`, `accessType`, `isActive`, `createdAt`, `updatedAt`
- **TypeScript домен:** `ApiEndpointData`, `id: string`, `method: string`, `path: string`, `description: string | null`, `accessType: 'public' | 'owner' | 'role' | 'super_admin'`, `isActive: boolean`, `createdAt: Date`, `updatedAt: Date`

@see docs/model/entities/role-api-endpoint.md — связь M:N roles↔api_endpoints
@see docs/model/entities/role.md — сущность Role
