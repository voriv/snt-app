# Аутентификация и безопасность

> 📌 Контекстный сегмент. Полная версия: [`auth.md`](../specs/auth.md)

---

## JWT Auth (NextAuth.js v5)

| Параметр | Значение |
|----------|----------|
| Стратегия | JWT (не database sessions) |
| Access Token | HS256, 1 час |
| Refresh Token | 7 дней, хранится в БД для отзыва |
| Password Hashing | bcrypt, rounds = 12 (~250ms) |
| Аутентификация | Email/Password |

### Структура токенов

```typescript
// Access Token
interface AccessToken {
  sub: string   // User ID
  email: string
  exp: number   // Expires (timestamp)
  iat: number   // Issued at
}

// Refresh Token
interface RefreshToken {
  sub: string
  type: 'refresh'
  exp: number
  iat: number
  jti: string   // Unique ID (для отзыва)
}
```

### Refresh Token Flow

1. Клиент отправляет `POST /api/auth/refresh` с refreshToken
2. Сервер проверяет подпись, наличие в БД, не отозван ли
3. Если валиден: генерирует новые access + refresh токены
4. Старый refresh token помечается как отозванный
5. Если невалиден: 401, клиент перенаправляется на логин

---

## WebSocket Auth

```typescript
// Клиент подключается с JWT в заголовке
const ws = new WebSocket('wss://example.com/ws', {
  headers: { Authorization: `Bearer ${accessToken}` }
})

// Сервер верифицирует токен
import { verify } from 'jsonwebtoken'
const decoded = verify(token, process.env.WS_INTERNAL_SECRET)
```

---

## RBAC (Role-Based Access Control)

| Роль | Описание | Доступ |
|------|----------|--------|
| `ADMIN` | Председатель/бухгалтер | Все ресурсы, административные действия |
| `MEMBER` | Садовод | Собственные данные, публичные ресурсы |
| `GUEST` | Гость | Только публичные данные |

**Проверка прав на уровне API:**
```typescript
const user = await requireAuth()                    // Любой авторизованный
const admin = await requireAuthWithRole(['ADMIN'])   // Только ADMIN
```

**Проверка прав на уровне Service:**
```typescript
if (document.authorId !== userId && !isAdmin(userId)) {
  throw new ForbiddenError('Cannot delete document')
}
```

---

## Zod валидация

Все входные данные валидируются через Zod на всех уровнях:

```typescript
// API Router level
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

// Service level — бизнес-валидация через Zod + бизнес-правила
```

---

## Защита сессии

| Мера | Описание |
|------|----------|
| HTTPS только | `Secure` cookie flag |
| HTTP only cookie | JS не может получить токен |
| SameSite | `Strict` для предотвращения CSRF |
| Token rotation | Новый refresh token при каждом использовании |
| Token revocation | Возможность отзыва через БД |

---

## Обработка ошибок

| Уровень | Типы ошибок | Формат ответа |
|---------|-------------|---------------|
| API Router | ValidationError, UnauthorizedError | `{ error: { code, message } }` |
| Service | DomainError (ValidationError, NotFoundError, ConflictError, BusinessRuleError) | Throw typed error |
| Repository | DatabaseError | Translate to domain error |

**Запрещено:** generic `Error`, `catch (any)`, игнорирование ошибок

---

## Защита от XSS/Injection

- Prisma ORM (parameterized queries)
- React (escaping by default)
- HTML sanitize при загрузке документов

---

## Восстановление пароля

1. `POST /api/auth/forgot-password { email }` — генерирует resetToken (1 час)
2. Отправляет email с ссылкой `/reset-password?token=xxx`
3. `POST /api/auth/reset-password { token, newPassword }` — проверяет token, обновляет пароль
4. Безопасный ответ: "Если аккаунт существует, email отправлен"

---

📄 Полная спецификация: [`auth.md`](../specs/auth.md)