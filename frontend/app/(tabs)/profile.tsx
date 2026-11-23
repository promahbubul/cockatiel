import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  Bell,
  Shield,
  ChevronRight,
  Info,
  HeartHandshake,
  LogOut,
  Edit3,
  X,
  Check,
} from 'lucide-react-native';
import { COLORS } from '../../src/constants/theme';
import { CURRENT_USER } from '../../src/constants/mockData';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/api';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  // Profile Edit Modal State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAbout, setEditAbout] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const displayName = user?.displayName || CURRENT_USER.name;
  const userEmail = user?.email || CURRENT_USER.email;
  const avatarUrl = user?.avatarUrl || CURRENT_USER.avatar;
  const aboutText = user?.about || CURRENT_USER.about || 'Available';

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/welcome');
  };

  const handleOpenEditModal = () => {
    setEditName(displayName);
    setEditAbout(aboutText);
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Required', 'Display name cannot be empty.');
      return;
    }

    try {
      setIsSavingProfile(true);
      await updateUser({
        displayName: editName.trim(),
        about: editAbout.trim(),
      });
      setIsEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsUploading(true);
        const pickedUri = result.assets[0].uri;
        const uploadRes = await api.media.upload(pickedUri, 'cockatiel/avatars');
        if (uploadRes.success && uploadRes.url) {
          await updateUser({ avatarUrl: uploadRes.url });
          Alert.alert('Success', 'Profile photo updated successfully!');
        }
      }
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      Alert.alert('Error', err.message || 'Failed to update profile photo');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={handleOpenEditModal}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* User Info & Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            <TouchableOpacity
              style={styles.cameraBadge}
              onPress={handlePickAvatar}
              disabled={isUploading}
              activeOpacity={0.8}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Camera size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userPhone}>{userEmail}</Text>
        </View>

        {/* ABOUT Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>ABOUT</Text>
            <TouchableOpacity onPress={handleOpenEditModal} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Edit3 size={15} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.aboutCard} activeOpacity={0.7} onPress={handleOpenEditModal}>
            <Text style={styles.aboutText}>{aboutText}</Text>
          </TouchableOpacity>
        </View>

        {/* PREFERENCES Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>PREFERENCES</Text>
          <View style={styles.card}>
            {/* Notifications */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/settings/notifications')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: '#FFF2EB' }]}>
                <Bell size={20} color={COLORS.primary} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Notifications</Text>
                <Text style={styles.menuSubtitle}>Alerts, Sounds, Badges</Text>
              </View>
              <ChevronRight size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Privacy */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/settings/privacy')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: '#FEF3C7' }]}>
                <Shield size={20} color="#D97706" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Privacy</Text>
                <Text style={styles.menuSubtitle}>Last Seen, Read Receipts, Blocked</Text>
              </View>
              <ChevronRight size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* APP INFO & SUPPORT */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>MORE</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/about')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: '#FEF3C7' }]}>
                <Info size={20} color={COLORS.primary} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>About Cockatiel</Text>
                <Text style={styles.menuSubtitle}>Version 1.0.0 • Lutino Edition</Text>
              </View>
              <ChevronRight size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/support')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: '#DCFCE7' }]}>
                <HeartHandshake size={20} color="#16A34A" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Help & Support</Text>
                <Text style={styles.menuSubtitle}>FAQs, Feedback, Bug Report</Text>
              </View>
              <ChevronRight size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: '#FEE2E2' }]}>
                <LogOut size={20} color="#EF4444" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={[styles.menuTitle, { color: '#EF4444' }]}>Log Out</Text>
                <Text style={styles.menuSubtitle}>Sign out of your account</Text>
              </View>
              <ChevronRight size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <X size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Avatar inside modal */}
            <View style={styles.modalAvatarBox}>
              <View style={styles.modalAvatarWrapper}>
                <Image source={{ uri: avatarUrl }} style={styles.modalAvatarImage} />
                <TouchableOpacity
                  style={styles.modalCameraBadge}
                  onPress={handlePickAvatar}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Camera size={16} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.modalAvatarHelp}>Tap camera to update photo</Text>
            </View>

            {/* Display Name Input */}
            <Text style={styles.inputLabel}>DISPLAY NAME</Text>
            <TextInput
              style={styles.textInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your Name"
              placeholderTextColor={COLORS.textSecondary}
              maxLength={40}
            />

            {/* About / Bio Input */}
            <Text style={styles.inputLabel}>ABOUT / STATUS</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={editAbout}
              onChangeText={setEditAbout}
              placeholder="Write a status or short bio..."
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={120}
            />

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsEditModalVisible(false)}
                disabled={isSavingProfile}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveProfile}
                disabled={isSavingProfile}
                activeOpacity={0.8}
              >
                {isSavingProfile ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Check size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.saveBtnText}>Save</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
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
  content: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3.5,
    borderColor: COLORS.accentGold,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 3,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
  },
  aboutCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.text,
    fontWeight: '500',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 68,
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
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalAvatarBox: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalAvatarWrapper: {
    position: 'relative',
  },
  modalAvatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  modalCameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  modalAvatarHelp: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 4,
  },
  textInput: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    paddingTop: 10,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    minWidth: 84,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
