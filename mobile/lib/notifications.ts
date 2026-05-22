// ============================================================
//  Troca Mobile - Service Notifications Push (Expo)
//  Registration token + reception handling
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

import { api } from '@/lib/api'

// Default behavior: show the alert even if the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

const PUSH_PROMPT_SNOOZE_KEY = 'push_permission_prompt_snooze_until'
const PUSH_PROMPT_BLOCKED_KEY = 'push_permission_prompt_blocked_forever'

type NotifHandler = (notif: Notifications.Notification) => void
type ResponseHandler = (response: Notifications.NotificationResponse) => void
type PromptListener = () => void

const promptListeners = new Set<PromptListener>()

export function subscribePushPermissionPrompt(listener: PromptListener) {
  promptListeners.add(listener)
  return () => {
    promptListeners.delete(listener)
  }
}

export function requestPushPermissionPrompt() {
  for (const listener of promptListeners) {
    listener()
  }
}

export async function shouldPromptForPushPermission(): Promise<boolean> {
  if (Platform.OS === 'web' || !Device.isDevice) return false

  const blocked = await AsyncStorage.getItem(PUSH_PROMPT_BLOCKED_KEY)
  if (blocked === 'true') return false

  const snoozedUntil = Number(await AsyncStorage.getItem(PUSH_PROMPT_SNOOZE_KEY) || '0')
  if (snoozedUntil > Date.now()) return false

  const { status } = await Notifications.getPermissionsAsync()
  if (status === 'granted') return false
  if (status === 'denied') {
    await AsyncStorage.setItem(PUSH_PROMPT_BLOCKED_KEY, 'true')
    return false
  }

  return true
}

export async function deferPushPermissionPrompt(days = 7) {
  const until = Date.now() + days * 24 * 60 * 60 * 1000
  await AsyncStorage.setItem(PUSH_PROMPT_SNOOZE_KEY, String(until))
}

export async function suppressPushPermissionPromptForever() {
  await AsyncStorage.setItem(PUSH_PROMPT_BLOCKED_KEY, 'true')
}

type RegisterPushTokenOptions = {
  requestPermission?: boolean
}

export async function registerPushToken(options: RegisterPushTokenOptions = {}): Promise<string | null> {
  const { requestPermission = true } = options

  // Push notifications do not work on simulators.
  if (!Device.isDevice) {
    console.log('[push] Simulator detected - push notifications ignored')
    return null
  }

  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing

  if (existing !== 'granted') {
    if (!requestPermission) {
      return null
    }

    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    if (requestPermission) {
      await suppressPushPermissionPromptForever()
    }
    console.log('[push] Permission refused')
    return null
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Troca',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563eb',
    })

    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Messages',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 100],
      lightColor: '#2563eb',
    })
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId
  if (!projectId) {
    console.warn('[push] EAS projectId missing in app.json')
    return null
  }

  const { data: pushToken } = await Notifications.getExpoPushTokenAsync({ projectId })
  console.log('[push] Expo token registered')

  await api.post('/users/push-token', {
    token: pushToken,
    platform: Platform.OS,
  }).catch((err) => console.warn('[push] Token registration error:', err.message))

  return pushToken
}

export function setupNotificationListeners(
  onNotification: NotifHandler,
  onResponse: ResponseHandler,
) {
  const notifSub = Notifications.addNotificationReceivedListener(onNotification)
  const responseSub = Notifications.addNotificationResponseReceivedListener(onResponse)

  return () => {
    notifSub.remove()
    responseSub.remove()
  }
}

export async function setBadge(count: number) {
  await Notifications.setBadgeCountAsync(count)
}

export async function clearBadge() {
  await Notifications.setBadgeCountAsync(0)
}

// TODO: test E2E sur le prompt de notifications apres premier message recu et le cooldown de 7 jours.
export async function sendLocalNotification(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null,
  })
}
