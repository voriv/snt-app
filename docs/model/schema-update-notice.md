# Обновление DBML схемы - Добавление поля theme в user_profiles

## Обновленная DBML схема для таблицы user_profiles

```dbml
Table user_profiles {
  id           varchar       [pk, not null] // cuid()
  user_id      varchar       [unique, not null, ref: > users]
  first_name   varchar       [not null]
  middle_name  varchar
  last_name    varchar       [not null]
  phone        varchar
  avatar       varchar
  bio          varchar
  theme        varchar       [not null, default: 'light']
  created_at   timestamp     [default: now(), not null]
  updated_at   timestamp     [default: now(), not null]

  Notes:'''
    Primary key: id
    Unique constraint: user_id
    Foreign key: user_id -> users.id
    Theme values: 'light', 'dark', 'green'
    '''
}
```

## Изменения по сравнению с предыдущей версией

### Добавленное поле
- **theme** - varchar, не null, значение по умолчанию 'light'
  - Описывает предпочтения пользователя по теме оформления приложения
  - Допустимые значения: 'light', 'dark', 'green'

## Необходимые обновления в Prisma схеме

В файл `prisma/schema.prisma` необходимо добавить поле в модель UserProfile:

```prisma
model UserProfile {
  // ... существующие поля
  theme  String  @default("light") @map("theme")
  // ... остальные поля
}
```

## Необходимые миграции

После обновления Prisma схемы выполнить:
```bash
npx prisma migrate dev --name add_theme_to_user_profiles
```

## Следующие шаги

После обновления схемы данных необходимо обновить следующие компоненты:

1. **Доменные типы** - добавить тип `Theme` и изменить `UserProfileData`
2. **Валидаторы** - добавить схему валидации для поля `theme`
3. **Репозиторий** - интерфейс и реализация должны поддерживать новые поля
4. **Сервис** - добавить метод для управления темой
5. **API** - добавить endpoint для обновления темы
6. **UI компоненты** - создать компоненты выбора и переключения темы
7. **CSS** - добавить переменные для всех трех тем оформления
