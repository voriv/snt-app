# Спецификация компонент: Change Password

> **Назначение:** Спецификация компонент и скелетов кода для [B-015: Активная смена пароля](../../plans/B-015-change-password-plan.md)
> **Создано:** `component-spec` режим
> **Статус:** `[DRAFT]`

---

## 1. 📋 Метаданные

| Параметр | Значение |
|---|---|
| **Feature** | `change-password` |
| **План реализации** | [`docs/plans/B-015-change-password-plan.md`](../../plans/B-015-change-password-plan.md) |
| **User Stories** | US-12 |
| **Требования** | REQ-AUTH-001 (FR-09…FR-12, BR-08…BR-12, EC-06…EC-09) |
| **Модель данных** | Без изменений — `User.password` уже существует |
| **UI-макет** | [`docs/design/layouts/settings-security/layout.md`](../../design/layouts/settings-security/layout.md) |
| **Версия** | `v1.0` |
| **Дата** | `2026-07-27` |
| **Статус** | `[DRAFT]` |

---

## 2. 📊 Матрица трассировки

> Каждая строка связывает компонент с требованиями. Без строки в матрице — нет компонента.
> Действия: 🆕 — создать файл, ✏️ — добавить в существующий, 🔧 — изменить существующее.

| # | Компонент | Слой | Действие | US | AC | Задача | Статус |
|---|---|---|---|---|---|---|---|
| 1 | `ChangePasswordInput` (z.infer) | Domain/Validators | ✏️ | US-12 | AC-9.1, AC-9.4, AC-9.5 | US-12-T1 | `[TODO]` |
| 2 | `changePasswordSchema` | Domain/Validators | ✏️ | US-12 | AC-9.4, AC-9.5, EC-08, EC-09 | US-12-T2 | `[TODO]` |
| 3 | `InvalidCurrentPasswordError` | Domain/Errors | ✏️ | US-12 | AC-9.2, EC-06 | US-12-T3 | `[TODO]` |
| 4 | `NewPasswordMatchesCurrentError` | Domain/Errors | ✏️ | US-12 | AC-9.3, EC-07 | US-12-T3 | `[TODO]` |
| 5 | `updatePassword()` в `IAuthRepository` | Domain/Repository | ✏️ | US-12 | AC-9.1, AC-9.6 | US-12-T4-1 | `[TODO]` |
| 6 | `updatePassword()` в `AuthRepositoryPrisma` | Domain/Repository | ✏️ | US-12 | AC-9.1, AC-9.6 | US-12-T4-2 | `[TODO]` |
| 7 | `changePassword()` в `AuthService` | Domain/Service | ✏️ | US-12 | AC-9.1…AC-9.6, EC-06…EC-09 | US-12-T5 | `[TODO]` |
| 8 | Re-exports в `auth/index.ts` | Domain/Index | ✏️ | US-12 | AC-9.1…AC-9.6 | US-12-T8 | `[TODO]` |
| 9 | `PUT /api/v1/auth/password` | API | 🆕 | US-12 | AC-9.1…AC-9.6, EC-11 | US-12-T7 | `[TODO]` |
| 10 | `useChangePassword()` | Hook | 🆕 | US-12 | AC-9.8, AC-9.10, AC-9.12 | US-12-T9 | `[TODO]` |
| 11 | `ChangePasswordForm` | UI/Feature | 🆕 | US-12 | AC-9.7, AC-9.8, AC-9.9, AC-9.10, AC-9.12 | US-12-T10 | `[TODO]` |
| 12 | `/settings/security` Page | Page | 🆕 | US-12 | AC-9.7, AC-9.11 | US-12-T11 | `[TODO]` |
| 13 | Навигация «Безопасность» | UI/Navigation | ✏️ | US-12 | AC-9.13 | US-12-T12 | `[TODO]` |

---

### 2.1 Покрытие AC

| AC | Описание | Покрыт в строке | Статус |
|----|----------|-----------------|--------|
| AC-9.1 | Успешная смена пароля (API) | 2,3,4,5,6,7,9 | `[TODO]` |
| AC-9.2 | Неверный текущий пароль | 3,7,9 | `[TODO]` |
| AC-9.3 | Новый пароль совпадает с текущим | 4,7,9 | `[TODO]` |
| AC-9.4 | Валидация длины нового пароля (<6) | 2,7 | `[TODO]` |
| AC-9.5 | Пароли не совпадают (new ≠ confirm) | 2,7 | `[TODO]` |
| AC-9.6 | Вход с новым паролем после смены | 5,6,7 | `[TODO]` |
| AC-9.7 | Отображение формы смены пароля | 11,12 | `[TODO]` |
| AC-9.8 | Успешная отправка формы | 10,11 | `[TODO]` |
| AC-9.9 | Клиентская валидация | 11 | `[TODO]` |
| AC-9.10 | Ошибка от сервера (UI) | 10,11 | `[TODO]` |
| AC-9.11 | Защита маршрута (редирект) | 12 | `[TODO]` |
| AC-9.12 | Состояние загрузки | 10,11 | `[TODO]` |
| AC-9.13 | Навигация к странице | 13 | `[TODO]` |
| EC-06 | Неверный текущий пароль | 3,7 | `[TODO]` |
| EC-07 | Новый пароль совпадает с текущим | 4,7 | `[TODO]` |
| EC-08 | Новый пароль <6 символов | 2,7 | `[TODO]` |
| EC-09 | Пароли не совпадают | 2,7 | `[TODO]` |
| EC-11 | Неавторизованный запрос к API | 9 | `[TODO]` |

---

## 3. 🏗️ Спецификация по слоям

---

### 3.1 Domain Layer

---

#### 3.1.1 `changePasswordSchema` + `ChangePasswordInput`

| Параметр | Значение |
|---|---|
| **Файл** | [`src/domains/auth/auth.validators.ts`](../../src/domains/auth/auth.validators.ts) |
| **Действие** | ✏️ Добавить |
| **Задача** | US-12-T1, US-12-T2 |
| **Трассировка** | US-12 AC-9.1, AC-9.4, AC-9.5 → FR-09, FR-11, BR-10 |

**Схема:**

| Поле | Тип | Правило | Сообщение об ошибке |
|---|---|---|---|
| `currentPassword` | `z.string()` | `.min(1, ...)` | "Текущий пароль обязателен" |
| `newPassword` | `z.string()` | `.min(6, ...)` | "Пароль должен содержать минимум 6 символов" |
| `confirmPasswordNew` | `z.string()` | `.min(1, ...)` | "Подтверждение пароля обязательно" |
| — | — | `.refine(newPassword === confirmPasswordNew)` | "Пароли не совпадают" (path: `confirmPasswordNew`) |

**Тип:**

```typescript
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
```

**Правила валидации:**

| Поле | Правило | BR | Сообщение |
|---|---|---|---|
| `currentPassword` | min 1 символ | — | "Текущий пароль обязателен" |
| `newPassword` | min 6 символов | BR-10 | "Пароль должен содержать минимум 6 символов" |
| `confirmPasswordNew` | min 1 символ | — | "Подтверждение пароля обязательно" |
| `newPassword` === `confirmPasswordNew` | refine | — | "Пароли не совпадают" |

**Инварианты:**
- Пароли передаются как строки БЕЗ `trim()` — пробелы являются частью пароля
- `refine` проверяет точное совпадение `newPassword` и `confirmPasswordNew`
- Все сообщения об ошибках на русском языке

**Референс:** [`registerSchema`](src/domains/auth/auth.validators.ts:16) — аналогичная структура с `refine` для совпадения паролей

---

#### 3.1.2 `InvalidCurrentPasswordError` + `NewPasswordMatchesCurrentError`

| Параметр | Значение |
|---|---|
| **Файл** | [`src/domains/auth/auth.errors.ts`](../../src/domains/auth/auth.errors.ts) |
| **Действие** | ✏️ Добавить |
| **Задача** | US-12-T3 |
| **Трассировка** | US-12 AC-9.2, AC-9.3, EC-06, EC-07 → FR-10, BR-08, BR-09 |

**Классы ошибок:**

| Класс | Наследуется от | HTTP Status | Code | Сообщение | Сценарий |
|---|---|---|---|---|---|
| `InvalidCurrentPasswordError` | `ValidationError` | 400 | `INVALID_CURRENT_PASSWORD` | "Неверный текущий пароль" | `bcrypt.compare(currentPassword, storedHash)` → `false` |
| `NewPasswordMatchesCurrentError` | `ValidationError` | 400 | `NEW_PASSWORD_MATCHES_CURRENT` | "Новый пароль не может совпадать с текущим" | `bcrypt.compare(newPassword, storedHash)` → `true` |

**Сценарии:**

| Сценарий | Проверка | Действие |
|---|---|---|
| Текущий пароль неверный | `bcrypt.compare(currentPassword, user.passwordHash)` → `false` | `InvalidCurrentPasswordError` |
| Новый пароль совпадает с текущим | `bcrypt.compare(newPassword, user.passwordHash)` → `true` | `NewPasswordMatchesCurrentError` |

**Референс:** [`InvalidCredentialsError`](src/domains/auth/auth.errors.ts:55) — аналогичный паттерн наследования от `ValidationError`/`UnauthorizedError`

---

#### 3.1.3 `IAuthRepository.updatePassword()`

| Параметр | Значение |
|---|---|
| **Файл** | [`src/domains/auth/auth.repository.interface.ts`](../../src/domains/auth/auth.repository.interface.ts) |
| **Действие** | ✏️ Добавить метод |
| **Задача** | US-12-T4-1 |
| **Трассировка** | US-12 AC-9.1, AC-9.6 → FR-09 |

**Метод:**

| Метод | Параметры | Возврат | Описание |
|---|---|---|---|
| `updatePassword` | `userId: string, newPasswordHash: string` | `Promise<void>` | Обновляет хеш пароля пользователя в БД |

**Параметры:**

| Параметр | Тип | Описание |
|---|---|---|
| `userId` | `string` | ID пользователя для обновления |
| `newPasswordHash` | `string` | Новый хеш пароля (bcrypt) |

**Инварианты:**
- Метод обновляет только поле `password`
- `newPasswordHash` — уже захешированный пароль (хеширование в Service)
- Возвращает `Promise<void>` — результат не нужен на уровне репозитория

**Референс:** [`findByEmailWithPassword`](src/domains/auth/auth.repository.interface.ts:40) — JSDoc-стиль

---

#### 3.1.4 `AuthRepository.updatePassword()`

| Параметр | Значение |
|---|---|
| **Файл** | [`src/domains/auth/auth.repository.prisma.ts`](../../src/domains/auth/auth.repository.prisma.ts) |
| **Действие** | ✏️ Добавить метод |
| **Задача** | US-12-T4-2 |
| **Трассировка** | US-12 AC-9.1, AC-9.6 → FR-09 |

**Реализация:**

```typescript
async updatePassword(userId: string, newPasswordHash: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { password: newPasswordHash },
  });
}
```

**Описание:** Простое обновление поля `password` через `prisma.user.update()`.

**Зависимости:** `prisma` — singleton Prisma Client

**Референс:** [`create()`](src/domains/auth/auth.repository.prisma.ts:108) — аналогичное использование Prisma

---

#### 3.1.5 `AuthService.changePassword()`

| Параметр | Значение |
|---|---|
| **Файл** | [`src/domains/auth/auth.service.ts`](../../src/domains/auth/auth.service.ts) |
| **Действие** | ✏️ Добавить метод |
| **Задача** | US-12-T5 |
| **Трассировка** | US-12 AC-9.1…AC-9.6, EC-06…EC-09 → FR-09, FR-10, FR-11, BR-08…BR-12 |

**Сигнатура:**

| Метод | Параметры | Возврат | Описание |
|---|---|---|---|
| `changePassword` | `email: string, data: unknown` | `Promise<void>` | Смена пароля текущего пользователя |

**Параметры:**

| Параметр | Тип | Описание |
|---|---|---|
| `email` | `string` | Email пользователя (из NextAuth session) |
| `data` | `unknown` | Сырые данные формы — валидируются через Zod |

**Алгоритм:**

| Шаг | Описание | Ошибка при сбое |
|---|---|---|
| 1 | `changePasswordSchema.parse(data)` | `ZodError` → `UserInvalidDataError` |
| 2 | `repository.findByEmailWithPassword(email)` | `null` → `InvalidCredentialsError` (маскировка) |
| 3 | Извлечь `userId` из `user.id` | — |
| 4 | `bcrypt.compare(currentPassword, user.passwordHash)` | `false` → `InvalidCurrentPasswordError` |
| 5 | `bcrypt.compare(newPassword, user.passwordHash)` | `true` → `NewPasswordMatchesCurrentError` (BR-09) |
| 6 | `bcrypt.hash(newPassword, 10)` | — |
| 7 | `repository.updatePassword(userId, newHash)` | — |
| 8 | Сессии НЕ инвалидируются (BR-11) | — |

**Бизнес-правила:**

| Правило | Шаг | Описание |
|---|---|---|
| BR-08 | Шаг 4 | Проверка текущего пароля (`bcrypt.compare`) |
| BR-09 | Шаг 5 | Новый пароль ≠ текущий (`bcrypt.compare`) |
| BR-10 | Шаг 1 | Минимальная длина 6 символов (Zod `.min(6)`) |
| BR-11 | Шаг 8 | Сессии сохраняются после смены пароля |
| BR-12 | Шаг 6 | Хеширование `bcrypt.hash(newPassword, 10)` |

**Обработка ошибок:**

| Исходная ошибка | Преобразование | HTTP |
|---|---|---|
| `ZodError` | `UserInvalidDataError` с первым сообщением | 400 |
| `InvalidCurrentPasswordError` | перебросить как есть | 400 |
| `NewPasswordMatchesCurrentError` | перебросить как есть | 400 |
| `InvalidCredentialsError` | перебросить как есть | 401 |
| Прочие (`Error`) | `UserInvalidDataError("Ошибка при смене пароля")` | 400 |

**Зависимости (DI):**

| Параметр | Тип | Описание |
|---|---|---|
| `repository` | `IAuthRepository` | Репозиторий пользователей |

**Референс:** [`verifyCredentials()`](src/domains/auth/auth.service.ts:109) — аналогичный паттерн с `bcrypt.compare` и обработкой ошибок

---

### 3.2 API Layer

---

#### 3.2.1 `PUT /api/v1/auth/password`

| Параметр | Значение |
|---|---|
| **Файл** | `src/app/api/v1/auth/password/route.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | US-12-T7 |
| **Трассировка** | US-12 AC-9.1…AC-9.6, EC-11 → FR-09 |

**Endpoint:**

| Метод | Путь | Auth | Request Body | Response | Ошибки |
|---|---|---|---|---|---|
| `PUT` | `/api/v1/auth/password` | ✅ (NextAuth session) | `{ currentPassword, newPassword, confirmPasswordNew }` | `200: { success: true }` | 400, 401 |

**Request Body:**

| Поле | Тип | Обязательный | Описание |
|---|---|---|---|
| `currentPassword` | `string` | ✅ | Текущий пароль пользователя |
| `newPassword` | `string` | ✅ | Новый пароль (min 6 символов) |
| `confirmPasswordNew` | `string` | ✅ | Подтверждение нового пароля |

**Response (успех):**

| Код | Body |
|---|---|
| 200 | `{ success: true }` |

**Response (ошибки):**

| Код | Код ошибки | Body | Сценарий |
|---|---|---|---|
| 400 | `USER_INVALID_DATA_ERROR` | `{ success: false, error: { code, message } }` | Валидация Zod (неверный формат, <6 символов, пароли не совпадают) |
| 400 | `INVALID_CURRENT_PASSWORD` | `{ success: false, error: { code, message } }` | Текущий пароль неверный |
| 400 | `NEW_PASSWORD_MATCHES_CURRENT` | `{ success: false, error: { code, message } }` | Новый пароль совпадает с текущим |
| 401 | `UNAUTHORIZED_ERROR` | `{ success: false, error: { code, message } }` | Нет сессии NextAuth |

**Алгоритм:**

| Шаг | Описание |
|---|---|
| 1 | `auth()` из `next-auth` → если нет сессии → `401 Unauthorized` |
| 2 | Извлечь `email` из `session.user.email` |
| 3 | `request.json()` → body |
| 4 | `createAuthService().changePassword(email, body)` |
| 5 | Ответ: `200 { success: true }` |
| 6 | Обработка: `(error as BaseError).statusCode` → HTTP-статус, `.code` → error code |

**Референс:** [`POST /api/v1/auth/register`](src/app/api/v1/auth/register/route.ts:25) — идентичный паттерн route handler

---

### 3.3 UI Layer

---

#### 3.3.1 `ChangePasswordForm`

| Параметр | Значение |
|---|---|
| **Файл** | `src/components/features/auth/ChangePasswordForm/ChangePasswordForm.tsx` |
| **Действие** | 🆕 Создать |
| **Задача** | US-12-T10 |
| **Трассировка** | US-12 AC-9.7, AC-9.8, AC-9.9, AC-9.10, AC-9.12 → FR-09, FR-12 |

**Props Interface:**

| Пропс | Тип | Обязательный | Описание |
|---|---|---|---|
| (нет) | — | — | Компонент самодостаточен — не принимает пропсов |

**Состояния:**

| Состояние | Условие | Отображение |
|---|---|---|
| `idle` | Начальное / после успеха / после ошибки | Активные поля, кнопка disabled пока не все поля заполнены |
| `loading` | `isLoading === true` (отправка) | Все поля `disabled`, кнопка показывает спиннер + текст "Смена пароля..." |
| `error` | `error !== null` | `<ErrorMessage>` над формой + поле с `border: color.danger` |
| `success` | `success === true` | `<Toast>` "Пароль успешно изменён", форма очищена |

**Поля формы:**

| Поле | Type | Label | Hint | Валидация | AC |
|---|---|---|---|---|---|
| `currentPassword` | `password` | "Текущий пароль" | — | Обязательное (not empty) | AC-9.7 |
| `newPassword` | `password` | "Новый пароль" | "Минимум 6 символов" | min 6 символов | AC-9.7, AC-9.9 |
| `confirmPasswordNew` | `password` | "Подтверждение нового пароля" | — | Совпадает с `newPassword` | AC-9.7, AC-9.9 |

**Клиентская валидация:**

| Поле | Правило | Сообщение | AC |
|---|---|---|---|
| `currentPassword` | not empty | "Текущий пароль обязателен" | AC-9.7 |
| `newPassword` | `.length >= 6` | "Пароль должен содержать минимум 6 символов" | AC-9.9 |
| `confirmPasswordNew` | `=== newPassword` | "Пароли не совпадают" | AC-9.9 |

**Поведение:**

| Событие | Действие | AC |
|---|---|---|
| Mount | Инициализация пустой формы | AC-9.7 |
| Input change | Обновление значения + клиентская валидация on blur | AC-9.9 |
| Submit | `useChangePassword().changePassword(data)` | AC-9.8 |
| Success | Очистка всех полей, показ `<Toast>` "Пароль успешно изменён" | AC-9.8 |
| Server Error | Отображение `error.message`, очистка `currentPassword`, сохранение `newPassword` + `confirmPasswordNew` | AC-9.10 |
| Loading | Блокировка всех полей + кнопки | AC-9.12 |

**Взаимодействие с hook:**

```typescript
const { changePassword, isLoading, error, success } = useChangePassword();
```

**Aria-атрибуты:**

| Элемент | Атрибут | Значение |
|---|---|---|
| Error message | `role="alert"` | Для скринридеров |
| Поле с ошибкой | `aria-describedby` | ID элемента с ошибкой |
| Success toast | `aria-live="polite"` | Для скринридеров |

**Референс:** [`LoginForm`](src/components/features/auth/LoginForm/LoginForm.tsx) — аналогичная структура с полями, хуком и состояниями

**⚠️ Оценка:** ~80 строк — рекомендуется реализовать как единый компонент с `useState` + `useChangePassword()`

---

#### 3.3.2 `/settings/security` Page

| Параметр | Значение |
|---|---|
| **Файл** | `src/app/settings/security/page.tsx` |
| **Действие** | 🆕 Создать |
| **Задача** | US-12-T11 |
| **Трассировка** | US-12 AC-9.7, AC-9.11 → FR-12 |

**Состав:**

| Компонент | Назначение |
|---|---|
| Layout wrapper | `<Card>` с заголовком "Безопасность" и описанием |
| `<ChangePasswordForm />` | Форма смены пароля |

**Поведение:**

| Условие | Действие |
|---|---|
| `useSession()` → `status === 'unauthenticated'` | Редирект на `/login` с `callbackUrl` |
| `useSession()` → `status === 'loading'` | Скелетон или пустой экран |
| `useSession()` → `status === 'authenticated'` | Рендер страницы с формой |

**Алгоритм:**

| Шаг | Описание |
|---|---|
| 1 | `useSession()` → проверка авторизации |
| 2 | Если нет сессии → `router.push('/login?callbackUrl=/settings/security')` |
| 3 | Иначе → рендер `<ChangePasswordForm />` внутри `<Card>` |

**UI-элементы (соответствие макету):**

| Элемент | Компонент | AC |
|---|---|---|
| Заголовок "Безопасность" | `<CardTitle>` | AC-9.7 |
| Описание | `<p>` text.body-sm | AC-9.7 |
| Форма | `<ChangePasswordForm />` | AC-9.7 |

**Референс:** [`/dashboard/profile/page.tsx`](src/app/dashboard/profile/page.tsx:1) — аналогичная структура страницы

**⚠️ Оценка:** ~40 строк — в пределах нормы

---

### 3.4 Hooks

---

#### 3.4.1 `useChangePassword`

| Параметр | Значение |
|---|---|
| **Файл** | `src/hooks/useChangePassword.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | US-12-T9 |
| **Трассировка** | US-12 AC-9.8, AC-9.10, AC-9.12 → FR-09 |

**Возвращает:**

| Поле | Тип | Описание |
|---|---|---|
| `changePassword` | `(data: ChangePasswordData) => Promise<void>` | Функция отправки запроса смены пароля |
| `isLoading` | `boolean` | Флаг загрузки (блокировка UI) |
| `error` | `string \| null` | Сообщение об ошибке от сервера |
| `success` | `boolean` | Признак успешной смены пароля |

**Параметры `changePassword()`:**

| Поле | Тип | Обязательный |
|---|---|---|
| `currentPassword` | `string` | ✅ |
| `newPassword` | `string` | ✅ |
| `confirmPasswordNew` | `string` | ✅ |

**Поведение:**

| Событие | Действие |
|---|---|
| Вызов `changePassword(data)` | `setIsLoading(true)`, `setError(null)`, `setSuccess(false)` |
| `apiClient.put('/auth/password', data)` → 200 | `setSuccess(true)`, `setIsLoading(false)` |
| → 400 (server error) | `setError(error.message)`, `setIsLoading(false)` |
| → 401 | `setError('Сессия истекла')`, редирект на `/login` |
| Сетевая ошибка | `setError('Ошибка сети. Попробуйте позже.')`, `setIsLoading(false)` |

**Сброс состояний:**

| Условие | Действие |
|---|---|
| Новый вызов `changePassword()` | `error → null`, `success → false`, `isLoading → true` |
| Успех | `success → true`, компонент-потребитель самостоятельно сбрасывает |

**API-вызов:**

```typescript
await apiClient.put('/auth/password', data);
```

**Референс:** [`useRegister`](src/hooks/useRegister.ts:35) — аналогичная структура состояний и API-вызовов

---

### 3.5 Navigation

---

#### 3.5.1 Навигация «Безопасность»

| Параметр | Значение |
|---|---|
| **Файл** | [`src/app/dashboard/profile/page.tsx`](../../src/app/dashboard/profile/page.tsx) + компоненты навигации |
| **Действие** | ✏️ Добавить |
| **Задача** | US-12-T12 |
| **Трассировка** | US-12 AC-9.13 → FR-09 |

**Точки входа:**

| Точка | Описание | Ссылка |
|---|---|---|
| Страница профиля `/dashboard/profile` | Кнопка/ссылка "Безопасность" или "Сменить пароль" | `/settings/security` |
| Выпадающее меню аватара | Пункт "Безопасность" | `/settings/security` |

**Референс:** Ссылка из меню профиля — аналогично существующей навигации

---

## 4. 🔗 Зависимости между компонентами

```
changePasswordSchema (T2) ─────────────┐
                                       │
InvalidCurrentPasswordError (T3) ──────┤
NewPasswordMatchesCurrentError (T3) ───┤
updatePassword() Interface (T4-1) ─────┤
updatePassword() Prisma (T4-2) ────────┤
                                       │
              ┌────────────────────────┤────────────────────────┐
              ▼                         ▼                        ▼
      AuthService.changePassword()  ←── репозиторий           API Route (T7)
      (T5)                           (T4)
                                                         │
                                                         ▼
                                                    useChangePassword (T9)
                                                         │
                                                         ▼
                                           ChangePasswordForm (T10)
                                                         │
                                                         ▼
                                                /settings/security Page (T11)

Navigation (T12) ────────────────────────────────────────► /settings/security
```

---

## 5. ✅ Чек-лист проверки

### Spec-файл

- [x] Матрица трассировки покрывает все AC из US-12 (AC-9.1…AC-9.13)
- [x] Матрица трассировки покрывает Edge Cases (EC-06…EC-09, EC-11)
- [x] Каждый компонент имеет TASK-ID из плана
- [x] Покрытие AC проверено — все AC-9.1…AC-9.13 имеют строки в матрице

### Архитектура

- [x] DDD-архитектура соблюдена (слои не пересекаются)
- [x] DI через интерфейсы (`IAuthRepository`)
- [x] API путь относительный (`/auth/password`)
- [x] `'use client'` на клиентских компонентах (Hook, Form, Page)
- [x] `apiClient` для запросов, `useSession()` для авторизации
- [x] Тип `ChangePasswordInput` через `z.infer` (единый источник — validators)
- [x] Отдельного `auth.types.ts` не создаётся — следует паттерну `RegisterInput`/`LoginInput`

### Бизнес-правила

- [x] BR-08: Проверка текущего пароля (шаг 4 в Service)
- [x] BR-09: Новый пароль ≠ текущий (шаг 5 в Service)
- [x] BR-10: Минимальная длина 6 символов (Zod `.min(6)`)
- [x] BR-11: Сессии сохраняются (явное упоминание в Service)
- [x] BR-12: `bcrypt.hash(newPassword, 10)` (шаг 6 в Service)

---

## 📖 Референсные примеры

> При реализации ориентироваться на существующие паттерны:

| Паттерн | Файл |
|---|---|
| Zod-схема с `refine` | [`auth.validators.ts:16`](src/domains/auth/auth.validators.ts:16) |
| Domain error class | [`auth.errors.ts:55`](src/domains/auth/auth.errors.ts:55) |
| Repository interface | [`auth.repository.interface.ts:16`](src/domains/auth/auth.repository.interface.ts:16) |
| Repository prisma | [`auth.repository.prisma.ts:63`](src/domains/auth/auth.repository.prisma.ts:63) |
| Service метод | [`auth.service.ts:109`](src/domains/auth/auth.service.ts:109) |
| API route handler | [`api/v1/auth/register/route.ts:25`](src/app/api/v1/auth/register/route.ts:25) |
| Hook с состояниями | [`hooks/useRegister.ts:35`](src/hooks/useRegister.ts:35) |
| UI компонент формы | `src/components/features/auth/LoginForm/LoginForm.tsx` |
| Re-exports | [`domains/auth/index.ts:5`](src/domains/auth/index.ts:5) |

---
