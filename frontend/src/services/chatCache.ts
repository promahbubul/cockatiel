import { storage } from './storage';
import { Message, Chat } from '../types';

const MSG_CACHE_PREFIX = 'cockatiel_cache_msgs_';
const DRAFT_CACHE_PREFIX = 'cockatiel_cache_draft_';
const CHAT_LIST_CACHE_KEY = 'cockatiel_cache_chat_list';

export const chatCache = {
  // Messages Cache
  async getCachedMessages(chatId: string): Promise<Message[] | null> {
    try {
      const raw = await storage.getItem(`${MSG_CACHE_PREFIX}${chatId}`);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      console.warn('Failed to parse cached messages for chat:', chatId, err);
      return null;
    }
  },

  async saveMessages(chatId: string, messages: Message[]): Promise<void> {
    try {
      // Store the last 50 messages to keep local storage lightweight
      const slice = messages.slice(-50);
      await storage.setItem(`${MSG_CACHE_PREFIX}${chatId}`, JSON.stringify(slice));
    } catch (err) {
      console.warn('Failed to save messages to cache for chat:', chatId, err);
    }
  },

  // Message Drafts
  async getDraft(chatId: string): Promise<string> {
    try {
      const raw = await storage.getItem(`${DRAFT_CACHE_PREFIX}${chatId}`);
      return raw || '';
    } catch {
      return '';
    }
  },

  async saveDraft(chatId: string, draft: string): Promise<void> {
    try {
      if (!draft.trim()) {
        await storage.removeItem(`${DRAFT_CACHE_PREFIX}${chatId}`);
      } else {
        await storage.setItem(`${DRAFT_CACHE_PREFIX}${chatId}`, draft);
      }
    } catch (err) {
      console.warn('Failed to save draft for chat:', chatId, err);
    }
  },

  async clearDraft(chatId: string): Promise<void> {
    try {
      await storage.removeItem(`${DRAFT_CACHE_PREFIX}${chatId}`);
    } catch {
      // Ignore
    }
  },

  // Chat List Cache
  async getCachedChatList(): Promise<Chat[] | null> {
    try {
      const raw = await storage.getItem(CHAT_LIST_CACHE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  async saveChatList(chats: Chat[]): Promise<void> {
    try {
      await storage.setItem(CHAT_LIST_CACHE_KEY, JSON.stringify(chats));
    } catch (err) {
      console.warn('Failed to save chat list to cache:', err);
    }
  },
};
