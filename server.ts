import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { db } from './src/server-db.js';
import { Message } from './src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  
  // Set up socket.io with robust CORS
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  const PORT = 3000;

  // JSON parsing middleware
  app.use(express.json());

  // ----------------- REST APIs -----------------

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Fetch chat history
  app.get('/api/messages', async (req, res) => {
    try {
      const messages = await db.getMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  // Send message via REST API
  app.post('/api/messages', async (req, res) => {
    try {
      const { id, sender, text, timestamp } = req.body;
      if (!id || !sender || !text || !timestamp) {
        res.status(400).json({ error: 'Missing required message fields' });
        return;
      }

      const message: Message = {
        id,
        sender,
        text,
        timestamp,
        status: 'sent',
      };

      const savedMessage = await db.addMessage(message);

      // Broadcast to all connected clients via socket.io
      io.emit('new_message', savedMessage);

      res.status(201).json(savedMessage);
    } catch (error) {
      res.status(500).json({ error: 'Failed to save and send message' });
    }
  });

  // Fetch users status list
  app.get('/api/users', async (req, res) => {
    try {
      const users = await db.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // ----------------- Socket.io Real-Time Handler -----------------

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // User join / login
    socket.on('join', async (data: { username: string }) => {
      const { username } = data;
      if (!username) return;

      try {
        console.log(`User joint: ${username} on socket ${socket.id}`);
        // Set user as online
        await db.setUserStatus(username, 'online', socket.id);

        // Broadcast updated users list
        io.emit('users_update', await db.getUsers());

        // Send confirmation to the client
        socket.emit('join_success', { username });
      } catch (err) {
        console.error('Error on join event:', err);
      }
    });

    // Real-time message sent over WebSocket
    socket.on('send_message', async (data: Message) => {
      try {
        if (!data.id || !data.sender || !data.text) return;

        // Force 'sent' status initially
        const message: Message = {
          ...data,
          status: 'sent',
        };

        const savedMessage = await db.addMessage(message);

        // Broadcast to all clients
        io.emit('new_message', savedMessage);
      } catch (err) {
        console.error('Error processing sent message:', err);
      }
    });

    // Message read receipts
    socket.on('mark_read', async (data: { exceptSender: string }) => {
      try {
        const { exceptSender } = data;
        if (!exceptSender) return;

        const updatedIds = await db.markAllAsRead(exceptSender);
        if (updatedIds.length > 0) {
          io.emit('messages_read', { updatedIds });
        }
      } catch (err) {
        console.error('Error marking messages as read:', err);
      }
    });

    // Typing indicators
    socket.on('typing', (data: { username: string; isTyping: boolean }) => {
      // Broadcast to everyone else
      socket.broadcast.emit('user_typing', data);
    });

    // Disconnection handling
    socket.on('disconnect', async () => {
      try {
        console.log(`Socket disconnected: ${socket.id}`);
        const user = await db.getUserBySocketId(socket.id);
        if (user) {
          console.log(`User offline: ${user.username}`);
          await db.setUserStatus(user.username, 'offline');
          // Broadcast update
          io.emit('users_update', await db.getUsers());
        }
      } catch (err) {
        console.error('Error on socket disconnect:', err);
      }
    });
  });

  // ----------------- Vite Dev / Prod Static Files Middleware -----------------

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA routing fallback (use Express v4 syntax)
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind to host 0.0.0.0 for container ingress
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
