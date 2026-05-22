// ============================================================
//  Troca Mobile — Écran de conversation
// ============================================================

import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { useEffect, useState, useRef, useCallback } from 'react';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { api, messagesApi } from '@/lib/api';
import { getSocket, messagingSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';

interface Message {
  id: number;
  sender_id: number;
  type?: 'text' | 'photo' | 'offer' | 'system';
  content: string | null;
  photo_url?: string | null;
  created_at: string;
  is_read: boolean;
  pending?: boolean;
  failed?: boolean;
}

interface ConvInfo {
  id: string;
  buyer_id: number;
  seller_id: number;
  annonce: { titre: string; image?: string | null; prix?: number | null };
  other_user: { prenom: string; nom: string };
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conv, setConv] = useState<ConvInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [connectionState, setConnectionState] = useState(messagingSocket.getSnapshot().state);
  const [reconnectInMs, setReconnectInMs] = useState<number | null>(messagingSocket.getSnapshot().reconnectInMs);
  const listRef = useRef<FlatList>(null);
  const socketRef = useRef<typeof messagingSocket | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didInitialScroll = useRef(false);
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      await api.post(`/messages/conversations/${id}`, { content });
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
      };
      setMessages((prev) => [...prev, optimistic]);
      scheduleScroll();
      return { optimistic };
    },
    onError: (_err, _content, context) => {
      if (!context?.optimistic) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === context.optimistic.id ? { ...m, pending: false, failed: true } : m))
      );
    },
  });

  const scheduleScroll = useCallback((delay = 100) => {
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, delay);
  }, []);

  const fetchConv = useCallback(async () => {
    try {
      const { data } = await messagesApi.getMessages(String(id), 1, 30);
      setConv(data.data.conversation);
      setMessages(data.data.messages ?? []);
      void messagesApi.markConversationRead(String(id)).catch(() => {});
    } catch {
      Alert.alert('Erreur', 'Conversation introuvable');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchConv();
  }, [fetchConv]);

  useEffect(() => messagingSocket.subscribeStatus((snapshot) => {
    setConnectionState(snapshot.state);
    setReconnectInMs(snapshot.reconnectInMs);
  }), []);

  useEffect(() => {
    if (!id) return;

    let alive = true;
    let socket: typeof messagingSocket | null = null;
    let onNewMessage: ((msg: Message) => void) | null = null;
    let onTyping: ((payload: { isTyping: boolean }) => void) | null = null;

    // TODO: test E2E sur la reconnexion WS et la reprise des événements en file d'attente.
    getSocket().then((s) => {
      if (!alive) return;
      socket = s;
      socketRef.current = s;
      socket.emit('join_conversation', id);

      onNewMessage = (msg: Message) => {
        setMessages((prev) => {
          const filtered = prev.filter((m) => !(m.pending && m.content === msg.content));
          return [...filtered, msg];
        });
        scheduleScroll();
      };

      onTyping = ({ isTyping }: { isTyping: boolean }) => {
        setTyping(isTyping);
      };

      socket.on('new_message', onNewMessage);
      socket.on('user_typing', onTyping);

      socketRef.current = socket;

      if (!alive && socket) {
        socket.emit('leave_conversation', id);
        if (onNewMessage) socket.off('new_message', onNewMessage);
        if (onTyping) socket.off('user_typing', onTyping);
      }
    });

    return () => {
      alive = false;
      socket?.emit('leave_conversation', id);
      if (onNewMessage) socket?.off('new_message', onNewMessage);
      if (onTyping) socket?.off('user_typing', onTyping);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
    };
  }, [id, scheduleScroll]);

  useEffect(() => {
    if (!loading && messages.length > 0 && !didInitialScroll.current) {
      didInitialScroll.current = true;
      scheduleScroll(0);
    }
  }, [loading, messages.length, scheduleScroll]);

  const sendMessage = async () => {
    if (!text.trim() || sending) return;
    const content = text.trim();
    setText('');
    setSending(true);

    try {
      await sendMessageMutation.mutateAsync(content);
    } catch {
      // rollback handled by onError
    } finally {
      setSending(false);
    }
  };

  const onTypingChange = (val: string) => {
    setText(val);
    socketRef.current?.emit('typing', { convId: id, isTyping: true });
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socketRef.current?.emit('typing', { convId: id, isTyping: false });
    }, 2500);
  };

  const connectionLabel = connectionState === 'connected'
    ? 'Connecté'
    : connectionState === 'reconnecting'
      ? `Reconnexion… ${Math.max(1, Math.ceil((reconnectInMs ?? 1000) / 1000))}s`
      : 'Hors ligne — les événements seront réémis dès le retour réseau';

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = Number(item.sender_id) === Number(user?.id);
    return (
      <View style={[styles.msgRow, isMine && styles.msgRowMine]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther, item.failed && styles.bubbleFailed]}>
          {item.type === 'photo' && item.photo_url ? (
            <Image source={{ uri: item.photo_url }} style={styles.photo} />
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
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: conv?.other_user
            ? `${conv.other_user.prenom} ${conv.other_user.nom}`
            : 'Conversation',
          headerBackTitle: 'Retour',
          headerTintColor: Colors.white,
          headerStyle: { backgroundColor: Colors.primary },
          headerTitleStyle: { color: Colors.white },
        }}
      />

      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {loading
          ? <ActivityIndicator color={Colors.primary} style={{ flex: 1 }} />
          : <>
              <FlatList
                ref={listRef}
                data={messages}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderMessage}
                contentContainerStyle={styles.list}
                ListHeaderComponent={
                  conv?.annonce ? (
                    <View style={styles.convMeta}>
                      <Text style={styles.convMetaTitle}>{conv.annonce.titre}</Text>
                      {conv.annonce.prix != null && (
                        <Text style={styles.convMetaPrice}>{conv.annonce.prix.toLocaleString('fr-NC')} XPF</Text>
                      )}
                    </View>
                  ) : null
                }
                ListFooterComponent={
                  typing
                    ? <View style={styles.typingWrap}>
                        <View style={styles.typingBubble}>
                          <Text style={styles.typingText}>En train d'écrire…</Text>
                        </View>
                      </View>
                    : null
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
                <TextInput
                  style={styles.input}
                  value={text}
                  onChangeText={onTypingChange}
                  placeholder="Votre message…"
                  placeholderTextColor={Colors.textTertiary}
                  accessibilityLabel="Saisir un message"
                  multiline
                  maxLength={2000}
                />
                <TouchableOpacity
                  style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
                  onPress={sendMessage}
                  disabled={!text.trim() || sending}
                  accessibilityRole="button"
                  accessibilityLabel="Envoyer le message"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="send" size={20} color={Colors.white} />
                </TouchableOpacity>
              </View>
            </>
        }
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Spacing.md, paddingBottom: Spacing.sm },
  convMeta: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  convMetaTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  convMetaPrice: { fontSize: FontSize.xs, color: Colors.primary, marginTop: 2, fontWeight: FontWeight.bold },
  msgRow: { marginBottom: Spacing.sm, alignItems: 'flex-start' },
  msgRowMine: { alignItems: 'flex-end' },
  bubble: { maxWidth: '78%', borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  bubbleMine: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  bubbleOther: {},
  bubbleFailed: { borderColor: Colors.danger },
  bubbleText: { fontSize: FontSize.md, color: Colors.text, lineHeight: 21 },
  bubbleTextMine: { color: Colors.white },
  photo: { width: 180, height: 180, borderRadius: Radius.md },
  statusIcon: { alignSelf: 'flex-end', marginTop: 2 },
  typingWrap: { padding: Spacing.md },
  typingBubble: { backgroundColor: Colors.gray100, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, alignSelf: 'flex-start' },
  typingText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontStyle: 'italic' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: Colors.white, padding: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border, gap: Spacing.sm },
  input: { flex: 1, backgroundColor: Colors.gray50, borderRadius: Radius.xl, paddingHorizontal: Spacing.md, paddingTop: 10, paddingBottom: 10, fontSize: FontSize.md, color: Colors.text, maxHeight: 120, borderWidth: 1, borderColor: Colors.border },
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
  connectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm, backgroundColor: Colors.white },
  connectionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.gray300 },
  connectionDotConnected: { backgroundColor: '#22c55e' },
  connectionDotReconnecting: { backgroundColor: '#f59e0b' },
  connectionDotOffline: { backgroundColor: '#ef4444' },
  connectionText: { fontSize: FontSize.xs },
  connectionTextConnected: { color: '#15803d' },
  connectionTextReconnecting: { color: '#d97706' },
  connectionTextOffline: { color: '#b91c1c' },
});
