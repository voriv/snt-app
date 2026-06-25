# WebSocket

> 📌 Контекстный сегмент. Полные версии: [`06-websocket-config.md`](../architecture/structure/06-websocket-config.md), [`websocket-client.md`](../specs/components/websocket-client.md)

---

## Архитектура

```
Клиенты → Nginx (:443/wss) → WS Server (:3001) → PostgreSQL (:5432)
```

Next.js не поддерживает долгоживущие WebSocket-соединения. WS-сервер — отдельный процесс, управляемый PM2.

### Структура ws-server

```
ws-server/src/
├── index.ts                # HTTP Server на порту 3001
├── connectionManager.ts     # Управление комнатами и соединениями
├── handlers/
│   ├── chat.ts             # Обработка чат-событий
│   └── notifications.ts    # Обработка уведомлений
└── utils/
    └── auth.ts             # JWT верификация
```

---

## Протокол сообщений

Все сообщения — JSON:

```json
{
  "type": "chat.message",
  "payload": { ... }
}
```

### Клиент → Сервер

| type | payload | Описание |
|------|---------|----------|
| `chat.join` | `{ chatId }` | Войти в чат |
| `chat.leave` | `{ chatId }` | Покинуть чат |
| `chat.message` | `{ chatId, content }` | Отправить сообщение |
| `chat.typing` | `{ chatId }` | Индикатор набора текста |

### Сервер → Клиент

| type | payload | Описание |
|------|---------|----------|
| `chat.message` | `{ id, chatId, sender, content, createdAt }` | Новое сообщение |
| `chat.typing` | `{ chatId, userId, name }` | Кто-то печатает |
| `notification` | `{ id, type, title, content, link }` | Push-уведомление |

---

## ConnectionManager

Управляет комнатами. Каждый чат — отдельная комната.

```typescript
class ConnectionManager {
  private userConnections: Map<string, Set<WebSocket>>  // userId → WebSocket[]
  private rooms: Map<string, Set<string>>               // chatId → userId[]

  join(userId, chatId): void
  leave(userId, chatId): void
  broadcast(chatId, message, excludeUserId?): void
  sendToUser(userId, message): void
  onDisconnect(ws): void
}
```

### Rooms

| Room | Описание |
|------|----------|
| `chat:general` | Общий чат |
| `chat:admin` | Чат администраторов |
| `chat:<chatId>` | Конкретный чат по ID |

---

## Авторизация

```typescript
// Клиент подключается с JWT
const ws = new WebSocket('wss://example.com/ws', {
  headers: { Authorization: `Bearer ${accessToken}` }
})

// Сервер верифицирует
import { verify } from 'jsonwebtoken'
const decoded = verify(token, process.env.WS_INTERNAL_SECRET)
```

---

## Интеграция с Next.js

Когда Server Action создаёт начисление, документ или голосование — нужно отправить уведомление:

1. Server Action пишет в БД через Prisma
2. Server Action отправляет `POST http://localhost:3001/internal/notify`
3. WS-сервер рассылает push-уведомления подключённым клиентам

Внутренний API защищён общим секретом (`WS_INTERNAL_SECRET`).

---

## Клиентские хуки

| Хук | Назначение |
|-----|-----------|
| `useWebSocket` | Подключение, переподключение, отправка сообщений |
| `useChat` | Подключение к конкретному чату, получение сообщений |
| `useNotifications` | Подписка на уведомления |

### Обработка разрывов

Exponential backoff: 1s → 2s → 4s → 8s → max 30s

### Статусы соединения

| Статус | Описание |
|--------|----------|
| CONNECTING | Установление соединения |
| OPEN | Активное соединение |
| CLOSING | Закрытие |
| CLOSED | Закрыто |
| RECONNECTING | Попытка переподключения |

---

📄 Полный протокол: [`06-websocket-config.md`](../architecture/structure/06-websocket-config.md)
📄 Клиент: [`websocket-client.md`](../specs/components/websocket-client.md)