import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

interface ExtendedWebSocket extends WebSocket {
  userId?: string;
  userRole?: 'student' | 'admin';
  isAlive?: boolean;
}

class ChatWebSocketServer {
  wss: WebSocketServer | null = null;
  private clients: Map<string, ExtendedWebSocket[]> = new Map();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ noServer: true });

    this.wss.on('connection', (ws: ExtendedWebSocket, req) => {
      ws.isAlive = true;

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());

          if (message.type === 'auth') {
            ws.userId = message.userId;
            ws.userRole = message.role;

            if (!this.clients.has(message.userId)) {
              this.clients.set(message.userId, []);
            }
            this.clients.get(message.userId)!.push(ws);

            ws.send(JSON.stringify({ type: 'auth_success', userId: message.userId }));
            console.log(`💬 WebSocket connected: ${message.userId} (${message.role})`);
          }

          if (message.type === 'message' && ws.userId) {
            const { ChatMessage } = await import('./mongodb/models');

            const adminId = 'admin';
            const isFromStudent = ws.userRole === 'student';

            const newMsg = await ChatMessage.create({
              fromUserId: ws.userId,
              fromUserName: message.fromUserName || (isFromStudent ? 'طالب' : 'الدعم الفني'),
              fromUserRole: ws.userRole || 'student',
              toUserId: isFromStudent ? adminId : message.toUserId,
              content: message.content,
              isRead: false,
            });

            ws.send(JSON.stringify({ type: 'message_sent', message: newMsg }));

            const targetId = isFromStudent ? adminId : message.toUserId;
            this.broadcastToUser(targetId, { type: 'new_message', message: newMsg });
          }

          if (message.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });

      ws.on('close', () => {
        if (ws.userId) {
          const userClients = this.clients.get(ws.userId) || [];
          const filtered = userClients.filter(c => c !== ws);
          if (filtered.length === 0) {
            this.clients.delete(ws.userId);
          } else {
            this.clients.set(ws.userId, filtered);
          }
        }
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    const heartbeat = setInterval(() => {
      this.wss?.clients.forEach((ws: ExtendedWebSocket) => {
        if (ws.isAlive === false) {
          ws.terminate();
          return;
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    this.wss.on('close', () => clearInterval(heartbeat));

    console.log('💬 Chat WebSocket server initialized');
  }

  broadcastToUser(userId: string, data: any) {
    const userClients = this.clients.get(userId) || [];
    const serialized = JSON.stringify(data);
    userClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(serialized);
      }
    });
  }

  broadcastToAdmins(data: any) {
    const serialized = JSON.stringify(data);
    this.clients.forEach((clients, userId) => {
      clients.forEach(client => {
        if (client.userRole === 'admin' && client.readyState === WebSocket.OPEN) {
          client.send(serialized);
        }
      });
    });
  }

  broadcastToAll(data: any) {
    const serialized = JSON.stringify(data);
    this.clients.forEach((clients) => {
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(serialized);
        }
      });
    });
  }

  getConnectedUsers(): string[] {
    return Array.from(this.clients.keys());
  }
}

export const wss = new ChatWebSocketServer();
export const chatWebSocketServer = wss;
