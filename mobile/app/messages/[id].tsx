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
import { api, messagesApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import type { Socket } from 'socket.io-client';

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
  const listRef = useRef<FlatList>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didInitialScroll = useRef(false);

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

  useEffect(() => {
    if (!id) return;

    let alive = true;
    let socket: Socket | null = null;
    let onNewMessage: ((msg: Message) => void) | null = null;
    let onTyping: ((payload: { isTyping: boolean }) => void) | null = null;

    getSocket().then((s) => {
      if (!alive) return;
      socket = s;
      socketRef.current = s;
      socket.emit('join_conversation', id);
      socket.emit('mark_read', id);

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

    try {
      await api.post(`/messages/conversations/${id}`, { content });
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? { ...m, pending: false, failed: true } : m))
      );
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
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: Colors.gray300 },
});
