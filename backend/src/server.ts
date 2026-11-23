import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';
import { connectDatabase } from './config/db.js';
import { setupSocketIO } from './sockets/index.js';
import { authRoutes } from './routes/auth.routes.js';
import { userRoutes } from './routes/user.routes.js';
import { chatRoutes } from './routes/chat.routes.js';
import { messageRoutes } from './routes/message.routes.js';
import { callRoutes } from './routes/call.routes.js';
import { storyRoutes } from './routes/story.routes.js';

dotenv.config();

const server = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
});

async function main() {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Register Plugins
    await server.register(cors, {
      origin: true,
      credentials: true,
    });

    await server.register(jwt, {
      secret: process.env.JWT_SECRET || 'cockatiel-super-secret-jwt-key-2026',
    });

    await server.register(multipart, {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max file size
      },
    });

    // Health check endpoint
    server.get('/health', async () => ({
      status: 'ok',
      service: 'Cockatiel API Backend',
      timestamp: new Date().toISOString(),
    }));

    // Register API Routes
    await server.register(authRoutes, { prefix: '/api/auth' });
    await server.register(userRoutes, { prefix: '/api/users' });
    await server.register(chatRoutes, { prefix: '/api/chats' });
    await server.register(messageRoutes, { prefix: '/api/messages' });
    await server.register(callRoutes, { prefix: '/api/calls' });
    await server.register(storyRoutes, { prefix: '/api/stories' });

    // Initialize Socket.IO with raw Node HTTP server from Fastify
    const io = new SocketIOServer(server.server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });

    setupSocketIO(io);

    const port = Number(process.env.PORT) || 5000;
    const host = '0.0.0.0';

    await server.listen({ port, host });
    console.log(`🚀 Cockatiel Server running on http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
