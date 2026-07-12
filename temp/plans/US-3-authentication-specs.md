# US-3: Спецификации авторизации — План изменений

## Обзор

На основе [User Story US-3](../docs/user-stories/US-3-authentication.md) создаются L1 Code-Spec спецификации (JSDoc/TSDoc) для всех затрагиваемых компонентов. Все новые методы содержат `throw new Error('Not implemented')`.

---

## 1. Repository — Изменяемые компоненты

### 1.1. `src/domains/auth/auth.types.ts` — Добавить типы

Добавить после существующих типов:

```typescript
/**
 * @type UserWithPassword
 * @domain auth
 * @description Данные пользователя с хешем пароля. Используется только внутри домена auth для верификации
 *
 * @spec
 * - Расширяет UserData полем passwordHash — хеш пароля bcrypt
 * - Никогда не передаётся за пределы домена auth — не экспортируется через index.ts
 * - Используется в IAuthRepository.findByEmailWithPassword и AuthService.verifyCredentials
 * - passwordHash — результат bcrypt.hash с salt rounds = 10
 *
 * @see docs/model/entities/user.md — поле password в концептуальной модели
 */
export interface UserWithPassword extends UserData {
  /** Хеш пароля. bcrypt hash, никогда не передаётся клиенту */
  passwordHash: string;
}

/**
 * @type LoginData
 * @domain auth
 * @description Данные для входа в систему — email и пароль
 *
 * @spec
 * - Email: обязателен, приводится к нижнему регистру, обрезаются пробелы
 * - Пароль: обязателен, пробелы в начале/конце НЕ обрезаются — часть пароля
 * - Валидация через loginSchema в auth.validators.ts
 *
 * @see docs/user-stories/US-3-authentication.md — BR-1, BR-2
 */
export interface LoginData {
  /** Email пользователя. Обязателен. Приводится к lowercase, обрезаются пробелы */
  email: string;
  /** Пароль. Обязателен. Пробелы — часть пароля */
  password: string;
}
```

### 1.2. `src/domains/auth/auth.errors.ts` — Добавить ошибку

Добавить после `UserInvalidDataError`:

```typescript
/**
 * @type InvalidCredentialsError
 * @domain auth
 * @description Ошибка неверных учётных данных при авторизации
 *
 * @spec
 * - Наследуется от UnauthorizedError — HTTP 401
 * - Используется когда email не найден или пароль неверный
 * - Сообщение общее — НЕ раскрывает, что именно неверно: email или пароль
 * - Это предотвращает перебор email-адресов
 *
 * @see docs/user-stories/US-3-authentication.md — Edge Cases 1,2, таблица ошибок
 */
import { UnauthorizedError } from '@/shared/errors/index';

export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super('Неверный email или пароль');
  }
}
```

### 1.3. `src/domains/auth/auth.validators.ts` — Добавить loginSchema

Добавить после `registerSchema`:

```typescript
/**
 * @function loginSchema
 * @domain auth
 * @description Zod-схема валидации данных входа пользователя
 *
 * @spec
 * - email: обязателен, строка, trim, lowercase, формат email через .email()
 * - password: обязателен, строка, БЕЗ trim — пробелы часть пароля
 * - Ошибки валидации: пользовательские сообщения на русском языке
 * - Отличается от registerSchema: нет confirmPassword, нет min длины пароля
 *
 * @see docs/user-stories/US-3-authentication.md — BR-1, BR-2, AC-5..AC-7
 */
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email обязателен' })
    .trim()
    .toLowerCase()
    .email('Некорректный email'),
  password: z
    .string({ required_error: 'Пароль обязателен' }),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

### 1.4. `src/domains/auth/auth.repository.interface.ts` — Добавить метод

Добавить в интерфейс `IAuthRepository` после `findByEmail`:

```typescript
  /**
   * Найти пользователя по email с хешем пароля
   *
   * @param email - Email пользователя. Должен быть уже приведён к lowercase
   * @returns UserWithPassword если найден, null если не найден
   *
   * @spec
   * - Возвращает UserData + passwordHash — полный объект с хешем пароля
   * - Возвращает null если пользователь не найден — НЕ бросает ошибку
   * - Используется ТОЛЬКО для верификации пароля при авторизации
   * - passwordHash никогда не покидает домен auth
   *
   * @see docs/user-stories/US-3-authentication.md — FR-1, BR-4
   */
  findByEmailWithPassword(email: string): Promise<UserWithPassword | null>;
```

Обновить import: добавить `UserWithPassword` из `./auth.types`.

### 1.5. `src/domains/auth/auth.repository.prisma.ts` — Добавить реализацию

Добавить метод в класс `AuthRepository` после `findByEmail`:

```typescript
  /**
   * Найти пользователя по email с хешем пароля
   *
   * @param email - Email пользователя. Должен быть уже приведён к lowercase
   * @returns UserWithPassword если найден, null если не найден
   *
   * @spec
   * - Включает поле password из БД — хеш bcrypt
   * - Возвращает null если пользователь не найден — НЕ бросает ошибку
   * - Используется ТОЛЬКО для верификации пароля при авторизации
   */
  async findByEmailWithPassword(email: string): Promise<UserWithPassword | null> {
    throw new Error('Not implemented');
  }
```

Обновить import: добавить `UserWithPassword` из `./auth.types`.

### 1.6. `src/domains/auth/index.ts` — Обновить реэкспорты

Добавить новые экспорты:

```typescript
export type { LoginData, UserWithPassword } from './auth.types';
export { InvalidCredentialsError } from './auth.errors';
export { loginSchema } from './auth.validators';
export type { LoginInput } from './auth.validators';
```

> **Важно:** `UserWithPassword` экспортируется как type — он нужен только внутри домена для типизации, но доступен через публичный API для тестов.

---

## 2. Service — Изменяемые компоненты

### 2.1. `src/domains/auth/auth.service.ts` — Добавить метод verifyCredentials

Добавить метод в класс `AuthService` после `registerUser`:

```typescript
  /**
   * Верифицировать учётные данные пользователя
   *
   * @param data - Данные входа: email и password. May be unknown from API
   * @returns UserData при успешной верификации
   * @throws {InvalidCredentialsError} если пользователь не найден или пароль неверный
   * @throws {UserInvalidDataError} при ошибке валидации входных данных
   *
   * @spec
   * - Шаг 1: Валидация данных через loginSchema — Zod
   * - Шаг 2: Приведение email к нижнему регистру — уже в loginSchema через .toLowerCase()
   * - Шаг 3: Поиск пользователя через repository.findByEmailWithPassword
   * - Шаг 4: Если пользователь не найден — InvalidCredentialsError — без уточнения причины
   * - Шаг 5: Сравнение пароля через bcrypt.compare — никогда не расшифровывается
   * - Шаг 6: Если пароль неверный — InvalidCredentialsError — общее сообщение
   * - Шаг 7: При ошибке bcrypt — UserInvalidDataError с сообщением о внутренней ошибке
   * - Возвращает UserData без пароля — пароль НЕ покидает метод
   * - Безопасность: одинаковое сообщение для «email не найден» и «пароль неверный»
   *
   * @see docs/user-stories/US-3-authentication.md — FR-1, BR-3, BR-4, Edge Cases 1,2,7
   */
  async verifyCredentials(data: unknown): Promise<UserData> {
    throw new Error('Not implemented');
  }
```

Обновить import: добавить `InvalidCredentialsError`, `loginSchema`, `UserWithPassword`.

Обновить JSDoc класса — добавить `InvalidCredentialsError` в список ошибок:

```typescript
/**
 * @service AuthService
 * @domain auth
 * @description Бизнес-логика регистрации и аутентификации пользователей
 *
 * @spec
 * - Валидация: через Zod-схемы из auth.validators.ts
 * - Ошибки: UserDuplicateError, UserInvalidDataError, InvalidCredentialsError
 * - Зависимости: IAuthRepository через DI
 */
```

---

## 3. API Route — Новые и изменяемые компоненты

### 3.1. `src/app/api/auth/[...nextauth]/route.ts` — НОВЫЙ файл

```typescript
/**
 * @route POST /api/auth/[...nextauth]
 * @auth none
 * @description NextAuth.js catch-all API route — обработка входа, выхода, получения сессии
 *
 * @response 200 — NextAuth JSON response — session, CSRF token и т.д.
 * @response 401 — Неверные учётные данные при попытке входа
 * @response 500 — Внутренняя ошибка сервера
 *
 * @spec
 * - Обрабатывает все запросы NextAuth: signIn, signOut, getSession, csrf
 * - Использует handlers из src/lib/auth.ts
 * - Credentials Provider авторизация делегируется AuthService.verifyCredentials
 * - После успешного входа — создаётся JWT сессия с id, email, role
 * - При неверных учётных данных — NextAuth возвращает ошибку CredentialsSignin
 *
 * @see docs/user-stories/US-3-authentication.md — FR-2
 * @see https://next-auth.js.org/configuration/routes
 */
import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
```

### 3.2. `src/lib/auth.ts` — Обновить конфигурацию NextAuth

Заменить содержимое на:

```typescript
/**
 * @file lib/auth.ts
 * @description NextAuth конфигурация с Credentials Provider и JWT/Session callbacks
 * @module @/lib/auth
 *
 * @spec
 * - Использует NextAuth.js v4 для аутентификации
 * - Credentials Provider: вызывает AuthService.verifyCredentials для проверки email/пароля
 * - JWT callback: добавляет id и role пользователя в JWT-токен
 * - Session callback: передаёт id и role из токена в объект сессии
 * - Экспортирует auth — для серверных компонентов, handlers — для API route
 * - Конфигурация auth.config.ts разделена для совместимости с middleware
 *
 * @see docs/user-stories/US-3-authentication.md — FR-1, FR-10
 */
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from '@/infrastructure/auth/auth.config';
import { createAuthService } from '@/di/container';

const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      /**
       * Credentials Provider — авторизация по email и паролю
       *
       * @spec
       * - Принимает email и password из формы входа
       * - Вызывает AuthService.verifyCredentials для проверки
       * - При успехе возвращает объект User с id, email, role
       * - При ошибке возвращает null — NextAuth покажет CredentialsSignin
       * - Email приводится к lowercase перед передачей в сервис
       *
       * @see docs/user-stories/US-3-authentication.md — FR-1, BR-3, BR-4
       */
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Пароль', type: 'password' },
      },
      async authorize(credentials) {
        throw new Error('Not implemented');
      },
    }),
  ],
  callbacks: {
    /**
     * JWT callback — добавление id и role в JWT-токен
     *
     * @param token - Текущий JWT-токен
     * @param user - Объект пользователя из authorize()
     * @returns Обогащённый JWT-токен
     *
     * @spec
     * - При первом входе — user не null — добавляет user.id и user.role в token
     * - При последующих запросах — user null — token уже содержит данные
     * - Токен содержит минимальный набор: id, email, role
     *
     * @see docs/user-stories/US-3-authentication.md — FR-10, BR-7
     */
    async jwt({ token, user }) {
      throw new Error('Not implemented');
    },
    /**
     * Session callback — передача данных из JWT в объект сессии
     *
     * @param session - Объект сессии NextAuth
     * @param token - JWT-токен с данными пользователя
     * @returns Обогащённый объект сессии
     *
     * @spec
     * - Передаёт id и role из token в session.user
     * - Используется на клиенте через useSession и на сервере через auth
     * - Сессия содержит: user.id, user.email, user.role
     *
     * @see docs/user-stories/US-3-authentication.md — FR-10, AC-12
     */
    async session({ session, token }) {
      throw new Error('Not implemented');
    },
  },
});

export { auth, handlers, signIn, signOut };
```

### 3.3. `src/infrastructure/auth/auth.config.ts` — Обновить JSDoc

Обновить аннотации, оставить `providers: []` — провайдеры добавляются в `auth.ts`:

```typescript
/**
 * @file infrastructure/auth/auth.config.ts
 * @description Базовая конфигурация NextAuth — страницы и общие настройки
 * @module @/infrastructure/auth/auth.config
 *
 * @spec
 * - Содержит ТОЛЬКО pages и общие настройки — без providers
 * - Providers определяются в src/lib/auth.ts для совместимости с middleware
 * - Страница входа: /login — переопределение дефолтной NextAuth страницы
 * - JWT strategy — сессии хранятся в JWT, не в БД
 * - Разделение конфигурации необходимо: auth.config.ts используется в middleware
 *   и не должен содержать ссылки на Node.js модули — bcrypt, Prisma и т.д.
 *
 * @see docs/user-stories/US-3-authentication.md — FR-1, FR-2
 * @see https://next-auth.js.org/configuration/options
 */
import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: '/login',
  },
};

export default authConfig;
```

---

## 4. UI/Infrastructure — Изменяемые компоненты

### 4.1. `src/app/(public)/login/page.tsx` — Добавить скрытие flash-сообщения

**Изменение**: Добавить state `showFlashMessage` и скрывать flash-сообщение при начале ввода.

Обновить JSDoc страницы:

```typescript
/**
 * @file src/app/(public)/login/page.tsx
 * @page /login
 * @description Страница входа в систему для авторизованных пользователей
 *
 * @spec
 * - Client Component: использует хуки для управления состоянием формы
 * - Валидация: email и пароль проверяются на клиенте перед отправкой
 * - Обработка ошибок: отображение сообщений об ошибках при неудачной авторизации
 * - Интеграция с NextAuth: используется signIn для авторизации
 * - Поддержка callbackUrl: после успешной авторизации перенаправление на исходную страницу
 * - Поддержка flash-сообщения: отображение при registered=true query параметре
 * - Скрытие flash-сообщения: при начале ввода в любое поле — AC-9
 * - Редирект callbackUrl: при callbackUrl=/ или /login — редирект на /dashboard — AC-3
 * - Валидация callbackUrl: только внутренние маршруты — Edge Case 6
 * - Адаптивная верстка: мобильные и десктоп
 * - a11y: правильные label, autocomplete, focus management
 *
 * @data-flow
 * - Client Component → форма с валидацией → signIn — next-auth/react → callback URL
 */
```

**Ключевые изменения в логике:**

1. Добавить `const [showFlashMessage, setShowFlashMessage] = useState(isRegistered);`
2. В `onChange` для email и password добавить `setShowFlashMessage(false)`
3. Условие отображения flash: `{showFlashMessage && isRegistered && (...)}`
4. В `handleSubmit` добавить валидацию callbackUrl:
   - Если `callbackUrl` равен `/` или `/login` → редирект на `/dashboard`
   - Если `callbackUrl` содержит внешний домен → редирект на `/dashboard`
5. Убрать `useEffect` для сброса ошибок — вместо этого точечный сброс при изменении поля

---

## 5. Сводная таблица всех изменений

| # | Файл | Тип изменения | Обоснование US-3 |
|---|------|--------------|-------------------|
| 1 | `src/domains/auth/auth.types.ts` | Изменение: +`UserWithPassword`, +`LoginData` | FR-1, BR-4 |
| 2 | `src/domains/auth/auth.errors.ts` | Изменение: +`InvalidCredentialsError` | FR-4, Edge 1,2 |
| 3 | `src/domains/auth/auth.validators.ts` | Изменение: +`loginSchema`, +`LoginInput` | BR-1, BR-2 |
| 4 | `src/domains/auth/auth.repository.interface.ts` | Изменение: +`findByEmailWithPassword()` | FR-1 |
| 5 | `src/domains/auth/auth.repository.prisma.ts` | Изменение: +`findByEmailWithPassword()` скелет | FR-1 |
| 6 | `src/domains/auth/auth.service.ts` | Изменение: +`verifyCredentials()` скелет, обновить JSDoc | FR-1, BR-3, BR-4 |
| 7 | `src/domains/auth/index.ts` | Изменение: +новые экспорты | — |
| 8 | `src/app/api/auth/[...nextauth]/route.ts` | **Новый**: NextAuth API route | FR-2 |
| 9 | `src/lib/auth.ts` | Изменение: Credentials Provider + callbacks | FR-1, FR-10 |
| 10 | `src/infrastructure/auth/auth.config.ts` | Изменение: JSDoc + типизация | FR-2 |
| 11 | `src/app/(public)/login/page.tsx` | Изменение: flash-скрытие, callbackUrl валидация | FR-5, AC-9 |

---

## 6. Маппинг US-3 → Компоненты

| FR/AC | Компонент | Метод/Логика |
|-------|-----------|-------------|
| FR-1 | `auth.service.ts` | `verifyCredentials()` |
| FR-2 | `api/auth/[...nextauth]/route.ts` | `handlers` |
| FR-3 | `login/page.tsx` | Клиентская валидация — уже есть |
| FR-4 | `auth.service.ts` | `verifyCredentials()` → `InvalidCredentialsError` |
| FR-5 | `login/page.tsx` | Валидация callbackUrl |
| FR-6 | `middleware.ts` | Уже реализовано |
| FR-7 | `login/page.tsx` | flash при `?registered=true` — уже есть |
| FR-8 | `login/page.tsx` | Ссылка на /register — уже есть |
| FR-9 | `login/page.tsx` | Блокировка кнопки — уже есть |
| FR-10 | `src/lib/auth.ts` | JWT + Session callbacks |
| AC-1..AC-3 | `auth.service.ts` + `login/page.tsx` | Весь поток авторизации |
| AC-4 | `auth.service.ts` | `InvalidCredentialsError` — общее сообщение |
| AC-5..AC-7 | `login/page.tsx` | Клиентская валидация — уже есть |
| AC-8 | `login/page.tsx` | flash при `?registered=true` — уже есть |
| AC-9 | `login/page.tsx` | Скрытие flash при вводе — **НОВОЕ** |
| AC-10 | `login/page.tsx` | Состояние загрузки — уже есть |
| AC-11 | `login/page.tsx` | Ссылка /register — уже есть |
| AC-12 | `src/lib/auth.ts` | Session callback с id, email, role |

---

## 7. Соответствие концептуальной модели данных

| Поле User (docs/model/entities/user.md) | Prisma schema | UserData (TS) | UserWithPassword (TS) |
|----------------------------------------|---------------|---------------|----------------------|
| id: String, cuid | ✅ `id String @id @default(cuid())` | ✅ `id: string` | ✅ наследуется |
| email: String, unique | ✅ `email String @unique` | ✅ `email: string` | ✅ наследуется |
| name: String? | ✅ `name String?` | ✅ `name: string \| null` | ✅ наследуется |
| password: String, bcrypt hash | ✅ `password String` | ❌ не включён | ✅ `passwordHash: string` |
| role: Role, default GUEST | ✅ `role Role @default(GUEST)` | ✅ `role: GUEST \| MEMBER \| ADMIN` | ✅ наследуется |
| created_at: DateTime | ✅ `createdAt DateTime @default(now())` | ✅ `createdAt: Date` | ✅ наследуется |
| updated_at: DateTime | ✅ `updatedAt DateTime @updatedAt` | ✅ `updatedAt: Date` | ✅ наследуется |

> **Примечание**: `UserData` не содержит `password` — это CORRECT по бизнес-инварианту «Пароль никогда не передаётся в откликах API». Новый тип `UserWithPassword` добавляет `passwordHash` только для внутреннего использования.