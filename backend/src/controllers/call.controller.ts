import { FastifyRequest, FastifyReply } from 'fastify';
import { Types } from 'mongoose';
import { CallLog } from '../models/CallLog.js';
import { LogCallSchema } from '../schemas/index.js';
import agoraPkg from 'agora-access-token';

const { RtcTokenBuilder, RtcRole } = agoraPkg as any;

export async function getAgoraToken(
  request: FastifyRequest<{ Querystring: { channelName?: string; uid?: string } }>,
  reply: FastifyReply
) {
  const { channelName: rawChannel, uid: queryUid } = request.query;
  const channelName = (rawChannel || 'cockatiel_call').replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 64);

  const appId = process.env.AGORA_APP_ID || '154e18901b364740bf303eb13727f22d';
  const appCertificate = process.env.AGORA_APP_CERTIFICATE || '6adaa7a957364fb8a9f189bf64ceece8';

  const uid = queryUid ? parseInt(queryUid, 10) || 0 : 0;
  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600 * 24; // 24 hours
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  try {
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      privilegeExpiredTs
    );

    return reply.send({
      success: true,
      token,
      appId,
      channelName,
      uid,
      expiresAt: privilegeExpiredTs,
    });
  } catch (err: any) {
    console.error('[AgoraToken] Failed to generate token:', err);
    return reply.status(500).send({ error: 'Failed to generate Agora token' });
  }
}

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
