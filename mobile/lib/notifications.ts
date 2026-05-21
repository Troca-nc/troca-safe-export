// ============================================================
//  Troca Mobile — Service Notifications Push (Expo)
//  Enregistrement du token + gestion des réceptions
// ============================================================

import * as Notifications from 'expo-notifications';
import * as Device        from 'expo-device';
import Constants          from 'expo-constants';
import { Platform }       from 'react-native';
import { api }            from '@/lib/api';

// Comportement par défaut : afficher l'alerte même si l'app est au premier plan
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

// ── Enregistrement du token push ─────────────────────────────

export async function registerPushToken(): Promise<string | null> {
  // Les notifications push ne fonctionnent pas sur simulateur
  if (!Device.isDevice) {
    console.log('[push] Simulateur détecté — notifications push ignorées');
    return null;
  }

  // Demander la permission
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[push] Permission refusée');
    return null;
  }

  // Canal Android (obligatoire pour Android 8+)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name:        'Troca',
      importance:  Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor:  '#2563eb',
    });

    await Notifications.setNotificationChannelAsync('messages', {
      name:        'Messages',
      importance:  Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 100],
      lightColor:  '#2563eb',
    });
  }

  // Récupérer le token Expo Push
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    console.warn('[push] projectId EAS non configuré dans app.json');
    return null;
  }

  const { data: pushToken } = await Notifications.getExpoPushTokenAsync({ projectId });
  console.log('[push] Token Expo enregistré');

  // Envoyer le token au backend pour l'associer à l'utilisateur
  await api.post('/users/push-token', {
    token:    pushToken,
    platform: Platform.OS,
  }).catch((err) => console.warn('[push] Erreur enregistrement token:', err.message));

  return pushToken;
}

// ── Listeners ─────────────────────────────────────────────────

type NotifHandler = (notif: Notifications.Notification) => void;
type ResponseHandler = (response: Notifications.NotificationResponse) => void;

export function setupNotificationListeners(
  onNotification: NotifHandler,
  onResponse:     ResponseHandler,
) {
  // Notification reçue pendant que l'app est active
  const notifSub = Notifications.addNotificationReceivedListener(onNotification);

  // L'utilisateur a tapé sur la notification
  const responseSub = Notifications.addNotificationResponseReceivedListener(onResponse);

  return () => {
    notifSub.remove();
    responseSub.remove();
  };
}

// ── Badge ──────────────────────────────────────────────────────

export async function setBadge(count: number) {
  await Notifications.setBadgeCountAsync(count);
}

export async function clearBadge() {
  await Notifications.setBadgeCountAsync(0);
}

// ── Notification locale (debug / test) ───────────────────────

export async function sendLocalNotification(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null, // immédiat
  });
}
