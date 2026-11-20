import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  Phone,
  Video,
  Search,
  Bell,
  Image as ImageIcon,
  ChevronRight,
  ShieldAlert,
  UserX,
  Users,
  LogOut,
} from 'lucide-react-native';
import { COLORS } from '../../src/constants/theme';
import { api } from '../../src/services/api';
import { socketService } from '../../src/services/socket';
import { useAuth } from '../../src/context/AuthContext';
import { Avatar } from '../../src/components/Avatar';

export default function ChatInfoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const chatId = String(id || '');
  const { user } = useAuth();

  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [chat, setChat] = useState<any>(null);
  const [sharedImages, setSharedImages] = useState<string[]>([]);
  const [otherUser, setOtherUser] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        if (chatId.length === 24) {
          const [chatRes, msgRes] = await Promise.all([
            api.chats.getById(chatId).catch(() => null),
            api.messages.getMessages(chatId, 100).catch(() => null),
          ]);

          if (mounted && chatRes?.success && chatRes.chat) {
            setChat(chatRes.chat);
            const other = chatRes.chat.participants?.find((p: any) => p.id !== user?.id);
            setOtherUser(other || null);
          }

          if (mounted && msgRes?.success && msgRes.messages) {
            const images = msgRes.messages
              .filter((m: any) => m.mediaUrl && m.mediaType !== 'AUDIO')
              .map((m: any) => m.mediaUrl);
            setSharedImages(images);
          }
        }
      } catch (err) {
        console.error('Error loading chat info:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [chatId, user?.id]);

  const displayName = chat?.isGroup
    ? chat.title
    : otherUser?.displayName || chat?.title || 'User';
  const displayAvatar = chat?.isGroup
    ? chat.avatarUrl || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400'
    : otherUser?.avatarUrl || chat?.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400';
  const displaySubtitle = chat?.isGroup
    ? `${chat.participants?.length || 0} members`
    : otherUser?.email || otherUser?.about || 'Available on Cockatiel 🦜';

  const handleStartCall = (callType: 'audio' | 'video') => {
    const roomName = `call_${Date.now()}`;
    const targetUserId = otherUser?.id || '';

    if (targetUserId && user?.id) {
      socketService.initiateCall({
        toUserId: targetUserId,
        caller: {
          id: user.id,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
        callType,
        roomName,
      });
    }

    router.push({
      pathname: '/call/ringing',
      params: {
        name: displayName,
        avatar: displayAvatar,
        type: callType,
        isIncoming: 'false',
        toUserId: targetUserId,
        roomName,
      },
    });
  };

  const handleBlockUser = () => {
    Alert.alert(
      'Block Contact',
      `Are you sure you want to block ${displayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Blocked', `${displayName} has been blocked.`);
            router.back();
          },
        },
      ]
    );
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
        <Text style={styles.headerTitle}>{chat?.isGroup ? 'Group Details' : 'Contact Info'}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : (
          <>
            {/* User Profile Card */}
            <View style={styles.userSection}>
              <Avatar
                uri={displayAvatar}
                size={96}
                isOnline={otherUser?.isOnline}
                showStoryRing={otherUser?.isOnline}
              />
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.subtitle}>{displaySubtitle}</Text>
            </View>

            {/* Quick Action Buttons (Only for 1-to-1 chats) */}
            {!chat?.isGroup && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => handleStartCall('audio')}
                  activeOpacity={0.7}
                >
                  <View style={styles.actionIconContainer}>
                    <Phone size={22} color={COLORS.primary} />
                  </View>
                  <Text style={styles.actionLabel}>Audio</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => handleStartCall('video')}
                  activeOpacity={0.7}
                >
                  <View style={styles.actionIconContainer}>
                    <Video size={22} color={COLORS.primary} />
                  </View>
                  <Text style={styles.actionLabel}>Video</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => router.back()}
                  activeOpacity={0.7}
                >
                  <View style={styles.actionIconContainer}>
                    <Search size={22} color={COLORS.primary} />
                  </View>
                  <Text style={styles.actionLabel}>Chat</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Shared Media Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>
                  SHARED PHOTOS ({sharedImages.length})
                </Text>
              </View>

              {sharedImages.length === 0 ? (
                <View style={styles.emptyMediaBox}>
                  <ImageIcon size={32} color={COLORS.textSecondary} />
                  <Text style={styles.emptyMediaText}>No shared photos in this conversation yet</Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaRow}>
                  {sharedImages.map((uri, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => router.push({ pathname: '/media-viewer', params: { uri } })}
                      activeOpacity={0.8}
                      style={styles.mediaThumbWrapper}
                    >
                      <Image source={{ uri }} style={styles.mediaThumb} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Group Members Section (if group chat) */}
            {chat?.isGroup && chat.participants && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  MEMBERS ({chat.participants.length})
                </Text>
                <View style={styles.card}>
                  {chat.participants.map((member: any) => (
                    <View key={member.id} style={styles.memberRow}>
                      <Avatar uri={member.avatarUrl} size={40} isOnline={member.isOnline} />
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{member.displayName}</Text>
                        <Text style={styles.memberEmail}>{member.email}</Text>
                      </View>
                      {member.id === user?.id && (
                        <View style={styles.youBadge}>
                          <Text style={styles.youBadgeText}>You</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Options List */}
            <View style={styles.card}>
              <View style={styles.menuRow}>
                <View style={styles.menuLeft}>
                  <Bell size={20} color={COLORS.text} style={styles.menuIcon} />
                  <Text style={styles.menuText}>Mute Notifications</Text>
                </View>
                <Switch
                  value={isMuted}
                  onValueChange={setIsMuted}
                  trackColor={{ false: '#E5E7EB', true: COLORS.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Destructive Actions */}
            <View style={[styles.card, styles.dangerCard]}>
              <TouchableOpacity
                style={styles.dangerRow}
                onPress={handleBlockUser}
                activeOpacity={0.7}
              >
                <UserX size={20} color="#EF4444" style={styles.menuIcon} />
                <Text style={styles.dangerText}>
                  {chat?.isGroup ? 'Leave Group' : `Block ${displayName}`}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background, // Feather Ivory #FAF9F6
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  backButton: {
    padding: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  content: {
    paddingBottom: 40,
  },
  userSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    paddingVertical: 12,
    marginBottom: 16,
  },
  actionItem: {
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight, // #FFF2EB
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#FFD6C4',
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  section: {
    marginTop: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  mediaRow: {
    flexDirection: 'row',
  },
  mediaThumbWrapper: {
    marginRight: 10,
  },
  mediaThumb: {
    width: 84,
    height: 84,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyMediaBox: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyMediaText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  card: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  memberEmail: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  youBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  youBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  dangerCard: {
    borderColor: '#FEE2E2',
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dangerText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
});
