# Page

## Описание

Страница приложения — реестр маршрутов, к которым настраивается ролевой доступ. Реестр полностью управляется в БД (через UI администрирования), без захардкоженного списка в коде. Новая страница, отсутствующая в реестре, по умолчанию недоступна всем пользователям, кроме `SUPER_ADMIN`.

Каждая страница содержит метаданные для отображения в навигационном меню: заголовок (`title`), группу (`group_name`) и порядок сортировки (`sort_order`).

Категория доступа (`access_type`) определяет механизм проверки — аналогично `api_endpoints`:
- `public` — доступен без авторизации (`/login`, `/register`)
- `owner` — доступ только к своим данным (`/profile` — auth + владелец)
- `role` — доступ по ролям через `role_pages` (большинство страниц `/dashboard/*`)
- `super_admin` — доступ только SUPER_ADMIN (`/dashboard/roles`)

> Поле `access_type` добавлено в US-9 для унификации механизма доступа страниц и API endpoints.

## Поля

| Поле | Тип | Обязательное | Описание | Бизнес-правила |
|------|-----|-------------|----------|----------------|
| `id` | String | Да | Уникальный идентификатор | Генерируется автоматически (cuid) |
| `path` | String | Да | URL-путь маршрута | Уникальный, начинается с `/`, соответствует маршруту Next.js (например `/dashboard/members`) |
| `title` | String | Да | Заголовок для меню | Обязательное, 2-100 символов |
| `group_name` | String? | Нет | Группа для группировки пунктов меню | Опциональное, например «Основное», «Администрирование» |
| `sort_order` | Integer | Да | Порядок сортировки в меню | По умолчанию `0`; пункты сортируются по `group_name`, затем по `sort_order` |
| `access_type` | String | Да | Категория доступа | `public`, `owner`, `role`, `super_admin`; по умолчанию `role`. Добавлено в US-9 |
| `is_active` | Boolean | Да | Признак активной страницы | По умолчанию `true`. При `false` страница скрыта из меню и доступ запрещён всем, включая назначенные роли (кроме `SUPER_ADMIN`) |
| `created_at` | DateTime | Да | Дата создания записи | Генерируется автоматически |
| `updated_at` | DateTime | Да | Дата последнего обновления | Обновляется при каждой записи |

## Связи

| Сущность | Тип связи | Описание |
|----------|-----------|----------|
| Role | has_many через `role_pages` | Странице назначаются роли, имеющие к ней доступ (M:N) |

## Индексы

| Поля | Тип | Описание |
|------|-----|----------|
| `path` | unique | Уникальный путь страницы |

## Бизнес-инварианты

- `path` уникален в системе
- `path` обязан начинаться с `/`
- При `is_active = false` страница недоступна всем пользователям, кроме `SUPER_ADMIN` (даже если роли назначены)
- Новая страница без записей в `role_pages` недоступна всем, кроме `SUPER_ADMIN` (по умолчанию закрыто) — только при `access_type=role`
- При `access_type=public` страница доступна без авторизации; записи в `role_pages` игнорируются
- При `access_type=owner` страница требует `auth()`; проверка владельца — в компоненте/хуке; записи в `role_pages` игнорируются
- При `access_type=role` страница без записей в `role_pages` недоступна всем, кроме SUPER_ADMIN
- При `access_type=super_admin` страница доступна только SUPER_ADMIN; записи в `role_pages` игнорируются
- Удаление страницы каскадно удаляет все записи в `role_pages`, связанные с этой страницей
- `SUPER_ADMIN` имеет доступ ко всем активным страницам через runtime-правило, независимо от `role_pages` (категории `role`, `super_admin`)

## Категории доступа

| access_type | auth() | role_pages | SUPER_ADMIN | Примеры |
|-------------|--------|------------|-------------|---------|
| `public` | ❌ | игнор | игнор | `/login`, `/register`, `/forbidden` |
| `owner` | ✅ → redirect /login | игнор | игнор | `/profile` |
| `role` | ✅ → redirect /login | проверка | runtime-доступ | `/dashboard`, `/dashboard/members`, `/dashboard/plots` |
| `super_admin` | ✅ → redirect /login | игнор | только SUPER_ADMIN | `/dashboard/roles` |

## Seed данные (при начальной инициализации)

| path | title | group_name | sort_order | access_type | is_active |
|------|-------|------------|------------|-------------|-----------|
| `/login` | Вход | Публичное | 0 | public | true |
| `/register` | Регистрация | Публичное | 10 | public | true |
| `/forbidden` | Доступ запрещён | Публичное | 20 | public | true |
| `/dashboard` | Дашборд | Основное | 0 | role | true |
| `/dashboard/members` | Члены СНТ | Основное | 10 | role | true |
| `/dashboard/plots` | Участки | Основное | 20 | role | true |
| `/profile` | Профиль | Личное | 100 | owner | true |
| `/dashboard/roles` | Управление ролями | Администрирование | 200 | super_admin | true |

## Конвенции именования

- **БД (PostgreSQL):** `pages`, `id`, `path`, `title`, `group_name`, `sort_order`, `access_type`, `is_active`, `created_at`, `updated_at`
- **Prisma:** `Page`, `id`, `path`, `title`, `groupName`, `sortOrder`, `accessType`, `isActive`, `createdAt`, `updatedAt`
- **TypeScript домен:** `PageData`, `id: string`, `path: string`, `title: string`, `groupName: string | null`, `sortOrder: number`, `accessType: 'public' | 'owner' | 'role' | 'super_admin'`, `isActive: boolean`, `createdAt: Date`, `updatedAt: Date`

@see docs/model/entities/role-page.md — связь M:N roles↔pages
