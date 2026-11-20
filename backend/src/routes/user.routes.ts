import { FastifyInstance } from 'fastify';
import {
  getContacts,
  searchUsers,
  getUserById,
  updateSettings,
  submitFeedback,
} from '../controllers/user.controller.js';
import { authenticateToken } from '../middlewares/auth.js';

export async function userRoutes(fastify: FastifyInstance) {
  fastify.get('/contacts', { preHandler: [authenticateToken] }, getContacts);
  fastify.get('/search', { preHandler: [authenticateToken] }, searchUsers);
  fastify.put('/settings', { preHandler: [authenticateToken] }, updateSettings);
  fastify.post('/feedback', { preHandler: [authenticateToken] }, submitFeedback);
  fastify.get('/:id', { preHandler: [authenticateToken] }, getUserById);
}
