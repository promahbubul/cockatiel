import { Platform } from 'react-native';
import { api } from './api';

/**
 * Register the current device for push notifications
 * Supports both Web desktop notifications and native Expo Push tokens
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      // Browser Web Notifications support
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          await Notification.requestPermission().catch(() => {});
        }
      }
      return null;
    }

    // Native Mobile (Expo / React Native)
    // Dynamic import to avoid web bundling overhead
    let Notifications: any = null;
    try {
      Notifications = await import('expo-notifications');
    } catch {
      return null;
    }

    if (!Notifications) return null;

    // Configure notification handler for foreground behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Push] Notification permission not granted');
      return null;
    }

    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync().catch(() => null);
    const token = tokenData?.data;

    if (token) {
      console.log('📱 [Push] Acquired Expo Push Token:', token);
      await api.users.savePushToken(token).catch((err) => {
        console.warn('[Push] Failed to save push token on server:', err);
      });
      return token;
    }
  } catch (error) {
    console.warn('[Push] Error in registerForPushNotificationsAsync:', error);
  }

  return null;
}

/**
 * Display a local notification (e.g. for incoming messages when foregrounded)
 */
export function showLocalNotification(title: string, body: string, data?: any) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          data,
        });
      } catch (err) {
        console.warn('Web notification error:', err);
      }
    }
  }
}
