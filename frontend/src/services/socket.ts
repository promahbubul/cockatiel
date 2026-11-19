import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';

const SOCKET_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:5000'
    : 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;
  private currentUserId: string | null = null;

  connect(userId: string) {
    if (this.socket && this.currentUserId === userId && this.socket.connected) {
      return;
    }

    this.currentUserId = userId;
    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected with ID:', this.socket?.id);
      this.socket?.emit('user:join', { userId });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });
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

  // Event Listeners
  onNewMessage(callback: (message: any) => void) {
    this.socket?.on('message:new', callback);
    return () => this.socket?.off('message:new', callback);
  }

  onTypingStart(callback: (data: { chatId: string; userId: string; userName: string }) => void) {
    this.socket?.on('typing:start', callback);
    return () => this.socket?.off('typing:start', callback);
  }

  onTypingStop(callback: (data: { chatId: string; userId: string }) => void) {
    this.socket?.on('typing:stop', callback);
    return () => this.socket?.off('typing:stop', callback);
  }

  onUserStatus(callback: (data: { userId: string; isOnline: boolean; lastSeen?: string }) => void) {
    this.socket?.on('user:status', callback);
    return () => this.socket?.off('user:status', callback);
  }

  onOnlineList(callback: (userIds: string[]) => void) {
    this.socket?.on('user:online_list', callback);
    return () => this.socket?.off('user:online_list', callback);
  }

  onChatCreated(callback: (chat: any) => void) {
    this.socket?.on('chat:created', callback);
    return () => this.socket?.off('chat:created', callback);
  }

  onChatUpdate(callback: (data: { chatId: string; lastMessage: any }) => void) {
    this.socket?.on('chat:update', callback);
    return () => this.socket?.off('chat:update', callback);
  }

  onMessageReact(callback: (data: { messageId: string; chatId: string; reactions: any[] }) => void) {
    this.socket?.on('message:react', callback);
    return () => this.socket?.off('message:react', callback);
  }

  onMessageDeleted(callback: (data: { messageId: string; chatId: string }) => void) {
    this.socket?.on('message:deleted', callback);
    return () => this.socket?.off('message:deleted', callback);
  }

  // WebRTC / Calling Signaling
  onIncomingCall(callback: (payload: any) => void) {
    this.socket?.on('call:incoming', callback);
    return () => this.socket?.off('call:incoming', callback);
  }

  onCallAccepted(callback: (payload: any) => void) {
    this.socket?.on('call:accepted', callback);
    return () => this.socket?.off('call:accepted', callback);
  }

  onCallRejected(callback: (payload: any) => void) {
    this.socket?.on('call:rejected', callback);
    return () => this.socket?.off('call:rejected', callback);
  }

  onCallEnded(callback: (payload: any) => void) {
    this.socket?.on('call:ended', callback);
    return () => this.socket?.off('call:ended', callback);
  }

  initiateCall(payload: {
    toUserId: string;
    caller: { id: string; displayName: string; avatarUrl: string };
    callType: 'audio' | 'video';
    roomName: string;
    sdpOffer?: any;
  }) {
    this.socket?.emit('call:initiate', payload);
  }

  acceptCall(payload: { toUserId: string; roomName: string; sdpAnswer?: any }) {
    this.socket?.emit('call:accept', payload);
  }

  rejectCall(payload: { toUserId: string; roomName: string; reason?: string }) {
    this.socket?.emit('call:reject', payload);
  }

  endCall(payload: { toUserId: string; roomName: string }) {
    this.socket?.emit('call:end', payload);
  }
}

export const socketService = new SocketService();
