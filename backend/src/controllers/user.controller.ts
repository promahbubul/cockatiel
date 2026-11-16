import { FastifyRequest, FastifyReply } from 'fastify';
import { User } from '../models/User.js';

export async function getContacts(request: FastifyRequest, reply: FastifyReply) {
  const currentUserId = (request as any).user?.userId;
  const users = await User.find(currentUserId ? { _id: { $ne: currentUserId } } : {})
    .select('displayName phoneNumber avatarUrl about isOnline lastSeen')
    .sort({ displayName: 1 })
    .lean();

  return reply.send({
    success: true,
    contacts: users.map((u: any) => ({
      id: u._id.toString(),
      displayName: u.displayName,
      phoneNumber: u.phoneNumber,
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
    $or: [{ displayName: regex }, { phoneNumber: regex }],
  })
    .select('displayName phoneNumber avatarUrl about isOnline lastSeen')
    .limit(20)
    .lean();

  return reply.send({
    success: true,
    users: users.map((u: any) => ({
      id: u._id.toString(),
      displayName: u.displayName,
      phoneNumber: u.phoneNumber,
      avatarUrl: u.avatarUrl,
      about: u.about,
      isOnline: u.isOnline,
      lastSeen: u.lastSeen,
    })),
  });
}

export async function getUserById(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  const user = await User.findById(id).select('displayName phoneNumber avatarUrl about isOnline lastSeen').lean();

  if (!user) {
    return reply.status(404).send({ error: 'User not found' });
  }

  return reply.send({
    success: true,
    user: {
      id: (user as any)._id.toString(),
      displayName: (user as any).displayName,
      phoneNumber: (user as any).phoneNumber,
      avatarUrl: (user as any).avatarUrl,
      about: (user as any).about,
      isOnline: (user as any).isOnline,
      lastSeen: (user as any).lastSeen,
    },
  });
}
