# ProfileService

## Статус: На обсуждении

---

## 1. Описание

### 1.1 Назначение

Сервис управления профилем пользователя. Обеспечивает получение, обновление данных профиля и управление аватаром.

### 1.2 Границы ответственности

| Входит | НЕ входит |
|--------|-----------|
| Получение данных профиля пользователя | Аутентификация (вход/выход) |
| Обновление данных профиля (name, phone, avatarUrl) | Хеширование паролей |
| Обновление данных участника (surname, firstName, patronymic, address) | Управление ролями |
| Валидация входных данных профиля | Управление сессиями |
| Проверка прав доступа к профилю | Отправка email-уведомлений |

### 1.3 Связанные домены и сущности

| Домен | Сущность | Роль |
|-------|----------|------|
| Core | User | Основная сущность профиля |
| Core | Member | Данные участника (связь 1:1 с User) |

---

## 2. Бизнес-правила

### 2.1 Правила валидации

| ID | Правило | Описание | Ошибка |
|----|---------|----------|--------|
| VR-001 | name-length | Имя не более 100 символов | ValidationError |
| VR-002 | phone-format | Телефон в формате +7XXXXXXXXXX или пустой | ValidationError |
| VR-003 | avatar-url-format | URL аватара должен быть валидным URL или пустой | ValidationError |
| VR-004 | surname-length | Фамилия не более 100 символов | ValidationError |
| VR-005 | firstName-length | Имя (firstName) не более 100 символов | ValidationError |
| VR-006 | patronymic-length | Отчество не более 100 символов | ValidationError |
| VR-007 | address-length | Адрес не более 300 символов | ValidationError |

### 2.2 Правила бизнес-логики

| ID | Правило | Описание | Исключение |
|----|---------|----------|------------|
| BL-001 | user-must-exist | Профиль можно получить только для существующего пользователя | NotFoundError |
| BL-002 | owner-or-admin | Обновлять профиль может только владелец или ADMIN | ForbiddenError |
| BL-003 | member-optional | Данные Member обновляются только если запись существует | — (пропуск, не ошибка) |

---

## 3. API сервиса

### 3.1 Получение

#### getProfile

Получает данные профиля пользователя по ID, включая данные участника (Member).

| Параметр | Тип | Обязательное | Описание |
|----------|-----|--------------|----------|
| userId | string | да | ID пользователя |

| Возвращает | Тип | Описание |
|------------|-----|----------|
| profile | ProfileDetail | Данные профиля с информацией об участнике |

| Выбрасывает | Когда | Код ошибки |
|-------------|-------|-------------|
| NotFoundError | Пользователь не найден | NOT_FOUND |

#### Пример вызова

| Шаг | Действие | Результат |
|-----|----------|-----------|
| 1 | Вызов `getProfile('user-123')` | Поиск User по ID |
| 2 | User найден | Возврат ProfileDetail с member |

---

### 3.2 Обновление

#### updateProfile

Обновляет данные профиля пользователя. Поддерживает обновление полей User и Member.

| Параметр | Тип | Обязательное | Описание |
|----------|-----|--------------|----------|
| userId | string | да | ID пользователя |
| input | UpdateProfileInput | да | Данные для обновления |

| Возвращает | Тип | Описание |
|------------|-----|----------|
| profile | ProfileDetail | Обновлённые данные профиля |

| Выбрасывает | Когда | Код ошибки |
|-------------|-------|-------------|
| ValidationError | Входные данные невалидны | VALIDATION_ERROR |
| NotFoundError | Пользователь не найден | NOT_FOUND |
| ForbiddenError | Пользователь не владелец и не ADMIN | FORBIDDEN |

#### Пример вызова

| Шаг | Действие | Результат |
|-----|----------|-----------|
| 1 | Вызов `updateProfile('user-123', { name: 'Иван', phone: '+79001234567' })` | Валидация входных данных |
| 2 | Валидация пройдена | Обновление User через Repository |
| 3 | Если переданы поля Member | Обновление Member через Repository |
| 4 | Успешное обновление | Возврат обновлённого ProfileDetail |

---

### 3.3 Дополнительные операции

#### updateAvatarUrl

Обновляет только URL аватара пользователя.

| Параметр | Тип | Обязательное | Описание |
|----------|-----|--------------|----------|
| userId | string | да | ID пользователя |
| avatarUrl | string | да | Новый URL аватара |

| Возвращает | Тип | Описание |
|------------|-----|----------|
| profile | ProfileDetail | Обновлённые данные профиля |

| Выбрасывает | Когда | Код ошибки |
|-------------|-------|-------------|
| ValidationError | URL невалиден | VALIDATION_ERROR |
| NotFoundError | Пользователь не найден | NOT_FOUND |

---

## 4. Входные данные

### 4.1 Типы входных данных

#### UpdateProfileInput

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| name | string | нет | Имя/ник пользователя |
| phone | string | нет | Контактный телефон |
| avatarUrl | string | нет | URL аватара |
| surname | string | нет | Фамилия (Member) |
| firstName | string | нет | Имя (Member) |
| patronymic | string | нет | Отчество (Member) |
| address | string | нет | Адрес (Member) |

---

### 4.2 Zod схемы валидации

#### updateProfileSchema

| Поле | Схема | Ограничение | Сообщение об ошибке |
|------|-------|-------------|---------------------|
| name | `z.string().max(100).optional()` | Макс. 100 символов | "Имя не должно превышать 100 символов" |
| phone | `z.string().regex(/^\+7\d{10}$/).optional().or(z.literal(''))` | Формат +7XXXXXXXXXX | "Неверный формат телефона" |
| avatarUrl | `z.string().url().optional().or(z.literal(''))` | Валидный URL | "Неверный формат URL аватара" |
| surname | `z.string().max(100).optional()` | Макс. 100 символов | "Фамилия не должна превышать 100 символов" |
| firstName | `z.string().max(100).optional()` | Макс. 100 символов | "Имя не должно превышать 100 символов" |
| patronymic | `z.string().max(100).optional()` | Макс. 100 символов | "Отчество не должно превышать 100 символов" |
| address | `z.string().max(300).optional()` | Макс. 300 символов | "Адрес не должен превышать 300 символов" |

#### updateAvatarUrlSchema

| Поле | Схема | Ограничение | Сообщение об ошибке |
|------|-------|-------------|---------------------|
| avatarUrl | `z.string().url().min(1)` | Валидный URL, не пустой | "Неверный формат URL аватара" |

---

## 5. Зависимости

### 5.1 Repository зависимости

| Repository | Методы | Назначение |
|------------|--------|------------|
| UserRepository | `findById`, `update` | Доступ к данным User |
| MemberRepository | `findByUserId`, `update` | Доступ к данным Member |

### 5.2 Service зависимости

Нет зависимостей от других сервисов.

### 5.3 Внешние зависимости

| Пакет | Версия | Назначение | Согласовано |
|-------|--------|------------|-------------|
| zod | ^3.x | Валидация входных данных | да |

---

## 6. Выходные данные

### 6.1 Типы возвращаемых данных

#### ProfileDetail

| Поле | Тип | Описание |
|------|-----|----------|
| id | string | ID пользователя |
| email | string | Email пользователя |
| name | string \| null | Имя/ник |
| phone | string \| null | Контактный телефон |
| avatarUrl | string \| null | URL аватара |
| role | string | Роль пользователя (ADMIN, MEMBER, GUEST) |
| isActive | boolean | Статус аккаунта |
| member | MemberDetail \| null | Данные участника (если есть) |

#### MemberDetail

| Поле | Тип | Описание |
|------|-----|----------|
| surname | string | Фамилия |
| firstName | string | Имя |
| patronymic | string \| null | Отчество |
| address | string \| null | Адрес |
| snn | string \| null | СНИЛС |

---

## 7. Обработка ошибок

### 7.1 Классы ошибок

| Ошибка | Когда выбрасывается | Код | HTTP статус |
|--------|---------------------|-----|-------------|
| ValidationError | Неверные входные данные | VALIDATION_ERROR | 400 |
| NotFoundError | Пользователь не найден | NOT_FOUND | 404 |
| ForbiddenError | Пользователь не владелец и не ADMIN | FORBIDDEN | 403 |

### 7.2 Стратегия обработки

| Сценарий | Обработка | Результат |
|----------|-----------|-----------|
| User не найден по ID | Выбросить NotFoundError | 404 |
| Обновление чужого профиля (не ADMIN) | Выбросить ForbiddenError | 403 |
| Невалидный формат телефона | Выбросить ValidationError | 400 |
| Невалидный URL аватара | Выбросить ValidationError | 400 |

---

## 8. Транзакции

Обновление User и Member не требует транзакционной целостности, так как это независимые операции. Если Member не существует, его данные просто игнорируются.

| Операция | Атомарные действия | Откат при |
|----------|-------------------|-----------|
| updateProfile | update User → update Member (если есть) | Ошибка обновления User |

---

## 9. Тестирование

### 9.1 Unit тесты

| Тест | Сценарий | Ожидаемый результат |
|------|----------|---------------------|
| should return profile when user exists | Вызов getProfile с существующим userId | ProfileDetail с member |
| should return profile without member | Вызов getProfile для User без Member | ProfileDetail с member=null |
| should throw NotFoundError when user not found | Вызов getProfile с несуществующим userId | NotFoundError |
| should update user fields | updateProfile с name и phone | Обновлённый ProfileDetail |
| should update member fields | updateProfile с surname и firstName | Обновлённый ProfileDetail с member |
| should skip member update when no member | updateProfile с surname для User без Member | ProfileDetail без обновления member |
| should validate phone format | updateProfile с невалидным телефоном | ValidationError |
| should validate avatar URL | updateAvatarUrl с невалидным URL | ValidationError |
| should throw ForbiddenError for non-owner | updateProfile чужого профиля (не ADMIN) | ForbiddenError |
| should allow admin to update any profile | ADMIN обновляет чужой профиль | Успешное обновление |

### 9.2 Integration тесты

Интеграционные тесты не требуются, так как сервис не имеет побочных эффектов.

---

## 10. Структура файлов

| Файл | Назначение |
|------|------------|
| `src/services/profile-service.ts` | Основной файл сервиса |
| `src/services/_lib/errors.ts` | Классы ошибок (общие для всех сервисов) |
| `src/services/profile-service.test.ts` | Unit тесты |

---

## 11. Чек-лист качества

- [ ] Все публичные методы имеют JSDoc аннотации
- [ ] Входные данные валидируются через Zod схемы
- [ ] Используется Repository абстракция (нет прямого доступа к Prisma)
- [ ] Все ошибки явно типизированы (нет generic `Error`)
- [ ] Бизнес-правила реализованы и покрыты тестами
- [ ] Транзакции используются где требуется
- [ ] Factory функция для создания экземпляра сервиса
- [ ] Dependency Injection через конструктор
- [ ] Нет `any`, `unknown` (как обходного пути), `ts-ignore`
- [ ] Каждая функция ≤ 50 строк
- [ ] Покрытие тестами ≥ 80%

---

## 12. История изменений

| Версия | Дата | Изменения | Автор |
|--------|------|-----------|-------|
| 0.1.0 | 2026-06-26 | Начальная версия | architect |