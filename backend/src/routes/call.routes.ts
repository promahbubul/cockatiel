import { FastifyInstance } from 'fastify';
import { getCalls, logCall } from '../controllers/call.controller.js';
import { authenticateToken } from '../middlewares/auth.js';

export async function callRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateToken);

  fastify.get('/', getCalls);
  fastify.post('/log', logCall);
}
