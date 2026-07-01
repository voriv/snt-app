# Обновление модели данных: Тема пользователя

## Изменения в модели данных

### Сущность User
Остается без изменений.

### Сущность UserProfile
Добавляется новое поле `theme` в таблицу `user_profiles`:

| Поле | Тип | Обязательное | Значение по умолчанию | Описание |
|------|-----|--------------|----------------------|----------|
| `theme` | String | Да | `'light'` | Тема оформления пользователя |

---

## Список доступных тем

| Значение | Описание | CSS класс |
|----------|----------|-----------|
| `light` | Светлая тема | `light-theme` |
| `dark` | Темная тема | `dark-theme` |
| `green` | Салатовая/зеленая тема | `green-theme` |

---

## Схема DBML

```dbml
Table user_profiles {
  id           varchar       [pk, not null]
  user_id      varchar       [unique, not null, ref: > users]
  first_name   varchar
  middle_name  varchar
  last_name    varchar
  phone        varchar
  avatar       varchar
  bio          varchar
  theme        varchar       [default: 'light', not null] // НОВОЕ ПОЛЕ
  created_at   timestamp     [default: now(), not null]
  updated_at   timestamp     [default: now(), not null]

  Notes: '''
    tema: 'light', 'dark', или 'green'
    Значение по умолчанию: 'light'
    '''
}
```

---

## Prisma Schema

Добавить в файл `prisma/schema.prisma`:

```prisma
model UserProfile {
  id         String    @id @default(cuid())
  user_id    String    @unique @map("user_id")
  first_name String?   @map("first_name")
  middle_name String?  @map("middle_name")
  last_name  String?   @map("last_name")
  phone      String?   @map("phone")
  avatar     String?   @map("avatar")
  bio        String?   @map("bio")
  theme      String    @default("light") @map("theme") // НОВОЕ ПОЛЕ
  
  createdAt  DateTime  @default(now()) @map("created_at")
  updatedAt  DateTime  @updatedAt @map("updated_at")
  
  user       User      @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  @@map("user_profiles")
}
```

---

## TypeScript типы

### Определение типа темы

В файле `src/domains/userProfile/userProfile.types.ts`:

```typescript
/**
 * @type Theme
 * @domain userProfile
 * @description Доступные темы оформления
 * @enum {'light' | 'dark' | 'green'}
 *
 * @spec
 * - light: светлая тема оформления (по умолчанию)
 * - dark: темная тема оформления
 * - green: салатовая/зеленая тема оформления
 * - Значение может быть расширено в будущем
 */
export type Theme = 'light' | 'dark' | 'green';
```

### Обновление интерфейса UserProfileData

```typescript
/**
 * @type UserProfileData
 * @domain userProfile
 * @description Профиль пользователя в БД (из Prisma)
 *
 * @spec
 * - Бизнес-ключ: id (cuid)
 * - Жизненный цикл: создается при первом редактировании профиля
 * - Инварианты: все поля кроме id и userId опциональны
 * - theme: тема оформления пользователя, по умолчанию 'light'
 *
 * @see docs/model/entities/user-profile.md — концептуальная модель
 */
export interface UserProfileData {
  /** Уникальный идентификатор. Генерируется автоматически cuid */
  id: string;
  /** ID пользователя системы */
  userId: string;
  /** Имя — опциональное, может быть null */
  firstName: string | null;
  /** Отчество — опциональное, 2-50 символов или null */
  middleName: string | null;
  /** Фамилия — опциональная, может быть null */
  lastName: string | null;
  /** Телефон — опциональный, формат E.164 или национальный */
  phone: string | null;
  /** URL аватара — опциональный, JPG/PNG/GIF, max 5MB */
  avatar: string | null;
  /** Биография — опциональная, max 500 символов */
  bio: string | null;
  /** Тема оформления — светлая, темная или зеленая */
  theme: Theme;
  /** Дата создания профиля */
  createdAt: Date;
  /** Дата последнего обновления профиля */
  updatedAt: Date;
}
```

---

## Валидация Zod

### Обновление схем в `src/domains/userProfile/userProfile.validators.ts`:

```typescript
/**
 * Схема для валидации темы
 */
export const themeSchema = z.enum(['light', 'dark', 'green']);

/**
 * Обновленная схема создания профиля
 */
export const createUserProfileSchema = z.object({
  // существующие поля...
  theme: themeSchema.default('light'),
});

/**
 * Обновленная схема обновления профиля
 */
export const updateUserProfileSchema = baseUserProfileSchema.partial().extend({
  theme: themeSchema.optional(),
});

/**
 * Обновленная схема обновления только темы
 */
export const updateThemeSchema = z.object({
  theme: themeSchema,
});
```

---

## Функциональные требования

### FR-1: Изменение темы пользователя
Пользователь может выбрать одну из доступных тем оформления через настройки профиля или навигационную панель.

### FR-2: Применение темы
Выбранная тема применяется ко всем страницам авторизованной зоны (кроме публичных страниц `/` и `/login`).

### FR-3: Отображение выбора темы
- В настройках профиля отображается список доступных тем с превью
- В навбаре отображается иконка/кнопка для быстрого переключения темы
- При выборе темы пользователь видит превью выбранной темы

### FR-4: Сохранение темы
- Выбранная тема сохраняется в БД (в поле `theme` таблицы `user_profiles`)
- Тема применяется автоматически при каждом входе в систему
- Значение по умолчанию: `light`
- Если у пользователя нет профиля, создается с темой `light` по умолчанию

### FR-5: Адаптация к системным настройкам
При создании первого профиля, если тема не задана явно, используется системная настройка (`prefers-color-scheme`), с паддбеком на `light`.

### FR-6: CSS-переменные
Для каждой темы определяются CSS-переменные в корневом стиле:
```css
:root[data-theme='light'] { /* переменные светлой темы */ }
:root[data-theme='dark'] { /* переменные темной темы */ }
:root[data-theme='green'] { /* переменные зеленой темы */ }
```

---

## API эндпоинты

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/v1/profile` | Получить профиль текущего пользователя (включая theme) |
| `PATCH` | `/api/v1/profile` | Обновить профиль пользователя (включая theme) |
| `PATCH` | `/api/v1/profile/theme` | Изменить тему пользователя (отдельный endpoint) |

---

## UI компоненты

| Компонент | Описание |
|-----------|----------|
| `ThemeSelector` | Компонент выбора темы с превью |
| `ThemeToggle` | Компонент быстрого переключения темы в навбаре |
| `ThemePreviewCard` | Карточка с превью темы |

---

## Влияние на существующие компоненты

### Области изменения:

1. **`src/app/layout.tsx`** — установка атрибута `data-theme` на корневом элементе
2. **`src/components/layouts/Navbar.tsx`** — добавление компонента переключения темы
3. **`src/app/(dashboard)/profile/page.tsx`** — добавление выбора темы в настройки
4. **`src/components/features/userProfile/*`** — обновление компонентов для поддержки темы
5. **`src/domains/userProfile/*`** — обновление типов, валидации, сервиса и репозитория

---

## Нефункциональные требования

- **Производительность**: Тема загружается мгновенно при инициализации приложения
- **UX**: Плавная анимация при переключении темы (transition)
- **Доступность**: Кнопка смены темы имеет aria-label и поддерживается с клавиатуры
- **Браузеры**: Поддержка современных браузеров (Chrome 90+, Firefox 88+, Safari 14+)

---

## Edge cases

| № | Ситуация | Ожидаемое поведение |
|---|----------|---------------------|
| 1 | Пользователь без профиля меняет тему | Создается профиль с темой `light` по умолчанию |
| 2 | Пользователь с профилем меняет тему | Тема сохраняется в БД |
| 3 | Неверное значение темы в БД | Используется тема по умолчанию `light` |
| 4 | Ошибка при сохранении темы | Пользователь видит сообщение об ошибке, тема не изменяется |
| 5 | Нестабильное интернет-соединение | Текущая тема сохраняется локально до успешной синхронизации |
| 6 | Первое создание профиля без темы | Создается с темой `light` (или `prefers-color-scheme`) |

---

## История изменений

| Дата | Автор | Действие |
|------|-------|----------|
| 2024-06-30 | — | Создание черновика спецификации темы пользователя в UserProfile |
