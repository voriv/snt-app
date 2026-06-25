import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import cors from 'cors';
import express from 'express';
import { ConnectionManager } from './connectionManager';
import { ChatHandler } from './handlers/chat';
import { AuthMiddleware } from './utils/auth';

const app = express();
app.use(cors());

const wss = new WebSocketServer({ port: parseInt(process.env.WS_PORT || '3001', 10) });
const connectionManager = new ConnectionManager();
const authMiddleware = new AuthMiddleware(process.env.WS_INTERNAL_SECRET || 'default-secret');
const chatHandler = new ChatHandler(connectionManager);

const PORT = parseInt(process.env.WS_PORT || '3001', 10);

// Internal API for notifications from Next.js
app.post('/internal/notify', async (req, res) => {
  const secret = req.headers['x-internal-secret'] as string;
  
  if (secret !== process.env.WS_INTERNAL_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { userId, type, payload } = req.body;

  if (!userId || !type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  connectionManager.notifyUser(userId, type, payload);
  res.json({ success: true });
});

wss.on('connection', (ws: WebSocket, req) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    ws.close(4001, 'Unauthorized: No token provided');
    return;
  }

  const userData = authMiddleware.verifyToken(token);
  
  if (!userData) {
    ws.close(4002, 'Unauthorized: Invalid token');
    return;
  }

  connectionManager.addConnection(ws, userData);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString()) as {
        type: string;
        payload: Record<string, unknown>;
      };

      chatHandler.handleMessage(ws, message, userData.userId);
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format',
      }));
    }
  });

  ws.on('close', () => {
    connectionManager.removeConnection(ws, userData.userId);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    connectionManager.removeConnection(ws, userData.userId);
  });
});

console.log(`WebSocket server running on port ${PORT}`);
