# Auth UI — Стартовая страница, авторизация и профиль пользователя

## Статус: На обсуждении

## Метаданные

| Параметр | Значение |
|----------|----------|
| Версия | 0.1.0 |
| Дата создания | 2026-06-25 |
| Автор | Architect |
| Связанные документы | [`auth.md`](./auth.md), [`api-router-requirements.md`](./components/api-routers/api-router-requirements.md), [`service-component-requirements.md`](./components/services/service-component-requirements.md) |
| Состояние | На обсуждении |

---

## 0. Назначение

Спецификация определяет функциональность стартовой страницы, авторизации, управления сессией и профиля пользователя.

---

## 1. Стартовая страница (Landing Page)

### 1.1 Назначение

Точка входа в приложение. Содержит общую информацию о СНТ и элементы управления авторизацией/темой.

### 1.2 Функциональные требования

| Требование | Описание |
|------------|----------|
| Отображение фона | Фон страницы — тематика садового товарищества (изображение/градиент) |
| Тема оформления | 3 темы: светлая (`light`), тёмная (`dark`), садовое-тёплая (`garden`) |
| Статус авторизации | Показывает, авторизован ли пользователь |
| Неавторизованный | Кнопка "Войти" → редирект на `/login?callbackUrl=${currentPath}` |
| Авторизованный | Кнопка "Выйти" + кнопка смены темы |

### 1.3 Публичность

Страница публичная — доступна без авторизации.

---

## 2. Авторизация

### 2.1 Login Page (`/login`)

#### Функциональные требования

| Требование | Описание |
|------------|----------|
| Форма входа | Email + Password |
| Валидация | Zod schema: email (valid email), password (min 6 chars) |
| Callback URL | Если URL содержит `?callbackUrl=...`, редирект после входа на этот URL |
| Защита от open redirect | `callbackUrl` должен быть относительным URL внутри приложения |
| Ссылка на сброс пароля | "Забыли пароль?" → `/forgot-password` |
| Обработка ошибок | Отображение сообщений об ошибках (неверный email/пароль) |

#### Zod схема

```typescript
const loginSchema = z.object({
  email: z.string().email('Неверный email'),
  password: z.string().min(6, 'Пароль минимум 6 символов'),
}).strict()
```

### 2.2 Forgot Password Page (`/forgot-password`)

#### Функциональные требования

| Требование | Описание |
|------------|----------|
| Форма | Только email |
| Действие | Генерирует `resetToken` (1 час) и сохраняет в БД |
| Email | **Mock реализация** — в консоли логируем ссылку |
| Безопасный ответ | Всегда показываем "Если аккаунт существует, email отправлен" |

#### Zod схема

```typescript
const forgotPasswordSchema = z.object({
  email: z.string().email('Неверный email'),
}).strict()
```

### 2.3 Reset Password Page (`/reset-password?token=xxx`)

#### Функциональные требования

| Требование | Описание |
|------------|----------|
| Форма | Новый пароль + подтверждение пароля |
| Валидация | Пароли должны совпадать, минимум 6 символов |
| Токен | Берётся из URL query param `token` |
| Успех | Редирект на `/login` с сообщением об успехе |

#### Zod схема

```typescript
const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6, 'Пароль минимум 6 символов'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
}).strict()
```

---

## 3. Профиль пользователя

### 3.1 Profile Page (`/profile`)

#### Функциональные требования

| Требование | Описание |
|------------|----------|
| Отображение данных | Аватар, email, имя/ник, контакты (phone), роли, тема |
| Редактирование | Возможность изменить: имя, телефон, пароль, аватар |
| Смена темы | Выпадающий список: light / dark / garden |
| Кнопка выхода | `/api/auth/signout` с редиректом на `/` |
| Ссылка на логин | Если неавторизован → редирект на `/login` |

#### Поля профиля

| Поле | Тип | Обязательное | Редактируемое |
|------|-----|--------------|---------------|
| `avatarUrl` | String? | Нет | Да (загрузка файла) |
| `email` | String | Да | Да (через API) |
| `passwordHash` | String | Да | Нет (хеш, отображаетсяmasked) |
| `name` | String? | Нет | Да |
| `phone` | String? | Нет | Да |
| `role` | UserRole | Да | Нет (только для просмотра) |
| `theme` | Theme | Нет | Да (client-side) |

#### Zod схемы

```typescript
const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
}).strict()

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
  confirmNewPassword: z.string(),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmNewPassword'],
}).strict()
```

---

## 4. API Endpoints

### 4.1 Auth Endpoints

| Method | Path | Auth | Роль | Описание |
|--------|------|------|------|----------|
| POST | `/api/auth/login` | Нет | — | Вход по email/password (использует NextAuth) |
| POST | `/api/auth/logout` | Да | — | Выход из сессии |
| POST | `/api/auth/forgot-password` | Нет | — | Генерация reset token |
| POST | `/api/auth/reset-password` | Нет | — | Сброс пароля по token |
| POST | `/api/auth/change-password` | Да | — | Смена пароля авторизованного пользователя |

### 4.2 Profile Endpoints

| Method | Path | Auth | Роль | Описание |
|--------|------|------|------|----------|
| GET | `/api/profile` | Да | — | Получение данных профиля |
| PUT | `/api/profile` | Да | — | Обновление данных профиля |
| POST | `/api/profile/avatar` | Да | — | Загрузка аватара (mock) |

---

## 5. Сервисы

### 5.1 AuthService

| Метод | Входные данные | Возврат | Описание |
|-------|----------------|---------|----------|
| `login(email, password)` | `{ email: string, password: string }` | `{ user: User }` | Проверка учётных данных |
| `logout(sessionId)` | `{ sessionId: string }` | `void` | Завершение сессии |
| `generateResetToken(email)` | `{ email: string }` | `{ resetToken: string }` | Генерация токена сброса |
| `resetPassword(token, newPassword)` | `{ token: string, newPassword: string }` | `void` | Сброс пароля |
| `changePassword(userId, currentPassword, newPassword)` | `{ userId, currentPassword, newPassword }` | `void` | Смена пароля |

### 5.2 ProfileService

| Метод | Входные данные | Возврат | Описание |
|-------|----------------|---------|----------|
| `getProfile(userId)` | `{ userId: string }` | `{ profile: ProfileResponse }` | Получение профиля |
| `updateProfile(userId, data)` | `{ userId, name?, phone? }` | `{ profile: ProfileResponse }` | Обновление профиля |
| `changePassword(userId, currentPassword, newPassword)` | `{ userId, currentPassword, newPassword }` | `void` | Смена пароля |

### 5.3 FileStorageService (Mock)

| Метод | Входные данные | Возврат | Описание |
|-------|----------------|---------|----------|
| `uploadAvatar(userId, file)` | `{ userId, file: File }` | `{ url: string }` | Mock загрузка файла |

---

## 6. UI Компоненты

### 6.1 Форма авторизации

| Компонент | Тип | Расположение | Описание |
|-----------|-----|--------------|----------|
| `LoginForm` | Form | `src/components/forms/login-form.tsx` | Форма входа |
| `ForgotPasswordForm` | Form | `src/components/forms/forgot-password-form.tsx` | Форма сброса пароля |
| `ResetPasswordForm` | Form | `src/components/forms/reset-password-form.tsx` | Форма сброса по токену |
| `ChangePasswordForm` | Form | `src/components/forms/change-password-form.tsx` | Форма смены пароля |

### 6.2 Профиль

| Компонент | Тип | Расположение | Описание |
|-----------|-----|--------------|----------|
| `ProfileForm` | Form | `src/components/forms/profile-form.tsx` | Форма редактирования профиля |
| `UserAvatar` | UI | `src/components/features/user-avatar.tsx` | Аватар пользователя |
| `ProfileView` | View | `src/components/features/profile-view.tsx` | Отображение профиля |

### 6.3 Утилиты UI

| Компонент | Тип | Расположение | Описание |
|-----------|-----|--------------|----------|
| `ThemeSwitcher` | UI | `src/components/ui/theme-switcher.tsx` | Переключатель темы |
| `LogoutButton` | UI | `src/components/ui/logout-button.tsx` | Кнопка выхода |

---

## 7. State Management

### 7.1 Theme Store

```typescript
// src/hooks/useTheme.ts
type Theme = 'light' | 'dark' | 'garden'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}
```

Хранение в `localStorage` для персистентности между сессиями.

### 7.2 Auth Hooks

Используем `next-auth/react` — `useSession()`, `signIn()`, `signOut()`.

---

## 8. Страницы

| Страница | Путь | Auth | Описание |
|----------|------|------|----------|
| Landing | `/` | Нет | Стартовая страница |
| Login | `/login` | Нет | Форма входа |
| Forgot Password | `/forgot-password` | Нет | Запрос на сброс пароля |
| Reset Password | `/reset-password` | Нет | Сброс пароля по токену |
| Profile | `/profile` | Да | Профиль пользователя |

---

## 9. Зависимости

Новые зависимости не требуются. Используем существующие:

- `next-auth` — авторизация
- `zod` — валидация
- `react-hook-form` + `@hookform/resolvers` — формы
- `@radix-ui/*` — UI компоненты (ThemeSwitcher)
- `zustand` — state management (theme store)
- `clsx` + `tailwind-merge` — стилизация

---

## 10. Безопасность

| Мера | Описание |
|------|----------|
| CSRF защита | NextAuth JWT strategy + SameSite cookies |
| Rate limiting | На уровне API (можно добавить `@upstash/ratelimit` в будущем) |
| Password hashing | bcrypt, rounds = 12 |
| Reset token | 1 час, одноразовый |
| Open redirect защита | callbackUrl только относительный URL |

---

## 11. Чек-лист качества

- [ ] Все API endpoints имеют JSDoc
- [ ] Zod валидация на всех уровнях
- [ ] Error handling через try/catch
- [ ] Ни один `catch` не игнорирует ошибку
- [ ] Нет `any` типов
- [ ] Service слой не знает о HTTP
- [ ] Repository слой не знает о бизнес-логике
- [ ] Component функция ≤ 50 строк
- [ ] Unit тесты для сервисов

---

## 12. История изменений

| Версия | Дата | Автор | Изменения |
|--------|------|-------|-----------|
| 0.1.0 | 2026-06-25 | Architect | Первоначальная версия |
