import { Server as SocketIOServer, Socket } from 'socket.io';
import { User } from '../models/User.js';
import { Chat } from '../models/Chat.js';

let ioInstance: SocketIOServer | null = null;

export function getIO(): SocketIOServer | null {
  return ioInstance;
}

export function setupSocketIO(io: SocketIOServer) {
  ioInstance = io;
  // Map of userId -> Set of socket IDs for multi-device support
  const userSockets = new Map<string, Set<string>>();

  io.on('connection', (socket: Socket) => {
    let currentUserId: string | null = null;

    // User authentication / register socket
    socket.on('user:join', async (data: { userId: string }) => {
      if (!data?.userId) return;
      currentUserId = data.userId;
      socket.join(`user:${currentUserId}`);

      if (!userSockets.has(currentUserId)) {
        userSockets.set(currentUserId, new Set());
      }
      userSockets.get(currentUserId)!.add(socket.id);

      try {
        await User.findByIdAndUpdate(currentUserId, { isOnline: true });
        io.emit('user:status', { userId: currentUserId, isOnline: true });
      } catch (e) {
        console.error('Error updating online status:', e);
      }
    });

    // Chat room join/leave
    socket.on('chat:join', (chatId: string) => {
      socket.join(`chat:${chatId}`);
    });

    socket.on('chat:leave', (chatId: string) => {
      socket.leave(`chat:${chatId}`);
    });

    // Typing indicators
    socket.on('typing:start', (data: { chatId: string; userId: string; userName: string }) => {
      socket.to(`chat:${data.chatId}`).emit('typing:start', data);
    });

    socket.on('typing:stop', (data: { chatId: string; userId: string }) => {
      socket.to(`chat:${data.chatId}`).emit('typing:stop', data);
    });

    // Real-time message dispatch
    socket.on('message:send', async (data: { chatId: string; message: any }) => {
      io.to(`chat:${data.chatId}`).emit('message:new', data.message);

      // Also deliver to each participant's user room
      try {
        const chat = await Chat.findById(data.chatId).select('participants');
        if (chat && chat.participants) {
          chat.participants.forEach((pId) => {
            io.to(`user:${pId.toString()}`).emit('message:new', data.message);
          });
        }
      } catch (err) {
        console.error('Error broadcasting message to participants:', err);
      }
    });

    // WebRTC Calling Signaling
    socket.on('call:initiate', (payload: {
      toUserId: string;
      caller: { id: string; displayName: string; avatarUrl: string };
      callType: 'audio' | 'video';
      roomName: string;
      sdpOffer?: any;
    }) => {
      io.to(`user:${payload.toUserId}`).emit('call:incoming', {
        caller: payload.caller,
        callType: payload.callType,
        roomName: payload.roomName,
        sdpOffer: payload.sdpOffer,
      });
    });

    socket.on('call:accept', (payload: {
      toUserId: string;
      roomName: string;
      sdpAnswer?: any;
    }) => {
      io.to(`user:${payload.toUserId}`).emit('call:accepted', {
        roomName: payload.roomName,
        sdpAnswer: payload.sdpAnswer,
      });
    });

    socket.on('call:reject', (payload: {
      toUserId: string;
      roomName: string;
      reason?: string;
    }) => {
      io.to(`user:${payload.toUserId}`).emit('call:rejected', {
        roomName: payload.roomName,
        reason: payload.reason || 'declined',
      });
    });

    socket.on('call:ice_candidate', (payload: {
      toUserId: string;
      candidate: any;
      roomName: string;
    }) => {
      io.to(`user:${payload.toUserId}`).emit('call:ice_candidate', {
        candidate: payload.candidate,
        roomName: payload.roomName,
      });
    });

    socket.on('call:end', (payload: {
      toUserId: string;
      roomName: string;
    }) => {
      io.to(`user:${payload.toUserId}`).emit('call:ended', {
        roomName: payload.roomName,
      });
    });

    // Disconnect cleanup
    socket.on('disconnect', async () => {
      if (currentUserId && userSockets.has(currentUserId)) {
        const set = userSockets.get(currentUserId)!;
        set.delete(socket.id);

        if (set.size === 0) {
          userSockets.delete(currentUserId);
          try {
            await User.findByIdAndUpdate(currentUserId, {
              isOnline: false,
              lastSeen: new Date(),
            });
            io.emit('user:status', {
              userId: currentUserId,
              isOnline: false,
              lastSeen: new Date(),
            });
          } catch (e) {
            console.error('Error updating offline status:', e);
          }
        }
      }
    });
  });
}
