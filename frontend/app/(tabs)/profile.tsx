import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Camera, Bell, Shield, ChevronRight, Info, HeartHandshake } from 'lucide-react-native';
import { COLORS } from '../../src/constants/theme';
import { CURRENT_USER } from '../../src/constants/mockData';

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* User Info & Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: CURRENT_USER.avatar }} style={styles.avatarImage} />
            <TouchableOpacity style={styles.cameraBadge} activeOpacity={0.8}>
              <Camera size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{CURRENT_USER.name}</Text>
          <Text style={styles.userPhone}>{CURRENT_USER.phone}</Text>
        </View>

        {/* ABOUT Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>ABOUT</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutText}>{CURRENT_USER.about}</Text>
          </View>
        </View>

        {/* PREFERENCES Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>PREFERENCES</Text>
          <View style={styles.card}>
            {/* Notifications */}
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <View style={[styles.menuIconContainer, { backgroundColor: '#E8F1FF' }]}>
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
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <View style={[styles.menuIconContainer, { backgroundColor: '#F3E8FF' }]}>
                <Shield size={20} color="#9333EA" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Privacy</Text>
                <Text style={styles.menuSubtitle}>Security, Two-step verification</Text>
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
              <View style={[styles.menuIconContainer, { backgroundColor: '#E0F2FE' }]}>
                <Info size={20} color="#0284C7" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>About Cockatiel</Text>
                <Text style={styles.menuSubtitle}>App information and credits</Text>
              </View>
              <ChevronRight size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/support')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: '#FEF3C7' }]}>
                <HeartHandshake size={20} color="#D97706" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Support & Creator</Text>
                <Text style={styles.menuSubtitle}>Buy me a coffee & social links</Text>
              </View>
              <ChevronRight size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  editButtonText: {
    fontSize: 17,
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
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  aboutCard: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 18,
    padding: 18,
  },
  aboutText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.text,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 74,
  },
});
