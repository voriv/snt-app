# RoleApiEndpoint

## Описание

Связующая таблица отношения M:N между ролями и API endpoints. Определяет, к каким API endpoints (HTTP-метод + путь) имеет доступ роль. Назначение endpoint роли автоматически предоставляет доступ всем пользователям с этой ролью.

Записи в этой таблице имеют значение только для endpoints с `access_type=role`. Для `public`, `owner`, `super_admin` — игнорируются сервисом проверки доступа.

## Поля

| Поле | Тип | Обязательное | Описание | Бизнес-правила |
|------|-----|-------------|----------|----------------|
| `role_id` | String | Да | Ссылка на роль | Часть составного первичного ключа; CASCADE при удалении роли |
| `api_endpoint_id` | String | Да | Ссылка на API endpoint | Часть составного первичного ключа; CASCADE при удалении endpoint |
| `created_at` | DateTime | Да | Дата назначения endpoint роли | Генерируется автоматически |

## Связи

| Сущность | Тип связи | Описание |
|----------|-----------|----------|
| Role | belongs_to | Запись связывает роль с API endpoint |
| ApiEndpoint | belongs_to | Запись связывает API endpoint с ролью |

## Индексы

| Поля | Тип | Описание |
|------|-----|----------|
| (`role_id`, `api_endpoint_id`) | primary key | Составной первичный ключ — endpoint назначается роли один раз |
| `api_endpoint_id` | index | Для быстрого поиска ролей, имеющих доступ к endpoint |

## Бизнес-инварианты

- Комбинация (`role_id`, `api_endpoint_id`) уникальна — endpoint назначается роли один раз
- При удалении роли удаляются все её назначения endpoints (CASCADE)
- При удалении endpoint удаляются все его назначения ролям (CASCADE)
- Записи имеют значение только для endpoints с `access_type=role` — для остальных категорий игнорируются
- SUPER_ADMIN имеет полный доступ ко всем активным endpoint через runtime-правило, независимо от записей в этой таблице
- Назначение endpoint с `is_active=false` не предоставляет доступ — проверка `is_active` выполняется при проверке прав

## Конвенции именования

- **БД (PostgreSQL):** `role_api_endpoints`, `role_id`, `api_endpoint_id`, `created_at`
- **Prisma:** `RoleApiEndpoint`, `roleId`, `apiEndpointId`, `createdAt`
- **TypeScript домен:** `RoleApiEndpointData`, `roleId: string`, `apiEndpointId: string`, `createdAt: Date`

@see docs/model/entities/role.md — сущность Role
@see docs/model/entities/api-endpoint.md — сущность ApiEndpoint
