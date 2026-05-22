import { useEffect } from 'react';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import { requestPushPermissionPrompt } from '@/lib/notifications';
import { bootstrapPushNotifications } from '@/lib/pushBootstrap';
import { messagingSocket } from '@/lib/socket';

export function usePushNotificationRouting(enabled: boolean) {
  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;

    let cleanup: (() => void) | undefined;
    let socketCleanup: (() => void) | undefined;

    bootstrapPushNotifications({
      onNotification: (notif) => {
        const data = notif.request.content.data as Record<string, unknown> | undefined;
        if (data?.type === 'new_message') {
          requestPushPermissionPrompt();
        }
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

    // TODO: test E2E sur le prompt notifications apres le premier message recu.
    void messagingSocket.connect();
    const onSocketNotification = (notif: { type: string }) => {
      if (notif.type === 'new_message') {
        requestPushPermissionPrompt();
      }
    };
    messagingSocket.on('notification', onSocketNotification);
    socketCleanup = () => messagingSocket.off('notification', onSocketNotification);

    return () => {
      cleanup?.();
      socketCleanup?.();
    };
  }, [enabled]);
}
