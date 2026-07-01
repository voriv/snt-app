class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: Map<string, Array<Function>> = new Map();

  constructor(url: string) {
    this.url = url;
    this.connect();
  }

  private connect() {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.reconnect();
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.reconnect();
    }
  }

  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
    }
  }

  private handleMessage(data: { type: string; payload: unknown }) {
    const handlers = this.messageHandlers.get(data.type);
    if (handlers) {
      handlers.forEach((handler: Function) => handler(data.payload));
    }
  }

  public subscribe<T>(type: string, handler: (data: T) => void) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    const handlersArray = this.messageHandlers.get(type) as Array<Function>;
    handlersArray?.push(handler);
  }

  public unsubscribe(type: string, handler: Function) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  public publish<T>(type: string, data: T) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload: data }));
    }
  }

  public disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}

export const wsService = new WebSocketService(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3101');
