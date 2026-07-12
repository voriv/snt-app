# План реализации User Story: US-19-01 (Просмотр профиля пользователя)

## Метаданные
- **US-ID:** US-19-01
- **Название:** Просмотр профиля пользователя
- **Требование:** REQ-PROFILE-001
- **Версия:** 2.0
- **Дата:** 2026-07-12
- **Статус:** [IN PROGRESS]

## Ссылки
- **User Story:** [`docs/user-stories/US-19-01-просмотр-профиля.md`](../user-stories/US-19-01-просмотр-профиля.md)
- **Требование:** [`docs/requirements/REQ-PROFILE-001.md`](../requirements/REQ-PROFILE-001.md)
- **Модель данных:** [`docs/model/entities/user-profile.md`](../model/entities/user-profile.md)

---

## Результат аудита существующей реализации

> **Важно:** Аудит показал, что подавляющее большинство слоёв **уже реализовано**. План v1.0 предполагал создание файлов с нуля, но фактически домен `userProfile` полностью построен. Ниже — сводка фактического состояния и оставшихся gap.

### Фактическое состояние по слоям

| Слой | Файл | Статус | Примечание |
|------|------|--------|------------|
| Модель данных | `prisma/schema.prisma`, `docs/model/entities/user-profile.md` | ✅ DONE | UserProfile существует, поля соответствует US |
| Доменные типы | [`src/domains/userProfile/userProfile.types.ts`](../../src/domains/userProfile/userProfile.types.ts:1) | ✅ DONE | UserProfileData, UserProfileFull, CreateUserProfileInput, UpdateUserProfileInput — все с JSDoc |
| Zod-валидаторы | `src/domains/userProfile/userProfile.validators.ts` | ✅ DONE | Схемы импортируются в service |
| Доменные ошибки | [`src/domains/userProfile/userProfile.errors.ts`](../../src/domains/userProfile/userProfile.errors.ts:1) | ✅ DONE | UserProfileNotFoundError, InvalidDataError, DuplicateError, ThemeInvalidError, ProfileRepositoryError — все с JSDoc |
| Repository (interface) | [`src/domains/userProfile/userProfile.repository.interface.ts`](../../src/domains/userProfile/userProfile.repository.interface.ts:1) | ✅ DONE | findById, findByUserId, findOrCreateWithUser, findWithUser, create, update, updateTheme, delete — все с JSDoc |
| Repository (prisma) | [`src/domains/userProfile/userProfile.repository.prisma.ts`](../../src/domains/userProfile/userProfile.repository.prisma.ts:1) | ✅ DONE | Реализация с findOrCreateWithUser (автосоздание BR-08) |
| Service | [`src/domains/userProfile/userProfile.service.ts`](../../src/domains/userProfile/userProfile.service.ts:1) | ✅ DONE | getUserProfile(userId) → findOrCreateWithUser (автосоздание) |
| DI Container | [`src/di/container.ts`](../../src/di/container.ts:1) | ✅ DONE | createUserProfileService() существует |
| API Route Handler | [`src/app/api/v1/profile/route.ts`](../../src/app/api/v1/profile/route.ts:1) | ✅ DONE | GET через withRoleGuard, JSDoc полный |
| UI-компонент (карточка) | [`src/components/features/userProfile/ProfileCard/ProfileCard.tsx`](../../src/components/features/userProfile/ProfileCard/ProfileCard.tsx:1) | ⚠️ PARTIAL | Нет даты регистрации, нет отображения "—" для пустых полей |
| Страница | [`src/app/dashboard/profile/page.tsx`](../../src/app/dashboard/profile/page.tsx:1) | ⚠️ PARTIAL | Нет setTimeout перед редиректом, нет кнопки retry |
| Мёртвый код | [`src/app/dashboard/profile/page.client.tsx`](../../src/app/dashboard/profile/page.client.tsx:1) | ❌ TRASH | Не используется, содержит bug с `/api/v1` префиксом |

---

## Оставшиеся задачи (Gap Analysis)

### T1: Удалить мёртвый код `page.client.tsx`
**ID:** US-19-01-T1-CLEANUP
**Статус:** [TODO]

**Обоснование:** Файл [`src/app/dashboard/profile/page.client.tsx`](../../src/app/dashboard/profile/page.client.tsx:1) не импортируется ни одним компонентом. Содержит bug: `apiClient.get('/api/v1/profile')` — дублирование префикса (нарушение [`api-paths.md`](../../.roo/rules/api-paths.md)). Функциональность полностью покрыта в `page.tsx`.

**Чек-лист:**
- [ ] Проверить отсутствие импортов `page.client.tsx` в кодовой базе
- [ ] Удалить файл `src/app/dashboard/profile/page.client.tsx`
- [ ] Запустить `npm run type-check` — убедиться, что 0 ошибок

---

### T2: Добавить задержку `setTimeout` перед редиректом (AC-1.2)
**ID:** US-19-01-T2-REDIRECT-FIX
**Статус:** [TODO]

**Обоснование:** [`page.tsx:77`](../../src/app/dashboard/profile/page.tsx:77) использует `router.replace('/login?callbackUrl=/dashboard/profile')` без задержки `setTimeout(..., 100)`. Нарушение PROJECT.md секция 10 «Проверка ролей и редиректы»: обязательна задержка `setTimeout(() => router.replace('/login'), 100)`.

**Чек-лист:**
- [ ] В [`src/app/dashboard/profile/page.tsx`](../../src/app/dashboard/profile/page.tsx:1) обернуть `router.replace` в `setTimeout(() => router.replace('/login?callbackUrl=/dashboard/profile'), 100)`
- [ ] Сохранить блокировку UI на время редиректа (опционально: добавить state `isRedirecting`)
- [ ] `npm run type-check` — 0 ошибок

---

### T3: Добавить отображение даты регистрации в ProfileCard (AC-1.1)
**ID:** US-19-01-T3-REGISTRATION-DATE
**Статус:** [TODO]

**Обоснование:** AC-1.1 требует отображения «даты регистрации». Тип [`UserProfileFull`](../../src/domains/userProfile/userProfile.types.ts:64) содержит поля `userCreatedAt` и `profileCreatedAt`. Однако [`ProfileCard.tsx`](../../src/components/features/userProfile/ProfileCard/ProfileCard.tsx:1) их не отображает. Открытый вопрос US-1 допускает: дата регистрации из таблицы User (`userCreatedAt`).

**Чек-лист:**
- [ ] Расширить `ProfileCardProps.profile` полем `createdAt: Date` (или `userCreatedAt: Date`)
- [ ] В [`ProfileCard.tsx`](../../src/components/features/userProfile/ProfileCard/ProfileCard.tsx:1) добавить блок отображения даты регистрации (формат: `dd.MM.yyyy`, на русском)
- [ ] Использовать утилиту форматирования из `src/shared/utils/formatting.ts` (если есть formatDate)
- [ ] В [`page.tsx`](../../src/app/dashboard/profile/page.tsx:1) передать `profile.userCreatedAt` в ProfileCard
- [ ] Обновить JSDoc `@spec` и `@example` в ProfileCard
- [ ] `npm run type-check` — 0 ошибок

---

### T4: Обработка пустых полей — отображение «—» (EC-7)
**ID:** US-19-01-T4-EMPTY-FIELDS
**Статус:** [TODO]

**Обоснование:** EC-7 US: «Поля отображаются как пустые/прочерк». [`ProfileCard.tsx`](../../src/components/features/userProfile/ProfileCard/ProfileCard.tsx:1) отображает `profile.firstName` напрямую — при `null` рендерит пустое значение. Должно отображаться «—» (прочерк) для null-полей, кроме email (email отображается всегда).

**Чек-лист:**
- [ ] В [`ProfileCard.tsx`](../../src/components/features/userProfile/ProfileCard/ProfileCard.tsx:1) создать helper `displayValue(value: string | null): string` → возвращает значение или «—»
- [ ] Применить к полям: firstName, lastName, middleName, phone, bio
- [ ] Email НЕ обрабатывать (всегда отображается из User)
- [ ] Обновить JSDoc `@spec`: «при null отображается "—"»
- [ ] `npm run type-check` — 0 ошибок

---

### T5: Добавить кнопку «Повторить» при ошибке загрузки (AC-1.6)
**ID:** US-19-01-T5-RETRY-BUTTON
**Статус:** [TODO]

**Обоснование:** AC-1.6 US: «показывается сообщение об ошибке загрузки с возможностью повторить запрос». [`page.tsx:187-189`](../../src/app/dashboard/profile/page.tsx:187) отображает ошибку, но **без кнопки повтора**.

**Чек-лист:**
- [ ] В [`page.tsx`](../../src/app/dashboard/profile/page.tsx:1) вынести логику загрузки профиля в `useCallback` функцию `loadProfile`
- [ ] В блоке error state (строки 187-189) добавить кнопку «Повторить» из `src/components/ui/Button`
- [ ] Кнопка вызывает `loadProfile()`
- [ ] Использовать компонент `Button` с `variant="primary"` и `isLoading` при повторном запросе
- [ ] Обновить JSDoc `@spec` страницы: «при ошибке — кнопка повтора запроса»
- [ ] `npm run type-check` — 0 ошибок

---

### T6: Исправить JSDoc-аннотацию в page.tsx (api-paths)
**ID:** US-19-01-T6-JSDOC-FIX
**Статус:** [TODO]

**Обоснование:** [`page.tsx:18`](../../src/app/dashboard/profile/page.tsx:18) в JSDoc указан путь `apiClient.patch('/api/v1/profile/theme')` — с префиксом `/api/v1`, что нарушает [`api-paths.md`](../../.roo/rules/api-paths.md). Фактический код в строке 163 корректен (`'/profile/theme'`), но JSDoc вводит в заблуждение.

**Чек-лист:**
- [ ] В JSDoc [`page.tsx`](../../src/app/dashboard/profile/page.tsx:1) заменить `/api/v1/profile/theme` → `/profile/theme` (относительный путь)
- [ ] Проверить все JSDoc-аннотации на отсутствие `/api/v1` префикса в путях apiClient

---

## Матрица AC → Задачи (обновлённая)

| AC ID | Описание | Связанные задачи | Статус |
|-------|----------|------------------|--------|
| AC-1.1 | Отображение профиля | T3-REGISTRATION-DATE (дата), остальные ✅ DONE | ⚠️ PARTIAL |
| AC-1.2 | Редирект неавторизованного | T2-REDIRECT-FIX | ⚠️ PARTIAL |
| AC-1.3 | Автосоздание профиля | ✅ DONE (service.getUserProfile → findOrCreateWithUser) | ✅ |
| AC-1.4 | Email read-only | ✅ DONE (ProfileCard отображает email из User) | ✅ |
| AC-1.5 | Индикатор загрузки | ✅ DONE (isLoading state) | ✅ |
| AC-1.6 | Сетевая ошибка | T5-RETRY-BUTTON (кнопка повтора) | ⚠️ PARTIAL |
| AC-1.7 | Медленная сеть | ✅ DONE (isLoading продолжается) | ✅ |
| EC-7 | Пустые поля → «—» | T4-EMPTY-FIELDS | ⚠️ PARTIAL |

---

## Чек-лист валидации перед передачей в Code-режим

- [x] План включает все слои архитектуры (большинство уже DONE)
- [x] Задачи декомпозированы и имеют чёткие чек-листы
- [x] Матрица AC → Задачи заполнена
- [x] Проверено существование реализации (аудит проведён)
- [x] План следует шаблону `docs/templates/us-realization-plan.md`

---

## История изменений

| Версия | Дата | Автор | Изменение |
|--------|------|-------|-----------|
| 1.0 | 2026-07-12 | Архитектор | Создание плана реализации |
| 2.0 | 2026-07-12 | Архитектор | Аудит существующей реализации; план переориентирован на устранение gap вместо создания с нуля |
