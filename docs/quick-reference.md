# Quick Reference — Навигация по документации

> 📌 **AI: читай этот файл первым.** Остальная документация — по ссылке при необходимости.

---

## Подход к контексту

Документация организована по принципу **от общего к частному**:
1. Этот файл — навигационная карта (~80 строк)
2. Контекстные сегменты — выжимка по теме (~100-150 строк каждый)
3. Полные спецификации — только когда нужны детали
4. Исходный код — финальный источник истины

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
│   └── 06-websocket.md         Протокол, handlers, rooms, events
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

| Что нужно | Сегмент | Полный документ |
|-----------|---------|-----------------|
| Стек, структура, конфигурация | [`01-architecture.md`](context-segments/01-architecture.md) | [`ARCHITECTURE.md`](architecture/ARCHITECTURE.md) |
| Модель данных, сущности | [`02-database.md`](context-segments/02-database.md) | [`04-database-core.md`](architecture/structure/04-database-core.md), [`05-database-social.md`](architecture/structure/05-database-social.md) |
| Аутентификация, JWT, RBAC | [`03-auth-security.md`](context-segments/03-auth-security.md) | [`auth.md`](specs/auth.md) |
| Service, Repository, DI | [`04-component-patterns.md`](context-segments/04-component-patterns.md) | [`component-requirements.md`](specs/components/component-requirements.md) |
| API, endpoints, ApiResponse | [`05-api-patterns.md`](context-segments/05-api-patterns.md) | [`api-router-requirements.md`](specs/components/api-routers/api-router-requirements.md) |
| WebSocket, чаты, уведомления | [`06-websocket.md`](context-segments/06-websocket.md) | [`06-websocket-config.md`](architecture/structure/06-websocket-config.md) |
| Чек-лист качества | — | [`shared/checklists.md`](shared/checklists.md) |
| Разрешённые/запрещённые зависимости | — | [`shared/dependencies.md`](shared/dependencies.md) |
| История изменений | — | [`CHANGELOG.md`](CHANGELOG.md) |

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