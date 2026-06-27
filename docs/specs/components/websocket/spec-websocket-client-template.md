# WebSocket Client: {{client-name}}

## Статус: {{статус}}

## 1. Описание

### 1.1 Назначение

{{Краткое описание назначения WebSocket клиента. Какие задачи он решает и какие данные передаёт.}}

### 1.2 Границы ответственности

{{Описание границ ответственности WebSocket клиента. Что входит и что НЕ входит в ответственность.}}

| Входит | НЕ входит |
|--------|-----------|
| {{Operation 1}} | {{External concern 1}} |
| {{Operation 2}} | {{External concern 2}} |

### 1.3 Связанные компоненты

| Компонент | Тип | Ссылка |
|-----------|-----|--------|
| {{component-name}} | {{component-type}} | [Ссылка](../path/to/component.md) |

---

## 2. Архитектура подключения

### 2.1 URL сервера

| Окружение | URL |
|-----------|-----|
| Development | `ws://localhost:{{port}}` |
| Staging | `wss://{{staging-domain}}` |
| Production | `wss://{{production-domain}}` |

### 2.2 Процессы подключения

#### Шаг 1: Инициализация подключения

{{Описание процесса инициализации WebSocket подключения.}}

#### Шаг 2: Аутентификация

{{Описание процесса аутентификации после установления подключения.}}

| Параметр | Тип | Обязательное | Описание |
|----------|-----|--------------|----------|
| token | string | да | JWT токен для аутентификации |
| userId | string | да | ID пользователя |

#### Шаг 3: Подписка на каналы

{{Описание процесса подписки на каналы уведомлений.}}

| Канал | Описание | Требуемая роль |
|-------|----------|----------------|
| {{channel-name}} | {{description}} | {{role}} |

---

## 3. Протокол сообщений

### 3.1 Формат сообщений

#### входящие сообщения (Server → Client)

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| type | string | да | Тип сообщения |
| payload | object | да | Полезная нагрузка |
| timestamp | string | да | Временная метка (ISO 8601) |
| messageId? | string | нет | ID сообщения для подтверждения |

#### исходящие сообщения (Client → Server)

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| type | string | да | Тип сообщения |
| payload | object | да | Полезная нагрузка |
| messageId? | string | нет | ID сообщения для подтверждения |

### 3.2 Типы сообщений

#### Входящие сообщения

| Тип | Описание | Payload |
|-----|----------|---------|
| {{MESSAGE_TYPE}} | {{description}} | {{payload-type}} |
| notification | Уведомление | NotificationPayload |
| chatMessage | Сообщение чата | ChatMessagePayload |
| typing | Индикатор набора | TypingPayload |

#### Исходящие сообщения

| Тип | Описание | Payload |
|-----|----------|---------|
| {{MESSAGE_TYPE}} | {{description}} | {{payload-type}} |
| subscribe | Подписка на канал | ChannelPayload |
| unsubscribe | Отписка от канала | ChannelPayload |
| ack | Подтверждение получения | AckPayload |

### 3.3 Схемы сообщений (Zod)

```typescript
const WebSocketIncomingMessageSchema = z.object({
  type: z.string(),
  payload: z.unknown(),
  timestamp: z.string().datetime(),
  messageId: z.string().optional(),
});

const WebSocketOutgoingMessageSchema = z.object({
  type: z.string(),
  payload: z.unknown(),
  messageId: z.string().optional(),
});
```

---

## 4. API клиента

### 4.1 Методы подключения

#### connect

Устанавливает WebSocket подключение.

| Параметр | Тип | Обязательное | Описание |
|----------|-----|--------------|----------|
| token | string | да | JWT токен |
| options? | WebSocketOptions | нет | Опции подключения |

| Возвращает | Тип | Описание |
|------------|-----|----------|
| Promise\<void\> | void | {{description}} |

| Выбрасывает | Когда | Код ошибки |
|-------------|--------|-------------|
| ConnectionError | {{condition}} | {{error-code}} |
| AuthError | {{condition}} | {{error-code}} |

#### disconnect

Разрывает WebSocket подключение.

| Параметр | Тип | Обязательное | Описание |
|----------|-----|--------------|----------|
| code? | number | нет | Код завершения |
| reason? | string | нет | Причина завершения |

| Возвращает | Тип | Описание |
|------------|-----|----------|
| void | void | {{description}} |

### 4.2 Методы подписки

#### subscribe

Подписывается на канал уведомлений.

| Параметр | Тип | Обязательное | Описание |
|----------|-----|--------------|----------|
| channel | string | да | Название канала |
| handler | MessageHandler | да | Обработчик сообщений |

| Возвращает | Тип | Описание |
|------------|-----|----------|
| UnsubscribeFn | function | Функция для отписки |

#### unsubscribe

Отписывается от канала.

| Параметр | Тип | Обязательное | Описание |
|----------|-----|--------------|----------|
| channel | string | да | Название канала |
| handler? | MessageHandler | нет | Конкретный обработчик |

| Возвращает | Тип | Описание |
|------------|-----|----------|
| void | void | {{description}} |

### 4.3 Методы отправки

#### send

Отправляет сообщение на сервер.

| Параметр | Тип | Обязательное | Описание |
|----------|-----|--------------|----------|
| type | string | да | Тип сообщения |
| payload | T | да | Полезная нагрузка |
| expectAck? | boolean | нет | Ожидать подтверждение |

| Возвращает | Тип | Описание |
|------------|-----|----------|
| Promise\<void\> | void | {{description}} |

| Выбрасывает | Когда | Код ошибки |
|-------------|--------|-------------|
| NotConnectedError | {{condition}} | {{error-code}} |
| MessageTooLargeError | {{condition}} | {{error-code}} |

---

## 5. Обработка событий

### 5.1 События подключения

| Событие | Когда возникает | Данные |
|---------|-----------------|--------|
| connect | Подключение установлено | { url: string } |
| disconnect | Подключение разорвано | { code: number, reason: string } |
| error | Произошла ошибка | { error: Error } |
| reconnecting | Попытка переподключения | { attempt: number, delay: number } |
| reconnected | Переподключение успешно | { attempt: number } |

### 5.2 Обработчики событий

```typescript
interface WebSocketEventHandlers {
  onConnect?: (data: ConnectData) => void;
  onDisconnect?: (data: DisconnectData) => void;
  onError?: (data: ErrorData) => void;
  onReconnecting?: (data: ReconnectingData) => void;
  onReconnected?: (data: ReconnectedData) => void;
  onMessage?: (message: IncomingMessage) => void;
}
```

### 5.3 Политика переподключения

| Параметр | Значение | Описание |
|----------|----------|----------|
| maxRetries | {{number}} | Максимальное число попыток |
| initialDelay | {{ms}} | Начальная задержка (мс) |
| maxDelay | {{ms}} | Максимальная задержка (мс) |
| backoffFactor | {{number}} | Фактор увеличения задержки |

---

## 6. Управление состоянием

### 6.1 Состояния подключения

```typescript
enum ConnectionState {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected',
  Reconnecting = 'reconnecting',
  Error = 'error',
}
```

### 6.2 Переходы состояний

| Текущее состояние | Событие | Новое состояние |
|-------------------|---------|-----------------|
| Disconnected | connect() | Connecting |
| Connecting | open event | Connected |
| Connected | close event | Reconnecting |
| Reconnecting | max retries exceeded | Error |
| Reconnecting | open event | Connected |

---

## 7. Безопасность

### 7.1 Аутентификация

{{Описание механизма аутентификации WebSocket подключений.}}

| Метод | Описание |
|-------|----------|
| JWT Token | Токен передаётся при инициализации подключения |
| Session Validation | Сервер валидирует сессию при каждом сообщении |

### 7.2 Авторизация

{{Описание механизма авторизации доступа к каналам.}}

| Канал | Требуемая роль | Описание |
|-------|----------------|----------|
| {{channel}} | {{role}} | {{description}} |

### 7.3 Ограничения

| Параметр | Значение | Описание |
|----------|----------|----------|
| maxMessageSize | {{bytes}} | Максимальный размер сообщения |
| maxMessagesPerSecond | {{number}} | Лимит сообщений в секунду |
| maxConnectionsPerUser | {{number}} | Максимум подключений на пользователя |

---

## 8. Тестирование

### 8.1 Unit тесты

| Тест | Сценарий | Ожидаемый результат |
|------|----------|---------------------|
| {{test-name}} | {{scenario}} | {{expected}} |

### 8.2 Integration тесты

| Тест | Сценарий | Ожидаемый результат |
|------|----------|---------------------|
| {{test-name}} | {{scenario}} | {{expected}} |

### 8.3 Mock сервер

{{Описание создания mock WebSocket сервера для тестирования.}}

---

## 9. Мониторинг и логирование

### 9.1 Логируемые события

| Событие | Уровень | Данные |
|---------|---------|--------|
| connection_established | INFO | { url, timestamp } |
| message_sent | DEBUG | { type, payloadSize } |
| message_received | DEBUG | { type, messageId } |
| connection_error | ERROR | { error, attempt } |
| reconnection_attempt | WARN | { attempt, delay } |

### 9.2 Метрики

| Метрика | Тип | Описание |
|---------|-----|----------|
| connectionCount | gauge | Текущее число подключений |
| messageRate | counter | Скорость сообщений |
| avgLatency | histogram | Средняя задержка |
| errorRate | counter | Скорость ошибок |

---

## 10. Зависимости

### 10.1 Внутренние зависимости

| Зависимость | Тип | Назначение |
|-------------|-----|------------|
| {{dependency}} | {{type}} | {{purpose}} |

### 10.2 Внешние зависимости

| Пакет | Версия | Назначение | Согласовано |
|-------|--------|------------|-------------|
| {{package}} | {{version}} | {{purpose}} | {{yes/no}} |

---

## 11. Чек-лист качества

- [ ] Все публичные методы имеют JSDoc аннотации
- [ ] Реализована автоматическая переподключение с backoff
- [ ] Обработаны все состояния подключения
- [ ] Реализована аутентификация WebSocket
- [ ] Ограничен размер сообщений
- [ ] Реализована подписка/отписка от каналов
- [ ] Логируются все критические события
- [ ] Написаны unit и integration тесты
- [ ] Нет утечек памяти (cleanup обработчиков)
- [ ] Поддержка server-sent events для fallback

---

## 12. История изменений

| Версия | Дата | Изменения | Автор |
|--------|------|-----------|-------|
| 0.1.0 | {{YYYY-MM-DD}} | Начальная версия | {{автор}} |
