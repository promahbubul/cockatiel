import { FastifyRequest, FastifyReply } from 'fastify';
import { User } from '../models/User.js';
import { SendOtpSchema, VerifyOtpSchema, UpdateProfileSchema } from '../schemas/index.js';

// In-memory OTP storage for demo/development (can be Redis or SMS gateway in production)
const otpStore = new Map<string, { code: string; expiresAt: number }>();

export async function sendOtp(request: FastifyRequest, reply: FastifyReply) {
  const result = SendOtpSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({ error: result.error.errors[0].message });
  }

  const { phoneNumber } = result.data;
  // Default predictable demo code '123456' or random 6 digits
  const code = phoneNumber.endsWith('9999') ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(phoneNumber, {
    code: '123456', // Always allow 123456 for easy developer testing
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  return reply.send({
    success: true,
    message: 'OTP sent successfully',
    demoCode: '123456', // Helpful for frontend test
  });
}

export async function verifyOtp(request: FastifyRequest, reply: FastifyReply) {
  const result = VerifyOtpSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({ error: result.error.errors[0].message });
  }

  const { phoneNumber, code } = result.data;
  const stored = otpStore.get(phoneNumber);

  // Accept valid stored OTP or standard demo code 123456
  const isValid = code === '123456' || (stored && stored.code === code && stored.expiresAt > Date.now());

  if (!isValid) {
    return reply.status(400).send({ error: 'Invalid or expired OTP code' });
  }

  // Find or create user
  let user = await User.findOne({ phoneNumber });
  let isNewUser = false;

  if (!user) {
    user = await User.create({
      phoneNumber,
      displayName: `User ${phoneNumber.slice(-4)}`,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      isOnline: true,
    });
    isNewUser = true;
  } else {
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();
  }

  const token = (request.server as any).jwt.sign({
    userId: user._id.toString(),
    phoneNumber: user.phoneNumber,
  });

  return reply.send({
    success: true,
    token,
    isNewUser,
    user: {
      id: user._id.toString(),
      phoneNumber: user.phoneNumber,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      about: user.about,
      isOnline: user.isOnline,
    },
  });
}

export async function updateProfile(request: FastifyRequest, reply: FastifyReply) {
  const result = UpdateProfileSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({ error: result.error.errors[0].message });
  }

  const authUser = (request as any).user;
  const user = await User.findById(authUser.userId);
  if (!user) {
    return reply.status(404).send({ error: 'User not found' });
  }

  if (result.data.displayName) user.displayName = result.data.displayName;
  if (result.data.about !== undefined) user.about = result.data.about;
  if (result.data.avatarUrl) user.avatarUrl = result.data.avatarUrl;

  await user.save();

  return reply.send({
    success: true,
    user: {
      id: user._id.toString(),
      phoneNumber: user.phoneNumber,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      about: user.about,
      isOnline: user.isOnline,
    },
  });
}

export async function getMe(request: FastifyRequest, reply: FastifyReply) {
  const authUser = (request as any).user;
  const user = await User.findById(authUser.userId);
  if (!user) {
    return reply.status(404).send({ error: 'User not found' });
  }

  return reply.send({
    success: true,
    user: {
      id: user._id.toString(),
      phoneNumber: user.phoneNumber,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      about: user.about,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
    },
  });
}
