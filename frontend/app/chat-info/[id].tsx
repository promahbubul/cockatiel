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
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
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
  UserPlus,
  UserMinus,
  Edit3,
  Camera,
  Check,
  X,
  Crown,
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

  // Group Management Modals & State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupAvatar, setEditGroupAvatar] = useState('');
  const [isSavingGroup, setIsSavingGroup] = useState(false);

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingMemberId, setAddingMemberId] = useState<string | null>(null);

  const isAdmin = Boolean(
    chat?.isGroup &&
      (chat?.admins?.includes(user?.id) || chat?.admins?.some?.((a: any) => a === user?.id || a?.id === user?.id))
  );

  const loadData = async () => {
    try {
      if (chatId.length === 24) {
        const [chatRes, msgRes] = await Promise.all([
          api.chats.getById(chatId).catch(() => null),
          api.messages.getMessages(chatId, 100).catch(() => null),
        ]);

        if (chatRes?.success && chatRes.chat) {
          setChat(chatRes.chat);
          const other = chatRes.chat.participants?.find((p: any) => p.id !== user?.id);
          setOtherUser(other || null);
          setEditGroupName(chatRes.chat.title || '');
          setEditGroupAvatar(chatRes.chat.avatarUrl || '');
        }

        if (msgRes?.success && msgRes.messages) {
          const images = msgRes.messages
            .filter((m: any) => m.mediaUrl && m.mediaType !== 'AUDIO')
            .map((m: any) => m.mediaUrl);
          setSharedImages(images);
        }
      }
    } catch (err) {
      console.error('Error loading chat info:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen to real-time chat updates
    const socket = socketService.getSocket();
    if (socket) {
      const handleChatUpdated = (data: any) => {
        if (data.chatId === chatId) {
          setChat((prev: any) =>
            prev ? { ...prev, title: data.groupName || prev.title, avatarUrl: data.groupAvatar || prev.avatarUrl } : prev
          );
        }
      };

      const handleMemberAdded = (data: any) => {
        if (data.chatId === chatId) {
          loadData();
        }
      };

      const handleMemberRemoved = (data: any) => {
        if (data.chatId === chatId) {
          if (data.memberId === user?.id) {
            Alert.alert('Group Notification', 'You have been removed from this group.');
            router.replace('/(tabs)/chats');
          } else {
            loadData();
          }
        }
      };

      socket.on('chat:updated', handleChatUpdated);
      socket.on('chat:memberAdded', handleMemberAdded);
      socket.on('chat:memberRemoved', handleMemberRemoved);

      return () => {
        socket.off('chat:updated', handleChatUpdated);
        socket.off('chat:memberAdded', handleMemberAdded);
        socket.off('chat:memberRemoved', handleMemberRemoved);
      };
    }
  }, [chatId, user?.id]);

  // Search users to add to group
  useEffect(() => {
    if (!isAddModalVisible) return;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.users.search(searchQuery.trim());
        if (res.success && res.users) {
          // Filter out users who are already in the group
          const currentMemberIds = (chat?.participants || []).map((p: any) => p.id);
          const filtered = res.users.filter((u: any) => !currentMemberIds.includes(u.id));
          setSearchResults(filtered);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, isAddModalVisible, chat?.participants]);

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

  const handlePickGroupAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      try {
        setIsSavingGroup(true);
        const uploaded = await api.media.upload(result.assets[0].uri, 'cockatiel/groups');
        if (uploaded.success && uploaded.url) {
          setEditGroupAvatar(uploaded.url);
        }
      } catch (err: any) {
        Alert.alert('Upload Failed', err.message || 'Could not upload group avatar.');
      } finally {
        setIsSavingGroup(false);
      }
    }
  };

  const handleSaveGroupChanges = async () => {
    if (!editGroupName.trim()) {
      Alert.alert('Required', 'Group name cannot be empty.');
      return;
    }
    try {
      setIsSavingGroup(true);
      const res = await api.chats.updateGroup(chatId, {
        groupName: editGroupName.trim(),
        groupAvatar: editGroupAvatar || undefined,
      });
      if (res.success) {
        setChat((prev: any) => ({
          ...prev,
          title: res.chat.groupName,
          avatarUrl: res.chat.groupAvatar,
        }));
        setIsEditModalVisible(false);
        Alert.alert('Success', 'Group info updated.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not update group.');
    } finally {
      setIsSavingGroup(false);
    }
  };

  const handleAddMember = async (memberId: string) => {
    try {
      setAddingMemberId(memberId);
      const res = await api.chats.addMembers(chatId, [memberId]);
      if (res.success) {
        setChat((prev: any) => ({
          ...prev,
          participants: res.participants,
        }));
        setSearchResults((prev) => prev.filter((u) => u.id !== memberId));
        Alert.alert('Added', 'Member added to group.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not add member.');
    } finally {
      setAddingMemberId(null);
    }
  };

  const handleRemoveMember = (member: any) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member.displayName} from this group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.chats.removeMember(chatId, member.id);
              if (res.success) {
                setChat((prev: any) => ({
                  ...prev,
                  participants: (prev.participants || []).filter((p: any) => p.id !== member.id),
                }));
                Alert.alert('Removed', `${member.displayName} has been removed.`);
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not remove member.');
            }
          },
        },
      ]
    );
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group? You will no longer receive messages.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              if (user?.id) {
                await api.chats.removeMember(chatId, user.id);
              }
              Alert.alert('Left Group', 'You have left the group.');
              router.replace('/(tabs)/chats');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not leave group.');
            }
          },
        },
      ]
    );
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
        {chat?.isGroup && isAdmin ? (
          <TouchableOpacity
            onPress={() => setIsEditModalVisible(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Edit3 size={22} color={COLORS.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 28 }} />
        )}
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
                showStoryRing={Boolean(otherUser?.isOnline)}
              />
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.subtitle}>{displaySubtitle}</Text>

              {chat?.isGroup && isAdmin && (
                <View style={styles.adminTag}>
                  <Crown size={12} color="#D97706" style={{ marginRight: 4 }} />
                  <Text style={styles.adminTagText}>You are Group Admin</Text>
                </View>
              )}
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
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>
                    MEMBERS ({chat.participants.length})
                  </Text>
                  <TouchableOpacity
                    style={styles.addMemberBtn}
                    onPress={() => setIsAddModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <UserPlus size={16} color={COLORS.primary} style={{ marginRight: 4 }} />
                    <Text style={styles.addMemberBtnText}>Add Member</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.card}>
                  {chat.participants.map((member: any) => {
                    const isMemberAdmin =
                      chat.admins?.includes(member.id) ||
                      chat.admins?.some?.((a: any) => a === member.id || a?.id === member.id);
                    const isCurrentUser = member.id === user?.id;

                    return (
                      <View key={member.id} style={styles.memberRow}>
                        <Avatar uri={member.avatarUrl} size={40} isOnline={member.isOnline} />
                        <View style={styles.memberInfo}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.memberName}>{member.displayName}</Text>
                            {isMemberAdmin && (
                              <View style={styles.adminBadge}>
                                <Text style={styles.adminBadgeText}>Admin</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.memberEmail}>{member.email}</Text>
                        </View>

                        {isCurrentUser ? (
                          <View style={styles.youBadge}>
                            <Text style={styles.youBadgeText}>You</Text>
                          </View>
                        ) : isAdmin ? (
                          <TouchableOpacity
                            onPress={() => handleRemoveMember(member)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={styles.removeMemberBtn}
                          >
                            <UserMinus size={18} color="#EF4444" />
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    );
                  })}
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
                onPress={chat?.isGroup ? handleLeaveGroup : handleBlockUser}
                activeOpacity={0.7}
              >
                {chat?.isGroup ? (
                  <LogOut size={20} color="#EF4444" style={styles.menuIcon} />
                ) : (
                  <UserX size={20} color="#EF4444" style={styles.menuIcon} />
                )}
                <Text style={styles.dangerText}>
                  {chat?.isGroup ? 'Leave Group' : `Block ${displayName}`}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Edit Group Info Modal */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Group</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <X size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Avatar picker */}
            <View style={{ alignItems: 'center', marginVertical: 16 }}>
              <View style={{ position: 'relative' }}>
                <Avatar uri={editGroupAvatar || displayAvatar} size={88} />
                <TouchableOpacity
                  style={styles.avatarCameraBadge}
                  onPress={handlePickGroupAvatar}
                  disabled={isSavingGroup}
                >
                  <Camera size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 6 }}>
                Tap camera to change avatar (Cloudinary)
              </Text>
            </View>

            {/* Group Name input */}
            <Text style={styles.inputLabel}>Group Name</Text>
            <TextInput
              style={styles.textInput}
              value={editGroupName}
              onChangeText={setEditGroupName}
              placeholder="e.g. Feather Flocks"
              placeholderTextColor={COLORS.textSecondary}
              maxLength={40}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsEditModalVisible(false)}
                disabled={isSavingGroup}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveGroupChanges}
                disabled={isSavingGroup}
              >
                {isSavingGroup ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Member Search Modal */}
      <Modal visible={isAddModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Members</Text>
              <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                <X size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchBar}>
              <Search size={18} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search friends by name or email..."
                placeholderTextColor={COLORS.textSecondary}
                autoFocus
              />
            </View>

            {/* Member list / Search Results */}
            {isSearching ? (
              <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : searchResults.length === 0 ? (
              <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: COLORS.textSecondary }}>
                  {searchQuery ? 'No matching users found' : 'Type a name or email to search'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                style={{ marginTop: 8 }}
                renderItem={({ item }) => (
                  <View style={styles.searchUserRow}>
                    <Avatar uri={item.avatarUrl} size={42} isOnline={item.isOnline} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.searchUserName}>{item.displayName}</Text>
                      <Text style={styles.searchUserEmail}>{item.email}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.addBtn}
                      onPress={() => handleAddMember(item.id)}
                      disabled={addingMemberId === item.id}
                    >
                      {addingMemberId === item.id ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.addBtnText}>Add</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
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
  adminTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  adminTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
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
    backgroundColor: COLORS.primaryLight,
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
  },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  addMemberBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
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
  adminBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 6,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
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
  removeMemberBtn: {
    padding: 6,
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
    marginHorizontal: 16,
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

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    marginTop: 8,
  },
  textInput: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  saveBtn: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    minWidth: 80,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  searchUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchUserName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  searchUserEmail: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 54,
    alignItems: 'center',
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
