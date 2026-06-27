# Prompt: Добавление нового функционального требования

> Шаблон для постановки задачи AI на добавление новой функциональности в проект snt-app.
> Заполни секции в квадратных скобках и отправь AI.

---

Мне нужно добавить новую функциональность: **[Опишите фичу кратко]**

## Исходные данные

- **Назначение:** [Краткое описание зачем это нужно]
- **Пользователи:** [Кто будет использовать: ADMIN / MEMBER / GUEST]
- **Входные данные:** [Что нужно на вход]
- **Выходные данные:** [Что должно получиться]
- **Бизнес-правила:** [Ограничения, проверки, логики]
- **Зависимости:** [Внешние библиотеки, если нужны]

---

## Инструкция для AI

Выполняй шаги ПО ПОРЯКУ, строго соблюдая правила из `.roo/rules/change-rules.md`.

---

## Этап 1: Анализ функциональных изменений

→ Выяви неточности в исходных данных
→ Предложи замечания и уточнения
→ Обсуди с пользователем перед переходом к следующему этапу

---

## Этап 2: Изменение функциональных требований

→ Подготовь изменения документов, описывающих функциональные требования
→ Определи, какие документы нуждаются в обновлении
→ Обсуди изменения фнукциональных требований
→ Внеси изменения

---

## Этап 3: Определение изменяемых компонентов

→ Подготовь список изменяемых компонентов и причину их изменения
→ Если изменение затрагивает несколько доменов — определи все затронутые спецификации

---

## Этап 3.5: Согласование

→ Представь пользователю список изменений для одобрения
→ ПЕРED переходом к спецификации дождись подтверждения

---

## Этап 4: Спецификация

→ Каждый компонент имеет индивидуальную спецификацию. Запрещено объединять описание нескольких компонентов в одной спецификации.
→ Соблюдай порядок обновления спецификаций:

### 4.1. Модель данных

- Обновить DBML спецификацию (`docs/model/<domain>.dbml`)
- Обновить MD описание (`docs/model/<domain>.md`)
- Обновить Prisma Schema (`prisma/schema.prisma`)

### 4.2. Repository слой

- Обновить спецификацию Repository компонента
- Обновить lite-спецификацию (`docs/specs-lite/repository-requirements-lite.md`)

### 4.3. Service слой

- Обновить спецификацию Service компонента (шаблон: [`spec-service-template.md`](../docs/specs/components/services/spec-service-template.md))
- Обновить lite-спецификацию (`docs/specs-lite/service-requirements-lite.md`)

### 4.4. Презентационный слой (выполняется параллельно)

> Все подэтапы выполняются параллельно. Порядок не важен.

- **4a. API Router:** обновить спецификацию + lite-спецификацию (`docs/specs-lite/api-router-requirements-lite.md`)
- **4b. WebSocket Client** (если затрагивается): обновить спецификацию + lite-спецификацию (`docs/specs-lite/websocket-client-lite.md`)
- **4c. UI:** обновить спецификацию + lite-спецификацию (`docs/specs-lite/ui-requirements-lite.md`)

---

## Этап 5: Планирование реализации

→ Проверь, что есть спецификации на все изменяемые компоненты
→ Подготовить пошаговый план реализации (TODO list) в чате ДО НАЧАЛА КОДИРОВАНИЯ

---

## Этап 6: Реализация

→ СТРОГО В СООТВЕТСТВИИ С ПЛАНОМ создавать самодокументируемый код
→ Добавить JSDoc/TSDoc аннотации для публичных функций и интерфейсов

### Реализация компонентов

- **Spec first**: НЕ НАЧИНАЙ РЕАЛИЗАЦИЮ КОМПОНЕНТА, ЕСЛИ НЕТ СПЕЦИФИКАЦИИ
- **Service слой:** бизнес-логика, валидация через Zod, доменные ошибки
- **Repository слой:** интерфейс, Prisma реализация, транзакции
- **API Router:** валидация, Authorization, ApiResponse формат
- **UI компоненты:** декомпозиция по правилу 50 строк, PascalCase

---

## Этап 7: Тестирование

→ Создать Unit-тесты (Jest) для компонентов бизнес-логики (Service слой, mock Repository)
→ E2E-тесты — только для критических пользовательских сценариев
→ Проверить: `pnpm test`

---

## Этап 8: Верификация

→ Выполнить созданные тесты
→ Проверить соответствие всем чек-листам из `docs/shared/checklists.md`

---

## Ограничения

- **Clean Architecture:** API Router → Service → Repository → Prisma
- **TypeScript strict:** нет `any`, `unknown`-bypass, `ts-ignore`
- **Zod валидация:** на всех уровнях
- **Typed errors:** ValidationError, NotFoundError, ConflictError, BusinessRuleError
- **DI через конструктор:** Repository внедряется в Service
- **Repository абстракция:** Service не знает о Prisma напрямую
- **Нет глобального mutable state**
- **Новые зависимости** — только из `docs/shared/dependencies.md`
- **Новые чек-листы** — только в `docs/shared/checklists.md`
- **История изменений** — только в `docs/CHANGELOG.md`
- **Правило 50 строк:** функция-компонент не должна превышать 50 строк

---

## Ссылки для справки

| Что | Где |
|-----|-----|
| Навигация по документации | [`docs/quick-reference.md`](docs/quick-reference.md) |
| Архитектура (кратко) | [`docs/context-segments/01-architecture.md`](docs/context-segments/01-architecture.md) |
| Модель данных (кратко) | [`docs/context-segments/02-database.md`](docs/context-segments/02-database.md) |
| Безопасность (кратко) | [`docs/context-segments/03-auth-security.md`](docs/context-segments/03-auth-security.md) |
| Паттерны компонентов (кратко) | [`docs/context-segments/04-component-patterns.md`](docs/context-segments/04-component-patterns.md) |
| API паттерны (кратко) | [`docs/context-segments/05-api-patterns.md`](docs/context-segments/05-api-patterns.md) |
| WebSocket (кратко) | [`docs/context-segments/06-websocket.md`](docs/context-segments/06-websocket.md) |
| Управление изменениями спецификаций | [`docs/specs/spec-change-management.md`](docs/specs/spec-change-management.md) |
| Порядок внесения изменений | [`.roo/rules/change-rules.md`](.roo/rules/change-rules.md) |
| Чек-листы | [`docs/shared/checklists.md`](docs/shared/checklists.md) |
| Разрешённые зависимости | [`docs/shared/dependencies.md`](docs/shared/dependencies.md) |
| **Lite-спецификации (Repository)** | [`docs/specs-lite/repository-requirements-lite.md`](docs/specs-lite/repository-requirements-lite.md) |
| **Lite-спецификации (Service)** | [`docs/specs-lite/service-requirements-lite.md`](docs/specs-lite/service-requirements-lite.md) |
| **Lite-спецификации (API Router)** | [`docs/specs-lite/api-router-requirements-lite.md`](docs/specs-lite/api-router-requirements-lite.md) |
| **Lite-спецификации (WebSocket)** | [`docs/specs-lite/websocket-client-lite.md`](docs/specs-lite/websocket-client-lite.md) |
| **Lite-спецификации (UI)** | [`docs/specs-lite/ui-requirements-lite.md`](docs/specs-lite/ui-requirements-lite.md) |
| **Шаблон Service спецификации** | [`docs/specs/components/services/spec-service-template.md`](docs/specs/components/services/spec-service-template.md) |
