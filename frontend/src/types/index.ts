export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isOnline: boolean;
  statusText?: string;
  phone?: string;
  about?: string;
}

export interface Reaction {
  emoji: string;
  count?: number;
  userId: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text?: string;
  imageUrl?: string;
  caption?: string;
  timestamp: string;
  isOutgoing: boolean;
  isRead?: boolean;
  reactions?: Reaction[];
}

export interface Chat {
  id: string;
  name: string;
  avatar: string;
  isGroup: boolean;
  isOnline: boolean;
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
}

export interface CallLogItem {
  id: string;
  name: string;
  avatar: string;
  callType: 'audio' | 'video';
  direction: 'incoming' | 'outgoing' | 'missed';
  duration?: string;
  timestamp: string;
}

export interface ContactItem {
  id: string;
  name: string;
  avatar: string;
  statusText: string;
  isOnline: boolean;
  section: string;
}
