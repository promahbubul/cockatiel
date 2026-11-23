import { FastifyRequest, FastifyReply } from 'fastify';
import { User } from '../models/User.js';

export async function getContacts(request: FastifyRequest, reply: FastifyReply) {
  const currentUserId = (request as any).user?.userId;
  const users = await User.find(currentUserId ? { _id: { $ne: currentUserId } } : {})
    .select('displayName email avatarUrl about isOnline lastSeen')
    .sort({ displayName: 1 })
    .lean();

  return reply.send({
    success: true,
    contacts: users.map((u: any) => ({
      id: u._id.toString(),
      displayName: u.displayName,
      email: u.email,
      avatarUrl: u.avatarUrl,
      about: u.about,
      isOnline: u.isOnline,
      lastSeen: u.lastSeen,
    })),
  });
}

export async function searchUsers(request: FastifyRequest, reply: FastifyReply) {
  const query = ((request.query as any)?.q || '') as string;
  const currentUserId = (request as any).user?.userId;

  if (!query.trim()) {
    return reply.send({ success: true, users: [] });
  }

  const regex = new RegExp(query.trim(), 'i');
  const users = await User.find({
    _id: { $ne: currentUserId },
    $or: [{ displayName: regex }, { email: regex }],
  })
    .select('displayName email avatarUrl about isOnline lastSeen')
    .limit(20)
    .lean();

  return reply.send({
    success: true,
    users: users.map((u: any) => ({
      id: u._id.toString(),
      displayName: u.displayName,
      email: u.email,
      avatarUrl: u.avatarUrl,
      about: u.about,
      isOnline: u.isOnline,
      lastSeen: u.lastSeen,
    })),
  });
}

export async function getUserById(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  const user = await User.findById(id).select('displayName email avatarUrl about isOnline lastSeen').lean();

  if (!user) {
    return reply.status(404).send({ error: 'User not found' });
  }

  return reply.send({
    success: true,
    user: {
      id: (user as any)._id.toString(),
      displayName: (user as any).displayName,
      email: (user as any).email,
      avatarUrl: (user as any).avatarUrl,
      about: (user as any).about,
      isOnline: (user as any).isOnline,
      lastSeen: (user as any).lastSeen,
    },
  });
}

export async function updatePushToken(request: FastifyRequest, reply: FastifyReply) {
  const currentUserId = (request as any).user?.userId;
  const { pushToken } = (request.body as any) || {};

  if (!currentUserId) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  await User.findByIdAndUpdate(currentUserId, { pushToken: pushToken || null });
  console.log(`📱 [User] Updated push token for user ${currentUserId}`);

  return reply.send({
    success: true,
    message: 'Push token updated successfully',
  });
}

export async function updateSettings(request: FastifyRequest, reply: FastifyReply) {
  const currentUserId = (request as any).user?.userId;
  const user = await User.findById(currentUserId);

  if (!user) {
    return reply.status(404).send({ error: 'User not found' });
  }

  const body = (request.body || {}) as any;

  if (!user.settings) {
    user.settings = {
      showNotifications: true,
      messagePreviews: true,
      sounds: true,
      vibrate: true,
      readReceipts: true,
      lastSeenPrivacy: 'everyone',
    };
  }

  if (body.showNotifications !== undefined) user.settings.showNotifications = Boolean(body.showNotifications);
  if (body.messagePreviews !== undefined) user.settings.messagePreviews = Boolean(body.messagePreviews);
  if (body.sounds !== undefined) user.settings.sounds = Boolean(body.sounds);
  if (body.vibrate !== undefined) user.settings.vibrate = Boolean(body.vibrate);
  if (body.readReceipts !== undefined) user.settings.readReceipts = Boolean(body.readReceipts);
  if (body.lastSeenPrivacy !== undefined && ['everyone', 'contacts', 'nobody'].includes(body.lastSeenPrivacy)) {
    user.settings.lastSeenPrivacy = body.lastSeenPrivacy;
  }

  user.markModified('settings');
  await user.save();

  return reply.send({
    success: true,
    settings: user.settings,
  });
}

export async function submitFeedback(request: FastifyRequest, reply: FastifyReply) {
  const currentUserId = (request as any).user?.userId;
  const { category, subject, message } = (request.body || {}) as any;

  if (!message || !message.trim()) {
    return reply.status(400).send({ error: 'Message cannot be empty' });
  }

  console.log(`📩 [User Feedback] From: ${currentUserId}, Category: ${category || 'General'}, Subject: ${subject || 'No Subject'}`);
  console.log(`Message: ${message}`);

  return reply.send({
    success: true,
    message: 'Thank you for your feedback! The Cockatiel team will review it shortly.',
  });
}
