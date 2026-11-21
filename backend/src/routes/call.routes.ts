import { FastifyInstance } from 'fastify';
import { getCalls, logCall, getAgoraToken } from '../controllers/call.controller.js';
import { authenticateToken } from '../middlewares/auth.js';

export async function callRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateToken);

  fastify.get('/', getCalls);
  fastify.post('/log', logCall);
  fastify.get('/agora-token', getAgoraToken);
}
