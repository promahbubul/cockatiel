import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SquarePen } from 'lucide-react-native';
import { COLORS } from '../../src/constants/theme';
import { ACTIVE_STORIES, MOCK_CHATS } from '../../src/constants/mockData';
import { SearchBar } from '../../src/components/SearchBar';
import { Avatar } from '../../src/components/Avatar';
import { ChatListItem } from '../../src/components/ChatListItem';
import { api } from '../../src/services/api';
import { socketService } from '../../src/services/socket';
import { Chat } from '../../src/types';

export default function ChatsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState<Chat[]>(MOCK_CHATS);
  const [activeContacts, setActiveContacts] = useState<any[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const fetchChats = async () => {
    try {
      const res = await api.chats.getChats();
      if (res.success && res.chats && res.chats.length > 0) {
        const formatted: Chat[] = res.chats.map((c: any) => ({
          id: c.id,
          name: c.title || 'Chat',
          avatar: c.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
          isGroup: !!c.isGroup,
          isOnline: c.participants?.some((p: any) => p.isOnline || onlineUserIds.has(p.id)),
          lastMessage: c.lastMessage?.text || 'No messages yet',
          timestamp: c.lastMessage?.timestamp
            ? new Date(c.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Now',
          unreadCount: c.unreadCount || 0,
        }));
        setChats(formatted);
      }
    } catch {
      // Keep existing/mock chats if backend is still initializing
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await api.users.getContacts();
      if (res.success && res.contacts && res.contacts.length > 0) {
        setActiveContacts(res.contacts);
        // Pre-populate online users
        const initialOnline = new Set<string>();
        res.contacts.forEach((c: any) => {
          if (c.isOnline) initialOnline.add(c.id);
        });
        setOnlineUserIds((prev) => new Set([...prev, ...initialOnline]));
      }
    } catch {
      // Keep mock
    }
  };

  useEffect(() => {
    fetchChats();
    fetchContacts();

    // Listen for online users list from server
    const unsubOnlineList = socketService.onOnlineList((ids: string[]) => {
      setOnlineUserIds((prev) => new Set([...prev, ...ids]));
    });

    // Listen for user online / offline status changes
    const unsubUserStatus = socketService.onUserStatus((data) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        if (data.isOnline) {
          next.add(data.userId);
        } else {
          next.delete(data.userId);
        }
        return next;
      });

      // Update contacts list status
      setActiveContacts((prev) =>
        prev.map((c) => (c.id === data.userId ? { ...c, isOnline: data.isOnline } : c))
      );
    });

    // Real-time new message listener to refresh chat list preview
    const unsubscribeMessage = socketService.onNewMessage(() => {
      fetchChats();
    });

    const unsubscribeChatCreated = socketService.onChatCreated(() => {
      fetchChats();
    });

    const unsubscribeChatUpdate = socketService.onChatUpdate(() => {
      fetchChats();
    });

    const unsubscribeDeleted = socketService.onMessageDeleted(() => {
      fetchChats();
    });

    return () => {
      unsubOnlineList?.();
      unsubUserStatus?.();
      unsubscribeMessage?.();
      unsubscribeChatCreated?.();
      unsubscribeChatUpdate?.();
      unsubscribeDeleted?.();
    };
  }, []);

  const handleStartDirectChat = async (userId: string) => {
    try {
      const res = await api.chats.createDirect(userId);
      if (res.success && res.chat) {
        router.push(`/conversation/${res.chat.id}`);
        return;
      }
    } catch {
      // Fallback
    }
    router.push(`/conversation/chat_${userId}`);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchChats();
    setRefreshing(false);
  };

  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Chats</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/new-message')}
          activeOpacity={0.8}
        >
          <SquarePen size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          placeholder="Search chats"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Stories / Online Active Avatars Strip */}
      <View style={styles.storiesSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesContent}
        >
          {(activeContacts.length > 0 ? activeContacts : ACTIVE_STORIES).map((contact: any) => {
            const isUserOnline = onlineUserIds.has(contact.id) || !!contact.isOnline;
            return (
              <TouchableOpacity
                key={contact.id}
                style={styles.storyItem}
                onPress={() => handleStartDirectChat(contact.id)}
                activeOpacity={0.7}
              >
                <Avatar
                  uri={contact.avatarUrl || contact.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                  size={60}
                  isOnline={isUserOnline}
                  showStoryRing={isUserOnline}
                />
                <Text style={styles.storyName} numberOfLines={1}>
                  {contact.displayName || contact.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Chat List */}
      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatListItem
            chat={item}
            onPress={() => router.push(`/conversation/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No conversations found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD6C4',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  storiesSection: {
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  storiesContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  storyItem: {
    alignItems: 'center',
    width: 68,
  },
  storyName: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text,
    marginTop: 6,
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: 4,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
});
