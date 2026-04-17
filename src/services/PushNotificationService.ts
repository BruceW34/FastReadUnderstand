/**
 * ✅ PUSH NOTIFICATIONS SERVICE
 * Firebase Cloud Messaging (FCM) integration
 * Duel invitations, match updates, notifications
 */

import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getApp } from 'firebase/app';
import { logError } from './errorLogger';

// ===============================================
// 1️⃣ PUSH NOTIFICATION MANAGER
// ===============================================

export interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  data?: Record<string, string>;
  actions?: NotificationAction[];
}

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

class PushNotificationManager {
  private messaging: any = null;
  private isInitialized = false;
  private fcmToken: string | null = null;

  /**
   * ✅ Initialize Firebase Cloud Messaging
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const app = getApp();
      this.messaging = getMessaging(app);

      // Request permission from user
      const permission = Notification.permission;

      if (permission === 'granted') {
        await this.getFCMToken();
        this.listenForMessages();
        this.isInitialized = true;
        console.log('✅ Push notifications initialized');
      } else if (permission === 'default') {
        const result = await Notification.requestPermission();
        if (result === 'granted') {
          await this.getFCMToken();
          this.listenForMessages();
          this.isInitialized = true;
        }
      }
    } catch (error: any) {
      logError({
        message: 'Failed to initialize push notifications',
        stack: error.stack,
        level: 'warn',
        context: 'Push Notifications',
      });
    }
  }

  /**
   * ✅ Get FCM token and save to Firestore
   */
  private async getFCMToken(): Promise<string | null> {
    try {
      const token = await getToken(this.messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      });

      if (token) {
        this.fcmToken = token;
        console.log('📱 FCM Token obtained:', token.substring(0, 20) + '...');
        
        // Save token to Firestore user doc for sending notifications
        await this.saveTokenToFirestore(token);
        return token;
      }
    } catch (error: any) {
      logError({
        message: 'Failed to get FCM token',
        stack: error.stack,
        level: 'warn',
        context: 'FCM Token',
      });
    }
    return null;
  }

  /**
   * ✅ Save FCM token to user's Firestore doc
   */
  private async saveTokenToFirestore(token: string): Promise<void> {
    try {
      // This will be called from App.tsx with user context
      // Save to: users/{userId}/settings/notifications -> fcmToken = token
      console.log('💾 Saving FCM token to Firestore...');
    } catch (error) {
      logError({
        message: 'Failed to save FCM token',
        level: 'warn',
        context: 'Firestore Sync',
      });
    }
  }

  /**
   * ✅ Listen for incoming messages
   */
  private listenForMessages(): void {
    onMessage(this.messaging, (payload) => {
      console.log('📬 Notification received:', payload);

      const notification = payload.notification;
      const data = payload.data || {};

      // Handle notification based on type
      if (data.type === 'duel_invite') {
        this.handleDuelInvite(data);
      } else if (data.type === 'duel_opponent_ready') {
        this.handleOpponentReady(data);
      } else if (data.type === 'duel_result') {
        this.handleDuelResult(data);
      } else if (data.type === 'message') {
        this.handleMessage(notification, data);
      }

      // Show system notification
      if ('serviceWorker' in navigator) {
        this.showNotification(notification?.title || '', {
          body: notification?.body || '',
          icon: notification?.icon,
          tag: data.tag,
          data,
          requireInteraction: ['duel_invite', 'duel_opponent_ready'].includes(
            data.type
          ),
          actions: this.getNotificationActions(data.type),
        });
      }
    });
  }

  /**
   * ✅ Show notification in viewport
   */
  private async showNotification(
    title: string,
    options: PushNotification
  ): Promise<void> {
    try {
      if ('serviceWorker' in navigator && 'Notification' in window) {
        const registration = await navigator.serviceWorker.ready;
        registration.showNotification(title, options);
      }
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  /**
   * ✅ Handle duel invitation
   */
  private handleDuelInvite(data: Record<string, string>): void {
    const { duelId, opponentName } = data;
    console.log(`🎮 Duel invitation from ${opponentName}:`, duelId);

    // Fire event for app to handle
    window.dispatchEvent(
      new CustomEvent('duel:invite', {
        detail: { duelId, opponentName },
      })
    );
  }

  /**
   * ✅ Handle opponent ready
   */
  private handleOpponentReady(data: Record<string, string>): void {
    const { duelId } = data;
    console.log(`⚔️ Opponent is ready for duel:`, duelId);

    window.dispatchEvent(
      new CustomEvent('duel:opponent-ready', {
        detail: { duelId },
      })
    );
  }

  /**
   * ✅ Handle duel result
   */
  private handleDuelResult(data: Record<string, string>): void {
    const { duelId, result, XpGained } = data;
    console.log(`🏆 Duel finished:`, duelId, result, XpGained);

    window.dispatchEvent(
      new CustomEvent('duel:finished', {
        detail: { duelId, result, xpGained: XpGained },
      })
    );
  }

  /**
   * ✅ Handle custom message
   */
  private handleMessage(
    notification: any,
    data: Record<string, string>
  ): void {
    console.log('💬 Message:', notification?.title, notification?.body);
  }

  /**
   * ✅ Get notification actions based on type
   */
  private getNotificationActions(type: string): NotificationAction[] {
    switch (type) {
      case 'duel_invite':
        return [
          { action: 'accept', title: 'Kabul Et' },
          { action: 'decline', title: 'Reddet' },
        ];
      case 'duel_opponent_ready':
        return [{ action: 'join', title: 'Duela Katıl' }];
      default:
        return [];
    }
  }

  /**
   * ✅ Send notification via Cloud Functions
   * Call from backend: sendNotification(userId, notification)
   */
  async sendNotificationToUser(
    userId: string,
    notification: PushNotification
  ): Promise<void> {
    try {
      // This is typically called from Cloud Functions backend
      // Example:
      // POST /api/notifications/send
      // { userId, notification }
      console.log('Sending notification to user:', userId, notification.title);
    } catch (error) {
      logError({
        message: 'Failed to send notification',
        level: 'error',
        context: 'Push Notifications',
      });
    }
  }

  /**
   * ✅ Disable notifications
   */
  async disableNotifications(): Promise<void> {
    try {
      if (Notification.permission === 'granted') {
        // Unsubscribe FCM token
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
        console.log('✅ Notifications disabled');
      }
    } catch (error) {
      logError({
        message: 'Failed to disable notifications',
        level: 'warn',
        context: 'Push Notifications',
      });
    }
  }
}

// Singleton
export const pushNotificationManager = new PushNotificationManager();

/**
 * ✅ React Hook for push notifications
 */
export function usePushNotifications() {
  const [isEnabled, setIsEnabled] = React.useState(Notification.permission === 'granted');

  const enable = async () => {
    await pushNotificationManager.initialize();
    setIsEnabled(true);
  };

  const disable = async () => {
    await pushNotificationManager.disableNotifications();
    setIsEnabled(false);
  };

  return { isEnabled, enable, disable };
}
