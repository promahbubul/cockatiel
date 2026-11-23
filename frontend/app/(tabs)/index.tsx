import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Image,
  Pressable,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SquarePen, Plus, X, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../../src/constants/theme';
import { ACTIVE_STORIES, MOCK_CHATS } from '../../src/constants/mockData';
import { SearchBar } from '../../src/components/SearchBar';
import { Avatar } from '../../src/components/Avatar';
import { ChatListItem } from '../../src/components/ChatListItem';
import { api } from '../../src/services/api';
import { socketService } from '../../src/services/socket';
import { chatCache } from '../../src/services/chatCache';
import { useAuth } from '../../src/context/AuthContext';
import { Chat } from '../../src/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StoryItem {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  viewersCount: number;
  isViewed: boolean;
  createdAt: string;
  expiresAt: string;
}

interface UserStoryGroup {
  userId: string;
  displayName: string;
  avatarUrl: string;
  isOnline: boolean;
  isMe: boolean;
  hasUnseen: boolean;
  stories: StoryItem[];
}

export default function ChatsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeContacts, setActiveContacts] = useState<any[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Story System State
  const [myStories, setMyStories] = useState<StoryItem[]>([]);
  const [userStoryGroups, setUserStoryGroups] = useState<UserStoryGroup[]>([]);
  const [isUploadingStory, setIsUploadingStory] = useState(false);

  // Story Viewer State
  const [viewerVisible, setViewerVisible] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const progressTimerRef = useRef<any>(null);

  const fetchChats = async () => {
    try {
      const res = await api.chats.getChats();
      if (res.success && res.chats) {
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
        chatCache.saveChatList(formatted);
      }
    } catch {
      if (chats.length === 0) setChats(MOCK_CHATS);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await api.users.getContacts();
      if (res.success && res.contacts && res.contacts.length > 0) {
        setActiveContacts(res.contacts);
        const initialOnline = new Set<string>();
        res.contacts.forEach((c: any) => {
          if (c.isOnline) initialOnline.add(c.id);
        });
        setOnlineUserIds((prev) => new Set([...prev, ...initialOnline]));
      }
    } catch {
      // Keep mock contacts
    }
  };

  const fetchStories = async () => {
    try {
      const res = await api.stories.getActive();
      if (res.success) {
        setMyStories(res.myStories || []);
        setUserStoryGroups(res.userStoryGroups || []);
      }
    } catch (err) {
      console.warn('Failed to load active stories:', err);
    }
  };

  useEffect(() => {
    chatCache.getCachedChatList().then((cached) => {
      if (cached && cached.length > 0) {
        setChats(cached);
      }
    });

    fetchChats();
    fetchContacts();
    fetchStories();

    const unsubOnlineList = socketService.onOnlineList((ids: string[]) => {
      setOnlineUserIds((prev) => new Set([...prev, ...ids]));
    });

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

      setActiveContacts((prev) =>
        prev.map((c) => (c.id === data.userId ? { ...c, isOnline: data.isOnline } : c))
      );
    });

    const unsubscribeMessage = socketService.onNewMessage(() => fetchChats());
    const unsubscribeChatCreated = socketService.onChatCreated(() => fetchChats());
    const unsubscribeChatUpdate = socketService.onChatUpdate(() => fetchChats());
    const unsubscribeDeleted = socketService.onMessageDeleted(() => fetchChats());

    // Listen for story events
    const unsubStoryCreated = socketService.on('story:created', () => fetchStories());
    const unsubStoryDeleted = socketService.on('story:deleted', () => fetchStories());

    return () => {
      unsubOnlineList?.();
      unsubUserStatus?.();
      unsubscribeMessage?.();
      unsubscribeChatCreated?.();
      unsubscribeChatUpdate?.();
      unsubscribeDeleted?.();
      unsubStoryCreated?.();
      unsubStoryDeleted?.();
    };
  }, []);

  // Story Posting Handler
  const handlePickAndUploadStory = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const selectedUri = result.assets[0].uri;
      setIsUploadingStory(true);

      const uploadRes = await api.media.upload(selectedUri, 'cockatiel/stories');
      if (uploadRes.success && uploadRes.url) {
        await api.stories.create({
          mediaUrl: uploadRes.url,
          mediaType: 'image',
          caption: '',
        });
        await fetchStories();
        Alert.alert('Story Added', 'Your 24-hour story is now live! 🦜');
      }
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message || 'Could not upload story');
    } finally {
      setIsUploadingStory(false);
    }
  };

  // Compile active viewer groups (Includes 'My Story' if it has stories)
  const allGroupsForViewer: UserStoryGroup[] = [];
  if (myStories.length > 0) {
    allGroupsForViewer.push({
      userId: user?.id || 'me',
      displayName: 'Your Story',
      avatarUrl: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      isOnline: true,
      isMe: true,
      hasUnseen: false,
      stories: myStories,
    });
  }
  userStoryGroups.forEach((g) => {
    if (g.userId !== user?.id) {
      allGroupsForViewer.push(g);
    }
  });

  const currentGroup = allGroupsForViewer[activeGroupIndex];
  const currentStories = currentGroup?.stories || [];
  const currentStory = currentStories[activeStoryIndex];

  // Story viewer playback timer
  useEffect(() => {
    if (!viewerVisible || !currentStory) return;

    // Mark current story as viewed
    if (!currentGroup.isMe && !currentStory.isViewed) {
      api.stories.view(currentStory.id).catch(() => {});
    }

    setStoryProgress(0);
    const duration = 5000;
    const interval = 50;
    const step = interval / duration;

    clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      setStoryProgress((prev) => {
        if (prev + step >= 1) {
          clearInterval(progressTimerRef.current);
          handleNextStory();
          return 1;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(progressTimerRef.current);
  }, [viewerVisible, activeGroupIndex, activeStoryIndex]);

  const handleNextStory = () => {
    if (activeStoryIndex < currentStories.length - 1) {
      setActiveStoryIndex((prev) => prev + 1);
    } else if (activeGroupIndex < allGroupsForViewer.length - 1) {
      setActiveGroupIndex((prev) => prev + 1);
      setActiveStoryIndex(0);
    } else {
      closeStoryViewer();
    }
  };

  const handlePrevStory = () => {
    if (activeStoryIndex > 0) {
      setActiveStoryIndex((prev) => prev - 1);
    } else if (activeGroupIndex > 0) {
      setActiveGroupIndex((prev) => prev - 1);
      const prevGroup = allGroupsForViewer[activeGroupIndex - 1];
      setActiveStoryIndex((prevGroup?.stories.length || 1) - 1);
    }
  };

  const openStoryViewer = (groupIndex: number, storyIndex = 0) => {
    setActiveGroupIndex(groupIndex);
    setActiveStoryIndex(storyIndex);
    setViewerVisible(true);
  };

  const closeStoryViewer = () => {
    clearInterval(progressTimerRef.current);
    setViewerVisible(false);
    fetchStories();
  };

  const handleDeleteCurrentStory = async () => {
    if (!currentStory) return;
    try {
      await api.stories.delete(currentStory.id);
      Alert.alert('Deleted', 'Story deleted successfully');
      closeStoryViewer();
      fetchStories();
    } catch {
      Alert.alert('Error', 'Failed to delete story');
    }
  };

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
    await Promise.all([fetchChats(), fetchStories()]);
    setRefreshing(false);
  };

  const filteredChats = chats.filter(
    (chat) =>
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

      {/* Stories Carousel Strip */}
      <View style={styles.storiesSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesContent}
        >
          {/* Slot 0: "Your Story" (+ or view own stories) */}
          <View style={styles.storyItem}>
            <TouchableOpacity
              onPress={() => {
                if (myStories.length > 0) {
                  openStoryViewer(0);
                } else {
                  handlePickAndUploadStory();
                }
              }}
              activeOpacity={0.8}
              style={[
                styles.storyRingWrapper,
                myStories.length > 0 ? styles.storyRingActive : styles.storyRingInactive,
              ]}
            >
              <Image
                source={{
                  uri:
                    user?.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
                }}
                style={styles.storyAvatar}
              />
              {isUploadingStory && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>

            {/* Quick add (+) button badge */}
            <TouchableOpacity
              style={styles.plusBadge}
              onPress={handlePickAndUploadStory}
              disabled={isUploadingStory}
              activeOpacity={0.8}
            >
              <Plus size={14} color="#FFFFFF" strokeWidth={3} />
            </TouchableOpacity>

            <Text style={styles.storyName} numberOfLines={1}>
              Your Story
            </Text>
          </View>

          {/* Slots 1+: Active Contacts Stories */}
          {userStoryGroups
            .filter((g) => g.userId !== user?.id && g.stories.length > 0)
            .map((group) => {
              const viewerGroupIdx = allGroupsForViewer.findIndex((g) => g.userId === group.userId);
              return (
                <View key={group.userId} style={styles.storyItem}>
                  <TouchableOpacity
                    style={[
                      styles.storyRingWrapper,
                      group.hasUnseen ? styles.storyRingActive : styles.storyRingSeen,
                    ]}
                    onPress={() => openStoryViewer(viewerGroupIdx >= 0 ? viewerGroupIdx : 0)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: group.avatarUrl }} style={styles.storyAvatar} />
                  </TouchableOpacity>
                  <Text style={styles.storyName} numberOfLines={1}>
                    {group.displayName}
                  </Text>
                </View>
              );
            })}

          {/* Active online contacts fallback strip if no stories */}
          {userStoryGroups.length === 0 &&
            (activeContacts.length > 0 ? activeContacts : ACTIVE_STORIES).map((contact: any) => {
              const isUserOnline = onlineUserIds.has(contact.id) || !!contact.isOnline;
              return (
                <TouchableOpacity
                  key={contact.id}
                  style={styles.storyItem}
                  onPress={() => handleStartDirectChat(contact.id)}
                  activeOpacity={0.7}
                >
                  <Avatar
                    uri={
                      contact.avatarUrl ||
                      contact.avatar ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
                    }
                    size={58}
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
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading conversations...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No conversations found</Text>
            </View>
          )
        }
      />

      {/* 24-HOUR FULL-SCREEN STORY VIEWER MODAL */}
      <Modal
        visible={viewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeStoryViewer}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          {currentGroup && currentStory && (
            <View style={styles.modalContent}>
              {/* Top Segmented Progress Bars */}
              <View style={styles.progressBarContainer}>
                {currentStories.map((_, idx) => {
                  let fillWidth = 0;
                  if (idx < activeStoryIndex) fillWidth = 100;
                  else if (idx === activeStoryIndex) fillWidth = Math.min(storyProgress * 100, 100);

                  return (
                    <View key={idx} style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${fillWidth}%` }]} />
                    </View>
                  );
                })}
              </View>

              {/* Story Header (User Info & Actions) */}
              <View style={styles.viewerHeader}>
                <View style={styles.viewerUserInfo}>
                  <Image source={{ uri: currentGroup.avatarUrl }} style={styles.viewerAvatar} />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.viewerUserName}>{currentGroup.displayName}</Text>
                    <Text style={styles.viewerTimestamp}>
                      {new Date(currentStory.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>

                <View style={styles.viewerHeaderActions}>
                  {currentGroup.isMe && (
                    <TouchableOpacity
                      onPress={handleDeleteCurrentStory}
                      style={styles.viewerIconBtn}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Trash2 size={20} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={closeStoryViewer}
                    style={styles.viewerIconBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <X size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Main Story Image */}
              <View style={styles.storyMediaWrapper}>
                <Image
                  source={{ uri: currentStory.mediaUrl }}
                  style={styles.storyImage}
                  resizeMode="contain"
                />

                {/* Left Tap Zone (Previous Story) */}
                <Pressable
                  style={styles.tapZoneLeft}
                  onPress={handlePrevStory}
                  android_disableSound
                />

                {/* Right Tap Zone (Next Story) */}
                <Pressable
                  style={styles.tapZoneRight}
                  onPress={handleNextStory}
                  android_disableSound
                />
              </View>

              {/* Caption Overlay */}
              {Boolean(currentStory.caption) && (
                <View style={styles.captionOverlay}>
                  <Text style={styles.captionText}>{currentStory.caption}</Text>
                </View>
              )}
            </View>
          )}
        </SafeAreaView>
      </Modal>
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
    position: 'relative',
  },
  storyRingWrapper: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  storyRingActive: {
    borderWidth: 2.5,
    borderColor: '#F97316',
  },
  storyRingSeen: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  storyRingInactive: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  storyAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E2E8F0',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusBadge: {
    position: 'absolute',
    right: 4,
    bottom: 22,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
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
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 12,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalContent: {
    flex: 1,
    position: 'relative',
  },
  progressBarContainer: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 10,
    zIndex: 20,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  viewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 20,
  },
  viewerUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  viewerUserName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  viewerTimestamp: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    fontWeight: '500',
  },
  viewerHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  viewerIconBtn: {
    padding: 4,
  },
  storyMediaWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  tapZoneLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '35%',
    zIndex: 10,
  },
  tapZoneRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '65%',
    zIndex: 10,
  },
  captionOverlay: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    zIndex: 20,
  },
  captionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
