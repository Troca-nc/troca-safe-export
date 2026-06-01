import { Dimensions } from 'react-native'
import { api } from '@/lib/api'

type TrackMetadata = Record<string, string | number | boolean | null | undefined>

let sessionId: string | null = null

function getDeviceType(): 'mobile' | 'tablet' | 'unknown' {
  const width = Dimensions.get('window')?.width ?? 0
  if (width >= 768) return 'tablet'
  return 'mobile'
}

export async function trackEvent(
  eventName: string,
  metadata: TrackMetadata = {},
  pagePath = '/mobile',
) {
  try {
    if (!sessionId) {
      sessionId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `aid_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
    }

    await api.post('/analytics/events', {
      event_name: eventName,
      page_path: pagePath,
      referrer: null,
      device_type: getDeviceType(),
      session_id: sessionId,
      metadata,
      consent_analytics: true,
    })
    return true
  } catch {
    return false
  }
}
