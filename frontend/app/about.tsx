import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Sparkles,
  MessageSquare,
  Mic,
  Video,
  Cloud,
  Shield,
  Heart,
  Code2,
  ExternalLink,
} from 'lucide-react-native';
import { COLORS } from '../src/constants/theme';

export default function AboutScreen() {
  const router = useRouter();

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
        <Text style={styles.title}>About Cockatiel</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.crestCircle}>
            <Text style={styles.mascotEmoji}>🦜</Text>
          </View>
          <Text style={styles.heroTitle}>Cockatiel</Text>
          <Text style={styles.heroVersion}>Version 1.0.0 • Lutino Edition</Text>
          <Text style={styles.heroTagline}>
            Real-time messaging, voice notes & calling crafted with feather-light warmth and elegance.
          </Text>
        </View>

        {/* Story Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>THE STORY</Text>
          <View style={styles.card}>
            <Text style={styles.paragraph}>
              Cockatiel was inspired by the cheerful, melodic Australian Cockatiel bird — beloved for its expressive orange crest, friendly whistles, and loyal bond with its flock.
            </Text>
            <Text style={styles.paragraph}>
              We wanted to create a communication sanctuary away from corporate blues: a warm, natural space where your conversations feel as effortless, joyful, and musical as bird song.
            </Text>
          </View>
        </View>

        {/* Key Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>KEY CAPABILITIES</Text>

          <View style={styles.card}>
            <View style={styles.featureRow}>
              <View style={[styles.featureIconBox, { backgroundColor: '#FFF2EB' }]}>
                <MessageSquare size={20} color={COLORS.primary} />
              </View>
              <View style={styles.featureTextCol}>
                <Text style={styles.featureTitle}>Real-Time Messaging</Text>
                <Text style={styles.featureDesc}>Instant multi-room socket delivery with live typing indicators & unread counters.</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.featureRow}>
              <View style={[styles.featureIconBox, { backgroundColor: '#FEF3C7' }]}>
                <Mic size={20} color="#D97706" />
              </View>
              <View style={styles.featureTextCol}>
                <Text style={styles.featureTitle}>Waveform Voice Notes</Text>
                <Text style={styles.featureDesc}>Studio-grade audio recording, dynamic playback waveform & Cloudinary storage.</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.featureRow}>
              <View style={[styles.featureIconBox, { backgroundColor: '#E0F2FE' }]}>
                <Video size={20} color="#0284C7" />
              </View>
              <View style={styles.featureTextCol}>
                <Text style={styles.featureTitle}>Crystal-Clear Calls</Text>
                <Text style={styles.featureDesc}>Full-screen ringing, call signaling, live timers & call history logs.</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.featureRow}>
              <View style={[styles.featureIconBox, { backgroundColor: '#F3E8FF' }]}>
                <Cloud size={20} color="#9333EA" />
              </View>
              <View style={styles.featureTextCol}>
                <Text style={styles.featureTitle}>Cloudinary Media Vault</Text>
                <Text style={styles.featureDesc}>High-speed image upload & shared photo galleries across direct and group chats.</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.featureRow}>
              <View style={[styles.featureIconBox, { backgroundColor: '#DCFCE7' }]}>
                <Shield size={20} color="#16A34A" />
              </View>
              <View style={styles.featureTextCol}>
                <Text style={styles.featureTitle}>Unsend & Privacy</Text>
                <Text style={styles.featureDesc}>Real-time message unsend for everyone, presence status & granular controls.</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tech Stack */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>UNDER THE HOOD</Text>
          <View style={styles.card}>
            <View style={styles.techPillGrid}>
              {['Expo SDK 58', 'React 19', 'React Native 0.88', 'Fastify', 'MongoDB', 'Socket.IO', 'Cloudinary', 'TypeScript'].map((tech) => (
                <View key={tech} style={styles.techPill}>
                  <Text style={styles.techPillText}>{tech}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.footerText}>Crafted with </Text>
            <Heart size={14} color="#EF4444" fill="#EF4444" />
            <Text style={styles.footerText}> for the flock</Text>
          </View>
          <Text style={styles.copyrightText}>© 2026 Cockatiel Communications Inc.</Text>
        </View>
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
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  crestCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3C7',
    borderWidth: 3,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  mascotEmoji: {
    fontSize: 42,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  heroVersion: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 4,
    marginBottom: 10,
  },
  heroTagline: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.text,
    marginBottom: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  featureIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureTextCol: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  techPillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  techPill: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  techPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  footer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  copyrightText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
});
