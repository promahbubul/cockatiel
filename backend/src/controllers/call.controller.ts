import { FastifyRequest, FastifyReply } from 'fastify';
import { Types } from 'mongoose';
import { CallLog } from '../models/CallLog.js';
import { LogCallSchema } from '../schemas/index.js';

export async function getCalls(request: FastifyRequest, reply: FastifyReply) {
  const currentUserId = (request as any).user.userId;

  const logs = await CallLog.find({
    $or: [{ callerId: new Types.ObjectId(currentUserId) }, { receiverId: new Types.ObjectId(currentUserId) }],
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('callerId', 'displayName avatarUrl email')
    .populate('receiverId', 'displayName avatarUrl email')
    .lean();

  return reply.send({
    success: true,
    calls: logs.map((log: any) => {
      const isCaller = log.callerId._id.toString() === currentUserId;
      const otherUser = isCaller ? log.receiverId : log.callerId;

      return {
        id: log._id.toString(),
        otherUser: {
          id: otherUser._id.toString(),
          displayName: otherUser.displayName,
          avatarUrl: otherUser.avatarUrl,
          email: otherUser.email,
        },
        callType: log.callType,
        direction: isCaller ? 'outgoing' : log.direction,
        duration: log.duration,
        roomName: log.roomName,
        createdAt: log.createdAt,
      };
    }),
  });
}

export async function logCall(request: FastifyRequest, reply: FastifyReply) {
  const currentUserId = (request as any).user.userId;
  const result = LogCallSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({ error: result.error.errors[0].message });
  }

  const { receiverId, callType, direction, duration, roomName } = result.data;

  const call = await CallLog.create({
    callerId: new Types.ObjectId(currentUserId),
    receiverId: new Types.ObjectId(receiverId),
    callType,
    direction,
    duration: duration || null,
    roomName,
  });

  return reply.send({
    success: true,
    call: {
      id: call._id.toString(),
      callType: call.callType,
      direction: call.direction,
      duration: call.duration,
      roomName: call.roomName,
      createdAt: call.createdAt,
    },
  });
}
