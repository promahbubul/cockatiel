import { z } from 'zod';

export const RegisterSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const VerifyEmailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  code: z.string().length(6, 'Verification code must be 6 digits'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  code: z.string().length(6, 'Verification code must be 6 digits'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

export const SendOtpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const VerifyOtpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  code: z.string().length(6, 'OTP must be 6 digits'),
});

export const UpdateProfileSchema = z.object({
  displayName: z.string().min(2, 'Name is too short').max(50).optional(),
  about: z.string().max(160).optional(),
  avatarUrl: z.string().url().optional(),
});

export const CreateDirectChatSchema = z.object({
  recipientId: z.string().min(1, 'Recipient ID is required'),
});

export const CreateGroupChatSchema = z.object({
  groupName: z.string().min(2, 'Group name too short').max(60),
  groupAvatar: z.string().url().optional(),
  memberIds: z.array(z.string()).min(1, 'Group must have at least one member'),
});

export const SendMessageSchema = z.object({
  chatId: z.string().min(1, 'Chat ID is required'),
  content: z.string().optional(),
  mediaUrl: z.string().url().optional(),
  mediaType: z.enum(['IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT']).optional(),
  caption: z.string().optional(),
});

export const ReactMessageSchema = z.object({
  messageId: z.string().min(1),
  emoji: z.string().min(1),
});

export const LogCallSchema = z.object({
  receiverId: z.string().min(1),
  callType: z.enum(['audio', 'video']),
  direction: z.enum(['incoming', 'outgoing', 'missed']),
  duration: z.string().optional(),
  roomName: z.string().min(1),
});
