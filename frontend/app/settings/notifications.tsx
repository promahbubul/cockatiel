import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { COLORS } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const { user, updateSettings } = useAuth();

  const userSettings = user?.settings || {};
  const [showNotifications, setShowNotifications] = useState(
    userSettings.showNotifications !== undefined ? userSettings.showNotifications : true
  );
  const [messagePreviews, setMessagePreviews] = useState(
    userSettings.messagePreviews !== undefined ? userSettings.messagePreviews : true
  );
  const [sounds, setSounds] = useState(
    userSettings.sounds !== undefined ? userSettings.sounds : true
  );
  const [vibrate, setVibrate] = useState(
    userSettings.vibrate !== undefined ? userSettings.vibrate : true
  );

  useEffect(() => {
    if (user?.settings) {
      if (user.settings.showNotifications !== undefined) setShowNotifications(user.settings.showNotifications);
      if (user.settings.messagePreviews !== undefined) setMessagePreviews(user.settings.messagePreviews);
      if (user.settings.sounds !== undefined) setSounds(user.settings.sounds);
      if (user.settings.vibrate !== undefined) setVibrate(user.settings.vibrate);
    }
  }, [user?.settings]);

  const handleToggle = (key: string, val: boolean) => {
    if (key === 'showNotifications') setShowNotifications(val);
    if (key === 'messagePreviews') setMessagePreviews(val);
    if (key === 'sounds') setSounds(val);
    if (key === 'vibrate') setVibrate(val);

    updateSettings({ [key]: val });
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
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MESSAGE NOTIFICATIONS</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Show Notifications</Text>
                <Text style={styles.settingSubtitle}>Receive alerts for incoming messages</Text>
              </View>
              <Switch
                value={showNotifications}
                onValueChange={(val) => handleToggle('showNotifications', val)}
                trackColor={{ false: '#E5E7EB', true: COLORS.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Show Previews</Text>
                <Text style={styles.settingSubtitle}>Display message text in notifications</Text>
              </View>
              <Switch
                value={messagePreviews}
                onValueChange={(val) => handleToggle('messagePreviews', val)}
                trackColor={{ false: '#E5E7EB', true: COLORS.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>IN-APP ALERTS</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>In-App Sounds</Text>
                <Text style={styles.settingSubtitle}>Play cheerful chirps when sending or receiving</Text>
              </View>
              <Switch
                value={sounds}
                onValueChange={(val) => handleToggle('sounds', val)}
                trackColor={{ false: '#E5E7EB', true: COLORS.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>In-App Vibrate</Text>
                <Text style={styles.settingSubtitle}>Vibrate device on incoming flock messages</Text>
              </View>
              <Switch
                value={vibrate}
                onValueChange={(val) => handleToggle('vibrate', val)}
                trackColor={{ false: '#E5E7EB', true: COLORS.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
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
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 16,
  },
});
