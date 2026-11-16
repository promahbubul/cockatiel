import { FastifyInstance } from 'fastify';
import { getMessages, sendMessage, reactMessage, uploadMedia } from '../controllers/message.controller.js';
import { authenticateToken } from '../middlewares/auth.js';

export async function messageRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateToken);

  fastify.get('/chat/:chatId', getMessages);
  fastify.post('/send', sendMessage);
  fastify.post('/react', reactMessage);
  fastify.post('/upload', uploadMedia);
}
