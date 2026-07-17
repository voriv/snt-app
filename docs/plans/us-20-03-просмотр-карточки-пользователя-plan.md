# План реализации: US-20-03: Просмотр карточки пользователя

> **Шаблон используется для декомпозиции User Story на технические задачи по слоям архитектуры.**  
> Статусы задач: `[TODO]` → `[IN PROGRESS]` → `[DONE]`

---

## 📋 Метаданные

| Параметр       | Значение                          |
| -------------- | --------------------------------- |
| **US-ID**      | `US-20-03`                        |
| **Название**   | Просмотр карточки пользователя    |
| **Версия плана** | `v1.0`                            |
| **Дата создания** | `2026-07-13`                     |
| **Статус**     | `[NOT STARTED]`                   |
| **Зависит от** | `US-20-01`, `US-20-02`            |

---

## 📎 Ссылки

- **User Story:** [`docs/user-stories/US-20-03-просмотр-карточки-пользователя.md`](../user-stories/US-20-03-просмотр-карточки-пользователя.md)
- **Требования (REQ):** `docs/requirements/REQ-USERS-001.md`
- **Модель данных:** `docs/model/entities/user.md`, `docs/model/entities/user-profile.md`, `docs/model/entities/role.md`

---

## 📁 Дерево файлов

```
src/
├── domains/
│   └── users/
│       ├── users.types.ts                 ✏️  Добавить UserDetail, UserRoleDetail
│       ├── users.validators.ts            ✏️  Добавить userIdParamSchema
│       ├── users.errors.ts                ✏️  Добавить UserNotFoundError
│       ├── users.repository.interface.ts  ✏️  Добавить findUserById
│       ├── users.repository.prisma.ts     ✏️  Реализация findUserById
│       └── users.service.ts               ✏️  Добавить findUserById
│
├── app/
│   └── api/v1/users/
│       └── [id]/
│           └── route.ts                   🆕  GET /api/v1/users/[id]
│
├── components/
│   └── features/
│       └── users/
│           ├── UserCard/
│           │   ├── UserCard.tsx           🆕  Карточка пользователя
│           │   └── index.ts               🆕  Re-export
│           └── index.ts                   ✏️  Добавить UserCard
│
├── app/dashboard/users/
│   └── [id]/
│       └── page.tsx                       🆕  Страница карточки
│
└── components/features/users/UserList/
    ├── UserList.tsx                       ✏️  Клик на строку → переход к карточке
    └── index.ts                           (без изменений)
```

---

## 📦 Задачи по слоям

---

### 1. Модель данных

**Без изменений** — используются существующие сущности `User`, `UserProfile`, `UserRole`, `Role`.

---

### 2. Types (Доменные типы)

#### Задача US-20-03-T2-1: Определить типы для карточки пользователя

| Параметр   | Значение                                         |
| ---------- | ------------------------------------------------ |
| **ID**     | `US-20-03-T2-1`                                  |
| **Статус** | `[TODO]`                                         |
| **Файл**   | `src/domains/users/users.types.ts`               |
| **Действие** | Изменить                                       |

**Целевое состояние:**

- Определён интерфейс `UserDetail` — полная информация о пользователе с профилем и ролями
- Определён интерфейс `UserRoleDetail` — детальная информация о назначенной роли

**Чек-лист:**

- [ ] `UserDetail` определён с JSDoc-аннотациями
- [ ] `UserRoleDetail` определён с JSDoc-аннотациями
- [ ] Все поля описаны с комментариями
- [ ] Реэкспорт в `index.ts`

**Типы:**

```typescript
/**
 * @type UserRoleDetail
 * @domain users
 * @description Детальная информация о назначенной роли пользователя
 */
export interface UserRoleDetail {
  roleId: string;
  roleName: string;
  roleDescription: string | null;
}

/**
 * @type UserDetail
 * @domain users
 * @description Полная информация о пользователе для карточки
 *
 * @spec
 * - firstName/lastName/patronymic/phone — nullable (не у всех есть профиль)
 * - roles — массив UserRoleDetail с полными данными ролей
 */
export interface UserDetail {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  patronymic: string | null;
  phone: string | null;
  createdAt: Date;
  roles: UserRoleDetail[];
}
```

---

### 3. Validators (Zod-схемы)

#### Задача US-20-03-T3-1: Создать валидатор параметра id

| Параметр   | Значение                                         |
| ---------- | ------------------------------------------------ |
| **ID**     | `US-20-03-T3-1`                                  |
| **Статус** | `[TODO]`                                         |
| **Файл**   | `src/domains/users/users.validators.ts`          |
| **Действие** | Изменить                                       |

**Целевое состояние:**

- Определена Zod-схема `userIdParamSchema` для валидации параметра `id` из URL

**Чек-лист:**

- [ ] Сchema `userIdParamSchema` валидирует строку (не пустая)
- [ ] Сообщения об ошибках на русском языке

```typescript
/**
 * @schema userIdParamSchema
 * @domain users
 * @description Валидация параметра id из URL
 *
 * @spec
 * - id — обязательная непустая строка
 */
export const userIdParamSchema = z.object({
  id: z.string().min(1, 'ID пользователя не может быть пустым'),
});
```

---

### 4. Errors (Доменные ошибки)

#### Задача US-20-03-T4-1: Создать ошибку UserNotFoundError

| Параметр   | Значение                                         |
| ---------- | ------------------------------------------------ |
| **ID**     | `US-20-03-T4-1`                                  |
| **Статус** | `[TODO]`                                         |
| **Файл**   | `src/domains/users/users.errors.ts`              |
| **Действие** | Изменить                                       |

**Целевое состояние:**

- Определён класс `UserNotFoundError` наследующий `NotFoundError`

**Чек-лист:**

- [ ] Наследуется от `NotFoundError`
- [ ] HTTP статус 404
- [ ] Код ошибки `USER_NOT_FOUND`
- [ ] Сообщение на русском
- [ ] JSDoc-аннотация
- [ ] Реэкспорт в `index.ts`

---

### 5. Repository (Интерфейс + Реализация)

#### Задача US-20-03-T5-1: Добавить метод findUserById в интерфейс

| Параметр   | Значение                                         |
| ---------- | ------------------------------------------------ |
| **ID**     | `US-20-03-T5-1`                                  |
| **Статус** | `[TODO]`                                         |
| **Файл**   | `src/domains/users/users.repository.interface.ts` |
| **Действие** | Изменить                                       |

**Чек-лист:**

- [ ] Метод `findUserById(id: string): Promise<UserDetail | null>` добавлен в интерфейс
- [ ] JSDoc-аннотация с `@param`, `@returns`, `@spec`

#### Задача US-20-03-T5-2: Реализовать findUserById в Prisma-репозитории

| Параметр   | Значение                                         |
| ---------- | ------------------------------------------------ |
| **ID**     | `US-20-03-T5-2`                                  |
| **Статус** | `[TODO]`                                         |
| **Файл**   | `src/domains/users/users.repository.prisma.ts`   |
| **Действие** | Изменить                                       |

**Целевое состояние:**

- Реализован `findUserById` с JOIN `user_profiles` (LEFT) и `user_roles` + `roles`
- Возвращает `null` если пользователь не найден

**Чек-лист:**

- [ ] `prisma.user.findUnique` с `include: { profile: true, roles: { include: { role: true } } }`
- [ ] Маппинг на `UserDetail` с обработкой nullable полей
- [ ] Возврат `null` при отсутствии записи

---

### 6. Service (Бизнес-логика)

#### Задача US-20-03-T6-1: Добавить метод findUserById в сервис

| Параметр   | Значение                                         |
| ---------- | ------------------------------------------------ |
| **ID**     | `US-20-03-T6-1`                                  |
| **Статус** | `[TODO]`                                         |
| **Файл**   | `src/domains/users/users.service.ts`             |
| **Действие** | Изменить                                       |

**Целевое состояние:**

- Метод `findUserById(id: string): Promise<UserDetail>` вызывает репозиторий и бросает `UserNotFoundError`

**Чек-лист:**

- [ ] Валидация `id` через `userIdParamSchema`
- [ ] Вызов `repository.findUserById(id)`
- [ ] Бросает `UserNotFoundError` если `null`
- [ ] JSDoc-аннотация с `@param`, `@returns`, `@throws`

---

### 7. DI Container

**Без изменений** — `UsersService` уже зарегистрирован в `src/di/container.ts`.

---

### 8. API

#### Задача US-20-03-T8-1: Создать API GET /api/v1/users/[id]

| Параметр   | Значение                                         |
| ---------- | ------------------------------------------------ |
| **ID**     | `US-20-03-T8-1`                                  |
| **Статус** | `[TODO]`                                         |
| **Файл**   | `src/app/api/v1/users/[id]/route.ts`             |
| **Действие** | Создать                                        |

**Целевое состояние:**

- Создан handler `GET` возвращающий `UserDetail`
- Защищён `withRoleGuard(['SUPER_ADMIN'])`
- Обработка `UserNotFoundError` → 404

**Чек-лист:**

- [ ] JSDoc: `@route GET /api/v1/users/:id`, `@auth required`
- [ ] `withRoleGuard(['SUPER_ADMIN'])`
- [ ] Валидация `id` из params
- [ ] Вызов `usersService.findUserById(id)`
- [ ] Ответ: `{ success: true, data: UserDetail }` при 200
- [ ] Ответ: `{ success: false, error }` при 404
- [ ] Обработка `UserNotFoundError` → 404
- [ ] Обработка остальных ошибок → 500

---

### 9. UI (Feature-компоненты)

#### Задача US-20-03-T9-1: Создать компонент UserCard

| Параметр   | Значение                                         |
| ---------- | ------------------------------------------------ |
| **ID**     | `US-20-03-T9-1`                                  |
| **Статус** | `[TODO]`                                         |
| **Файл**   | `src/components/features/users/UserCard/UserCard.tsx` |
| **Действие** | Создать                                        |

**Целевое состояние:**

- Компонент `UserCard` отображает карточку пользователя с разделами «Профиль» и «Роли»
- Состояния: `loading` (скелетон), `error`, `data`, `empty` (пользователь не найден)
- Кнопка «Назад к списку»

**Чек-лист:**

- [ ] `'use client'` директива
- [ ] JSDoc-аннотация с `@component`, `@category`, `@spec`
- [ ] Загрузка данных через `apiClient.get<UserDetail>(/users/${id})`
- [ ] Раздел «Профиль»: email, имя, фамилия, отчество, телефон, дата регистрации
- [ ] Раздел «Роли»: бейджи с названиями ролей или «Роли не назначены»
- [ ] Обработка «Профиль не заполнен» (firstName == null)
- [ ] Обработка 404 — «Пользователь не найден» + кнопка «Вернуться к списку»
- [ ] Состояние загрузки — скелетон
- [ ] Кнопка «Назад к списку» — `router.push('/dashboard/users')`
- [ ] `index.ts` с re-export

#### Задача US-20-03-T9-2: Добавить клик по строке в UserList

| Параметр   | Значение                                         |
| ---------- | ------------------------------------------------ |
| **ID**     | `US-20-03-T9-2`                                  |
| **Статус** | `[TODO]`                                         |
| **Файл**   | `src/components/features/users/UserList/UserList.tsx` |
| **Действие** | Изменить                                       |

**Чек-лист:**

- [ ] Добавить `useRouter` в UserList
- [ ] `onClick` на строку таблицы → `router.push(/dashboard/users/${user.id})`
- [ ] Визуальный индикатор (курсор pointer, hover эффект)
- [ ] Обновить `index.ts` features/users с реэкспортом `UserCard`

---

### 10. Pages

#### Задача US-20-03-T10-1: Создать страницу /dashboard/users/[id]

| Параметр   | Значение                                         |
| ---------- | ------------------------------------------------ |
| **ID**     | `US-20-03-T10-1`                                 |
| **Статус** | `[TODO]`                                         |
| **Файл**   | `src/app/dashboard/users/[id]/page.tsx`          |
| **Действие** | Создать                                        |

**Чек-лист:**

- [ ] `'use client'` директива
- [ ] JSDoc: `@page /dashboard/users/:id`, `@auth required`, `@role SUPER_ADMIN`
- [ ] `useSession()` + проверка роли SUPER_ADMIN
- [ ] `useParams()` для получения `id`
- [ ] Рендер `UserCard` с `id`
- [ ] Обработка отсутствия сессии → редирект на `/login`

---

## 🔗 Матрица AC → Задачи

| AC | Задача(и) |
|----|----------|
| AC-1.1: Открытие карточки из таблицы | US-20-03-T9-2, US-20-03-T10-1 |
| AC-1.2: Отображение профиля | US-20-03-T9-1 |
| AC-1.3: Пользователь не найден (EC-02) | US-20-03-T9-1, US-20-03-T8-1 |
| AC-1.4: Нет профиля (EC-03) | US-20-03-T9-1 |
| AC-1.5: Отображение списка ролей | US-20-03-T9-1 |
| AC-1.6: Нет ролей (EC-04) | US-20-03-T9-1 |

---

## ✅ Чек-лист валидации (перед передачей в Code-режим)

- [ ] Plan соответствует требованиям US-20-03
- [ ] Все AC покрыты задачами
- [ ] Все edge cases учтены (EC-02, EC-03, EC-04, EC-06, EC-08)
- [ ] Задачи декомпозицированы по слоям архитектуры
- [ ] Чек-листы содержат конкретные шаги

---

## 📜 История изменений

| Дата | Автор | Изменение |
|------|-------|-----------|
| 2026-07-13 | ИИ-архитектор | Создание плана |
