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
  FlatList,
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
  UserX,
  Users,
  LogOut,
  UserPlus,
  UserMinus,
  Check,
  X,
  ShieldCheck,
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

  // Group Member Management State
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
  const [availableContacts, setAvailableContacts] = useState<any[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [isSubmittingMembers, setIsSubmittingMembers] = useState(false);

  const fetchChatDetails = async () => {
    if (chatId.length !== 24) return;
    try {
      const [chatRes, msgRes] = await Promise.all([
        api.chats.getById(chatId).catch(() => null),
        api.messages.getMessages(chatId, 100).catch(() => null),
      ]);

      if (chatRes?.success && chatRes.chat) {
        setChat(chatRes.chat);
        const other = chatRes.chat.participants?.find((p: any) => p.id !== user?.id);
        setOtherUser(other || null);
      }

      if (msgRes?.success && msgRes.messages) {
        const images = msgRes.messages
          .filter((m: any) => m.mediaUrl && m.mediaType !== 'AUDIO')
          .map((m: any) => m.mediaUrl);
        setSharedImages(images);
      }
    } catch (err) {
      console.error('Error loading chat info:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChatDetails();

    const unsubMemberAdded = socketService.on('chat:memberAdded', () => fetchChatDetails());
    const unsubMemberRemoved = socketService.on('chat:memberRemoved', () => fetchChatDetails());

    return () => {
      unsubMemberAdded?.();
      unsubMemberRemoved?.();
    };
  }, [chatId, user?.id]);

  const isAdmin = Boolean(chat?.isGroup && chat?.admins?.includes(user?.id));

  const displayName = chat?.isGroup
    ? chat.title
    : otherUser?.displayName || chat?.title || 'User';
  const displayAvatar = chat?.isGroup
    ? chat.avatarUrl || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400'
    : otherUser?.avatarUrl || chat?.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400';
  const displaySubtitle = chat?.isGroup
    ? `${chat.participants?.length || 0} members`
    : otherUser?.email || otherUser?.about || 'Available';

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

  // Open Add Members Modal & Load Contacts
  const handleOpenAddMemberModal = async () => {
    try {
      const res = await api.users.getContacts();
      if (res.success && res.contacts) {
        const existingIds = new Set((chat?.participants || []).map((p: any) => p.id));
        const eligible = res.contacts.filter((c: any) => !existingIds.has(c.id));
        setAvailableContacts(eligible);
        setSelectedContactIds(new Set());
        setAddMemberModalVisible(true);
      }
    } catch {
      Alert.alert('Error', 'Could not load contacts');
    }
  };

  const toggleSelectContact = (contactId: string) => {
    setSelectedContactIds((prev) => {
      const next = new Set(prev);
      if (next.has(contactId)) {
        next.delete(contactId);
      } else {
        next.add(contactId);
      }
      return next;
    });
  };

  const handleAddMembersSubmit = async () => {
    if (selectedContactIds.size === 0) return;
    setIsSubmittingMembers(true);
    try {
      const res = await api.chats.addMembers(chatId, Array.from(selectedContactIds));
      if (res.success) {
        setAddMemberModalVisible(false);
        await fetchChatDetails();
        Alert.alert('Success', 'Member(s) added to group');
      }
    } catch (err: any) {
      Alert.alert('Failed to add members', err.message || 'Something went wrong');
    } finally {
      setIsSubmittingMembers(false);
    }
  };

  // Remove Member (Admin action)
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
                await fetchChatDetails();
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  // Leave Group
  const handleLeaveGroup = () => {
    Alert.alert(
      'Leave Group',
      `Are you sure you want to leave ${chat?.title || 'this group'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return;
            try {
              await api.chats.removeMember(chatId, user.id);
              Alert.alert('Left Group', 'You have left the group.');
              router.replace('/(tabs)');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to leave group');
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
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : (
          <>
            {/* User / Group Profile Card */}
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

            {/* Group Members Section (if group chat) */}
            {chat?.isGroup && chat.participants && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>
                    MEMBERS ({chat.participants.length})
                  </Text>
                  <TouchableOpacity
                    style={styles.addMemberBtn}
                    onPress={handleOpenAddMemberModal}
                    activeOpacity={0.7}
                  >
                    <UserPlus size={16} color={COLORS.primary} />
                    <Text style={styles.addMemberBtnText}>Add Member</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.card}>
                  {chat.participants.map((member: any) => {
                    const isMemberAdmin = (chat.admins || []).includes(member.id);
                    const isSelf = member.id === user?.id;

                    return (
                      <View key={member.id} style={styles.memberRow}>
                        <Avatar uri={member.avatarUrl} size={40} isOnline={member.isOnline} />
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName}>{member.displayName}</Text>
                          <Text style={styles.memberEmail}>{member.email}</Text>
                        </View>

                        <View style={styles.memberBadges}>
                          {isMemberAdmin && (
                            <View style={styles.adminBadge}>
                              <ShieldCheck size={12} color="#D97706" style={{ marginRight: 3 }} />
                              <Text style={styles.adminBadgeText}>Admin</Text>
                            </View>
                          )}
                          {isSelf && (
                            <View style={styles.youBadge}>
                              <Text style={styles.youBadgeText}>You</Text>
                            </View>
                          )}
                          {isAdmin && !isSelf && (
                            <TouchableOpacity
                              onPress={() => handleRemoveMember(member)}
                              style={styles.removeMemberBtn}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <UserMinus size={18} color="#EF4444" />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
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
              {chat?.isGroup ? (
                <TouchableOpacity
                  style={styles.dangerRow}
                  onPress={handleLeaveGroup}
                  activeOpacity={0.7}
                >
                  <LogOut size={20} color="#EF4444" style={styles.menuIcon} />
                  <Text style={styles.dangerText}>Leave Group</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.dangerRow}
                  onPress={handleBlockUser}
                  activeOpacity={0.7}
                >
                  <UserX size={20} color="#EF4444" style={styles.menuIcon} />
                  <Text style={styles.dangerText}>Block {displayName}</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* ADD MEMBER MODAL */}
      <Modal
        visible={addMemberModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAddMemberModalVisible(false)}
      >
        <SafeAreaView style={styles.addModalContainer}>
          <View style={styles.addModalContent}>
            <View style={styles.addModalHeader}>
              <Text style={styles.addModalTitle}>Add Members</Text>
              <TouchableOpacity
                onPress={() => setAddMemberModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {availableContacts.length === 0 ? (
              <View style={styles.emptyContacts}>
                <Users size={40} color={COLORS.textSecondary} />
                <Text style={styles.emptyContactsText}>All contacts are already in this group.</Text>
              </View>
            ) : (
              <FlatList
                data={availableContacts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const isSelected = selectedContactIds.has(item.id);
                  return (
                    <TouchableOpacity
                      style={styles.contactItem}
                      onPress={() => toggleSelectContact(item.id)}
                      activeOpacity={0.7}
                    >
                      <Avatar uri={item.avatarUrl} size={44} isOnline={item.isOnline} />
                      <View style={styles.contactInfo}>
                        <Text style={styles.contactName}>{item.displayName}</Text>
                        <Text style={styles.contactEmail}>{item.email}</Text>
                      </View>
                      <View
                        style={[
                          styles.checkbox,
                          isSelected && styles.checkboxSelected,
                        ]}
                      >
                        {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                      </View>
                    </TouchableOpacity>
                  );
                }}
                contentContainerStyle={{ paddingVertical: 10 }}
              />
            )}

            {availableContacts.length > 0 && (
              <View style={styles.addModalFooter}>
                <TouchableOpacity
                  style={[
                    styles.submitAddBtn,
                    selectedContactIds.size === 0 && styles.submitAddBtnDisabled,
                  ]}
                  onPress={handleAddMembersSubmit}
                  disabled={selectedContactIds.size === 0 || isSubmittingMembers}
                  activeOpacity={0.8}
                >
                  {isSubmittingMembers ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitAddBtnText}>
                      Add ({selectedContactIds.size}) to Group
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
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
    marginBottom: 8,
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
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
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
    marginHorizontal: 0,
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
  memberBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
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
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
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

  // Add Member Modal
  addModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  addModalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  addModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  addModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  emptyContacts: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContactsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 12,
    fontWeight: '500',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  contactEmail: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  addModalFooter: {
    paddingTop: 14,
  },
  submitAddBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitAddBtnDisabled: {
    opacity: 0.5,
  },
  submitAddBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
