# План реализации: US-03 — Контроль доступа к функциям приложения на основе роли

## Метаданные

| Параметр | Значение |
|----------|----------|
| **US-ID** | US-03 |
| **Название** | Контроль доступа к функциям приложения на основе роли |
| **Версия** | 1.0 |
| **Дата** | 2026-07-12 |
| **Статус** | [IN PROGRESS] |

## Ссылки

- **User Story:** [`docs/user-stories/US-03-контроль-доступа-к-функциям-приложения-на-основе-роли.md`](../docs/user-stories/US-03-контроль-доступа-к-функциям-приложения-на-основе-роли.md)
- **Требование:** [`docs/requirements/REQ-ROLES-001.md`](../docs/requirements/REQ-ROLES-001.md)
- **Модель данных:** [`docs/model/entities/api-endpoint.md`](./docs/model/entities/api-endpoint.md), [`docs/model/entities/role-api-endpoint.md`](./docs/model/entities/role-api-endpoint.md)

## Дерево файлов

| Файл | Действие | Описание |
|------|----------|----------|
| `src/domains/roles/access.service.ts` | ✅ Реализован | `canAccessApi()`, `resolveEndpoint()` уже есть |
| `src/shared/utils/path-matcher.ts` | ✅ Реализован | Сопоставление путей с `:param` |
| `src/domains/roles/with-role-guard.ts` | 🆕 Создать | Обёртка для защиты API Route Handlers |
| `src/app/api/v1/members/route.ts` | 🔄 Обновить | Добавить `withRoleGuard()` |
| `src/app/api/v1/plots/route.ts` | 🔄 Обновить | Добавить `withRoleGuard()` |
| `src/app/api/v1/roles/route.ts` | 🔄 Обновить | Добавить `withRoleGuard()` |
| `tests/e2e/roles/role-guard.e2e.spec.ts` | 🆕 Создать | E2E тесты для проверки доступа |
| `tests/integration/roles/access-service.test.ts` | 🆕 Создать | Unit тесты для AccessService |

## Задачи по слоям

### 1. Модель данных (Model Layer)

| ID | Статус | Задача |
|----|--------|--------|
| US-03-T1-DB | [DONE] | Модель `ApiEndpoint`, `RoleApiEndpoint`, `Page`, `Role` уже существует |

### 2. Repository Layer

| ID | Статус | Задача |
|----|--------|--------|
| US-03-T2-REPO | [DONE] | Реестры `IApiEndpointRepository`, `IRoleApiEndpointRepository`, `IRoleRepository` уже существуют |

### 3. Service Layer

| ID | Статус | Задача |
|----|--------|--------|
| US-03-T3-SERVICE | [DONE] | `AccessService.canAccessApi()`, `resolveEndpoint()` уже реализованы |

### 4. Middleware/Guard Layer

| ID | Статус | Задача |
|----|--------|--------|
| US-03-T4-GUARD | [TODO] | Создать `withRoleGuard()` обёртку для защиты API handlers |

### 5. API Layer

| ID | Статус | Задача |
|----|--------|--------|
| US-03-T5-API-MEMBERS | [TODO] | Применить `withRoleGuard()` к `/api/v1/members` |
| US-03-T5-API-PLOTS | [TODO] | Применить `withRoleGuard()` к `/api/v1/plots` |
| US-03-T5-API-ROLES | [TODO] | Применить `withRoleGuard()` к `/api/v1/roles` |
| US-03-T5-API-OTHER | [TODO] | Применить `withRoleGuard()` к другим endpoint'ам |

### 6. Тестирование

| ID | Статус | Задача |
|----|--------|--------|
| US-03-T6-UNIT | [TODO] | Написать unit-тесты для `AccessService` |
| US-03-T7-E2E | [TODO] | Написать E2E тесты для проверки доступа |

### 7. Code Review

| ID | Статус | Задача |
|----|--------|--------|
| US-03-T8-REVIEW | [TODO] | Пройти code review по чек-листу CODE_REVIEW.md |

## Матрица AC → Задачи

| AC | Описание | Задачи |
|----|----------|--------|
| AC-1 | Проверка доступа к endpoint с access_type=role | US-03-T4-GUARD, US-03-T6-E2E |
| AC-2 | Доступ SUPER_ADMIN ко всем endpoint'ам | US-03-T4-GUARD, US-03-T6-E2E |
| AC-3 | Проверка доступа через role_api_endpoints | US-03-T4-GUARD, US-03-T6-E2E |
| AC-4 | Неавторизованный доступ к endpoint | US-03-T4-GUARD, US-03-T6-E2E |
| AC-5 | Endpoint с access_type=public доступен | US-03-T4-GUARD, US-03-T6-E2E |

## Чек-лист валидации перед передачей в Code Mode

- [ ] JSDoc-аннотации в `withRoleGuard()` полные
- [ ] JSDoc в тестовых файлах соответствует спецификации
- [ ] Все бизнес-правила из US покрыты в тестах
- [ ] Обработка ошибок соответствует спецификации
- [ ] Код соответствует чек-листу CODE_REVIEW.md

## История изменений

| Дата | Автор | Изменение |
|------|-------|-----------|
| 2026-07-12 | Code Agent | Создание плана реализации |
