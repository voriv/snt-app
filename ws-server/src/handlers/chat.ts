import { WebSocket } from 'ws';
import { ConnectionManager } from '../connectionManager';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ChatMessage {
  type: string;
  payload: Record<string, unknown>;
}

export class ChatHandler {
  constructor(private connectionManager: ConnectionManager) {}

  async handleChatJoin(ws: WebSocket, userId: string, chatId: string): Promise<void> {
    this.connectionManager.joinRoom(userId, chatId);
    
    // Send current messages in the chat
    const messages = await prisma.chatMessage.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      take: 50,
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    ws.send(JSON.stringify({
      type: 'chat.messages',
      payload: {
        chatId,
        messages: messages.map((msg: any) => ({
          id: msg.id,
          chatId: msg.chatId,
          senderId: msg.senderId,
          senderName: msg.sender.name || msg.sender.email,
          content: msg.content,
          createdAt: msg.createdAt.toISOString(),
        })),
      },
    }));
  }

  async handleChatLeave(ws: WebSocket, userId: string, chatId: string): Promise<void> {
    this.connectionManager.leaveRoom(userId, chatId);
  }

  async handleChatMessage(ws: WebSocket, userId: string, chatId: string, content: string): Promise<void> {
    if (!content || content.trim().length === 0) {
      ws.send(JSON.stringify({ type: 'error', message: 'Message content cannot be empty' }));
      return;
    }

    const savedMessage = await prisma.chatMessage.create({
      data: {
        chatId,
        senderId: userId,
        content: content.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // Notify all users in the chat
    this.connectionManager.broadcast(
      chatId,
      JSON.stringify({
        type: 'chat.message',
        payload: {
          id: savedMessage.id,
          chatId: savedMessage.chatId,
          senderId: savedMessage.senderId,
          senderName: savedMessage.sender.name || savedMessage.sender.email,
          content: savedMessage.content,
          createdAt: savedMessage.createdAt.toISOString(),
        },
      }),
      userId, // Don't echo back to sender
    );

    // Notify sender of their own message (optional, for immediate feedback)
    this.connectionManager.sendToUser(userId, JSON.stringify({
      type: 'chat.message',
      payload: {
        id: savedMessage.id,
        chatId: savedMessage.chatId,
        senderId: savedMessage.senderId,
        senderName: savedMessage.sender.name || savedMessage.sender.email,
        content: savedMessage.content,
        createdAt: savedMessage.createdAt.toISOString(),
      },
    }));
  }

  async handleTyping(ws: WebSocket, userId: string, chatId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    this.connectionManager.notifyTyping(chatId, userId);
  }

  handleMessage(ws: WebSocket, message: ChatMessage, userId: string): void {
    const { type, payload } = message;

    switch (type) {
      case 'chat.join':
        this.handleChatJoin(ws, userId, payload.chatId as string);
        break;

      case 'chat.leave':
        this.handleChatLeave(ws, userId, payload.chatId as string);
        break;

      case 'chat.message':
        this.handleChatMessage(ws, userId, payload.chatId as string, payload.content as string);
        break;

      case 'chat.typing':
        this.handleTyping(ws, userId, payload.chatId as string);
        break;

      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Unknown message type',
        }));
    }
  }
}
