# UserProfile

## Описание

Расширенная информация о пользователе системы. Профиль содержит имя, отчество, фамилию, телефон, аватар, биографию и тему оформления. Связан с сущностью `User` через однонаправленную связь (один к одному).

> **Примечание**: Профиль агрегирует данные из `User` (email) и `UserProfile` (first_name, middle_name, last_name, phone, avatar, bio, theme).

## Поля

| Поле | Тип | Обязательное | Описание | Бизнес-правила |
|------|-----|-------------|----------|----------------|
| `id` | String | Да | Уникальный идентификатор | Генерируется автоматически (cuid) |
| `user_id` | String | Да | Ссылка на пользователя системы | Уникальный, не может быть null |
| `first_name` | String | Да | Имя пользователя | Обязательное поле, 2-50 символов |
| `middle_name` | String? | Нет | Отчество пользователя | Опциональное поле, 2-50 символов |
| `last_name` | String | Да | Фамилия пользователя | Обязательное поле, 2-50 символов |
| `phone` | String? | Нет | Контактный телефон | Опциональное, формат E.164 или национальный |
| `avatar` | String? | Нет | URL аватара (изображения) | Опциональное, JPG/PNG/GIF, max 5MB |
| `bio` | String? | Нет | Краткая биография | Опциональное, max 500 символов |
| `theme` | String | Да | Тема оформления | light/dark/green, default: 'light' (BR-2) |
| `created_at` | DateTime | Да | Дата создания профиля | Генерируется автоматически |
| `updated_at` | DateTime | Да | Дата последнего обновления | Обновляется при каждой записи |

## Связи

| Сущность | Тип связи | Описание |
|----------|-----------|----------|
| User | belongs_to | Профиль пользователя связан с учётной записью |

## Индексы

| Поля | Тип | Описание |
|------|-----|----------|
| `user_id` | unique | Уникальная связь с пользователем |

## Бизнес-инварианты

- `user_id` уникален в системе (один профиль на пользователя)
- `first_name` и `last_name` обязательны и не могут быть пустыми
- `avatar` должен соответствовать ограничениям по размеру (≤5MB) и формату (JPG/PNG/GIF)
- `bio` не может превышать 500 символов
- `theme` обязательно должно быть одним из значений: `light`, `dark`, `green` (BR-1)
- `theme` имеет значение по умолчанию `light` для новых профилей (BR-2)
- При удалении User профиль удаляется каскадно

## Конвенции именования

- **БД (PostgreSQL):** `user_profiles`, `id`, `user_id`, `first_name`, `middle_name`, `last_name`, `phone`, `avatar`, `bio`, `theme`, `created_at`, `updated_at`
- **Prisma:** `UserProfile`, `id`, `userId`, `firstName`, `middleName`, `lastName`, `phone`, `avatar`, `bio`, `theme`, `createdAt`, `updatedAt`
- **TypeScript домен:** `UserProfileData`, `id: string`, `userId: string`, `firstName: string`, `middleName: string \| null`, `lastName: string`, `phone: string \| null`, `avatar: string \| null`, `bio: string \| null`, `theme: Theme`, `createdAt: Date`, `updatedAt: Date`
