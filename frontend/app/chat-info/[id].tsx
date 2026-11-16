import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
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
} from 'lucide-react-native';
import { COLORS } from '../../src/constants/theme';

export default function ChatInfoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [isMuted, setIsMuted] = useState(false);

  const contact = {
    name: 'Emma Watson',
    phone: '+1 (555) 345-6789',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    about: 'Design & coffee enthusiast ☕✨',
  };

  const sharedMedia = [
    'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&auto=format&fit=crop&q=80',
  ];

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
        <Text style={styles.headerTitle}>Contact Info</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.userSection}>
          <Image source={{ uri: contact.avatar }} style={styles.avatar} />
          <Text style={styles.name}>{contact.name}</Text>
          <Text style={styles.phone}>{contact.phone}</Text>
          <Text style={styles.about}>{contact.about}</Text>
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => router.push({ pathname: '/call/audio', params: { name: contact.name, avatar: contact.avatar } })}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconContainer}>
              <Phone size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.actionLabel}>Audio</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => router.push({ pathname: '/call/video', params: { name: contact.name, avatar: contact.avatar } })}
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
            <Text style={styles.actionLabel}>Search</Text>
          </TouchableOpacity>
        </View>

        {/* Media & Docs Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>SHARED MEDIA</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaRow}>
            {sharedMedia.map((uri, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => router.push({ pathname: '/media-viewer', params: { uri } })}
                activeOpacity={0.8}
              >
                <Image source={{ uri }} style={styles.mediaThumb} />
              </TouchableOpacity>
            ))}
          </ScrollView>
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
          <TouchableOpacity style={styles.dangerRow} activeOpacity={0.7}>
            <UserX size={20} color="#EF4444" style={styles.menuIcon} />
            <Text style={styles.dangerText}>Block {contact.name}</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.dangerRow} activeOpacity={0.7}>
            <ShieldAlert size={20} color="#EF4444" style={styles.menuIcon} />
            <Text style={styles.dangerText}>Report Contact</Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  phone: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  about: {
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
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  mediaRow: {
    flexDirection: 'row',
  },
  mediaThumb: {
    width: 90,
    height: 90,
    borderRadius: 12,
    marginRight: 10,
  },
  card: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
    marginBottom: 16,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
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
    backgroundColor: '#FEF2F2',
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  dangerText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
  divider: {
    height: 1,
    backgroundColor: '#FEE2E2',
    marginLeft: 48,
  },
});
