// ============================================================
//  Troca Mobile — Onglet Messages (liste des conversations)
// ============================================================

import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { messagesApi } from '@/lib/api';
import { getSocket, messagingSocket } from '@/lib/socket';
import { setBadge } from '@/lib/notifications';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Conversation {
  id:          string;
  listing_id:  string;
  buyer_id:    number;
  seller_id:   number;
  unread_count: number;
  updated_at:  string;
  annonce: { titre?: string; image?: string | null; image_url?: string | null };
  other_user:  { prenom?: string; nom?: string; avatar_url: string | null; trust_score?: number | null; trust_level?: string | null };
  last_message?: { content: string };
}

export default function MessagesTab() {
  const [convs, setConvs]           = useState<Conversation[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connectionState, setConnectionState] = useState(messagingSocket.getSnapshot().state);
  const [reconnectInMs, setReconnectInMs] = useState<number | null>(messagingSocket.getSnapshot().reconnectInMs);

  const fetchConvs = useCallback(async () => {
    try {
      const { data } = await messagesApi.getConversations();
      const list = data.data ?? [];
      setConvs(list);
      const unread = list.reduce((sum: number, c: Conversation) => sum + (c.unread_count ?? 0), 0);
      await setBadge(unread);
    } catch (err) {
      console.error('[messages] fetch error', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refresh quand on revient sur l'onglet
  useFocusEffect(useCallback(() => { fetchConvs(); }, [fetchConvs]));

  useEffect(() => messagingSocket.subscribeStatus((snapshot) => {
    setConnectionState(snapshot.state);
    setReconnectInMs(snapshot.reconnectInMs);
  }), []);

  // Écouter les nouvelles notifications WS pour rafraîchir la liste
  useEffect(() => {
    let cleanup: (() => void) | null = null;

    getSocket().then((socket) => {
      const onNotif = (n: { type: string }) => {
        if (n.type === 'new_message') fetchConvs();
      };
      socket.on('notification', onNotif);
      cleanup = () => socket.off('notification', onNotif);
    });

    return () => { cleanup?.(); };
  }, [fetchConvs]);

  const renderItem = ({ item }: { item: Conversation }) => {
    const isUnread = item.unread_count > 0;
    const otherUser = item.other_user;
    const initials = `${otherUser.prenom?.[0] ?? '?'}${otherUser.nom?.[0] ?? '?'}`.toUpperCase();
    const timeAgo = formatDistanceToNow(new Date(item.updated_at), {
      addSuffix: true, locale: fr,
    });

    return (
      <TouchableOpacity
        style={[styles.item, isUnread && styles.itemUnread]}
        onPress={() => router.push(`/messages/${item.id}`)}
        activeOpacity={0.75}
      >
        {/* Avatar */}
        {otherUser.avatar_url
          ? <Image source={{ uri: otherUser.avatar_url }} style={styles.avatar} />
          : <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
        }

        <View style={styles.itemBody}>
          <View style={styles.itemHeader}>
            <Text style={[styles.itemName, isUnread && styles.itemNameBold]}>
              {otherUser.prenom ?? 'Utilisateur'} {otherUser.nom ?? ''}
            </Text>
            <Text style={styles.itemTime}>{timeAgo}</Text>
          </View>
          {otherUser.trust_score != null && (
            <View style={styles.trustRow}>
              <Ionicons name="shield-checkmark" size={10} color={Colors.primary} />
              <Text style={styles.trustText}>
                Confiance {otherUser.trust_score}/100{otherUser.trust_level ? ` · ${otherUser.trust_level}` : ''}
              </Text>
            </View>
          )}
          <Text style={styles.itemAnnonce} numberOfLines={1}>
            {item.annonce.titre ?? 'Annonce'}
          </Text>
          <Text
            style={[styles.itemLast, isUnread && styles.itemLastBold]}
            numberOfLines={1}
          >
            {item.last_message?.content ?? 'Nouvelle conversation'}
          </Text>
        </View>

        {isUnread && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unread_count}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <View style={styles.connectionRow}>
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
            {connectionState === 'connected'
              ? 'Connecté'
              : connectionState === 'reconnecting'
                ? `Reconnexion… ${Math.max(1, Math.ceil((reconnectInMs ?? 1000) / 1000))}s`
                : 'Hors ligne — file d’attente active'}
          </Text>
        </View>
      </View>

      {loading
        ? <ActivityIndicator color={Colors.primary} style={{ flex: 1 }} />
        : <FlatList
            data={convs}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchConvs(); }} tintColor={Colors.primary} />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={styles.emptyTitle}>Aucun message</Text>
                <Text style={styles.emptyText}>
                  Contactez un vendeur depuis une annonce pour démarrer une conversation.
                </Text>
              </View>
            }
          />
      }
    </View>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: Colors.background },
  header:     { backgroundColor: Colors.white, paddingTop: 56, paddingBottom: Spacing.md, paddingHorizontal: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title:      { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  connectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  connectionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.gray300 },
  connectionDotConnected: { backgroundColor: '#22c55e' },
  connectionDotReconnecting: { backgroundColor: '#f59e0b' },
  connectionDotOffline: { backgroundColor: '#ef4444' },
  connectionText: { fontSize: FontSize.xs },
  connectionTextConnected: { color: '#15803d' },
  connectionTextReconnecting: { color: '#d97706' },
  connectionTextOffline: { color: '#b91c1c' },
  list:       { flexGrow: 1 },
  item:       { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  itemUnread: { backgroundColor: Colors.primaryLight },
  avatar:     { width: 52, height: 52, borderRadius: 26, marginRight: Spacing.md },
  avatarFallback: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  avatarText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  itemBody:   { flex: 1 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName:   { fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.text },
  itemNameBold: { fontWeight: FontWeight.bold },
  itemTime:   { fontSize: FontSize.xs, color: Colors.textTertiary },
  trustRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  trustText:  { fontSize: FontSize.xs, color: Colors.textSecondary },
  itemAnnonce:{ fontSize: FontSize.xs, color: Colors.primary, marginTop: 1 },
  itemLast:   { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  itemLastBold:{ color: Colors.text, fontWeight: FontWeight.semibold },
  unreadBadge:{ backgroundColor: Colors.primary, borderRadius: 12, minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, marginLeft: Spacing.sm },
  unreadText: { color: Colors.white, fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  separator:  { height: 1, backgroundColor: Colors.border, marginLeft: 52 + Spacing.lg + Spacing.md },
  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, paddingTop: 80 },
  emptyIcon:  { fontSize: 56, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  emptyText:  { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 20 },
});
