# PlotUser (Связь пользователь-участок)

## Описание
Сущность представляет связь между пользователем системы и земельным участком с назначенной ролью. Используется для управления правами доступа и отчётности в СНТ.

## Поля

| Поле | Тип БД | Тип Prisma | Тип TS | Обязательное | Описание | Бизнес-правила |
|------|--------|------------|--------|-------------|----------|---------------|
| id | varchar | String | string | Да | Уникальный ID связи (cuid) | Генерируется автоматически |
| user_id | varchar | String | string | Да | Ссылка на users.id | FK → users.id, CASCADE DELETE |
| plot_id | varchar | String | string | Да | Ссылка на plots.id | FK → plots.id, CASCADE DELETE |
| role | integer | Int | PlotUserRoleRole | Да | 1=owner, 2=resident, 3=representative | BR-5 |
| status | varchar | String | PlotUserRoleStatus | Да | active, pending, expired | BR-6, default: 'active' |
| comment | varchar | String? | string\|null | Нет | Комментарий к связи (max 500 символов) | BR-8 |
| assigned_at | timestamp | DateTime | Date | Да | Дата назначения | default: now() |
| expires_at | timestamp | DateTime? | Date\|null | Нет | Дата истечения срока | BR-8: null = бессрочно |
| created_at | timestamp | DateTime | Date | Да | Дата создания записи | default: now() |
| updated_at | timestamp | DateTime | Date | Да | Дата последнего обновления | auto-update |

## Связи

| Сущность | Тип связи | Описание |
|----------|-----------|----------|
| User | belongs_to | Связь с пользователем (через user_id) |
| Plot | belongs_to | Связь с участком (через plot_id) |
| PlotUserRoleHistory | has_many | История изменений связи |

## Индексы

| Поля | Тип | Описание |
|------|-----|----------|
| id | primary | Первичный ключ |
| user_id, plot_id, status | unique | Уникальная активная связь (BR-3) |
| user_id | index | Для быстрого поиска по пользователю |
| plot_id | index | Для быстрого поиска по участку |

## Бизнес-инварианты

- **BR-1**: Пользователь может иметь несколько активных ролей на одном участке
- **BR-2**: Участок может иметь несколько активных владельцев
- **BR-3**: На одну пару (user_id, plot_id) может быть только одна активная запись (уникальность по user_id + plot_id + status='active')
- **BR-4**: user_id, plot_id, role, status обязательны
- **BR-5**: role должен быть 1, 2 или 3
- **BR-6**: status должен быть active, pending или expired
- **BR-7**: Каждая запись в plot_users автоматически дублируется в истории (plot_user_history)
- **BR-8**: expires_at может быть null (бессрочные связи)

## Конвенции именования

- **БД (PostgreSQL):** snake_case имена (user_id, plot_id, assigned_at, etc.)
- **Prisma:** camelCase имена с @map для snake_case колонок
- **TypeScript домен:** camelCase поля (userId, plotId, assignedAt, etc.)
