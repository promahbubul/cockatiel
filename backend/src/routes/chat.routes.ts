import { FastifyInstance } from 'fastify';
import {
  getChats,
  getChatById,
  createDirectChat,
  createGroupChat,
  updateGroup,
  addMembers,
  removeMember,
  pinMessage,
  unpinMessage,
} from '../controllers/chat.controller.js';
import { authenticateToken } from '../middlewares/auth.js';

export async function chatRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateToken);

  fastify.get('/', getChats);
  fastify.get('/:id', getChatById);
  fastify.post('/direct', createDirectChat);
  fastify.post('/group', createGroupChat);
  fastify.put('/:id', updateGroup);
  fastify.post('/:id/members', addMembers);
  fastify.delete('/:id/members/:memberId', removeMember);
  fastify.post('/:id/pin', pinMessage);
  fastify.delete('/:id/pin', unpinMessage);
}
