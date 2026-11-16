import { FastifyRequest, FastifyReply } from 'fastify';
import { User } from '../models/User.js';
import { SendOtpSchema, VerifyOtpSchema, UpdateProfileSchema } from '../schemas/index.js';

// In-memory OTP storage for email verification
const otpStore = new Map<string, { code: string; expiresAt: number }>();

export async function sendOtp(request: FastifyRequest, reply: FastifyReply) {
  const result = SendOtpSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({ error: result.error.errors[0].message });
  }

  const email = result.data.email.toLowerCase().trim();
  // Standard demo code '123456' for predictable developer testing, or random 6 digits
  const code = '123456';
  
  otpStore.set(email, {
    code,
    expiresAt: Date.now() + 15 * 60 * 1000, // 15 mins expiry
  });

  console.log(`📧 [Email Verification] Code sent to ${email}: ${code}`);

  return reply.send({
    success: true,
    message: `Verification code sent to ${email}`,
    demoCode: '123456', // Helpful for frontend test/development
  });
}

export async function verifyOtp(request: FastifyRequest, reply: FastifyReply) {
  const result = VerifyOtpSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({ error: result.error.errors[0].message });
  }

  const email = result.data.email.toLowerCase().trim();
  const { code } = result.data;
  const stored = otpStore.get(email);

  // Accept valid stored OTP or standard demo code 123456
  const isValid = code === '123456' || (stored && stored.code === code && stored.expiresAt > Date.now());

  if (!isValid) {
    return reply.status(400).send({ error: 'Invalid or expired verification code' });
  }

  // Find or create user by email
  let user = await User.findOne({ email });
  let isNewUser = false;

  if (!user) {
    const defaultName = email.split('@')[0];
    user = await User.create({
      email,
      displayName: defaultName.charAt(0).toUpperCase() + defaultName.slice(1),
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
    email: user.email,
  });

  return reply.send({
    success: true,
    token,
    isNewUser,
    user: {
      id: user._id.toString(),
      email: user.email,
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
      email: user.email,
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
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      about: user.about,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
    },
  });
}
