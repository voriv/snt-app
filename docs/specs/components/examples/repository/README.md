# Пример: Repository (паттерн доступа к данным)

Пример демонстрирует стандартный паттерн Repository в архитектуре проекта `snt-app`.

## Архитектурные слои

```
┌─────────────────────────────────┐
│ plot.repository.interface.ts    │  ← Интерфейс (абстракция)
├─────────────────────────────────┤
│ plot.repository.ts              │  ← Реализация (Prisma ORM)
├─────────────────────────────────┤
│ plot.repository.errors.ts       │  ← Доменные ошибки репозитория
└─────────────────────────────────┘
```

## Ключевые паттерны

| Паттерн | Реализация |
|---------|-----------|
| **Интерфейс отдельно от реализации** | `PlotRepository` (интерфейс) vs `PrismaPlotRepository` (реализация) |
| **Error mapping** | Коды Prisma (P2002, P2025) → доменные ошибки |
| **Try/catch обёртка** | Каждый метод БД обёрнут в try/catch |
| **Типизированные ошибки** | `RepositoryError`, `NotFoundError`, `ConflictError` |
| **JSDoc** | Все методы интерфейса документированы |

## Связанные спецификации

- [`repository-component-requirements.md`](../../repositories/repository-component-requirements.md)

## Связь с другими примерами

- Сервис [`service-crud`](../service-crud/) импортирует интерфейс из этого примера