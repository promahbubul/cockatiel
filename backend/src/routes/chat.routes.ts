import { FastifyInstance } from 'fastify';
import { getChats, getChatById, createDirectChat, createGroupChat } from '../controllers/chat.controller.js';
import { authenticateToken } from '../middlewares/auth.js';

export async function chatRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateToken);

  fastify.get('/', getChats);
  fastify.get('/:id', getChatById);
  fastify.post('/direct', createDirectChat);
  fastify.post('/group', createGroupChat);
}
