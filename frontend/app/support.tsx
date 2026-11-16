import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Coffee, ExternalLink } from 'lucide-react-native';
import { COLORS } from '../src/constants/theme';

export default function SupportScreen() {
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
        <Text style={styles.title}>Support</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Creator Info */}
        <View style={styles.creatorSection}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80' }}
            style={styles.creatorAvatar}
          />
          <Text style={styles.sectionTitle}>About Me</Text>
          <Text style={styles.bioText}>
            Hi, I'm Iqbal, a mobile app designer. I create resources to help you design better apps. If you find my work useful, please support me to keep making more.
          </Text>
        </View>

        {/* Support Option */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <TouchableOpacity
            style={styles.coffeeCard}
            onPress={() => Linking.openURL('https://buymeacoffee.com/ansyoriigbm')}
            activeOpacity={0.8}
          >
            <View style={styles.coffeeIconContainer}>
              <Coffee size={24} color="#000000" />
            </View>
            <View style={styles.coffeeTextContainer}>
              <Text style={styles.coffeeTitle}>Buy Me A Coffee</Text>
              <Text style={styles.coffeeLink}>buymeacoffee.com/ansyoriigbm</Text>
            </View>
            <ExternalLink size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Social Media */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social Media</Text>
          <TouchableOpacity
            style={styles.socialLink}
            onPress={() => Linking.openURL('https://ui8.net')}
            activeOpacity={0.7}
          >
            <Text style={styles.socialLinkText}>UI8 - TwoLight</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialLink}
            onPress={() => Linking.openURL('https://dribbble.com/iqbalansyori')}
            activeOpacity={0.7}
          >
            <Text style={styles.socialLinkText}>Dribbble - iqbalansyori</Text>
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
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  creatorSection: {
    marginBottom: 28,
  },
  creatorAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 10,
  },
  bioText: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.text,
  },
  coffeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  coffeeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FDE047',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  coffeeTextContainer: {
    flex: 1,
  },
  coffeeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  coffeeLink: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textDecorationLine: 'underline',
  },
  socialLink: {
    paddingVertical: 8,
  },
  socialLinkText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    textDecorationLine: 'underline',
  },
});
