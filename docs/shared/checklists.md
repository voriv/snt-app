# Чек-листы качества

> 📌 Единый справочник чек-листов. Спецификации ссылаются на этот файл вместо дублирования.

---

## 1. Общий чек-лист компонента

> Источник: [`component-requirements.md`](../specs/components/component-requirements.md)

- [ ] JSDoc/TSDoc аннотации на всех публичных функциях
- [ ] Имя в PascalCase, файл — в kebab-case
- [ ] Props типизированы (TypeScript interface)
- [ ] Нет `any`, `unknown`, `ts-ignore`
- [ ] Нет `console.log` в продакшен коде
- [ ] Обработаны ошибки (try/catch, error boundary)
- [ ] Примеры использования в JSDoc `@example`
- [ ] Длина функции ≤ 50 строк
- [ ] Нет дублирования логики (DRY)
- [ ] Нет глобального мутабельного состояния
- [ ] Абсолютные импорты (`@/...`)
- [ ] Внешние зависимости разрешены в спецификации
- [ ] Unit-тесты для бизнес-логики

---

## 2. Service

> Источник: [`service-component-requirements.md`](../specs/components/services/service-component-requirements.md)

- [ ] Шаблон структуры: импорты → типы → константы → функции
- [ ] Файл: `<entity>-service.ts` (lowercase, суффикс `-service`)
- [ ] Функции: `<action><Entity>Service`
- [ ] Типы: `<Action><Entity>Input` / `<Action><Entity>Output`
- [ ] Zod валидация входных данных
- [ ] Доменные ошибки (ValidationError, NotFoundError, ConflictError) — не generic `Error`
- [ ] Транзакции для multi-step операций
- [ ] Repository через DI (конструктор), без прямого Prisma
- [ ] Нет HTTP/UI логики, нет зависимости от React/Next.js
- [ ] Unit-тесты: AAA паттерн, mock Repository, покрытие ≥ 80%

---

## 3. Repository

> Источник: [`repository-component-requirements.md`](../specs/components/repositories/repository-component-requirements.md)

- [ ] Интерфейс в отдельном файле, реализация в `src/repositories/_impl/`
- [ ] В service-слоях нет импорта `@prisma/client`
- [ ] Методы интерфейса асинхронны
- [ ] Ошибки БД → `RepositoryError` и наследники
- [ ] Пагинация (limit/offset) для списков
- [ ] Сырые SQL параметризированы, результаты типизированы
- [ ] Нет бизнес-логики в репозитории (только данные)

---

## 4. UI

> Источник: [`ui-component-requirements.md`](../specs/components/ui/ui-component-requirements.md)

- [ ] ARIA атрибуты при необходимости
- [ ] Поддержка клавиатуры (tabindex, keyboard events)
- [ ] Адаптивность (responsive Tailwind классы)
- [ ] Примеры в JSDoc `@example` с JSX

---

## 5. Аутентификация

> Источник: [`auth.md`](../specs/auth.md)

- [ ] Email/Password через bcrypt (rounds=12)
- [ ] Access токен 1 час, Refresh 7 дней (rotation)
- [ ] Восстановление пароля с resetToken (1 час)
- [ ] Rate limiting на login
- [ ] HTTPS only, HTTP-only cookie, SameSite=Strict
- [ ] Redaction чувствительных данных в логах

---

## 6. Логирование и мониторинг

> Источник: [`logging-monitoring.md`](../specs/logging-monitoring.md)

- [ ] Pino для структурированного логирования
- [ ] Уровень: `info` (prod), `debug` (dev)
- [ ] `reqId` во всех логах
- [ ] Чувствительные данные redacted
- [ ] Stack trace только в development
- [ ] Медленные запросы (>500ms) логируются отдельно
- [ ] PM2 лимиты памяти настроены
- [ ] Health check эндпоинт реализован

---

## 7. Хранение файлов

> Источник: [`file-storage.md`](../specs/file-storage.md)

- [ ] Валидация MIME-типа client + server (magic bytes)
- [ ] Проверка размера, переименование (UUID)
- [ ] Проверка прав доступа перед выдачей
- [ ] Streaming для файлов >1 MB
- [ ] Мягкое удаление (`isDeleted`), 30-дневный период восстановления

---

## 8. WebSocket-клиент

> Источник: [`websocket-client.md`](../specs/components/websocket-client.md)

- [ ] Глобальный Context для управления соединением
- [ ] Экспоненциальная задержка переподключения с джиттером
- [ ] Очередь отложенных сообщений
- [ ] Callbacks: onConnect, onDisconnect, onError, onMessage
- [ ] Корректное состояние при ошибке, автоматическое переподключение