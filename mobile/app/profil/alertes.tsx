// ============================================================
//  Troca Mobile - Alertes de recherche
// ============================================================

import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Switch,
} from 'react-native'
import { useEffect, useState, useCallback } from 'react'
import { Stack } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { alertsApi } from '@/lib/api'
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme'

interface Alerte {
  id: number
  label: string
  frequency: 'immediate' | 'daily' | 'weekly'
  status: 'active' | 'paused' | 'deleted'
  nb_results: number
  last_sent_at: string | null
  created_at: string
}

const FREQ_LABELS: Record<string, string> = {
  immediate: '⚡ Immédiate',
  daily: '📅 Quotidienne',
  weekly: '📆 Hebdomadaire',
}

export default function AlertesScreen() {
  const [alertes, setAlertes] = useState<Alerte[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetch = useCallback(async () => {
    try {
      const { data } = await alertsApi.getAlerts()
      setAlertes(data.data ?? [])
    } catch {
      Alert.alert('Erreur')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  const toggleAlerte = async (a: Alerte) => {
    const newStatus = a.status === 'active' ? 'paused' : 'active'
    try {
      await alertsApi.toggleAlert(a.id, newStatus)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      setAlertes((prev) => prev.map((x) => (x.id === a.id ? { ...x, status: newStatus } : x)))
    } catch {
      Alert.alert('Erreur')
    }
  }

  const deleteAlerte = (a: Alerte) => {
    Alert.alert('Supprimer l\'alerte ?', `"${a.label}"`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await alertsApi.deleteAlert(a.id)
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            setAlertes((prev) => prev.filter((x) => x.id !== a.id))
          } catch {
            Alert.alert('Erreur')
          }
        },
      },
    ])
  }

  const renderItem = ({ item }: { item: Alerte }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <Ionicons name="notifications-outline" size={18} color={Colors.primary} />
          <Text style={styles.label} numberOfLines={1}>
            {item.label}
          </Text>
        </View>
        <Switch
          value={item.status === 'active'}
          onValueChange={() => toggleAlerte(item)}
          trackColor={{ false: Colors.gray200, true: Colors.primaryLight }}
          thumbColor={item.status === 'active' ? Colors.primary : Colors.gray400}
        />
      </View>

      <View style={styles.cardMeta}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{FREQ_LABELS[item.frequency]}</Text>
        </View>
        {item.nb_results > 0 && (
          <View style={[styles.chip, styles.chipGreen]}>
            <Text style={[styles.chipText, { color: Colors.success }]}>
              {item.nb_results} résultat{item.nb_results > 1 ? 's' : ''} envoyé{item.nb_results > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>

      {item.last_sent_at && (
        <Text style={styles.lastSent}>Dernier envoi : {new Date(item.last_sent_at).toLocaleDateString('fr-NC')}</Text>
      )}

      <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteAlerte(item)}>
        <Ionicons name="trash-outline" size={16} color={Colors.danger} />
        <Text style={styles.deleteText}>Supprimer</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Mes alertes',
          headerBackTitle: 'Profil',
          headerTintColor: Colors.primary,
          headerStyle: { backgroundColor: Colors.white },
        }}
      />

      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
          <Text style={styles.infoText}>
            Les alertes sont créées depuis la page de recherche (site web ou appui long sur une annonce).
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ flex: 1 }} />
        ) : (
          <FlatList
            data={alertes}
            keyExtractor={(a) => String(a.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true)
                  fetch()
                }}
                tintColor={Colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🔔</Text>
                <Text style={styles.emptyTitle}>Aucune alerte</Text>
                <Text style={styles.emptyText}>
                  Effectuez une recherche et appuyez sur "Créer une alerte" pour être notifié des nouvelles annonces.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, backgroundColor: Colors.primaryLight, padding: Spacing.md, margin: Spacing.md, borderRadius: Radius.md },
  infoText: { flex: 1, fontSize: FontSize.xs, color: Colors.primary, lineHeight: 17 },
  list: { padding: Spacing.md, paddingTop: 0, paddingBottom: 32 },
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1, marginRight: Spacing.sm },
  label: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text, flex: 1 },
  cardMeta: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', marginBottom: Spacing.sm },
  chip: { backgroundColor: Colors.gray100, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  chipGreen: { backgroundColor: Colors.successLight },
  chipText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  lastSent: { fontSize: FontSize.xs, color: Colors.textTertiary, marginBottom: Spacing.sm },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end' },
  deleteText: { fontSize: FontSize.sm, color: Colors.danger },
  empty: { alignItems: 'center', paddingTop: 60, padding: Spacing.xl },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, marginTop: Spacing.md },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 20 },
})
