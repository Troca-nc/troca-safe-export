// ============================================================
//  Troca Mobile - Écran de conversation
// ============================================================

import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
} from 'react-native'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { router, useLocalSearchParams, Stack } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useMutation } from '@tanstack/react-query'
import { WebView } from 'react-native-webview'
import { api, messagesApi, uploadApi, usersApi } from '@/lib/api'
import { getSocket, messagingSocket } from '@/lib/socket'
import { useAuthStore } from '@/store/authStore'
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme'

type MessageType = 'text' | 'photo' | 'offer' | 'system' | 'audio' | 'document'

interface Message {
  id: number
  sender_id: number
  type?: MessageType
  content: string | null
  photo_url?: string | null
  attachment_url?: string | null
  attachment_download_url?: string | null
  attachment_name?: string | null
  attachment_mime_type?: string | null
  attachment_size_bytes?: number | null
  created_at: string
  is_read: boolean
  offer?: { id: number; amount_xpf: number; status?: string }
  pending?: boolean
  failed?: boolean
}

interface ConvInfo {
  id: string
  buyer_id: number
  seller_id: number
  annonce: { titre: string; image?: string | null; prix?: number | null; statut?: string | null }
  other_user: {
    id: number
    prenom: string
    nom: string
    avatar_url?: string | null
    is_online?: boolean
    last_seen_label?: string | null
    note_moyenne?: number | null
    nb_avis?: number | null
    avg_response_time_label?: string | null
  }
}

type AudioBridgeEvent =
  | { type: 'ready' }
  | { type: 'recording'; recording: boolean }
  | { type: 'recorded'; audioBase64: string; mimeType: string }
  | { type: 'error'; message: string }

type DocumentBridgeEvent =
  | { type: 'ready' }
  | { type: 'picked'; documentBase64: string; mimeType: string; name: string; size: number }
  | { type: 'error'; message: string }

function createRecorderHtml() {
  return `<!doctype html>
  <html>
    <body style="margin:0;background:transparent;">
      <script>
        let recorder = null;
        let stream = null;
        let chunks = [];

        function post(payload) {
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }

        async function startRecording() {
          if (recorder && recorder.state === 'recording') return;
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
              ? 'audio/webm;codecs=opus'
              : (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg');
            chunks = [];
            recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
            recorder.ondataavailable = (event) => {
              if (event.data && event.data.size > 0) chunks.push(event.data);
            };
            recorder.onstop = async () => {
              try {
                const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || 'audio/webm' });
                const dataUrl = await new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onerror = () => reject(new Error('read_error'));
                  reader.onload = () => resolve(String(reader.result || ''));
                  reader.readAsDataURL(blob);
                });
                post({ type: 'recorded', audioBase64: dataUrl, mimeType: blob.type || mimeType || 'audio/webm' });
              } catch (error) {
                post({ type: 'error', message: String(error?.message || error || 'audio_error') });
              } finally {
                if (stream) stream.getTracks().forEach((track) => track.stop());
                stream = null;
                recorder = null;
                chunks = [];
              }
            };
            recorder.start();
            post({ type: 'recording', recording: true });
          } catch (error) {
            post({ type: 'error', message: String(error?.message || error || 'mic_error') });
          }
        }

        function stopRecording() {
          if (!recorder || recorder.state === 'inactive') return;
          recorder.stop();
          post({ type: 'recording', recording: false });
        }

        function handleCommand(event) {
          try {
            const data = JSON.parse(event.data);
            if (data?.type === 'start') startRecording();
            if (data?.type === 'stop') stopRecording();
          } catch {}
        }

        window.addEventListener('message', handleCommand);
        document.addEventListener('message', handleCommand);
        post({ type: 'ready' });
      </script>
    </body>
  </html>`
}

function createDocumentPickerHtml() {
  return `<!doctype html>
  <html>
    <body style="margin:0;background:transparent;">
      <input id="picker" type="file" accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,image/jpeg,image/png,image/webp,image/heic" style="display:none" />
      <script>
        const picker = document.getElementById('picker');
        function post(payload) {
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }

        async function handleFile(file) {
          try {
            const dataUrl = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onerror = () => reject(new Error('read_error'));
              reader.onload = () => resolve(String(reader.result || ''));
              reader.readAsDataURL(file);
            });
            post({
              type: 'picked',
              documentBase64: dataUrl,
              mimeType: file.type || 'application/octet-stream',
              name: file.name || 'document',
              size: file.size || 0,
            });
          } catch (error) {
            post({ type: 'error', message: String(error?.message || error || 'document_error') });
          }
        }

        picker.addEventListener('change', () => {
          if (!picker.files || !picker.files[0]) return;
          handleFile(picker.files[0]);
          picker.value = '';
        });

        function handleCommand(event) {
          try {
            const data = JSON.parse(event.data);
            if (data?.type === 'open') picker.click();
          } catch {}
        }

        window.addEventListener('message', handleCommand);
        document.addEventListener('message', handleCommand);
        post({ type: 'ready' });
      </script>
    </body>
  </html>`
}

function AudioPlayer({ uri }: { uri: string }) {
  const html = useMemo(() => {
    const src = JSON.stringify(uri)
    return `<!doctype html><html><body style="margin:0;background:transparent;display:flex;align-items:center;">
      <audio controls style="width:100%;max-width:100%" src=${src}></audio>
    </body></html>`
  }, [uri])

  return (
    <WebView
      source={{ html }}
      style={{ width: '100%', height: 56, backgroundColor: 'transparent' }}
      originWhitelist={['*']}
      javaScriptEnabled={false}
      scrollEnabled={false}
    />
  )
}

function formatBytes(value?: number | null) {
  if (!value || value <= 0) return null
  const units = ['o', 'Ko', 'Mo', 'Go']
  let current = value
  let index = 0
  while (current >= 1024 && index < units.length - 1) {
    current /= 1024
    index += 1
  }
  const rounded = current >= 10 || index === 0 ? Math.round(current) : current.toFixed(1)
  return `${rounded} ${units[index]}`
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [conv, setConv] = useState<ConvInfo | null>(null)
  const [sellerProfile, setSellerProfile] = useState<{
    is_online?: boolean
    last_seen_label?: string | null
    note_moyenne?: number | null
    nb_avis?: number | null
    avg_response_time_label?: string | null
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(false)
  const [sending, setSending] = useState(false)
  const [connectionState, setConnectionState] = useState(messagingSocket.getSnapshot().state)
  const [reconnectInMs, setReconnectInMs] = useState<number | null>(messagingSocket.getSnapshot().reconnectInMs)
  const [audioReady, setAudioReady] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordingError, setRecordingError] = useState<string | null>(null)
  const [uploadingAudio, setUploadingAudio] = useState(false)
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const [pendingDocument, setPendingDocument] = useState<{
    documentBase64: string
    mimeType: string
    name: string
    size: number
  } | null>(null)
  const listRef = useRef<FlatList>(null)
  const socketRef = useRef<typeof messagingSocket | null>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didInitialScroll = useRef(false)
  const audioBridgeRef = useRef<WebView>(null)
  const documentBridgeRef = useRef<WebView>(null)

  const fetchConv = useCallback(async () => {
    try {
      const { data } = await messagesApi.getMessages(String(id), 1, 30)
      const conversation = data.data.conversation as ConvInfo
      setConv(conversation)
      setMessages(data.data.messages ?? [])
      void messagesApi.markConversationRead(String(id)).catch(() => {})
      if (conversation?.other_user?.id) {
        try {
          const profileRes = await usersApi.getProfile(String(conversation.other_user.id))
          setSellerProfile(profileRes.data?.data ?? null)
        } catch {
          setSellerProfile(null)
        }
      } else {
        setSellerProfile(null)
      }
    } catch {
      Alert.alert('Erreur', 'Conversation introuvable')
      router.back()
    } finally {
      setLoading(false)
    }
  }, [id])

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      await api.post(`/messages/conversations/${id}`, { content })
    },
    onMutate: async (content) => {
      const optimistic: Message = {
        id: Date.now(),
        sender_id: Number(user!.id),
        type: 'text',
        content,
        created_at: new Date().toISOString(),
        is_read: false,
        pending: true,
      }
      setMessages((prev) => [...prev, optimistic])
      scheduleScroll()
      return { optimistic }
    },
    onError: (_err, _content, context) => {
      if (!context?.optimistic) return
      setMessages((prev) =>
        prev.map((message) => (
          message.id === context.optimistic.id
            ? { ...message, pending: false, failed: true }
            : message
        ))
      )
    },
  })

  const scheduleScroll = useCallback((delay = 100) => {
    if (scrollTimer.current) clearTimeout(scrollTimer.current)
    scrollTimer.current = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true })
    }, delay)
  }, [])

  useEffect(() => {
    fetchConv()
  }, [fetchConv])

  useEffect(() => messagingSocket.subscribeStatus((snapshot) => {
    setConnectionState(snapshot.state)
    setReconnectInMs(snapshot.reconnectInMs)
  }), [])

  useEffect(() => {
    if (!id) return

    let alive = true
    let socket: typeof messagingSocket | null = null
    let onNewMessage: ((msg: Message) => void) | null = null
    let onTyping: ((payload: { isTyping: boolean }) => void) | null = null

    getSocket().then((s) => {
      if (!alive) return
      socket = s
      socketRef.current = s
      socket.emit('join_conversation', id)

      onNewMessage = (msg: Message) => {
        setMessages((prev) => {
          const filtered = prev.filter((item) => {
            if (!item.pending || item.type !== msg.type) return true
            if (item.type === 'document') return item.attachment_url !== msg.attachment_url
            if (item.type === 'photo' || item.type === 'audio') return item.photo_url !== msg.photo_url
            return item.content !== msg.content
          })
          return [...filtered, msg]
        })
        scheduleScroll()
      }

      onTyping = ({ isTyping }: { isTyping: boolean }) => {
        setTyping(isTyping)
      }

      socket.on('new_message', onNewMessage)
      socket.on('user_typing', onTyping)
      socketRef.current = socket
    })

    return () => {
      alive = false
      socket?.emit('leave_conversation', id)
      if (onNewMessage) socket?.off('new_message', onNewMessage)
      if (onTyping) socket?.off('user_typing', onTyping)
      if (typingTimer.current) clearTimeout(typingTimer.current)
      if (scrollTimer.current) clearTimeout(scrollTimer.current)
    }
  }, [id, scheduleScroll])

  useEffect(() => {
    if (!loading && messages.length > 0 && !didInitialScroll.current) {
      didInitialScroll.current = true
      scheduleScroll(0)
    }
  }, [loading, messages.length, scheduleScroll])

  const sendMessage = async () => {
    if (pendingDocument) {
      if (uploadingDocument) return
      setUploadingDocument(true)
      setRecordingError(null)
      try {
        const uploadRes = await uploadApi.uploadChatDocument(pendingDocument.documentBase64, pendingDocument.mimeType, pendingDocument.name)
        const attachment = uploadRes.data?.data
        const attachmentUrl = attachment?.url
        if (attachmentUrl) {
          await messagesApi.sendDocument(
            String(id),
            attachmentUrl,
            attachment?.filename || pendingDocument.name,
            attachment?.mime_type || pendingDocument.mimeType,
            attachment?.size_bytes ?? pendingDocument.size ?? null,
          )
          setPendingDocument(null)
          await fetchConv()
        }
      } catch (error) {
        console.error('[chat-document]', error)
        setRecordingError('Impossible d’envoyer le document')
      } finally {
        setUploadingDocument(false)
      }
      return
    }

    if (!text.trim() || sending) return
    const content = text.trim()
    setText('')
    setSending(true)

    try {
      await sendMessageMutation.mutateAsync(content)
    } finally {
      setSending(false)
    }
  }

  const onTypingChange = (val: string) => {
    setText(val)
    socketRef.current?.emit('typing', { convId: id, isTyping: true })
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => {
      socketRef.current?.emit('typing', { convId: id, isTyping: false })
    }, 2500)
  }

  const connectionLabel = connectionState === 'connected'
    ? 'Connecté'
    : connectionState === 'reconnecting'
      ? `Reconnexion… ${Math.max(1, Math.ceil((reconnectInMs ?? 1000) / 1000))}s`
      : 'Hors ligne — les évènements seront réémis dès le retour réseau'

  const handleAudioBridgeMessage = useCallback(async (event: any) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data) as AudioBridgeEvent
      if (payload.type === 'ready') {
        setAudioReady(true)
        return
      }

      if (payload.type === 'recording') {
        setRecording(payload.recording)
        return
      }

      if (payload.type === 'error') {
        setRecording(false)
        setUploadingAudio(false)
        setRecordingError('Impossible d’utiliser le micro')
        console.error('[chat-audio]', payload.message)
        return
      }

      if (payload.type === 'recorded') {
        setUploadingAudio(true)
        setRecordingError(null)
        try {
          const uploadRes = await uploadApi.uploadChatAudio(payload.audioBase64, payload.mimeType)
          const audioUrl = uploadRes.data?.data?.url
          if (audioUrl) {
            await messagesApi.sendAudio(String(id), audioUrl)
            await fetchConv()
          }
        } catch (error) {
          console.error('[chat-audio]', error)
          setRecordingError('Impossible d’envoyer le message vocal')
        } finally {
          setUploadingAudio(false)
          setRecording(false)
        }
      }
    } catch (error) {
      console.error('[chat-audio-bridge]', error)
    }
  }, [fetchConv, id])

  const handleDocumentBridgeMessage = useCallback(async (event: any) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data) as DocumentBridgeEvent
      if (payload.type === 'ready') {
        return
      }

      if (payload.type === 'error') {
        setUploadingDocument(false)
        setRecordingError('Impossible de lire le document')
        console.error('[chat-document]', payload.message)
        return
      }

      if (payload.type === 'picked') {
        setPendingDocument({
          documentBase64: payload.documentBase64,
          mimeType: payload.mimeType,
          name: payload.name,
          size: payload.size,
        })
        setRecordingError(null)
      }
    } catch (error) {
      console.error('[chat-document-bridge]', error)
    }
  }, [fetchConv, id])

  const startAudioRecording = useCallback(() => {
    if (!audioReady || uploadingAudio) {
      setRecordingError('L’enregistrement audio n’est pas prêt')
      return
    }
    setRecordingError(null)
    audioBridgeRef.current?.postMessage(JSON.stringify({ type: 'start' }))
  }, [audioReady, uploadingAudio])

  const stopAudioRecording = useCallback(() => {
    if (!recording) return
    audioBridgeRef.current?.postMessage(JSON.stringify({ type: 'stop' }))
  }, [recording])

  const pickDocument = useCallback(() => {
    if (uploadingAudio || uploadingDocument || recording) return
    setRecordingError(null)
    documentBridgeRef.current?.postMessage(JSON.stringify({ type: 'open' }))
  }, [uploadingAudio, uploadingDocument, recording])

  const cancelDocument = useCallback(() => {
    if (uploadingDocument) return
    setPendingDocument(null)
  }, [uploadingDocument])

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = Number(item.sender_id) === Number(user?.id)
    const documentMime = (item.attachment_mime_type || '').toLowerCase()
    const documentUrl = item.attachment_download_url || item.attachment_url || ''
    const documentIsImage = documentMime.startsWith('image/')
    const documentIsPdf = documentMime === 'application/pdf'

    return (
      <View style={[styles.msgRow, isMine && styles.msgRowMine]}>
      <View
          style={[
            styles.bubble,
            isMine ? styles.bubbleMine : styles.bubbleOther,
            item.failed && styles.bubbleFailed,
          ]}
        >
          {item.type === 'document' && documentUrl ? (
            <View style={[styles.documentCard, isMine && styles.documentCardMine]}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => { void Linking.openURL(documentUrl) }}
                style={styles.documentPreviewTap}
              >
                {documentIsImage ? (
                  <Image source={{ uri: documentUrl }} style={styles.documentPreviewImage} />
                ) : (
                  <View style={styles.documentPreviewFallback}>
                    <Ionicons name="document-text-outline" size={26} color={isMine ? Colors.white : Colors.primary} />
                    <Text style={[styles.documentPreviewFallbackText, isMine && styles.documentPreviewFallbackTextMine]}>
                      {documentIsPdf ? 'Aperçu PDF' : 'Aperçu du fichier'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.documentMeta}>
                <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]} numberOfLines={1}>
                  {item.attachment_name || 'Document partagé'}
                </Text>
                <Text style={[styles.audioHint, isMine && styles.audioHintMine]} numberOfLines={1}>
                  {item.attachment_mime_type || 'Document'}
                  {formatBytes(item.attachment_size_bytes) ? ` · ${formatBytes(item.attachment_size_bytes)}` : ''}
                </Text>
              </View>

              <View style={styles.documentActions}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => { void Linking.openURL(documentUrl) }}
                  style={[styles.documentActionBtn, isMine && styles.documentActionBtnMine]}
                >
                  <Ionicons name="open-outline" size={14} color={isMine ? Colors.white : Colors.primary} />
                  <Text style={[styles.documentActionText, isMine && styles.documentActionTextMine]}>Ouvrir</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => { void Linking.openURL(documentUrl) }}
                  style={[styles.documentActionBtn, isMine && styles.documentActionBtnMine]}
                >
                  <Ionicons name="download-outline" size={14} color={isMine ? Colors.white : Colors.primary} />
                  <Text style={[styles.documentActionText, isMine && styles.documentActionTextMine]}>Télécharger</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : item.type === 'photo' && item.photo_url ? (
            <Image source={{ uri: item.photo_url }} style={styles.photo} />
          ) : item.type === 'audio' && item.photo_url ? (
            <View style={styles.audioCard}>
              <View style={styles.audioIcon}>
                <Ionicons name="mic" size={16} color={Colors.primary} />
              </View>
              <View style={styles.audioMeta}>
                <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>Message vocal</Text>
                <Text style={[styles.audioHint, isMine && styles.audioHintMine]}>Appuyez pour écouter</Text>
              </View>
            <View style={styles.audioPlayerWrap}>
                <AudioPlayer uri={item.photo_url} />
              </View>
            </View>
          ) : (
            <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
              {item.content ?? (item.type === 'offer' ? 'Offre de prix' : 'Message')}
            </Text>
          )}

          {item.pending && (
            <Ionicons name="time-outline" size={10} color="rgba(255,255,255,0.6)" style={styles.statusIcon} />
          )}
          {item.failed && (
            <Ionicons name="alert-circle-outline" size={10} color={Colors.danger} style={styles.statusIcon} />
          )}
        </View>
      </View>
    )
  }

  const sellerMeta = sellerProfile ?? conv?.other_user ?? null

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: conv?.other_user ? `${conv.other_user.prenom} ${conv.other_user.nom}` : 'Conversation',
          headerBackTitle: 'Retour',
          headerTintColor: Colors.white,
          headerStyle: { backgroundColor: Colors.primary },
          headerTitleStyle: { color: Colors.white },
        }}
      />

      <WebView
        ref={audioBridgeRef}
        source={{ html: createRecorderHtml() }}
        onMessage={handleAudioBridgeMessage}
        style={styles.hiddenWebView}
        originWhitelist={['*']}
        javaScriptEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
      />

      <WebView
        ref={documentBridgeRef}
        source={{ html: createDocumentPickerHtml() }}
        onMessage={handleDocumentBridgeMessage}
        style={styles.hiddenWebView}
        originWhitelist={['*']}
        javaScriptEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
      />

      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ flex: 1 }} />
        ) : (
          <>
            <FlatList
              ref={listRef}
              data={messages}
              inverted
              keyExtractor={(item) => String(item.id)}
              renderItem={renderMessage}
              contentContainerStyle={styles.list}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                conv?.annonce ? (
                  <View style={styles.convMeta}>
                    <View style={styles.convMetaTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.convMetaTitle}>{conv.annonce.titre}</Text>
                        {conv.annonce.prix != null && (
                          <Text style={styles.convMetaPrice}>{conv.annonce.prix.toLocaleString('fr-NC')} XPF</Text>
                        )}
                      </View>
                      {sellerMeta?.is_online != null && (
                        <View style={[styles.sellerChip, sellerMeta.is_online ? styles.sellerChipOnline : styles.sellerChipOffline]}>
                          <View style={[styles.sellerDot, sellerMeta.is_online ? styles.sellerDotOnline : styles.sellerDotOffline]} />
                          <Text style={[styles.sellerChipText, sellerMeta.is_online ? styles.sellerChipTextOnline : styles.sellerChipTextOffline]}>
                            {sellerMeta.is_online ? 'En ligne' : (sellerMeta.last_seen_label ?? 'Hors ligne')}
                          </Text>
                        </View>
                      )}
                    </View>

                    {(sellerMeta?.avg_response_time_label || sellerMeta?.note_moyenne != null) && (
                      <View style={styles.sellerMetaRow}>
                        {sellerMeta.avg_response_time_label && (
                          <View style={styles.sellerMetaPill}>
                            <Ionicons name="time-outline" size={11} color={Colors.primaryDark} />
                            <Text style={styles.sellerMetaText}>
                              Répond en moyenne en {sellerMeta.avg_response_time_label}
                            </Text>
                          </View>
                        )}
                        {sellerMeta.note_moyenne != null && (
                          <View style={styles.sellerMetaPill}>
                            <Ionicons name="star" size={11} color={Colors.warning} />
                            <Text style={styles.sellerMetaText}>
                              {Number(sellerMeta.note_moyenne).toFixed(1)}/5{sellerMeta.nb_avis != null ? ` (${sellerMeta.nb_avis})` : ''}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                ) : null
              }
              ListFooterComponent={
                typing ? (
                  <View style={styles.typingWrap}>
                    <View style={styles.typingBubble}>
                      <Text style={styles.typingText}>En train d’écrire…</Text>
                    </View>
                  </View>
                ) : null
              }
            />

            <View style={styles.connectionRow} accessibilityRole="text">
              <View
                style={[
                  styles.connectionDot,
                  connectionState === 'connected' && styles.connectionDotConnected,
                  connectionState === 'reconnecting' && styles.connectionDotReconnecting,
                  connectionState === 'offline' && styles.connectionDotOffline,
                ]}
              />
              <Text
                style={[
                  styles.connectionText,
                  connectionState === 'connected' && styles.connectionTextConnected,
                  connectionState === 'reconnecting' && styles.connectionTextReconnecting,
                  connectionState === 'offline' && styles.connectionTextOffline,
                ]}
              >
                {connectionLabel}
              </Text>
            </View>

            <View style={styles.inputBar}>
              <View style={styles.inputWrap}>
              <TextInput
                  style={styles.input}
                  value={text}
                  onChangeText={onTypingChange}
                  placeholder={pendingDocument ? 'Document en attente…' : 'Écrivez votre message…'}
                  placeholderTextColor={Colors.textTertiary}
                  accessibilityLabel="Saisir un message"
                  multiline
                  maxLength={2000}
                  editable={!pendingDocument && !uploadingDocument}
                />
              </View>

              <TouchableOpacity
                style={[styles.attachBtn, uploadingDocument && styles.attachBtnActive]}
                onPress={pickDocument}
                disabled={uploadingAudio || uploadingDocument || recording || Boolean(pendingDocument)}
                accessibilityRole="button"
                accessibilityLabel="Joindre un document"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="attach" size={20} color={uploadingDocument ? Colors.white : Colors.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.micBtn, (recording || uploadingAudio) && styles.micBtnActive]}
                onPressIn={startAudioRecording}
                onPressOut={stopAudioRecording}
                disabled={uploadingAudio || Boolean(pendingDocument)}
                accessibilityRole="button"
                accessibilityLabel={recording ? 'Relâcher pour envoyer le message vocal' : 'Maintenir pour enregistrer un message vocal'}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name={recording ? 'stop' : 'mic'} size={20} color={recording ? Colors.white : Colors.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sendBtn, !pendingDocument && !text.trim() && styles.sendBtnDisabled]}
                onPress={sendMessage}
                disabled={(pendingDocument ? uploadingDocument : !text.trim() || sending) || uploadingAudio}
                accessibilityRole="button"
                accessibilityLabel={pendingDocument ? 'Envoyer le document' : 'Envoyer le message'}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="send" size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>

            {pendingDocument && (
              <View style={styles.documentPreview}>
                <View style={styles.documentPreviewHeader}>
                  <View style={styles.documentPreviewIcon}>
                    <Ionicons name="document-text-outline" size={18} color={Colors.primary} />
                  </View>
                  <View style={styles.documentPreviewMeta}>
                    <Text style={styles.documentPreviewTitle} numberOfLines={1}>{pendingDocument.name}</Text>
                    <Text style={styles.documentPreviewSub} numberOfLines={1}>
                      {pendingDocument.mimeType}
                      {formatBytes(pendingDocument.size) ? ` · ${formatBytes(pendingDocument.size)}` : ''}
                    </Text>
                    <Text style={styles.documentPreviewHint}>Prévisualisation avant envoi</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.documentPreviewCancel}
                    onPress={cancelDocument}
                    disabled={uploadingDocument}
                    accessibilityRole="button"
                    accessibilityLabel="Annuler le document"
                  >
                    <Ionicons name="close" size={16} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.documentPreviewBody}>
                  {pendingDocument.mimeType.startsWith('image/') ? (
                    <Image source={{ uri: pendingDocument.documentBase64 }} style={styles.documentPreviewImage} />
                  ) : (
                    <View style={styles.documentPreviewFallback}>
                      <Ionicons name="document-text-outline" size={28} color={Colors.primary} />
                      <Text style={styles.documentPreviewFallbackText}>
                        {pendingDocument.mimeType === 'application/pdf' ? 'Aperçu PDF' : 'Aperçu du fichier'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            <View style={styles.helperRow}>
              <Text style={styles.helperText}>
                {pendingDocument
                  ? 'Document prêt à être envoyé. Appuyez sur envoyer ou annulez.'
                  : recording
                  ? 'Enregistrement en cours… relâchez pour envoyer.'
                  : recordingError ?? 'Texte, photo ou message vocal.'}
              </Text>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hiddenWebView: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    left: -9999,
    top: -9999,
  },
  list: { padding: Spacing.md, paddingBottom: Spacing.sm },
  convMeta: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  convMetaTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  convMetaTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  convMetaPrice: { fontSize: FontSize.xs, color: Colors.primary, marginTop: 2, fontWeight: FontWeight.bold },
  sellerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sellerChipOnline: { backgroundColor: 'rgba(34, 197, 94, 0.12)' },
  sellerChipOffline: { backgroundColor: Colors.gray100 },
  sellerDot: { width: 7, height: 7, borderRadius: 999 },
  sellerDotOnline: { backgroundColor: '#22c55e' },
  sellerDotOffline: { backgroundColor: Colors.gray300 },
  sellerChipText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  sellerChipTextOnline: { color: '#15803d' },
  sellerChipTextOffline: { color: Colors.textSecondary },
  sellerMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  sellerMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(13, 121, 193, 0.10)',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sellerMetaText: { color: Colors.primaryDark, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  msgRow: { marginBottom: Spacing.sm, alignItems: 'flex-start' },
  msgRowMine: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '78%',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bubbleMine: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  bubbleOther: {},
  bubbleFailed: { borderColor: Colors.danger },
  bubbleText: { fontSize: FontSize.md, color: Colors.text, lineHeight: 21 },
  bubbleTextMine: { color: Colors.white },
  photo: { width: 180, height: 180, borderRadius: Radius.md },
  audioCard: { gap: 8, minWidth: 220 },
  audioIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioMeta: { gap: 2 },
  audioHint: { fontSize: FontSize.xs, color: Colors.textSecondary },
  audioHintMine: { color: 'rgba(255,255,255,0.75)' },
  audioPlayerWrap: { borderRadius: Radius.md, overflow: 'hidden' },
  statusIcon: { alignSelf: 'flex-end', marginTop: 2 },
  typingWrap: { padding: Spacing.md },
  typingBubble: {
    backgroundColor: Colors.gray100,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignSelf: 'flex-start',
  },
  typingText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontStyle: 'italic' },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xs,
    backgroundColor: Colors.white,
  },
  connectionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.gray300 },
  connectionDotConnected: { backgroundColor: '#22c55e' },
  connectionDotReconnecting: { backgroundColor: '#f59e0b' },
  connectionDotOffline: { backgroundColor: '#ef4444' },
  connectionText: { fontSize: FontSize.xs },
  connectionTextConnected: { color: '#15803d' },
  connectionTextReconnecting: { color: '#d97706' },
  connectionTextOffline: { color: '#b91c1c' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  inputWrap: { flex: 1 },
  input: {
    backgroundColor: Colors.gray50,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: FontSize.md,
    color: Colors.text,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  micBtn: {
    width: 44,
    height: 44,
    minWidth: 44,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  micBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  attachBtn: {
    width: 44,
    height: 44,
    minWidth: 44,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  attachBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sendBtn: {
    width: 44,
    height: 44,
    minWidth: 44,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.gray300 },
  helperRow: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  helperText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  documentCard: {
    width: '100%',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Radius.lg,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  documentCardMine: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  documentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
  },
  documentIconMine: {
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  documentPreviewTap: {
    overflow: 'hidden',
    borderRadius: Radius.md,
  },
  documentMeta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  documentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  documentActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.gray100,
  },
  documentActionBtnMine: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  documentActionText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  documentActionTextMine: {
    color: Colors.white,
  },
  documentPreview: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  documentPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  documentPreviewIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
  },
  documentPreviewMeta: {
    flex: 1,
    minWidth: 0,
  },
  documentPreviewTitle: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: FontWeight.semibold,
  },
  documentPreviewSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  documentPreviewHint: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  documentPreviewCancel: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray100,
  },
  documentPreviewBody: {
    marginTop: 10,
    overflow: 'hidden',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.gray50,
  },
  documentPreviewImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  documentPreviewFallback: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    gap: 8,
  },
  documentPreviewFallbackText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: FontWeight.semibold,
  },
  documentPreviewFallbackTextMine: {
    color: Colors.white,
  },
  documentPreviewFallbackMine: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
})
