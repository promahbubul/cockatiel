import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import {
  RegisterSchema,
  LoginSchema,
  VerifyEmailSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  SendOtpSchema,
  VerifyOtpSchema,
  UpdateProfileSchema,
} from '../schemas/index.js';

// In-memory OTP storage for quick demo/development fallback
const otpStore = new Map<string, { code: string; expiresAt: number }>();

// 1. REGISTER
export async function register(request: FastifyRequest, reply: FastifyReply) {
  const result = RegisterSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({ error: result.error.errors[0].message });
  }

  const { displayName, email, password } = result.data;
  const normalizedEmail = email.toLowerCase().trim();

  // Check if existing verified user exists
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser && existingUser.isVerified) {
    return reply.status(400).send({ error: 'An account with this email already exists. Please log in.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const code = '123456'; // Standard predictable demo code for easy testing
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  if (existingUser) {
    existingUser.displayName = displayName;
    existingUser.password = hashedPassword;
    existingUser.isVerified = false;
    existingUser.verificationCode = { code, expiresAt };
    await existingUser.save();
  } else {
    await User.create({
      email: normalizedEmail,
      displayName,
      password: hashedPassword,
      avatarUrl: `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(displayName)}`,
      isVerified: false,
      verificationCode: { code, expiresAt },
    });
  }

  console.log(`📧 [Registration OTP] Verification code for ${normalizedEmail}: ${code}`);

  return reply.send({
    success: true,
    message: `Verification code sent to ${normalizedEmail}`,
    demoCode: '123456',
  });
}

// 2. VERIFY EMAIL
export async function verifyEmail(request: FastifyRequest, reply: FastifyReply) {
  const result = VerifyEmailSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({ error: result.error.errors[0].message });
  }

  const { email, code } = result.data;
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return reply.status(404).send({ error: 'User not found. Please register first.' });
  }

  const isStoredValid =
    user.verificationCode &&
    user.verificationCode.code === code &&
    new Date(user.verificationCode.expiresAt).getTime() > Date.now();

  // Accept valid stored OTP or standard demo code 123456
  const isValid = code === '123456' || isStoredValid;

  if (!isValid) {
    return reply.status(400).send({ error: 'Invalid or expired verification code' });
  }

  user.isVerified = true;
  user.isOnline = true;
  user.lastSeen = new Date();
  user.verificationCode = undefined;
  await user.save();

  const token = (request.server as any).jwt.sign({
    userId: user._id.toString(),
    email: user.email,
  });

  return reply.send({
    success: true,
    message: 'Email verified successfully',
    token,
    user: {
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      about: user.about,
      isOnline: user.isOnline,
      settings: user.settings || {},
    },
  });
}

// 3. LOGIN (Email & Password)
export async function login(request: FastifyRequest, reply: FastifyReply) {
  const result = LoginSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({ error: result.error.errors[0].message });
  }

  const { email, password } = result.data;
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  if (!user) {
    return reply.status(400).send({ error: 'Invalid email or password' });
  }

  // Check password
  let passwordMatches = false;
  if (user.password) {
    passwordMatches = await bcrypt.compare(password, user.password);
  }

  // Allow standard demo password for development convenience
  if (!passwordMatches && (password === 'password123' || password === '123456')) {
    passwordMatches = true;
  }

  if (!passwordMatches) {
    return reply.status(400).send({ error: 'Invalid email or password' });
  }

  // If user wasn't verified yet, auto-verify upon correct login credentials
  if (!user.isVerified) {
    user.isVerified = true;
  }

  user.isOnline = true;
  user.lastSeen = new Date();
  await user.save();

  const token = (request.server as any).jwt.sign({
    userId: user._id.toString(),
    email: user.email,
  });

  return reply.send({
    success: true,
    token,
    user: {
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      about: user.about,
      isOnline: user.isOnline,
      settings: user.settings || {},
    },
  });
}

// 4. FORGOT PASSWORD
export async function forgotPassword(request: FastifyRequest, reply: FastifyReply) {
  const result = ForgotPasswordSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({ error: result.error.errors[0].message });
  }

  const { email } = result.data;
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return reply.status(404).send({ error: 'No account found with this email address' });
  }

  const code = '123456';
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  user.resetPasswordCode = { code, expiresAt };
  await user.save();

  console.log(`🔑 [Password Reset OTP] Code for ${normalizedEmail}: ${code}`);

  return reply.send({
    success: true,
    message: `Password reset code sent to ${normalizedEmail}`,
    demoCode: '123456',
  });
}

// 5. RESET PASSWORD
export async function resetPassword(request: FastifyRequest, reply: FastifyReply) {
  const result = ResetPasswordSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({ error: result.error.errors[0].message });
  }

  const { email, code, newPassword } = result.data;
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  if (!user) {
    return reply.status(404).send({ error: 'User not found' });
  }

  const isStoredValid =
    user.resetPasswordCode &&
    user.resetPasswordCode.code === code &&
    new Date(user.resetPasswordCode.expiresAt).getTime() > Date.now();

  const isValid = code === '123456' || isStoredValid;

  if (!isValid) {
    return reply.status(400).send({ error: 'Invalid or expired reset code' });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetPasswordCode = undefined;
  await user.save();

  return reply.send({
    success: true,
    message: 'Password reset successful! You can now log in with your new password.',
  });
}

// 6. OTP LOGIN / VERIFICATION (Backward compatible)
export async function sendOtp(request: FastifyRequest, reply: FastifyReply) {
  const result = SendOtpSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({ error: result.error.errors[0].message });
  }

  const email = result.data.email.toLowerCase().trim();
  const code = '123456';
  
  otpStore.set(email, {
    code,
    expiresAt: Date.now() + 15 * 60 * 1000,
  });

  console.log(`📧 [Email Verification] Code sent to ${email}: ${code}`);

  return reply.send({
    success: true,
    message: `Verification code sent to ${email}`,
    demoCode: '123456',
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

  const isValid = code === '123456' || (stored && stored.code === code && stored.expiresAt > Date.now());

  if (!isValid) {
    return reply.status(400).send({ error: 'Invalid or expired verification code' });
  }

  let user = await User.findOne({ email });
  let isNewUser = false;

  if (!user) {
    const defaultName = email.split('@')[0];
    user = await User.create({
      email,
      displayName: defaultName.charAt(0).toUpperCase() + defaultName.slice(1),
      avatarUrl: `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(email)}`,
      isVerified: true,
      isOnline: true,
    });
    isNewUser = true;
  } else {
    user.isVerified = true;
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
      settings: user.settings || {},
    },
  });
}

// 7. PROFILE & CURRENT USER
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
      settings: user.settings || {},
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
      settings: user.settings || {},
    },
  });
}
