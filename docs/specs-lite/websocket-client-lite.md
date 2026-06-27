# WebSocket Client — Lite

> 📌 Сокращённая версия. Полная: [`websocket-client.md`](../specs/components/websocket-client.md) (631 строка)

---

## Архитектура

```
React App
├── WebSocketProvider (Context) — глобальное состояние соединения
├── useWebSocket — управление соединением, переподключение
├── useChat — чаты (сообщения, typing, join/leave)
└── useNotifications — push-уведомления
```

---

## WebSocketProvider

**Файл:** `src/components/providers/ws-provider.tsx`

```typescript
interface WebSocketContextType {
  isConnected: boolean
  isConnecting: boolean
  lastError: string | null
  sendMessage: (message: WebSocketMessage) => void
  joinRoom: (chatId: string) => void
  leaveRoom: (chatId: string) => void
}
```

---

## useWebSocket — основной хук

**Интерфейс:**
```typescript
interface UseWebSocketOptions {
  url: string
  token?: string
  maxReconnectAttempts?: number     // 0 = бесконечно
  initialReconnectDelay?: number    // мс
  maxReconnectDelay?: number        // 30000 мс
  delayMultiplier?: number          // 2 (экспоненциальный рост)
  jitter?: boolean                  // предотвращение thundering herd
  onConnect? / onDisconnect? / onError? / onMessage?
}

interface UseWebSocketReturn {
  isConnected / isConnecting / reconnectAttempts / lastError
  sendMessage / sendText / disconnect
}
```

**Структура сообщения:**
```typescript
interface WebSocketMessage { type: string; payload: Record<string, unknown> }
interface WSResponse { type: string; payload: Record<string, unknown>; error?: string }
```

---

## useChat — хук для чатов

```typescript
interface UseChatOptions { chatId: string; initialMessages?: ChatMessage[]; pageSize?: number }
interface UseChatReturn {
  messages / isTyping / typingUsers / isLoading / hasMoreMessages
  sendMessage / join / leave / loadMoreMessages
}
```

**Обрабатываемые события:** `chat.message`, `chat.typing`, `chat.joined`

---

## useNotifications — хук уведомлений

```typescript
interface UseNotificationsReturn {
  notifications / unreadCount
  markAsRead / markAllAsRead / remove
}
```

**Обрабатываемые события:** `notification`

---

## Переподключение (Exponential Backoff)

| Попытка | Задержка | С джиттером |
|---------|---------|-------------|
| 1 | 1000 мс | 500–1000 |
| 2 | 2000 мс | 1000–2000 |
| 3 | 4000 мс | 2000–4000 |
| 6+ | 30000 мс (max) | 15000–30000 |

**Очередь сообщений:** при разрыве сообщения накапливаются, отправляются при восстановлении

---

## Библиотеки

| Библиотека | Назначение | Рекомендация |
|------------|-----------|--------------|
| `WebSocket` (browser API) | Базовое соединение | ✅ Использовать |
| `useSession` (next-auth) | JWT токен | ✅ Использовать |
| `socket.io-client` | Автопереподключение | ⚠️ Опционально |
| `zustand` | Управление состоянием | ⚠️ Опционально |

**Рекомендация:** стандартная WebSocket API без доп. зависимостей

---

📄 Полная спецификация: [`websocket-client.md`](../specs/components/websocket-client.md)
📄 Чек-лист: [`shared/checklists.md#8-websocket-клиент`](../shared/checklists.md#8-websocket-клиент)