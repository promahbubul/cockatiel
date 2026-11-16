import { FastifyInstance } from 'fastify';
import { getContacts, searchUsers, getUserById } from '../controllers/user.controller.js';
import { authenticateToken } from '../middlewares/auth.js';

export async function userRoutes(fastify: FastifyInstance) {
  fastify.get('/contacts', { preHandler: [authenticateToken] }, getContacts);
  fastify.get('/search', { preHandler: [authenticateToken] }, searchUsers);
  fastify.get('/:id', { preHandler: [authenticateToken] }, getUserById);
}
