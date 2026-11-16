import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  Phone,
  Video,
  Plus,
  Smile,
  ArrowUp,
} from 'lucide-react-native';
import { COLORS } from '../../src/constants/theme';
import { MOCK_CONVERSATION_EMMA, CURRENT_USER } from '../../src/constants/mockData';
import { Message } from '../../src/types';
import { Avatar } from '../../src/components/Avatar';
import { MessageBubble } from '../../src/components/MessageBubble';
import { api } from '../../src/services/api';
import { socketService } from '../../src/services/socket';
import { useAuth } from '../../src/context/AuthContext';

export default function ConversationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const chatId = String(id || 'chat_1');
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>(MOCK_CONVERSATION_EMMA);
  const [chatInfo, setChatInfo] = useState<{
    title: string;
    avatarUrl: string;
    isOnline: boolean;
  }>({
    title: 'Emma Watson',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    isOnline: true,
  });

  const [inputText, setInputText] = useState('');
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    // Join socket room
    socketService.joinChat(chatId);

    // Fetch chat info and message history if MongoDB ObjectId (24 chars) or real chat
    const loadChatData = async () => {
      try {
        if (chatId.length === 24) {
          const [chatRes, msgRes] = await Promise.all([
            api.chats.getById(chatId).catch(() => null),
            api.messages.getMessages(chatId).catch(() => null),
          ]);

          if (chatRes?.success && chatRes.chat) {
            setChatInfo({
              title: chatRes.chat.title || 'Conversation',
              avatarUrl: chatRes.chat.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
              isOnline: chatRes.chat.participants?.some((p: any) => p.isOnline && p.id !== user?.id) || false,
            });
          }

          if (msgRes?.success && msgRes.messages && msgRes.messages.length > 0) {
            const mapped: Message[] = msgRes.messages.map((m: any) => ({
              id: m.id,
              chatId: m.chatId,
              senderId: m.senderId,
              senderName: m.senderName,
              senderAvatar: m.senderAvatar,
              text: m.content || '',
              timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isOutgoing: m.isMe,
              isRead: m.status === 'READ',
              reactions: m.reactions,
              imageUrl: m.mediaUrl,
            }));
            setMessages(mapped);
          }
        }
      } catch {
        // Fallback to mock conversation
      }
    };

    loadChatData();

    // Listen for incoming messages
    const unsubscribeMessage = socketService.onNewMessage((newMsg: any) => {
      if (newMsg.chatId === chatId) {
        const formatted: Message = {
          id: newMsg.id || `msg_${Date.now()}`,
          chatId: newMsg.chatId,
          senderId: newMsg.senderId,
          senderName: newMsg.senderName || 'User',
          senderAvatar: newMsg.senderAvatar,
          text: newMsg.content || newMsg.text || '',
          timestamp: 'Just now',
          isOutgoing: newMsg.senderId === user?.id,
          isRead: false,
          imageUrl: newMsg.mediaUrl,
        };

        setMessages((prev) => {
          if (prev.some((m) => m.id === formatted.id)) return prev;
          return [...prev, formatted];
        });

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });

    // Listen for typing events
    const unsubTypingStart = socketService.onTypingStart((data) => {
      if (data.chatId === chatId && data.userId !== user?.id) {
        setIsOtherTyping(true);
      }
    });

    const unsubTypingStop = socketService.onTypingStop((data) => {
      if (data.chatId === chatId && data.userId !== user?.id) {
        setIsOtherTyping(false);
      }
    });

    return () => {
      socketService.leaveChat(chatId);
      unsubscribeMessage?.();
      unsubTypingStart?.();
      unsubTypingStop?.();
    };
  }, [chatId, user?.id]);

  const handleInputChange = (text: string) => {
    setInputText(text);

    if (user?.id) {
      socketService.sendTypingStart(chatId, user.id, user.displayName);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketService.sendTypingStop(chatId, user.id);
      }, 2000);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const content = inputText.trim();
    setInputText('');

    const currentUserId = user?.id || CURRENT_USER.id;
    const currentUserName = user?.displayName || CURRENT_USER.name;
    const currentUserAvatar = user?.avatarUrl || CURRENT_USER.avatar;

    const tempId = `msg_${Date.now()}`;
    const localMessage: Message = {
      id: tempId,
      chatId,
      senderId: currentUserId,
      senderName: currentUserName,
      senderAvatar: currentUserAvatar,
      text: content,
      timestamp: 'Just now',
      isOutgoing: true,
      isRead: false,
    };

    setMessages((prev) => [...prev, localMessage]);
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Stop typing indicator immediately on send
    if (user?.id) {
      socketService.sendTypingStop(chatId, user.id);
    }

    try {
      if (chatId.length === 24) {
        const res = await api.messages.send({
          chatId,
          content,
        });

        if (res.success && res.message) {
          socketService.emitMessage(chatId, res.message);
        }
      } else {
        // Broadcast over socket for demo
        socketService.emitMessage(chatId, {
          id: tempId,
          chatId,
          senderId: currentUserId,
          senderName: currentUserName,
          senderAvatar: currentUserAvatar,
          content,
          createdAt: new Date().toISOString(),
        });
      }
    } catch {
      // Local optimistic message already added
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={28} color={COLORS.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerUser}
          onPress={() => router.push(`/chat-info/${chatId}`)}
          activeOpacity={0.8}
        >
          <Avatar
            uri={chatInfo.avatarUrl}
            size={40}
            isOnline={chatInfo.isOnline}
          />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerName}>{chatInfo.title}</Text>
            <Text style={styles.headerStatus}>
              {isOtherTyping ? 'Typing...' : chatInfo.isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() =>
              router.push({
                pathname: '/call/ringing',
                params: { name: chatInfo.title, avatar: chatInfo.avatarUrl, type: 'audio' },
              })
            }
            activeOpacity={0.7}
          >
            <Phone size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() =>
              router.push({
                pathname: '/call/ringing',
                params: { name: chatInfo.title, avatar: chatInfo.avatarUrl, type: 'video' },
              })
            }
            activeOpacity={0.7}
          >
            <Video size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View style={styles.dateSeparator}>
              <View style={styles.datePill}>
                <Text style={styles.dateText}>TODAY</Text>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              onImagePress={(uri) => router.push({ pathname: '/media-viewer', params: { uri } })}
            />
          )}
          contentContainerStyle={styles.messageListContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Bottom Input Bar */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton} activeOpacity={0.7}>
            <Plus size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <View style={styles.textInputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor={COLORS.textSecondary}
              value={inputText}
              onChangeText={handleInputChange}
              multiline
            />
            <TouchableOpacity style={styles.emojiButton} activeOpacity={0.7}>
              <Smile size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              inputText.trim().length > 0 && styles.sendButtonActive,
            ]}
            onPress={handleSend}
            activeOpacity={0.8}
          >
            <ArrowUp size={20} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    paddingRight: 6,
  },
  headerUser: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  headerTextContainer: {
    marginLeft: 10,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerStatus: {
    fontSize: 12,
    color: COLORS.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  messageListContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 12,
  },
  datePill: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    paddingHorizontal: 14,
    minHeight: 44,
    maxHeight: 100,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
  },
  emojiButton: {
    padding: 4,
    marginLeft: 6,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: COLORS.primary,
  },
});
