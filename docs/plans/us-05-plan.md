# План реализации: US-05: Реализация процесса аутентификации

> **Шаблон используется для декомпозиции User Story на технические задачи по слоям архитектуры.**  
> Шаблон создаётся на этапе PLAN (Спецификация) и передаётся в Code-режим для выполнения.  
> Статусы задач: `[TODO]` → `[IN PROGRESS]` → `[DONE]`

---

## 📋 Метаданные

| Параметр       | Значение                          |
| -------------- | --------------------------------- |
| **US-ID**      | `US-05`                           |
| **Название**   | Реализация процесса аутентификации |
| **Версия плана** | `v1.0`                            |
| **Дата создания** | `2026-07-10`                   |
| **Статус**     | `[TODO]`                          |
| **Зависит от** | `US-01` (автоматическое назначение роли GUEST), `US-04` (страница входа) |

---

## 📎 Ссылки

- **User Story:** [`docs/user-stories/US-05-реализация-процесса-аутентификации.md`](../../user-stories/US-05-реализация-процесса-аутентификации.md)
- **Требования (REQ):** `docs/requirements/REQ-AUTH-001.md`
- **Модель данных:** `docs/model/entities/user.md`, `docs/model/entities/role.md`, `docs/model/entities/user-role.md`

---

## 📁 Дерево файлов

Файлы, которые **требуют изменения** для реализации US-05:

```
src/
├── domains/
│   └── auth/
│       ├── auth.service.ts           # ✏️ Доработать: разделение Zod-ошибок (400) vs аутентификации (401)
│       └── auth.errors.ts            # ✏️ Проверить: InvalidCredentialsError (401)
│
├── infrastructure/
│   └── auth/
│       └── auth.config.ts            # ✏️ Проверить: authorize() возвращает null при ошибках
│
├── lib/
│   └── auth.ts                       # ✏️ Доработать: session.maxAge, jwt update roles
│
└── middleware.ts                     # ✏️ Доработать: сохранение callbackUrl при редиректе
```

> **Примечание:** Большая часть бэкенда уже реализована. Задачи по слоям MODEL, TYPES, VALIDATORS, ERRORS, REPO помечены как `[DONE]` — требуется только проверка.

---

## 📦 Задачи по слоям

---

### 1. Модель данных (Prisma + DBML)

#### Задача: Проверить модель данных User

| Параметр   | Значение                                         |
| ---------- | ------------------------------------------------ |
| **ID**     | `US-05-T1`                                       |
| **Статус** | `[DONE]`                                         |
| **Файлы**  | `docs/model/entities/user.md`, `prisma/schema.prisma` |
| **Действие** | `Проверить` |

**Целевое состояние:**

- Модель `User` содержит поля `email`, `passwordHash` (хеш bcrypt)
- Поле `email` имеет уникальный индекс для быстрого поиска
- Роли хранятся в таблице `user_roles`

**Чек-лист:**

- [x] Поля `email`, `passwordHash` существуют в `User`
- [x] `email` имеет `@unique` индекс
- [x] `passwordHash` хранит bcrypt хеш
- [x] Таблица `user_roles` связывает пользователей с ролями

---

### 2. Types (Доменные типы)

#### Задача: Проверить доменные типы auth

| Параметр   | Значение                                         |
| ---------- | ------------------------------------------------ |
| **ID**     | `US-05-T2`                                       |
| **Статус** | `[DONE]`                                         |
| **Файл**   | `src/domains/auth/auth.types.ts`                 |
| **Действие** | `Проверить` |

**Целевое состояние:**

- Определены типы `LoginData`, `UserData`, `UserWithPassword`
- Типы имеют JSDoc-аннотации
- `UserWithPassword` содержит поле `passwordHash`, но не экспортируется публично

**Чек-лист:**

- [x] `LoginData` определён с полями `email`, `password`
- [x] `UserData` определён с полями `id`, `email`, `name`, `createdAt`, `updatedAt`
- [x] `UserWithPassword` расширяет `UserData` полем `passwordHash`
- [x] Все типы имеют JSDoc-аннотации (`@type`, `@domain`, `@spec`)

---

### 3. Validators (Zod-схемы)

#### Задача: Проверить Zod-схему для входа

| Параметр   | Значение                                           |
| ---------- | -------------------------------------------------- |
| **ID**     | `US-05-T3`                                         |
| **Статус** | `[DONE]`                                           |
| **Файл**   | `src/domains/auth/auth.validators.ts`              |
| **Действие** | `Проверить` |

**Целевое состояние:**

- Определена `loginSchema` с валидацией `email` и `password`
- `email`: `.trim().toLowerCase().email()` — пробелы обрезаются, регистр приводится к нижнему
- `password`: без `.trim()` — пробелы часть пароля
- `loginSchema` выбрасывает `ZodError` при нарушении формата (400)

**Чек-лист:**

- [x] `loginSchema` валидирует `email` (format, required) и `password` (required)
- [x] `email` приводится к `lowercase` и обрезается `trim`
- [x] `password` без trim — пробелы часть пароля
- [x] Сообщения об ошибках на русском языке
- [x] Тип `LoginInput` определён через `z.infer`

---

### 4. Errors (Доменные ошибки)

#### Задача: Проверить классы ошибок auth

| Параметр   | Значение                                         |
| ---------- | ------------------------------------------------ |
| **ID**     | `US-05-T4`                                       |
| **Статус** | `[DONE]`                                         |
| **Файл**   | `src/domains/auth/auth.errors.ts`                |
| **Действие** | `Проверить` |

**Целевое состояние:**

- Определён `InvalidCredentialsError` для ошибок входа — наследуется от `UnauthorizedError` (HTTP 401)
- Сообщение: "Неверный email или пароль" — общее для всех сценариев неудачной аутентификации (BR-03)
- Определён `UserInvalidDataError` для ошибок валидации — наследуется от `ValidationError` (HTTP 400)

**Чек-лист:**

- [x] `InvalidCredentialsError` наследуется от `UnauthorizedError` — HTTP 401
- [x] `UserInvalidDataError` наследуется от `ValidationError` — HTTP 400
- [x] `InvalidCredentialsError` имеет общее сообщение "Неверный email или пароль"
- [x] `UserInvalidDataError` имеет конкретное сообщение из Zod-ошибки

---

### 5. Repository (Интерфейс + Реализация)

#### Задача: Проверить метод findByEmailWithPassword

| Параметр   | Значение                                             |
| ---------- | ---------------------------------------------------- |
| **ID**     | `US-05-T5`                                           |
| **Статус** | `[DONE]`                                             |
| **Файл**   | `src/domains/auth/auth.repository.prisma.ts`         |
| **Действие** | `Проверить` |

**Целевое состояние:**

- Метод `findByEmailWithPassword` возвращает пользователя с хешем пароля (`UserWithPassword`)
- Возвращает `null` если пользователь не найден — НЕ выбрасывает ошибку (согласно Contract Interface)

**Чек-лист:**

- [x] Метод `findByEmailWithPassword` определён в `IAuthRepository`
- [x] Метод возвращает `UserWithPassword | null`
- [x] Реализация в `AuthRepository` корректно запрашивает поле `passwordHash`
- [x] Метод имеет JSDoc-аннотации
- [x] При отсутствии пользователя возвращается `null` вместо выбрасывания ошибки

---

### 6. Service (Бизнес-логика)

#### Задача: Доработать метод verifyCredentials для разделения Zod-ошибок

| Параметр   | Значение                                         |
| ---------- | ------------------------------------------------ |
| **ID**     | `US-05-T6`                                       |
| **Статус** | `[TODO]`                                         |
| **Файл**   | `src/domains/auth/auth.service.ts`               |
| **Действие** | `Изменить` |

**Целевое состояние:**

- Метод `verifyCredentials` реализует логику входа:
  - Валидация через `loginSchema`
  - При Zod-ошибке — выбрасывает `UserInvalidDataError` с конкретным сообщением (HTTP 400)
  - Поиск пользователя через `findByEmailWithPassword`
  - При отсутствии пользователя — `InvalidCredentialsError` (HTTP 401)
  - Сравнение пароля через `bcrypt.compare`
  - При неверном пароле — `InvalidCredentialsError` (HTTP 401)
  - Возврат `UserData` без пароля

**Необходимые изменения:**

Текущий код маскирует Zod-ошибки под `UserInvalidDataError('Ошибка при входе')` — необходимо различать:
- Zod-ошибка → `UserInvalidDataError` с `error.issues` (конкретное сообщение из Zod)
- Ошибка аутентификации → `InvalidCredentialsError` (общее сообщение)

**Чек-лист:**

- [ ] Метод определён с JSDoc-аннотациями (`@service`, `@param`, `@returns`, `@throws`, `@spec`)
- [ ] Валидация входных данных через `loginSchema`
- [ ] `try-catch` блок разделяет Zod-ошибки и ошибки аутентификации:
  ```typescript
  catch (error) {
    if (error instanceof z.ZodError) {
      // Конкретное сообщение для валидации
      const message = error.issues.map(i => i.message).join('; ');
      throw new UserInvalidDataError(message);
    }
    if (error instanceof InvalidCredentialsError || error instanceof UserInvalidDataError) {
      throw error;
    }
    // Другие ошибки — общая ошибка
    throw new UserInvalidDataError('Ошибка при входе');
  }
  ```
- [ ] При отсутствии пользователя или неверном пароле выбрасывается `InvalidCredentialsError`
- [ ] Пароль никогда не возвращается в ответе
- [ ] Email нормализуется: `.trim().toLowerCase()` перед поиском

---

### 7. Infrastructure (NextAuth Configuration)

#### Задача: Проверить и настроить NextAuth config

| Параметр   | Значение                                         |
| ---------- | ------------------------------------------------ |
| **ID**     | `US-05-T7`                                       |
| **Статус** | `[TODO]`                                         |
| **Файл**   | `src/infrastructure/auth/auth.config.ts`         |
| **Действие** | `Проверить` |

**Целевое состояние:**

- `Credentials Provider` с `authorize()` реализован
- `authorize()` вызывает `AuthService.verifyCredentials`
- При успехе — загружает роли через `RoleService.getRoleNamesByUserId(user.id)`
- При ошибке — возвращает `null` (NextAuth покажет `CredentialsSignin`)
- `email` приводится к нижнему регистру перед передачей в сервис (если не сделано в сервисе)

**Чек-лист:**

- [x] `authorize()` реализован в `Providers`
- [x] Вызывает `AuthService.verifyCredentials`
- [x] При успехе загружает роли через `RoleService`
- [x] При ошибке возвращает `null`
- [ ] Email нормализуется в `authorize()` (дополнительная проверка, если не в сервисе)

#### Задача: Настроить срок жизни сессии (session.maxAge)

| Параметр   | Значение                                         |
| ---------- | ------------------------------------------------ |
| **ID**     | `US-05-T7-2`                                     |
| **Статус** | `[TODO]`                                         |
| **Файл**   | `src/lib/auth.ts`                                |
| **Действие** | `Добавить` |

**Целевое состояние:**

- Явно настроен `session.maxAge` — срок жизни JWT-сессии
- По умолчанию `next-auth` использует 30 дней — рекомендуется 24 часа для безопасности

**Чек-лист:**

- [ ] Добавить в `authOptions`:
  ```typescript
  session: {
    strategy: 'jwt' as const,
    maxAge: 24 * 60 * 60, // 24 часа в секундах
  },
  ```
- [ ] Добавить JSDoc-комментарий о настройке `maxAge`

#### Задача: Обновление ролей в jwt() callback (OQ-4)

| Параметр   | Значение                                         |
| ---------- | ------------------------------------------------ |
| **ID**     | `US-05-T7-3`                                     |
| **Статус** | `[TODO]`                                         |
| **Файл**   | `src/lib/auth.ts`                                |
| **Действие** | `Добавить/Проверить` |

**Целевое состояние:**

- Решение: **нет** — роли обновляются только при входе в `authorize()`
- Для обновления ролей пользователю нужно перевойти
- Альтернатива — обновление в `jwt()` callback при истечении срока (увеличивает нагрузку на БД)

**Чек-лист:**

- [x] Роли обновляются только в `authorize()` — при входе
- [ ] JSDoc-комментарий объясняет почему не обновляются в `jwt()` callback
- [ ] Открытый вопрос OQ-4 задокументирован в US-05

---

### 8. Middleware

#### Задача: Доработать middleware для сохранения callbackUrl

| Параметр   | Значение                                         |
| ---------- | ------------------------------------------------ |
| **ID**     | `US-05-T8`                                       |
| **Статус** | `[TODO]`                                         |
| **Файл**   | `src/middleware.ts`                              |
| **Действие** | `Изменить` |

**Целевое состояние:**

- Middleware защищает `/dashboard/*` и `/api/v1/*`
- При отсутствии сессии — редирект на `/login` с `callbackUrl` параметром
- NextAuth `withAuth` автоматически добавляет `callbackUrl` при редиректе — проверить текущее поведение
- Если `withAuth` не добавляет `callbackUrl` — реализовать вручную через `NextResponse.redirect`

**Необходимые изменения:**

Текущий код использует `withAuth` который **автоматически** добавляет `callbackUrl`. Необходимо проверить:
- Включает ли `pages: { signIn: '/login' }` автоматическое добавление `callbackUrl`?
- Если нет — реализовать кастомную логику:
  ```typescript
  const url = request.nextUrl.clone();
  if (!token) {
    url.searchParams.set('callbackUrl', encodeURIComponent(request.nextUrl.pathname));
    return NextResponse.redirect(new URL('/login', request.url));
  }
  ```

**Чек-лист:**

- [x] `withAuth` с `authorized: ({ token }) => !!token`
- [x] Matcher для `/dashboard/*` и `/api/v1/*`
- [x] Matcher исключает `/login`, `/register`, `/api/auth/*`
- [ ] Проверить поведение `withAuth` — добавляет ли `callbackUrl`?
- [ ] Если нет — реализовать кастомный редирект с `callbackUrl`
- [ ] AC-4.4: После успешного входа — редирект на `/dashboard/plots` из `callbackUrl`

---

### 9. DI Container

#### Задача: Проверить DI-контейнер

| Параметр   | Значение                                         |
| ---------- | ------------------------------------------------ |
| **ID**     | `US-05-T9`                                       |
| **Статус** | `[DONE]`                                         |
| **Файл**   | `src/di/container.ts`                            |
| **Действие** | `Проверить` |

**Целевое состояние:**

- `createAuthService()` возвращает `AuthService` с `AuthRepository`
- `createRoleService()` возвращает `RoleService` с `RoleRepository`

**Чек-лист:**

- [x] `createAuthService()` реализован
- [x] `createRoleService()` реализован
- [x] Сервисы получают репозит