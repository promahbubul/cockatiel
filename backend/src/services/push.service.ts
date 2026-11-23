/**
 * Cockatiel Expo Push Notification Service
 * Sends push notifications to mobile devices via Expo's free push relay API
 */

export interface PushNotificationPayload {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string;
  badge?: number;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
}

export class PushService {
  private readonly EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

  /**
   * Check if token is a valid Expo Push Token format
   */
  isExpoPushToken(token?: string | null): boolean {
    if (!token || typeof token !== 'string') return false;
    return token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[');
  }

  /**
   * Send one or multiple push notifications
   */
  async sendPushNotification(payload: PushNotificationPayload): Promise<boolean> {
    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    const validTokens = recipients.filter((t) => this.isExpoPushToken(t));

    if (validTokens.length === 0) {
      return false;
    }

    const messages = validTokens.map((token) => ({
      to: token,
      sound: payload.sound || 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
      priority: payload.priority || 'high',
      channelId: payload.channelId || 'default',
    }));

    try {
      const response = await fetch(this.EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        console.warn(`[PushService] Expo Push API responded with status ${response.status}`);
        return false;
      }

      console.log(`📱 [PushService] Sent ${messages.length} push notification(s): "${payload.title}"`);
      return true;
    } catch (err) {
      console.warn('[PushService] Failed to send push notification:', err);
      return false;
    }
  }
}

export const pushService = new PushService();
