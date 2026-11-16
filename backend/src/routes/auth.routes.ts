import { FastifyInstance } from 'fastify';
import { sendOtp, verifyOtp, updateProfile, getMe } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middlewares/auth.js';

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/send-otp', sendOtp);
  fastify.post('/verify-otp', verifyOtp);
  fastify.get('/me', { preHandler: [authenticateToken] }, getMe);
  fastify.put('/profile', { preHandler: [authenticateToken] }, updateProfile);
}
