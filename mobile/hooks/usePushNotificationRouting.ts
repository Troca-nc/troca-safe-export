import { useEffect } from 'react';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import { bootstrapPushNotifications } from '@/lib/pushBootstrap';

export function usePushNotificationRouting(enabled: boolean) {
  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;

    let cleanup: (() => void) | undefined;

    bootstrapPushNotifications({
      onNotification: (notif) => {
        console.log('[push] received:', notif.request.content.title);
      },
      onResponse: (response) => {
        const data = response.notification.request.content.data as Record<string, unknown>;
        if (data?.type === 'new_message' && data?.convId) {
          router.push(`/messages/${data.convId}`);
        } else if (data?.type === 'new_listing' && data?.listingId) {
          router.push(`/annonce/${data.listingId}`);
        }
      },
    }).then((dispose) => {
      cleanup = dispose;
    });

    return () => cleanup?.();
  }, [enabled]);
}
