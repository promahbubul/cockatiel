import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';

const getSocketUrl = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname || 'localhost';
    return `http://${hostname}:5000`;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }
  return 'http://localhost:5000';
};

class SocketService {
  private socket: Socket | null = null;
  private currentUserId: string | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  connect(userId: string) {
    if (this.socket && this.currentUserId === userId && this.socket.connected) {
      return;
    }

    this.currentUserId = userId;
    this.socket = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected with ID:', this.socket?.id, 'as user:', userId);
      this.socket?.emit('user:join', { userId });
      this.bindAllListeners();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });
  }

  private bindAllListeners() {
    if (!this.socket) return;
    this.listeners.forEach((callbacks, event) => {
      this.socket?.off(event);
      this.socket?.on(event, (data: any) => {
        callbacks.forEach((cb) => {
          try {
            cb(data);
          } catch (err) {
            console.error(`[Socket] Error in listener for ${event}:`, err);
          }
        });
      });
    });
  }

  private registerListener(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    if (this.socket) {
      this.socket.off(event);
      this.socket.on(event, (data: any) => {
        this.listeners.get(event)?.forEach((cb) => {
          try {
            cb(data);
          } catch (err) {
            console.error(`[Socket] Error in listener for ${event}:`, err);
          }
        });
      });
    }

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // Room management
  joinChat(chatId: string) {
    this.socket?.emit('chat:join', chatId);
  }

  leaveChat(chatId: string) {
    this.socket?.emit('chat:leave', chatId);
  }

  // Typing
  sendTypingStart(chatId: string, userId: string, userName: string) {
    this.socket?.emit('typing:start', { chatId, userId, userName });
  }

  sendTypingStop(chatId: string, userId: string) {
    this.socket?.emit('typing:stop', { chatId, userId });
  }

  // Messages
  emitMessage(chatId: string, message: any) {
    this.socket?.emit('message:send', { chatId, message });
  }

  // Event Listeners (Fully persistent across connections)
  onNewMessage(callback: (message: any) => void) {
    return this.registerListener('message:new', callback);
  }

  onTypingStart(callback: (data: { chatId: string; userId: string; userName: string }) => void) {
    return this.registerListener('typing:start', callback);
  }

  onTypingStop(callback: (data: { chatId: string; userId: string }) => void) {
    return this.registerListener('typing:stop', callback);
  }

  onUserStatus(callback: (data: { userId: string; isOnline: boolean; lastSeen?: string }) => void) {
    return this.registerListener('user:status', callback);
  }

  onOnlineList(callback: (userIds: string[]) => void) {
    return this.registerListener('user:online_list', callback);
  }

  onChatCreated(callback: (chat: any) => void) {
    return this.registerListener('chat:created', callback);
  }

  onChatUpdate(callback: (data: { chatId: string; lastMessage: any }) => void) {
    return this.registerListener('chat:update', callback);
  }

  onMessageReact(callback: (data: { messageId: string; chatId: string; reactions: any[] }) => void) {
    return this.registerListener('message:react', callback);
  }

  onMessageDeleted(callback: (data: { messageId: string; chatId: string }) => void) {
    return this.registerListener('message:deleted', callback);
  }

  // WebRTC / Calling Signaling
  onIncomingCall(callback: (payload: any) => void) {
    return this.registerListener('call:incoming', callback);
  }

  onCallAccepted(callback: (payload: any) => void) {
    return this.registerListener('call:accepted', callback);
  }

  onCallRejected(callback: (payload: any) => void) {
    return this.registerListener('call:rejected', callback);
  }

  onCallEnded(callback: (payload: any) => void) {
    return this.registerListener('call:ended', callback);
  }

  initiateCall(payload: {
    toUserId: string;
    caller: { id: string; displayName: string; avatarUrl: string };
    callType: 'audio' | 'video';
    roomName: string;
    chatId?: string;
    sdpOffer?: any;
  }) {
    console.log('[SocketService] Emitting call:initiate to:', payload.toUserId);
    this.socket?.emit('call:initiate', payload);
  }

  acceptCall(payload: { toUserId: string; roomName: string; sdpAnswer?: any }) {
    console.log('[SocketService] Emitting call:accept to:', payload.toUserId);
    this.socket?.emit('call:accept', payload);
  }

  rejectCall(payload: { toUserId: string; roomName: string; reason?: string }) {
    console.log('[SocketService] Emitting call:reject to:', payload.toUserId);
    this.socket?.emit('call:reject', payload);
  }

  endCall(payload: { toUserId: string; roomName: string }) {
    console.log('[SocketService] Emitting call:end to:', payload.toUserId);
    this.socket?.emit('call:end', payload);
  }
}

export const socketService = new SocketService();
