import { Platform } from 'react-native';
import { storage } from './storage';

// Base API URL configuration
export const API_BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:5000/api'
    : 'http://localhost:5000/api';

const TOKEN_KEY = 'cockatiel_auth_token';

let cachedToken: string | null = null;

export async function setAuthToken(token: string | null) {
  cachedToken = token;
  if (token) {
    await storage.setItem(TOKEN_KEY, token);
  } else {
    await storage.removeItem(TOKEN_KEY);
  }
}

export async function getAuthToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  cachedToken = await storage.getItem(TOKEN_KEY);
  return cachedToken;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export const api = {
  // Auth
  auth: {
    // 1. Register
    register: (payload: { displayName: string; email: string; password: string }) =>
      request<{ success: boolean; message: string; demoCode?: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    // 2. Login (Email + Password)
    login: (payload: { email: string; password: string }) =>
      request<{ success: boolean; token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    // 3. Verify Email OTP
    verifyEmail: (payload: { email: string; code: string }) =>
      request<{ success: boolean; token: string; user: any }>('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    // 4. Forgot Password
    forgotPassword: (email: string) =>
      request<{ success: boolean; message: string; demoCode?: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    // 5. Reset Password
    resetPassword: (payload: { email: string; code: string; newPassword: string }) =>
      request<{ success: boolean; message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    // Legacy / Quick OTP
    sendOtp: (email: string) =>
      request<{ success: boolean; message: string; demoCode?: string }>('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    verifyOtp: (email: string, code: string) =>
      request<{ success: boolean; token: string; isNewUser: boolean; user: any }>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      }),

    getMe: () => request<{ success: boolean; user: any }>('/auth/me'),

    updateProfile: (profile: { displayName?: string; about?: string; avatarUrl?: string }) =>
      request<{ success: boolean; user: any }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profile),
      }),
  },

  // Users
  users: {
    getContacts: () => request<{ success: boolean; contacts: any[] }>('/users/contacts'),
    search: (q: string) => request<{ success: boolean; users: any[] }>(`/users/search?q=${encodeURIComponent(q)}`),
    getById: (id: string) => request<{ success: boolean; user: any }>(`/users/${id}`),
    updateSettings: (settings: Record<string, any>) =>
      request<{ success: boolean; settings: any }>('/users/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      }),
    submitFeedback: (payload: { category: string; subject?: string; message: string }) =>
      request<{ success: boolean; message: string }>('/users/feedback', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },

  // Chats
  chats: {
    getChats: () => request<{ success: boolean; chats: any[] }>('/chats'),
    getById: (id: string) => request<{ success: boolean; chat: any }>(`/chats/${id}`),
    createDirect: (recipientId: string) =>
      request<{ success: boolean; chat: any }>('/chats/direct', {
        method: 'POST',
        body: JSON.stringify({ recipientId }),
      }),
    createGroup: (groupName: string, memberIds: string[], groupAvatar?: string) =>
      request<{ success: boolean; chat: any }>('/chats/group', {
        method: 'POST',
        body: JSON.stringify({ groupName, memberIds, groupAvatar }),
      }),
    updateGroup: (chatId: string, payload: { groupName?: string; groupAvatar?: string }) =>
      request<{ success: boolean; chat: any }>(`/chats/${chatId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    addMembers: (chatId: string, memberIds: string[]) =>
      request<{ success: boolean; participants: any[] }>(`/chats/${chatId}/members`, {
        method: 'POST',
        body: JSON.stringify({ memberIds }),
      }),
    removeMember: (chatId: string, memberId: string) =>
      request<{ success: boolean; message: string }>(`/chats/${chatId}/members/${memberId}`, {
        method: 'DELETE',
      }),
    pinMessage: (chatId: string, payload: { messageId: string; text?: string; senderName?: string }) =>
      request<{ success: boolean; pinnedMessage: any }>(`/chats/${chatId}/pin`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    unpinMessage: (chatId: string) =>
      request<{ success: boolean; message: string }>(`/chats/${chatId}/pin`, {
        method: 'DELETE',
      }),
  },

  // Messages
  messages: {
    getMessages: (chatId: string, limit = 50, before?: string) =>
      request<{ success: boolean; messages: any[] }>(
        `/messages/chat/${chatId}?limit=${limit}${before ? `&before=${encodeURIComponent(before)}` : ''}`
      ),

    send: (payload: {
      chatId: string;
      content?: string;
      mediaUrl?: string;
      mediaType?: string;
      caption?: string;
      replyTo?: {
        messageId: string;
        senderName: string;
        text?: string;
        mediaType?: string;
      };
    }) =>
      request<{ success: boolean; message: any }>('/messages/send', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    react: (messageId: string, emoji: string) =>
      request<{ success: boolean; reactions: any[] }>('/messages/react', {
        method: 'POST',
        body: JSON.stringify({ messageId, emoji }),
      }),

    delete: (messageId: string, forEveryone: boolean = true) =>
      request<{ success: boolean; messageId: string; chatId: string; forEveryone?: boolean }>(
        `/messages/${messageId}${forEveryone ? '?forEveryone=true' : '?forEveryone=false'}`,
        {
          method: 'DELETE',
        }
      ),
  },

  // Media & Cloudinary Uploads
  media: {
    upload: async (uri: string, folder: string = 'cockatiel/chats') => {
      const token = await getAuthToken();
      const formData = new FormData();

      if (Platform.OS === 'web') {
        const fetchRes = await fetch(uri);
        const blob = await fetchRes.blob();
        formData.append('file', blob, 'image.jpg');
      } else {
        const filename = uri.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        formData.append('file', {
          uri,
          name: filename,
          type,
        } as any);
      }

      formData.append('folder', folder);

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/messages/upload?folder=${encodeURIComponent(folder)}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Media upload failed');
      }

      return data as { success: boolean; url: string; publicId?: string };
    },
  },

  // Calls
  calls: {
    getCalls: () => request<{ success: boolean; calls: any[] }>('/calls'),
    logCall: (payload: {
      receiverId: string;
      callType: 'audio' | 'video';
      direction: 'incoming' | 'outgoing' | 'missed';
      duration?: string;
      roomName: string;
    }) =>
      request<{ success: boolean; call: any }>('/calls/log', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },
};
