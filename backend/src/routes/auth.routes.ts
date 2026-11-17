import { FastifyInstance } from 'fastify';
import {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  sendOtp,
  verifyOtp,
  updateProfile,
  getMe,
} from '../controllers/auth.controller.js';
import { authenticateToken } from '../middlewares/auth.js';

export async function authRoutes(fastify: FastifyInstance) {
  // New Full Authentication System
  fastify.post('/register', register);
  fastify.post('/login', login);
  fastify.post('/verify-email', verifyEmail);
  fastify.post('/forgot-password', forgotPassword);
  fastify.post('/reset-password', resetPassword);

  // Backward compatible OTP endpoints
  fastify.post('/send-otp', sendOtp);
  fastify.post('/verify-otp', verifyOtp);

  // Protected endpoints
  fastify.get('/me', { preHandler: [authenticateToken] }, getMe);
  fastify.put('/profile', { preHandler: [authenticateToken] }, updateProfile);
}
