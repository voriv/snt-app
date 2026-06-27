# Quick Reference — Навигация по документации

> 📌 **AI: читай этот файл первым.** Остальная документация — по ссылке при необходимости.

---

## Подход к контексту

Документация организована по принципу **от общего к частному**:
1. Этот файл — навигационная карта (~110 строк)
2. Контекстные сегменты — выжимка по теме (~100-150 строк каждый)
3. Lite спецификации — ключевые паттерны без деталей (~65-100 строк каждый)
4. Полные спецификации — только когда нужны детали
5. Исходный код — финальный источник истины

---

## Структура документации

```
docs/
├── quick-reference.md          ← Вы здесь
├── context-segments/           ← Выжимки по темам (~100-150 строк каждый)
│   ├── 01-architecture.md      Стек, структура, конфигурация
│   ├── 02-database.md          19 сущностей, связи, индексы
│   ├── 03-auth-security.md     JWT, RBAC, WebSocket auth, защита
│   ├── 04-component-patterns.md Service, Repository, DI, ошибки
│   ├── 05-api-patterns.md      Route структура, ApiResponse, пагинация
│   ├── 06-websocket.md         Протокол, handlers, rooms, events
│   ├── 07-monitoring.md        Pino, PM2, логирование, алерты
│   └── 08-file-storage.md      bytea, MIME, валидация, бэкап
├── specs-lite/                 ← Сокращённые спецификации (~65-100 строк каждый)
│   ├── service-requirements-lite.md       Service паттерны
│   ├── api-router-requirements-lite.md    API Router паттерны
│   ├── websocket-client-lite.md           WS Client паттерны
│   ├── ui-requirements-lite.md            UI компоненты паттерны
│   └── repository-requirements-lite.md    Repository паттерны
├── CHANGELOG.md                ← Единая история изменений
├── architecture/               ← Архитектурные решения (полные)
│   ├── ARCHITECTURE.md         Полная архитектура
│   ├── fr-rules.md             Правила функциональных требований
│   └── structure/              Детальные планы по компонентам
├── specs/                      ← Спецификации (полные)
│   ├── auth.md                 Аутентификация и авторизация
│   ├── file-storage.md         Хранение файлов
│   ├── logging-monitoring.md   Логирование и мониторинг
│   ├── component-spec-requirements.md   Требования к спецификациям
│   ├── component-types-classification.md Классификация компонентов
│   ├── spec-change-management.md        Управление изменениями спецификаций
│   ├── ui-state-persistence.md          Сохранение состояния UI
│   └── components/             Требования по типам компонентов
│       ├── component-requirements.md     Общие требования
│       ├── ui/                 UI-компоненты
│       ├── services/           Service-слой
│       ├── api-routers/        API Router-ы
│       ├── repositories/       Repository-слой
│       └── websocket-client.md WebSocket-клиент
├── shared/                     ← Общие справочники
│   ├── checklists.md           Чек-листы качества
│   └── dependencies.md         Разрешённые/запрещённые зависимости
└── requirements/               Функциональные требования
```

---

## Где искать

| Что нужно | Сегмент | Lite | Полный документ |
|-----------|---------|------|-----------------|
| Стек, структура | [`01-architecture`](context-segments/01-architecture.md) | — | [`ARCHITECTURE.md`](architecture/ARCHITECTURE.md) |
| Модель данных | [`02-database`](context-segments/02-database.md) | — | [`04-database-core.md`](architecture/structure/04-database-core.md) |
| Аутентификация | [`03-auth-security`](context-segments/03-auth-security.md) | — | [`auth.md`](specs/auth.md) |
| Service паттерны | [`04-component-patterns`](context-segments/04-component-patterns.md) | [`service-lite`](specs-lite/service-requirements-lite.md) | [`service-requirements.md`](specs/components/services/service-component-requirements.md) |
| API паттерны | [`05-api-patterns`](context-segments/05-api-patterns.md) | [`api-router-lite`](specs-lite/api-router-requirements-lite.md) | [`api-router-requirements.md`](specs/components/api-routers/api-router-requirements.md) |
| WebSocket | [`06-websocket`](context-segments/06-websocket.md) | [`ws-client-lite`](specs-lite/websocket-client-lite.md) | [`websocket-client.md`](specs/components/websocket-client.md) |
| Логирование | [`07-monitoring`](context-segments/07-monitoring.md) | — | [`logging-monitoring.md`](specs/logging-monitoring.md) |
| Файлы | [`08-file-storage`](context-segments/08-file-storage.md) | — | [`file-storage.md`](specs/file-storage.md) |
| UI компоненты | — | [`ui-lite`](specs-lite/ui-requirements-lite.md) | [`ui-requirements.md`](specs/components/ui/ui-component-requirements.md) |
| Repository | — | [`repo-lite`](specs-lite/repository-requirements-lite.md) | [`repository-requirements.md`](specs/components/repositories/repository-component-requirements.md) |
| Чек-листы | — | — | [`shared/checklists.md`](shared/checklists.md) |
| Зависимости | — | — | [`shared/dependencies.md`](shared/dependencies.md) |
| История | — | — | [`CHANGELOG.md`](CHANGELOG.md) |

---

## Принципы проекта

- **Clean Architecture:** API Router → Service → Repository
- **TypeScript strict:** нет `any`, `unknown`-bypass, `ts-ignore`
- **Zod-валидация:** на всех уровнях
- **Типизированные ошибки:** DomainError вместо generic `Error`
- **DI через конструктор:** Repository внедряется в Service

---

## Команды

```bash
pnpm dev          # Next.js dev-сервер
pnpm dev:ws       # WebSocket dev-сервер
pnpm build        # Production build
pnpm db:generate  # Prisma Client
pnpm db:migrate   # Применить миграции
pnpm db:studio    # Prisma Studio