import { WebSocket } from 'ws';

interface UserConnection {
  userId: string;
  ws: WebSocket;
}

interface ChatMessage {
  type: string;
  payload: Record<string, unknown>;
}

interface UserData {
  userId: string;
  email: string;
}

export class ConnectionManager {
  private userConnections: Map<string, Set<WebSocket>>;
  private rooms: Map<string, Set<string>>;

  constructor() {
    this.userConnections = new Map();
    this.rooms = new Map();
  }

  addConnection(ws: WebSocket, userData: UserData): void {
    if (!this.userConnections.has(userData.userId)) {
      this.userConnections.set(userData.userId, new Set());
    }
    this.userConnections.get(userData.userId)!.add(ws);
    console.log(`User ${userData.userId} connected`);
  }

  removeConnection(ws: WebSocket, userId: string): void {
    const connections = this.userConnections.get(userId);
    if (connections) {
      connections.delete(ws);
      if (connections.size === 0) {
        this.userConnections.delete(userId);
      }
    }

    this.rooms.forEach((room, chatId) => {
      if (room.has(userId)) {
        room.delete(userId);
      }
    });

    console.log(`User ${userId} disconnected`);
  }

  joinRoom(userId: string, chatId: string): void {
    if (!this.rooms.has(chatId)) {
      this.rooms.set(chatId, new Set());
    }
    this.rooms.get(chatId)!.add(userId);
  }

  leaveRoom(userId: string, chatId: string): void {
    const room = this.rooms.get(chatId);
    if (room) {
      room.delete(userId);
      if (room.size === 0) {
        this.rooms.delete(chatId);
      }
    }
  }

  broadcast(chatId: string, message: string, excludeUserId?: string): void {
    const room = this.rooms.get(chatId);
    if (!room) return;

    room.forEach((userId) => {
      if (excludeUserId && userId === excludeUserId) return;

      const connections = this.userConnections.get(userId);
      connections?.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    });
  }

  sendToUser(userId: string, message: string): void {
    const connections = this.userConnections.get(userId);
    connections?.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  sendMessage(chatId: string, userId: string, content: string): void {
    const message = JSON.stringify({
      type: 'chat.message',
      payload: {
        chatId,
        senderId: userId,
        content,
        createdAt: new Date().toISOString(),
      },
    });

    this.broadcast(chatId, message);
  }

  notifyTyping(chatId: string, userId: string): void {
    const message = JSON.stringify({
      type: 'chat.typing',
      payload: {
        chatId,
        userId,
        timestamp: Date.now(),
      },
    });

    this.broadcast(chatId, message);
  }

  notifyUser(userId: string, type: string, payload: Record<string, unknown>): void {
    const message = JSON.stringify({
      type,
      payload,
    });

    this.sendToUser(userId, message);
  }

  handleMessage(ws: WebSocket, message: ChatMessage, userId: string): void {
    const { type, payload } = message;

    switch (type) {
      case 'chat.join':
        this.joinRoom(userId, payload.chatId as string);
        break;

      case 'chat.leave':
        this.leaveRoom(userId, payload.chatId as string);
        break;

      case 'chat.message':
        this.sendMessage(
          payload.chatId as string,
          userId,
          payload.content as string,
        );
        break;

      case 'chat.typing':
        this.notifyTyping(payload.chatId as string, userId);
        break;

      default:
        ws.send(
          JSON.stringify({
            type: 'error',
            message: 'Unknown message type',
          }),
        );
    }
  }
}
