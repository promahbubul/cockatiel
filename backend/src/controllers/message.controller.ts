import { FastifyRequest, FastifyReply } from 'fastify';
import { Types } from 'mongoose';
import { Message } from '../models/Message.js';
import { Chat } from '../models/Chat.js';
import { SendMessageSchema, ReactMessageSchema } from '../schemas/index.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import { getIO } from '../sockets/index.js';

export async function getMessages(request: FastifyRequest, reply: FastifyReply) {
  const currentUserId = (request as any).user.userId;
  const { chatId } = request.params as any;
  const limit = Math.min(parseInt((request.query as any)?.limit || '50', 10), 100);
  const before = (request.query as any)?.before;

  const query: any = {
    chatId: new Types.ObjectId(chatId),
    deletedFor: { $ne: new Types.ObjectId(currentUserId) },
  };
  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('senderId', 'displayName avatarUrl')
    .lean();

  // Reset unread count for this user in this chat
  await Chat.findByIdAndUpdate(chatId, {
    $set: { [`unreadCounts.${currentUserId}`]: 0 },
  });

  return reply.send({
    success: true,
    messages: messages.reverse().map((msg: any) => ({
      id: msg._id.toString(),
      chatId: msg.chatId.toString(),
      senderId: msg.senderId?._id?.toString() || msg.senderId?.toString(),
      senderName: msg.senderId?.displayName || 'User',
      senderAvatar: msg.senderId?.avatarUrl || '',
      isMe: (msg.senderId?._id?.toString() || msg.senderId?.toString()) === currentUserId,
      content: msg.content,
      mediaUrl: msg.mediaUrl,
      mediaType: msg.mediaType,
      caption: msg.caption,
      status: msg.status,
      reactions: msg.reactions || [],
      replyTo: msg.replyTo
        ? {
            messageId: msg.replyTo.messageId?.toString(),
            senderName: msg.replyTo.senderName,
            text: msg.replyTo.text,
            mediaType: msg.replyTo.mediaType,
          }
        : undefined,
      createdAt: msg.createdAt,
    })),
  });
}

export async function sendMessage(request: FastifyRequest, reply: FastifyReply) {
  const currentUserId = (request as any).user.userId;
  const result = SendMessageSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({ error: result.error.errors[0].message });
  }

  const { chatId, content, mediaUrl, mediaType, caption, replyTo } = result.data;

  // Validate user is a participant of the chat
  const chat = await Chat.findOne({
    _id: chatId,
    participants: new Types.ObjectId(currentUserId),
  });

  if (!chat) {
    return reply.status(403).send({ error: 'Chat not found or access denied' });
  }

  const message = await Message.create({
    chatId: new Types.ObjectId(chatId),
    senderId: new Types.ObjectId(currentUserId),
    content: content || null,
    mediaUrl: mediaUrl || null,
    mediaType: mediaType || null,
    caption: caption || null,
    replyTo: replyTo
      ? {
          messageId: new Types.ObjectId(replyTo.messageId),
          senderName: replyTo.senderName,
          text: replyTo.text,
          mediaType: replyTo.mediaType,
        }
      : undefined,
    status: 'SENT',
    readBy: [new Types.ObjectId(currentUserId)],
  });

  // Update chat last message
  chat.lastMessage = {
    text: content || (mediaType ? `[${mediaType}]` : ''),
    senderId: new Types.ObjectId(currentUserId),
    timestamp: new Date(),
  };

  // Increment unread counts for all other participants
  chat.participants.forEach((pId) => {
    const idStr = pId.toString();
    if (idStr !== currentUserId) {
      const current = chat.unreadCounts.get(idStr) || 0;
      chat.unreadCounts.set(idStr, current + 1);
    }
  });

  await chat.save();

  const populated = await message.populate('senderId', 'displayName avatarUrl');

  const formattedMsg = {
    id: populated._id.toString(),
    chatId: populated.chatId.toString(),
    senderId: currentUserId,
    senderName: (populated.senderId as any)?.displayName || 'User',
    senderAvatar: (populated.senderId as any)?.avatarUrl || '',
    isMe: true,
    content: populated.content,
    mediaUrl: populated.mediaUrl,
    mediaType: populated.mediaType,
    caption: populated.caption,
    status: populated.status,
    reactions: populated.reactions,
    replyTo: populated.replyTo
      ? {
          messageId: populated.replyTo.messageId?.toString(),
          senderName: populated.replyTo.senderName,
          text: populated.replyTo.text,
          mediaType: populated.replyTo.mediaType,
        }
      : undefined,
    createdAt: populated.createdAt,
  };

  // Real-time broadcast
  const io = getIO();
  if (io) {
    io.to(`chat:${chatId}`).emit('message:new', formattedMsg);
    chat.participants.forEach((pId) => {
      io.to(`user:${pId.toString()}`).emit('message:new', formattedMsg);
      io.to(`user:${pId.toString()}`).emit('chat:update', {
        chatId,
        lastMessage: chat.lastMessage,
      });
    });
  }

  return reply.send({
    success: true,
    message: formattedMsg,
  });
}

export async function reactMessage(request: FastifyRequest, reply: FastifyReply) {
  const currentUserId = (request as any).user.userId;
  const result = ReactMessageSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({ error: result.error.errors[0].message });
  }

  const { messageId, emoji } = result.data;
  const message = await Message.findById(messageId);
  if (!message) {
    return reply.status(404).send({ error: 'Message not found' });
  }

  // Remove previous reaction from this user if exists
  message.reactions = message.reactions.filter(
    (r) => r.userId.toString() !== currentUserId
  );

  // Add new reaction
  message.reactions.push({
    userId: new Types.ObjectId(currentUserId),
    emoji,
    createdAt: new Date(),
  });

  await message.save();

  const formattedReactions = message.reactions.map((r: any) => ({
    userId: r.userId.toString(),
    emoji: r.emoji,
  }));

  const io = getIO();
  if (io) {
    io.to(`chat:${message.chatId.toString()}`).emit('message:react', {
      messageId: message._id.toString(),
      chatId: message.chatId.toString(),
      reactions: formattedReactions,
    });
  }

  return reply.send({
    success: true,
    reactions: formattedReactions,
  });
}

export async function uploadMedia(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: 'No file provided' });
    }

    const folder = ((request.query as any)?.folder || (data.fields as any)?.folder?.value || 'cockatiel/chats') as string;
    const buffer = await data.toBuffer();
    const result = await uploadToCloudinary(buffer, folder);

    return reply.send({
      success: true,
      url: (result as any).secure_url || (result as any).url,
      publicId: (result as any).public_id,
      format: (result as any).format,
      bytes: (result as any).bytes,
    });
  } catch (error: any) {
    return reply.status(500).send({ error: error.message || 'Media upload failed' });
  }
}

export async function deleteMessage(
  request: FastifyRequest<{ Params: { id: string }; Querystring: { forEveryone?: string } }>,
  reply: FastifyReply
) {
  const currentUserId = (request as any).user.userId;
  const { id } = request.params;
  const forEveryone = request.query?.forEveryone === 'true';

  const message = await Message.findById(id);
  if (!message) {
    return reply.status(404).send({ error: 'Message not found' });
  }

  const chatId = message.chatId.toString();

  if (forEveryone) {
    if (message.senderId.toString() !== currentUserId) {
      return reply.status(403).send({ error: 'You can only unsend your own messages' });
    }

    await Message.findByIdAndDelete(id);

    // Update chat last message
    const chat = await Chat.findById(chatId);
    if (chat) {
      const lastMsg = await Message.findOne({ chatId: new Types.ObjectId(chatId) }).sort({ createdAt: -1 });
      if (lastMsg) {
        chat.lastMessage = {
          text: lastMsg.content || (lastMsg.mediaType ? `[${lastMsg.mediaType}]` : ''),
          senderId: lastMsg.senderId,
          timestamp: lastMsg.createdAt,
        };
      } else {
        chat.lastMessage = undefined;
      }
      await chat.save();
    }

    // Real-time broadcast
    const io = getIO();
    if (io) {
      io.to(`chat:${chatId}`).emit('message:deleted', { messageId: id, chatId });
      if (chat && chat.participants) {
        chat.participants.forEach((pId) => {
          io.to(`user:${pId.toString()}`).emit('message:deleted', { messageId: id, chatId });
        });
      }
    }

    return reply.send({
      success: true,
      messageId: id,
      chatId,
      forEveryone: true,
    });
  } else {
    // Delete for Me: Hide from current user
    await Message.findByIdAndUpdate(id, {
      $addToSet: { deletedFor: new Types.ObjectId(currentUserId) },
    });

    return reply.send({
      success: true,
      messageId: id,
      chatId,
      forEveryone: false,
    });
  }
}
