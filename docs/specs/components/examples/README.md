# Примеры компонентов

Этот каталог содержит минимальные рабочие примеры (boilerplates), демонстрирующие типовые паттерны разработки в проекте `snt-app`.

Каждый пример соответствует определённому компоненту из спецификаций и может использоваться как шаблон при создании новых функциональных модулей.

## Содержание

| Пример | Описание | Связанные спецификации |
|--------|----------|----------------------|
| [service-crud](./service-crud/) | CRUD-сервис с инъекцией зависимостей, валидацией и обработкой ошибок | [service-component-requirements.md](../services/service-component-requirements.md) |
| [repository](./repository/) | Repository паттерн: интерфейс, реализация Prisma, error mapping | [repository-component-requirements.md](../repositories/repository-component-requirements.md) |
| [api-router-auth](./api-router-auth/) | API-роутер с авторизацией, валидацией запросов и стандартизированными ответами | [api-router-requirements.md](../api-routers/api-router-requirements.md), [auth.md](../../auth.md) |
| [ui-component](./ui-component/) | UI-компонент с декомпозицией на подкомпоненты, хуками и адаптивной вёрсткой | [ui-component-requirements.md](../ui/ui-component-requirements.md), [component-requirements.md](../component-requirements.md) |

## Связи между примерами

```
repository/ ──(интерфейс)──→ service-crud/ ──(сервис)──→ api-router-auth/
```

- `service-crud` импортирует интерфейс репозитория из `repository/`
- `api-router-auth` вызывает методы сервиса (импорт условный, т.к. сервис ещё не создан в src/)

## Общие принципы

Все примеры следуют принципам, описанным в разделе **[AI Context Analysis](../../../ai-context-analysis.md)** и документации по архитектуре:

- **Clean Architecture**: разделение на слои (API Router → Service → Repository)
- **TypeScript strict mode**: никаких `any`, полная типизация
- **JSDoc**: все публичные функции и интерфейсы документируются
- **Закон одного ответа**: каждая функция возвращает одно конкретное значение или ошибку
- **Правило 50 строк**: каждый файл не превышает 50 строк (за исключением комментариев и импортов)

> **Примечание:** Примеры содержат эталонный код (boilerplate), а не компилируемый модуль. TS-ошибки импортов ожидаемы — модули в `src/` будут созданы при реализации функциональности.
