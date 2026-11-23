import { FastifyInstance } from 'fastify';
import {
  createStory,
  getActiveStories,
  viewStory,
  deleteStory,
} from '../controllers/story.controller.js';
import { authenticateToken } from '../middlewares/auth.js';

export async function storyRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateToken);

  fastify.get('/', getActiveStories);
  fastify.post('/', createStory);
  fastify.post('/:id/view', viewStory);
  fastify.delete('/:id', deleteStory);
}
