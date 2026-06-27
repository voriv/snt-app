# Анализ размера контекста документации для AI

> Дата последней оптимизации: 2026-06-25 (Фаза 5 завершена)

## 1. Текущее состояние (после оптимизации Фаза 1+2+3+4+5)

### 1.1 Реестр файлов документации

| Файл | Строк | Размер |
|------|-------|--------|
| **Навигация** | | |
| `quick-reference.md` | 83 | ~6 KB |
| `CHANGELOG.md` | 22 | ~2 KB |
| **Контекстные сегменты** | | |
| `context-segments/README.md` | 28 | ~2 KB |
| `context-segments/01-architecture.md` | ~115 | ~5 KB |
| `context-segments/02-database.md` | ~130 | ~6 KB |
| `context-segments/03-auth-security.md` | ~105 | ~5 KB |
| `context-segments/04-component-patterns.md` | ~135 | ~7 KB |
| `context-segments/05-api-patterns.md` | ~120 | ~6 KB |
| `context-segments/06-websocket.md` | ~90 | ~4 KB |
| `context-segments/07-monitoring.md` | ~105 | ~5 KB |
| `context-segments/08-file-storage.md` | ~95 | ~5 KB |
| **Lite спецификации** | | |
| `specs-lite/README.md` | ~30 | ~2 KB |
| `specs-lite/service-requirements-lite.md` | ~100 | ~5 KB |
| `specs-lite/api-router-requirements-lite.md` | ~100 | ~5 KB |
| `specs-lite/websocket-client-lite.md` | ~80 | ~4 KB |
| `specs-lite/ui-requirements-lite.md` | ~65 | ~3 KB |
| `specs-lite/repository-requirements-lite.md` | ~75 | ~4 KB |
| **Архитектура** | | |
| `architecture/ARCHITECTURE.md` | 554 | ~21 KB |
| `architecture/fr-rules.md` | 117 | ~8 KB |
| `architecture/structure/00-README.md` | 29 | ~2 KB |
| `architecture/structure/01-architecture.md` | 62 | ~2 KB |
| `architecture/structure/02-directories.md` | 136 | ~5 KB |
| `architecture/structure/03-components-lib.md` | 119 | ~7 KB |
| `architecture/structure/04-database-core.md` | 180 | ~5 KB |
| `architecture/structure/05-database-social.md` | 253 | ~7 KB |
| `architecture/structure/06-websocket-config.md` | 242 | ~7 KB |
| **Спецификации компонентов** | | |
| `specs/components/README.md` | 39 | ~2 KB |
| `specs/components/component-requirements.md` | 381 | ~19 KB |
| `specs/components/ui/ui-component-requirements.md` | 247 | ~15 KB |
| `specs/components/services/service-component-requirements.md` | 741 | ~35 KB |
| `specs/components/api-routers/api-router-requirements.md` | 692 | ~26 KB |
| `specs/components/repositories/repository-component-requirements.md` | 239 | ~14 KB |
| `specs/components/websocket-client.md` | 553 | ~17 KB |
| **Общие спецификации** | | |
| `specs/auth.md` | 327 | ~12 KB |
| `specs/file-storage.md` | 298 | ~14 KB |
| `specs/logging-monitoring.md` | 404 | ~12 KB |
| `specs/component-spec-requirements.md` | 284 | ~11 KB |
| `specs/component-types-classification.md` | 166 | ~12 KB |
| `specs/spec-change-management.md` | 260 | ~17 KB |
| `specs/ui-state-persistence.md` | 175 | ~9 KB |
| **Общие справочники** | | |
| `shared/checklists.md` | 84 | ~5 KB |
| `shared/dependencies.md` | 28 | ~2 KB |
| **Концепт** | | |
| `concept.md` | 23 | ~1 KB |
| **Требования** | | |
| `requirements/fr-change-management.md` | 247 | ~20 KB |
| **ВСЕГО** | **~7,928 строк** | **~349 KB** |

### 1.2 Эквивалент для AI context window

| Метрика | Значение |
|---------|----------|
| Всего строк markdown | ~7,928 |
| Типичный AI-контекст (quick-reference) | **83 строки** |
| Типичный AI-контекст (quick-ref + 1 сегмент) | **~180-220 строк** |
| Типичный AI-контекст (quick-ref + 2-3 сегмента) | **~300-400 строк** |
| Все сегменты (без полных спецификаций) | **~780 строк** |
| Примерно токенов (полный) | ~100-120K токенов |
| Использовано context window (GPT-4-128K, полный) | ~78-94% |
| Использовано context window (GPT-4-128K, сегменты) | ~6-8% |
| Использовано context window (Claude Haiku 200K, полный) | ~50-60% |

---

## 2. Проблемные зоны (контекстный жир)

### 2.1 Критические дубликаты

| # | Дубликат | Где | Где вместо этого | Экономия |
|---|----------|-----|-------------------|----------|
| 1 | **Полный Prisma Schema** | [`ARCHITECTURE.md:627-1048`](docs/architecture/ARCHITECTURE.md:627) | [`prisma/schema.prisma`](prisma/schema.prisma) | **~420 строк** |
| 2 | **WebSocket Protocol таблица** | [`ARCHITECTURE.md:1050-1058`](docs/architecture/ARCHITECTURE.md:1050) | [`06-websocket-config.md:47-63`](docs/architecture/structure/06-websocket-config.md:47) | **~8 строк** |
| 3 | **Пример теста (853-854)** | [`service-component-requirements.md:782-854`](docs/specs/components/services/service-component-requirements.md:782) | Можно сократить до 10 строк | **~70 строк** |
| 4 | **Полный пример PlotService** | [`service-component-requirements.md:972-1181`](docs/specs/components/services/service-component-requirements.md:972) | Ссылка на паттерн | **~210 строк** |

### 2.2 Избыточные примеры кода

| Файл | Раздел | Строк | Проблема |
|------|--------|-------|----------|
| [`service-component-requirements.md`](docs/specs/components/services/service-component-requirements.md) | Раздел 12 (полный пример) | ~210 | Весь сервис с import, Zod схемами, factory |
| [`service-component-requirements.md`](docs/specs/components/services/service-component-requirements.md) | Раздел 8.3 (пример теста) | ~72 | Детальный тест с mock |
| [`api-router-requirements.md`](docs/specs/components/api-routers/api-router-requirements.md) | Раздел 13 (2 полных примера) | ~195 | Полный GET + POST endpoint |
| [`component-spec-requirements.md`](docs/specs/components/component-spec-requirements.md) | Раздел 2 (API примеры) | ~48 | cURL + Request/Response примеры |
| [`component-spec-requirements.md`](docs/specs/components/component-spec-requirements.md) | Раздел 3 (Service примеры) | ~73 | CRUD примеры |
| [`component-spec-requirements.md`](docs/specs/components/component-spec-requirements.md) | Раздел 4 (Repository примеры) | ~48 | findMany/create/update примеры |

**Итого избыточного кода: ~600 строк**

### 2.3 Повторяющиеся шаблоны

| Шаблон | Где повторяется | Можно заменить |
|--------|-----------------|----------------|
| JSDoc шаблон для функции | [`component-requirements.md:279-345`](docs/specs/components/component-requirements.md:279), [`service-component-requirements.md:874-918`](docs/specs/components/services/service-component-requirements.md:874), [`component-spec-requirements.md:306-333`](docs/specs/components/component-spec-requirements.md:306) | Единый справочный документ |
| Чек-лист качества | Практически в каждой спецификации | Единый файл `checklists.md` |
| История изменений | В каждом файле | Единая таблица в index |
| "Разрешённые/Запрещённые зависимости" | component, service, api-router, repository | Единый файл `dependencies.md` |

**Итого повторяющегося: ~300 строк**

---

## 3. Варианты уменьшения контекста

### Вариант A: Удаление дубликатов (рекомендуется)

| Действие | Экономия | Риск |
|----------|----------|------|
| Убрать раздел "Appendix A. PRISM Schema" из ARCHITECTURE.md | ~420 строк | Низкий — schema есть в `prisma/schema.prisma` |
| Убрать дубликат WebSocket Protocol из Appendix B | ~8 строк | Низкий |
| **Итого** | **~428 строк (~5.4%)** | |

### Вариант B: Сжатие примеров кода (высокий приоритет)

| Действие | Экономия | Риск |
|----------|----------|------|
| Сократить полный пример PlotService до 30-строчного сниппета | ~180 строк | Средний — нужно сохранить ключевые паттерны |
| Сократить пример теста до 15 строк | ~57 строк | Низкий |
| Сжать 2 полных примера API Router | ~140 строк | Средний |
| Убрать избыточные API примеры из component-spec-requirements | ~120 строк | Низкий |
| **Итого** | **~497 строк (~6.3%)** | |

### Вариант C: Создание "Quick Reference" файла (оптимально)

Создать один индексный файл (~100-150 строк), который содержит:
- Ключевые архитектурные решения
- Структуру проекта
- Основные паттерны (кратко)
- Ссылки на полные спецификации

**Эффект:**
- AI может прочитать только Quick Reference для общих вопросов
- Полные спецификации читаются только когда нужны детали
- Сокращение контекста при типичных запросах: **~60-70%**

### Вариант D: Создание системы контекстных сегментов

```
docs/
├── quick-reference.md              (~100 строк) - ЧИТАТЬ ПЕРВЫМ
├── context-segments/
│   ├── 01-architecture.md          (~100 строк) - Архитектура кратко
│   ├── 02-database.md              (~150 строк) - Модель данных
│   ├── 03-auth-security.md         (~100 строк) - Аутентификация
│   ├── 04-component-patterns.md    (~150 строк) - Паттерны компонентов
│   ├── 05-api-patterns.md          (~100 строк) - API паттерны
│   └── 06-websocket.md             (~100 строк) - WebSocket
└── detailed-specs/                 - Читать ТОЛЬКО по запросу
    ├── components/
    ├── auth.md
    ├── file-storage.md
    └── logging-monitoring.md
```

**Эффект:**
- Базовый контекст: ~100 строк (quick-reference)
- Один сегмент: ~100-150 строк
- Полный контекст: только когда явно нужно
- Сокращение типичного контекста: **~85-90%**

### Вариант E: Удаление историй изменений

| Действие | Экономия |
|----------|----------|
| Убрать "История изменений" из каждого файла (в среднем 5 строк × 21 файл) | ~105 строк |

---

## 4. Рекомендуемая стратегия

### Фаза 1: Немедленные действия (0 риска)

1. **Удалить Appendix A (Prisma Schema) из ARCHITECTURE.md**
   - Экономия: ~420 строк
   - AI прочитает `prisma/schema.prisma` когда нужен schema
   - Обновить ARCHITECTURE.md ссылкой: `📄 Полный schema: [prisma/schema.prisma](prisma/schema.prisma)`

2. **Создать `docs/quick-reference.md`** (~100 строк)
   - Ключевые решения: REST API, PostgreSQL bytea, Pino, JWT 1h
   - Структура проекта (кратко)
   - 19 сущностей (списком без schema)
   - Ссылки на полные документы

### Фаза 2: Оптимизация примеров (средний риск)

3. **Сжать полный пример PlotService** в [`service-component-requirements.md`](docs/specs/components/services/service-component-requirements.md:972)
   - Оставить только ключевые 30-40 строк
   - Полный пример перенести в `docs/examples/plot-service-example.ts`

4. **Сжать API Router примеры** в [`api-router-requirements.md`](docs/specs/components/api-routers/api-router-requirements.md:918)
   - Оставить только minimal working example
   - Полные примеры перенести в `docs/examples/`

### Фаза 3: Реорганизация (долгосрочно)

5. **Переход на систему контекстных сегментов** (Вариант D)
   - Постепенный перенос спецификаций
   - Создание quick-reference

---

## 5. Результаты оптимизации

### 5.1 Фаза 1+2 — ВЫПОЛНЕНО

| # | Изменение | Файл | Экономия |
|---|----------|------|----------|
| 1 | Удалён Appendix A (полный Prisma Schema) | [`ARCHITECTURE.md`](architecture/ARCHITECTURE.md) | ~420 строк |
| 2 | Сжат Appendix B (WebSocket Protocol) | [`ARCHITECTURE.md`](architecture/ARCHITECTURE.md) | ~4 строки |
| 3 | Сжат пример теста (72→15 строк) | [`service-component-requirements.md`](specs/components/services/service-component-requirements.md) | ~57 строк |
| 4 | Сжат полный пример PlotService (210→40 строк) | [`service-component-requirements.md`](specs/components/services/service-component-requirements.md) | ~170 строк |
| 5 | Сжаты примеры GET/POST API Router (195→55 строк) | [`api-router-requirements.md`](specs/components/api-routers/api-router-requirements.md) | ~140 строк |
| 6 | Сжаты шаблоны API/Service/Repository примеров | [`component-spec-requirements.md`](specs/component-spec-requirements.md) | ~90 строк |

### 5.2 Фаза 3 — ВЫПОЛНЕНО

| # | Изменение | Файл | Экономия |
|---|----------|------|----------|
| 7 | Создан `quick-reference.md` — навигационная карта | [`quick-reference.md`](quick-reference.md) | Новый: 67 строк |
| 8 | Создан `shared/checklists.md` — консолидированные чек-листы | [`shared/checklists.md`](shared/checklists.md) | Новый: 84 строк |
| 9 | Создан `shared/dependencies.md` — консолидированные зависимости | [`shared/dependencies.md`](shared/dependencies.md) | Новый: 28 строк |
| 10 | Создан `CHANGELOG.md` — единая история изменений | [`CHANGELOG.md`](CHANGELOG.md) | Новый: 16 строк |
| 11 | Чек-листы заменены на ссылки в 7 файлах | auth, logging, file-storage, websocket-client, component-req, service-req, repository-req | ~180 строк |
| 12 | Зависимости заменены на ссылки в 4 файлах | component-req, service-req, api-router-req, ui-req | ~80 строк |
| 13 | Истории изменений заменены на ссылки в 8 файлах | Все спецификации | ~56 строк |

### 5.3 Фаза 4 — ВЫПОЛНЕНО

| # | Изменение | Файл | Объём |
|---|----------|------|-------|
| 14 | Создан `context-segments/README.md` — навигация по сегментам | [`context-segments/README.md`](context-segments/README.md) | Новый: 28 строк |
| 15 | Создан `01-architecture.md` — архитектура кратко | [`01-architecture.md`](context-segments/01-architecture.md) | Новый: ~115 строк |
| 16 | Создан `02-database.md` — модель данных кратко | [`02-database.md`](context-segments/02-database.md) | Новый: ~130 строк |
| 17 | Создан `03-auth-security.md` — аутентификация и безопасность | [`03-auth-security.md`](context-segments/03-auth-security.md) | Новый: ~105 строк |
| 18 | Создан `04-component-patterns.md` — паттерны компонентов | [`04-component-patterns.md`](context-segments/04-component-patterns.md) | Новый: ~135 строк |
| 19 | Создан `05-api-patterns.md` — API паттерны | [`05-api-patterns.md`](context-segments/05-api-patterns.md) | Новый: ~120 строк |
| 20 | Создан `06-websocket.md` — WebSocket кратко | [`06-websocket.md`](context-segments/06-websocket.md) | Новый: ~90 строк |
| 21 | Обновлён `quick-reference.md` — навигация по сегментам | [`quick-reference.md`](quick-reference.md) | 67→83 строк |
| 22 | Обновлён `CHANGELOG.md` — запись о Фазе 4 | [`CHANGELOG.md`](CHANGELOG.md) | +3 строки |

### 5.4 Фаза 5 — ВЫПОЛНЕНО

| # | Изменение | Файл | Объём |
|---|----------|------|-------|
| 23 | Создан `07-monitoring.md` — логирование и мониторинг кратко | [`07-monitoring.md`](context-segments/07-monitoring.md) | Новый: ~105 строк |
| 24 | Создан `08-file-storage.md` — файловое хранилище кратко | [`08-file-storage.md`](context-segments/08-file-storage.md) | Новый: ~95 строк |
| 25 | Создан `specs-lite/` — lite версии спецификаций компонентов | [`specs-lite/README.md`](specs-lite/README.md) | 5 файлов, ~450 строк суммарно |
| 26 | Обновлён `file-storage.md` — удалён дубликат Prisma Schema | [`file-storage.md`](specs/file-storage.md) | ~70 строк |
| 27 | Обновлён `quick-reference.md` — навигация по lite-версиям | [`quick-reference.md`](quick-reference.md) | +20 строк |
| 28 | Обновлён `context-segments/README.md` — добавлены новые сегменты | [`context-segments/README.md`](context-segments/README.md) | +10 строк |

### 5.6 Фаза 6 — УДАЛЕНИЕ МЕТАДАННЫХ — ВЫПОЛНЕНО

| # | Изменение | Файл | Объём |
|---|----------|------|-------|
| 29 | Удалён блок «Метаданные» (YAML table, ~12 строк) | [`component-requirements.md`](specs/components/component-requirements.md) | ~12 строк |
| 30 | Удалён блок «Метаданные» (YAML table, ~12 строк) | [`service-component-requirements.md`](specs/components/services/service-component-requirements.md) | ~12 строк |
| 31 | Удалён блок «Метаданные» (YAML table, ~12 строк) | [`api-router-requirements.md`](specs/components/api-routers/api-router-requirements.md) | ~12 строк |
| 32 | Удалён блок «Метаданные» (YAML table, ~12 строк) | [`ui-component-requirements.md`](specs/components/ui/ui-component-requirements.md) | ~12 строк |
| 33 | Удалён блок «Метаданные» (YAML table, ~12 строк) | [`repository-component-requirements.md`](specs/components/repositories/repository-component-requirements.md) | ~12 строк |
| 34 | Удалён блок «Метаданные» (table, ~10 строк) | [`websocket-client.md`](specs/components/websocket-client.md) | ~10 строк |
| 35 | Удалён блок «Метаданные» (table, ~10 строк) | [`auth.md`](specs/auth.md) | ~10 строк |
| 36 | Удалён блок «Метаданные» (table, ~10 строк) | [`file-storage.md`](specs/file-storage.md) | ~10 строк |
| 37 | Удалён блок «Метаданные» (table, ~10 строк) | [`logging-monitoring.md`](specs/logging-monitoring.md) | ~10 строк |
| 38 | Удалён блок «Метаданные» (YAML table, ~16 строк) | [`spec-api-router-template.md`](specs/components/api-routers/spec-api-router-template.md) | ~16 строк |
| 39 | Удалён блок «Метаданные» (YAML table, ~16 строк) | [`spec-service-template.md`](specs/components/services/spec-service-template.md) | ~16 строк |
| 40 | Обновлён `CHANGELOG.md` — запись о Фазе 6 | [`CHANGELOG.md`](CHANGELOG.md) | +1 строка |

**Итого удалено: ~136 строк дублируемых метаданных**

### 5.7 Итоговая экономия (все фазы)

| Метрика | До (изначально) | После Фазы 1+2 | После Фазы 3 | После Фазы 4 | После Фазы 5 | Итого |
|---------|----------------|----------------|--------------|--------------|-------------|-------|
| Всего строк | ~7,936 | ~7,050 | ~7,192 | ~7,928* | **~8,378** | **+442 строки (новые сегменты)** |
| Типичный AI-контекст | ~7,936 | ~7,050 | 67 строк | **83 строки** (quick-ref) | **83 строки** (quick-ref) | **99.0%** экономия |
| Расширенный контекст (1 тема) | — | ~7,050 | ~1,500 | **~200 строк** (quick-ref + сегмент) | **~190 строк** (lite) | **~98%** экономия |
| Расширенный контекст (2-3 темы) | — | ~7,050 | ~3,000 | **~350 строк** (quick-ref + 2-3 сегмента) | **~290 строк** (lite) | **~96%** экономия |
| Использование GPT-4-128K | 78-98% | 69-86% | <1% | **<1%** (типичный) / **6-8%** (сегменты) | **<1%** (типичный) / **~2-4%** (lite) | **-74-98%** |

> \* Фаза 4-5 увеличила общий объём документации за счёт новых сегментов и lite-версий, но кардинально снизила контекст, необходимый AI для конкретных задач.

---

## 6. Дополнительные рекомендации

### 6.1 Поддержание оптимизации

- Автоматизировать проверку дубликатов при PR
- Запретить вставку полного Prisma Schema в markdown файлы
- История изменений — только в [`CHANGELOG.md`](CHANGELOG.md)
- Новые зависимости — только в [`shared/dependencies.md`](shared/dependencies.md)
- Новые чек-листы — только в [`shared/checklists.md`](shared/checklists.md)

### 6.2 AI-френдли структура (текущая — после Фазы 5)

```
docs/
├── quick-reference.md              ← AI читает ПЕРВЫМ (83 строки)
├── context-segments/               ← По запросу (~100-150 строк каждый)
│   ├── README.md                   Навигация по сегментам
│   ├── 01-architecture.md          Стек, структура, конфигурация
│   ├── 02-database.md              19 сущностей, связи, индексы
│   ├── 03-auth-security.md         JWT, RBAC, WebSocket auth, защита
│   ├── 04-component-patterns.md    Service, Repository, DI, ошибки
│   ├── 05-api-patterns.md          Route структура, ApiResponse, пагинация
│   ├── 06-websocket.md             Протокол, handlers, rooms, events
│   ├── 07-monitoring.md            Логирование, мониторинг, health check
│   └── 08-file-storage.md          Файловое хранилище bytea
├── specs-lite/                     ← Lite-версии спецификаций (~65-100 строк)
│   ├── README.md                   Навигация по lite-версиям
│   ├── service-requirements-lite.md    Паттерны сервисов
│   ├── api-router-requirements-lite.md API Router паттерны
│   ├── websocket-client-lite.md      WS Client паттерны
│   ├── ui-requirements-lite.md       UI компоненты паттерны
│   └── repository-requirements-lite.md Repository паттерны
├── CHANGELOG.md                     ← Единая история изменений
├── shared/                          ← Общие справочники
│   ├── checklists.md               Все чек-листы
│   └── dependencies.md             Все зависимости
├── architecture/                    ← Архитектурные решения (полные)
│   ├── ARCHITECTURE.md             Полная архитектура
│   ├── fr-rules.md                 Правила ФТ
│   └── structure/                  Детальные планы
├── specs/                           ← Спецификации (только по явному запросу)
│   ├── components/                 Требования к компонентам
│   ├── auth.md, file-storage.md    Доменные спецификации
│   └── ...
├── requirements/                    ← Функциональные требования
└── concept.md                      ← Концепция приложения
```

### 6.3 Рекомендация по использованию AI

| Сценарий | Что читать | Контекст |
|----------|-----------|----------|
| Общий вопрос о проекте | `quick-reference.md` | ~83 строки |
| Вопрос по архитектуре | quick-ref + `01-architecture.md` | ~200 строк |
| Вопрос по модели данных | quick-ref + `02-database.md` | ~210 строк |
| Вопрос по безопасности | quick-ref + `03-auth-security.md` | ~190 строк |
| Разработка компонента | quick-ref + `04-component-patterns.md` | ~220 строк |
| Разработка API | quick-ref + `05-api-patterns.md` | ~200 строк |
| Работа с WebSocket | quick-ref + `06-websocket.md` | ~170 строк |
| Мониторинг и логи | quick-ref + `07-monitoring.md` | ~190 строк |
| Файловое хранилище | quick-ref + `08-file-storage.md` | ~180 строк |
| Разработка сервиса (lite) | quick-ref + `service-requirements-lite.md` | ~185 строк |
| Разработка API Router (lite) | quick-ref + `api-router-requirements-lite.md` | ~185 строк |
| Комплексная задача | quick-ref + 2-3 сегмента | ~350 строк |
| Lite-разработка | quick-ref + 1 lite-версия | **~190 строк** |
| Детальная спецификация | lite + полный документ | ~400-800 строк |
