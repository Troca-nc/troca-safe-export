import { useEffect, useState } from 'react'
import { Modal, Pressable, Text, View } from 'react-native'

import {
  deferPushPermissionPrompt,
  registerPushToken,
  shouldPromptForPushPermission,
  subscribePushPermissionPrompt,
} from '@/lib/notifications'

export function PushPermissionPrompt() {
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)

  // TODO: test E2E sur le prompt notifications apres reception du premier message et le snooze 7 jours.
  useEffect(() => {
    let active = true
    const unsub = subscribePushPermissionPrompt(() => {
      void (async () => {
        if (!active) return
        const allowed = await shouldPromptForPushPermission()
        if (allowed) {
          setVisible(true)
        }
      })()
    })

    return () => {
      active = false
      unsub()
    }
  }, [])

  const handleActiver = async () => {
    setBusy(true)
    try {
      const token = await registerPushToken()
      if (token) {
        setVisible(false)
      } else {
        setVisible(false)
      }
    } finally {
      setBusy(false)
    }
  }

  const handleLater = async () => {
    await deferPushPermissionPrompt()
    setVisible(false)
  }

  if (!visible) return null

  return (
    <Modal visible transparent animationType="fade" onRequestClose={handleLater}>
      <View style={{ flex: 1, backgroundColor: 'rgba(8, 32, 50, 0.55)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#FFFFFF', padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
          <View style={{ width: 44, height: 4, borderRadius: 999, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 16 }} />
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#082032', marginBottom: 8 }}>
            Activez les notifications pour ne jamais manquer un message
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 20, color: '#4B5563', marginBottom: 20 }}>
            Nous vous prévenons dès qu&apos;une nouvelle conversation arrive. Vous pouvez choisir de l&apos;activer maintenant ou revenir plus tard.
          </Text>

          <View style={{ gap: 12 }}>
            <Pressable
              onPress={handleActiver}
              disabled={busy}
              style={({ pressed }) => ({
                backgroundColor: '#2563EB',
                borderRadius: 16,
                paddingVertical: 14,
                alignItems: 'center',
                opacity: pressed || busy ? 0.86 : 1,
              })}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>
                {busy ? 'Activation...' : 'Activer'}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleLater}
              style={({ pressed }) => ({
                backgroundColor: '#F8FAFC',
                borderRadius: 16,
                paddingVertical: 14,
                alignItems: 'center',
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text style={{ color: '#082032', fontWeight: '600' }}>Plus tard</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}
