import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react-native';
import { COLORS } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const { user, updateSettings } = useAuth();

  const userSettings = user?.settings || {};
  const [readReceipts, setReadReceipts] = useState(
    userSettings.readReceipts !== undefined ? userSettings.readReceipts : true
  );
  const [lastSeen, setLastSeen] = useState<'everyone' | 'contacts' | 'nobody'>(
    userSettings.lastSeenPrivacy || 'everyone'
  );

  useEffect(() => {
    if (user?.settings) {
      if (user.settings.readReceipts !== undefined) setReadReceipts(user.settings.readReceipts);
      if (user.settings.lastSeenPrivacy) setLastSeen(user.settings.lastSeenPrivacy);
    }
  }, [user?.settings]);

  const handleLastSeenChange = (option: 'everyone' | 'contacts' | 'nobody') => {
    setLastSeen(option);
    updateSettings({ lastSeenPrivacy: option });
  };

  const handleReadReceiptsToggle = (val: boolean) => {
    setReadReceipts(val);
    updateSettings({ readReceipts: val });
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
        <Text style={styles.headerTitle}>Privacy</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Who Can See My Last Seen */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WHO CAN SEE MY LAST SEEN</Text>
          <View style={styles.card}>
            {(['everyone', 'contacts', 'nobody'] as const).map((option, idx) => (
              <React.Fragment key={option}>
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={() => handleLastSeenChange(option)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionText}>
                    {option === 'everyone' ? 'Everyone' : option === 'contacts' ? 'My Contacts' : 'Nobody'}
                  </Text>
                  {lastSeen === option && <Check size={18} color={COLORS.primary} strokeWidth={2.5} />}
                </TouchableOpacity>
                {idx < 2 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Read Receipts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MESSAGING</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Read Receipts</Text>
                <Text style={styles.settingSubtitle}>
                  If turned off, you won't send or see read receipts (amber/golden checkmarks).
                </Text>
              </View>
              <Switch
                value={readReceipts}
                onValueChange={handleReadReceiptsToggle}
                trackColor={{ false: '#E5E7EB', true: COLORS.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Blocked Users */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SECURITY</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.linkRow}
              activeOpacity={0.7}
              onPress={() => Alert.alert('Blocked Contacts', 'You currently have no blocked contacts in your flock.')}
            >
              <Text style={styles.linkText}>Blocked Contacts</Text>
              <View style={styles.linkRight}>
                <Text style={styles.linkBadge}>0</Text>
                <ChevronRight size={18} color={COLORS.textSecondary} />
              </View>
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
    paddingTop: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 10,
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  linkRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkBadge: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 16,
  },
});
