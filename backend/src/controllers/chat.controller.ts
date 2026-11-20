import { FastifyRequest, FastifyReply } from 'fastify';
import { Types } from 'mongoose';
import { Chat } from '../models/Chat.js';
import { CreateDirectChatSchema, CreateGroupChatSchema } from '../schemas/index.js';
import { getIO } from '../sockets/index.js';

export async function getChats(request: FastifyRequest, reply: FastifyReply) {
  const currentUserId = (request as any).user.userId;

  const chats = await Chat.find({
    participants: new Types.ObjectId(currentUserId),
  })
    .populate('participants', 'displayName email avatarUrl isOnline lastSeen')
    .sort({ updatedAt: -1 })
    .lean();

  return reply.send({
    success: true,
    chats: chats.map((chat: any) => {
      // For direct chats, the other participant is the chat partner
      const otherUser = !chat.isGroup
        ? chat.participants.find((p: any) => p._id.toString() !== currentUserId)
        : null;

      return {
        id: chat._id.toString(),
        isGroup: chat.isGroup,
        title: chat.isGroup ? chat.groupName : (otherUser?.displayName || 'Direct Chat'),
        avatarUrl: chat.isGroup ? chat.groupAvatar : (otherUser?.avatarUrl || ''),
        participants: chat.participants.map((p: any) => ({
          id: p._id.toString(),
          displayName: p.displayName,
          email: p.email,
          avatarUrl: p.avatarUrl,
          isOnline: p.isOnline,
        })),
        lastMessage: chat.lastMessage
          ? {
              text: chat.lastMessage.text,
              timestamp: chat.lastMessage.timestamp,
              isMe: chat.lastMessage.senderId?.toString() === currentUserId,
            }
          : null,
        unreadCount: (chat.unreadCounts && (chat.unreadCounts[currentUserId] || (chat.unreadCounts as any).get?.(currentUserId))) || 0,
        updatedAt: chat.updatedAt,
      };
    }),
  });
}

export async function getChatById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const currentUserId = (request as any).user.userId;
  const { id } = request.params;

  const chat = await Chat.findOne({
    _id: id,
    participants: new Types.ObjectId(currentUserId),
  })
    .populate('participants', 'displayName email avatarUrl isOnline lastSeen about')
    .lean();

  if (!chat) {
    return reply.status(404).send({ error: 'Chat not found' });
  }

  const otherUser = !chat.isGroup
    ? (chat.participants as any[]).find((p: any) => p._id.toString() !== currentUserId)
    : null;

  return reply.send({
    success: true,
    chat: {
      id: chat._id.toString(),
      isGroup: chat.isGroup,
      title: chat.isGroup ? chat.groupName : (otherUser?.displayName || 'Direct Chat'),
      avatarUrl: chat.isGroup ? chat.groupAvatar : (otherUser?.avatarUrl || ''),
      participants: (chat.participants as any[]).map((p: any) => ({
        id: p._id.toString(),
        displayName: p.displayName,
        email: p.email,
        avatarUrl: p.avatarUrl,
        isOnline: p.isOnline,
        about: p.about,
      })),
      lastMessage: chat.lastMessage,
      admins: (chat.admins || []).map((a: any) => a.toString()),
      pinnedMessage: chat.pinnedMessage
        ? {
            messageId: chat.pinnedMessage.messageId?.toString(),
            text: chat.pinnedMessage.text,
            senderName: chat.pinnedMessage.senderName,
            pinnedAt: chat.pinnedMessage.pinnedAt,
            pinnedBy: chat.pinnedMessage.pinnedBy?.toString(),
          }
        : null,
      unreadCount: (chat.unreadCounts && (chat.unreadCounts[currentUserId] || (chat.unreadCounts as any).get?.(currentUserId))) || 0,
      createdAt: chat.createdAt,
    },
  });
}

export async function createDirectChat(request: FastifyRequest, reply: FastifyReply) {
  const currentUserId = (request as any).user.userId;
  const result = CreateDirectChatSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({ error: result.error.errors[0].message });
  }

  const { recipientId } = result.data;
  if (recipientId === currentUserId) {
    return reply.status(400).send({ error: 'Cannot start chat with yourself' });
  }

  // Check if a direct chat between these two already exists
  let chat = await Chat.findOne({
    isGroup: false,
    participants: { $all: [new Types.ObjectId(currentUserId), new Types.ObjectId(recipientId)] },
  }).populate('participants', 'displayName email avatarUrl isOnline lastSeen');

  if (!chat) {
    chat = await Chat.create({
      isGroup: false,
      participants: [new Types.ObjectId(currentUserId), new Types.ObjectId(recipientId)],
      unreadCounts: new Map([[currentUserId, 0], [recipientId, 0]]),
    });
    chat = await chat.populate('participants', 'displayName email avatarUrl isOnline lastSeen');
  }

  const chatPayload = {
    id: chat._id.toString(),
    isGroup: chat.isGroup,
    participants: (chat.participants as any[]).map((p: any) => ({
      id: p._id.toString(),
      displayName: p.displayName,
      email: p.email,
      avatarUrl: p.avatarUrl,
      isOnline: p.isOnline,
    })),
  };

  const io = getIO();
  if (io) {
    io.to(`user:${currentUserId}`).emit('chat:created', chatPayload);
    io.to(`user:${recipientId}`).emit('chat:created', chatPayload);
  }

  return reply.send({
    success: true,
    chat: chatPayload,
  });
}

export async function createGroupChat(request: FastifyRequest, reply: FastifyReply) {
  const currentUserId = (request as any).user.userId;
  const result = CreateGroupChatSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({ error: result.error.errors[0].message });
  }

  const { groupName, groupAvatar, memberIds } = result.data;
  const allParticipantIds = Array.from(new Set([currentUserId, ...memberIds])).map(
    (id) => new Types.ObjectId(id)
  );

  const initialUnread = new Map();
  allParticipantIds.forEach((id) => initialUnread.set(id.toString(), 0));

  let chat = await Chat.create({
    isGroup: true,
    groupName,
    groupAvatar:
      groupAvatar ||
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&auto=format&fit=crop&q=80',
    participants: allParticipantIds,
    admins: [new Types.ObjectId(currentUserId)],
    unreadCounts: initialUnread,
  });

  chat = await chat.populate('participants', 'displayName email avatarUrl isOnline lastSeen');

  return reply.send({
    success: true,
    chat: {
      id: chat._id.toString(),
      isGroup: true,
      title: chat.groupName,
      avatarUrl: chat.groupAvatar,
      participants: (chat.participants as any[]).map((p: any) => ({
        id: p._id.toString(),
        displayName: p.displayName,
        email: p.email,
        avatarUrl: p.avatarUrl,
      })),
    },
  });
}

export async function updateGroup(
  request: FastifyRequest<{
    Params: { id: string };
    Body: { groupName?: string; groupAvatar?: string };
  }>,
  reply: FastifyReply
) {
  const currentUserId = (request as any).user.userId;
  const { id } = request.params;
  const { groupName, groupAvatar } = request.body || {};

  const chat = await Chat.findOne({
    _id: id,
    isGroup: true,
    participants: new Types.ObjectId(currentUserId),
  });

  if (!chat) {
    return reply.status(404).send({ error: 'Group chat not found or access denied' });
  }

  const isAdmin = chat.admins?.some((a) => a.toString() === currentUserId);
  if (!isAdmin) {
    return reply.status(403).send({ error: 'Only group admins can update group settings' });
  }

  if (groupName && groupName.trim()) {
    chat.groupName = groupName.trim();
  }
  if (groupAvatar) {
    chat.groupAvatar = groupAvatar;
  }

  await chat.save();

  const io = getIO();
  if (io) {
    io.to(`chat:${id}`).emit('chat:updated', {
      chatId: id,
      groupName: chat.groupName,
      groupAvatar: chat.groupAvatar,
    });
  }

  return reply.send({
    success: true,
    chat: {
      id: chat._id.toString(),
      groupName: chat.groupName,
      groupAvatar: chat.groupAvatar,
    },
  });
}

export async function addMembers(
  request: FastifyRequest<{
    Params: { id: string };
    Body: { memberIds: string[] };
  }>,
  reply: FastifyReply
) {
  const currentUserId = (request as any).user.userId;
  const { id } = request.params;
  const { memberIds } = request.body || {};

  if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
    return reply.status(400).send({ error: 'memberIds array is required' });
  }

  const chat = await Chat.findOne({
    _id: id,
    isGroup: true,
    participants: new Types.ObjectId(currentUserId),
  });

  if (!chat) {
    return reply.status(404).send({ error: 'Group chat not found or access denied' });
  }

  const newMemberObjectIds = memberIds
    .filter((mId) => !chat.participants.some((p) => p.toString() === mId))
    .map((mId) => new Types.ObjectId(mId));

  if (newMemberObjectIds.length === 0) {
    return reply.status(400).send({ error: 'Selected users are already members of this group' });
  }

  chat.participants.push(...newMemberObjectIds);
  await chat.save();

  const populatedChat = await Chat.findById(id).populate(
    'participants',
    'displayName email avatarUrl isOnline lastSeen about'
  );

  const io = getIO();
  if (io) {
    io.to(`chat:${id}`).emit('chat:memberAdded', {
      chatId: id,
      newMembers: memberIds,
    });
    memberIds.forEach((mId) => {
      io.to(`user:${mId}`).emit('chat:created', {
        id: chat._id.toString(),
        isGroup: true,
        title: chat.groupName,
        avatarUrl: chat.groupAvatar,
      });
    });
  }

  return reply.send({
    success: true,
    participants: (populatedChat?.participants as any[])?.map((p: any) => ({
      id: p._id.toString(),
      displayName: p.displayName,
      email: p.email,
      avatarUrl: p.avatarUrl,
      isOnline: p.isOnline,
      about: p.about,
    })),
  });
}

export async function removeMember(
  request: FastifyRequest<{
    Params: { id: string; memberId: string };
  }>,
  reply: FastifyReply
) {
  const currentUserId = (request as any).user.userId;
  const { id, memberId } = request.params;

  const chat = await Chat.findOne({
    _id: id,
    isGroup: true,
    participants: new Types.ObjectId(currentUserId),
  });

  if (!chat) {
    return reply.status(404).send({ error: 'Group chat not found or access denied' });
  }

  const isAdmin = chat.admins?.some((a) => a.toString() === currentUserId);
  const isSelf = currentUserId === memberId;

  if (!isAdmin && !isSelf) {
    return reply.status(403).send({ error: 'Only admins can remove other members' });
  }

  chat.participants = (chat.participants as Types.ObjectId[]).filter(
    (p) => p.toString() !== memberId
  );
  chat.admins = ((chat.admins || []) as Types.ObjectId[]).filter(
    (a) => a.toString() !== memberId
  );

  if (chat.admins.length === 0 && chat.participants.length > 0) {
    chat.admins.push(chat.participants[0]);
  }

  await chat.save();

  const io = getIO();
  if (io) {
    io.to(`chat:${id}`).emit('chat:memberRemoved', {
      chatId: id,
      memberId,
      leftSelf: isSelf,
    });
    io.to(`user:${memberId}`).emit('chat:removed', {
      chatId: id,
    });
  }

  return reply.send({
    success: true,
    message: isSelf ? 'Left group successfully' : 'Member removed successfully',
  });
}

export async function pinMessage(
  request: FastifyRequest<{
    Params: { id: string };
    Body: { messageId: string; text?: string; senderName?: string };
  }>,
  reply: FastifyReply
) {
  const currentUserId = (request as any).user.userId;
  const { id } = request.params;
  const { messageId, text, senderName } = request.body || {};

  if (!messageId) {
    return reply.status(400).send({ error: 'messageId is required' });
  }

  const chat = await Chat.findOne({
    _id: id,
    participants: new Types.ObjectId(currentUserId),
  });

  if (!chat) {
    return reply.status(404).send({ error: 'Chat not found or access denied' });
  }

  const pinnedData = {
    messageId: new Types.ObjectId(messageId),
    text: text || 'Pinned message',
    senderName: senderName || 'User',
    pinnedAt: new Date(),
    pinnedBy: new Types.ObjectId(currentUserId),
  };

  chat.pinnedMessage = pinnedData as any;
  await chat.save();

  const formattedPinned = {
    chatId: id,
    messageId,
    text: pinnedData.text,
    senderName: pinnedData.senderName,
    pinnedAt: pinnedData.pinnedAt,
    pinnedBy: currentUserId,
  };

  const io = getIO();
  if (io) {
    io.to(`chat:${id}`).emit('chat:pinned', formattedPinned);
  }

  return reply.send({
    success: true,
    pinnedMessage: formattedPinned,
  });
}

export async function unpinMessage(
  request: FastifyRequest<{
    Params: { id: string };
  }>,
  reply: FastifyReply
) {
  const currentUserId = (request as any).user.userId;
  const { id } = request.params;

  const chat = await Chat.findOne({
    _id: id,
    participants: new Types.ObjectId(currentUserId),
  });

  if (!chat) {
    return reply.status(404).send({ error: 'Chat not found or access denied' });
  }

  chat.pinnedMessage = undefined;
  await chat.save();

  const io = getIO();
  if (io) {
    io.to(`chat:${id}`).emit('chat:unpinned', { chatId: id });
  }

  return reply.send({
    success: true,
    message: 'Message unpinned successfully',
  });
}
