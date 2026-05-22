import { Platform } from 'react-native';
import type { Notification, NotificationResponse } from 'expo-notifications';

type NotificationSetup = {
  onNotification?: (notif: Notification) => void;
  onResponse?: (response: NotificationResponse) => void;
};

export async function bootstrapPushNotifications({ onNotification, onResponse }: NotificationSetup = {}) {
  if (Platform.OS === 'web') return () => undefined;

  const { registerPushToken, setupNotificationListeners } = await import('@/lib/notifications');
  registerPushToken({ requestPermission: false }).catch(() => {});

  return setupNotificationListeners(
    onNotification ?? (() => undefined),
    onResponse ?? (() => undefined),
  );
}
