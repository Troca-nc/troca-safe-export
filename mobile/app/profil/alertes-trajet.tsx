// ============================================================
//  Troca Mobile - Alertes trajet covoiturage
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Switch,
} from 'react-native'
import { Stack } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'

import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme'
import { covoitAlertsApi } from '@/lib/api'

const DAYS = [
  { value: null as number | null, label: 'N\'importe quel jour' },
  { value: 0, label: 'Lundi' },
  { value: 1, label: 'Mardi' },
  { value: 2, label: 'Mercredi' },
  { value: 3, label: 'Jeudi' },
  { value: 4, label: 'Vendredi' },
  { value: 5, label: 'Samedi' },
  { value: 6, label: 'Dimanche' },
]

interface CovoitAlert {
  id: number
  from_commune: string | null
  to_commune: string | null
  jour_semaine: number | null
  heure_min: string | null
  heure_max: string | null
  via_push: boolean
  via_email: boolean
  active: boolean
  last_notified_at: string | null
  created_at: string
}

function formatDay(value: number | null) {
  return DAYS.find((item) => item.value === value)?.label ?? 'N\'importe quel jour'
}

export default function AlertesTrajetScreen() {
  const [alertes, setAlertes] = useState<CovoitAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fromCommune, setFromCommune] = useState('')
  const [toCommune, setToCommune] = useState('')
  const [jourSemaine, setJourSemaine] = useState<number | null>(null)
  const [heureMin, setHeureMin] = useState('')
  const [heureMax, setHeureMax] = useState('')
  const [viaPush, setViaPush] = useState(true)
  const [viaEmail, setViaEmail] = useState(false)

  const fetchAlerts = useCallback(async () => {
    try {
      const { data } = await covoitAlertsApi.getAlerts()
      setAlertes(Array.isArray(data.data) ? data.data : [])
    } catch {
      Alert.alert('Erreur', 'Impossible de charger vos alertes trajet.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const activeCount = useMemo(() => alertes.filter((item) => item.active).length, [alertes])

  const saveAlert = async () => {
    if (activeCount >= 3) {
      Alert.alert('Limite atteinte', 'Vous pouvez créer jusqu\'à 3 alertes trajet.')
      return
    }

    setSaving(true)
    try {
      const { data } = await covoitAlertsApi.createAlert({
        from_commune: fromCommune.trim() || null,
        to_commune: toCommune.trim() || null,
        jour_semaine: jourSemaine,
        heure_min: heureMin.trim() || null,
        heure_max: heureMax.trim() || null,
        via_push: viaPush,
        via_email: viaEmail,
        active: true,
      })
      const created = data?.data
      if (created) {
        setAlertes((current) => [created, ...current])
      } else {
        await fetchAlerts()
      }
      setFromCommune('')
      setToCommune('')
      setJourSemaine(null)
      setHeureMin('')
      setHeureMax('')
      setViaPush(true)
      setViaEmail(false)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (err: any) {
      Alert.alert('Erreur', err?.response?.data?.error ?? 'Impossible de créer l\'alerte.')
    } finally {
      setSaving(false)
    }
  }

  const toggleAlert = async (item: CovoitAlert) => {
    try {
      const nextActive = !item.active
      await covoitAlertsApi.toggleAlert(item.id, { active: nextActive })
      setAlertes((current) => current.map((alert) => (alert.id === item.id ? { ...alert, active: nextActive } : alert)))
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre à jour l\'alerte.')
    }
  }

  const removeAlert = (item: CovoitAlert) => {
    Alert.alert('Supprimer l\'alerte ?', `${item.from_commune || 'Tous trajets'} → ${item.to_commune || 'toutes destinations'}`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await covoitAlertsApi.deleteAlert(item.id)
            setAlertes((current) => current.filter((alert) => alert.id !== item.id))
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          } catch {
            Alert.alert('Erreur', 'Impossible de supprimer l\'alerte.')
          }
        },
      },
    ])
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Alertes trajet',
          headerBackTitle: 'Profil',
          headerTintColor: Colors.primary,
          headerStyle: { backgroundColor: Colors.white },
        }}
      />

      <View style={styles.root}>
        <FlatList
          data={alertes}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Mes alertes trajet</Text>
              <Text style={styles.headerText}>
                Créez jusqu'à 3 alertes pour être notifié quand un trajet covoiturage correspond à vos habitudes.
              </Text>

              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Nouvelle alerte</Text>
                <View style={styles.row}>
                  <TextInput
                    value={fromCommune}
                    onChangeText={setFromCommune}
                    placeholder="Départ"
                    style={[styles.input, styles.flex]}
                  />
                  <TextInput
                    value={toCommune}
                    onChangeText={setToCommune}
                    placeholder="Arrivée"
                    style={[styles.input, styles.flex]}
                  />
                </View>

                <Text style={styles.label}>Jour</Text>
                <View style={styles.chipsRow}>
                  {DAYS.map((day) => {
                    const active = jourSemaine === day.value
                    return (
                      <TouchableOpacity
                        key={String(day.value ?? 'any')}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => setJourSemaine(day.value)}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{day.label}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>

                <View style={styles.row}>
                  <TextInput
                    value={heureMin}
                    onChangeText={setHeureMin}
                    placeholder="Heure min (HH:MM)"
                    style={[styles.input, styles.flex]}
                  />
                  <TextInput
                    value={heureMax}
                    onChangeText={setHeureMax}
                    placeholder="Heure max (HH:MM)"
                    style={[styles.input, styles.flex]}
                  />
                </View>

                <View style={styles.switchRow}>
                  <View style={styles.switchItem}>
                    <Text style={styles.switchLabel}>Push</Text>
                    <Switch value={viaPush} onValueChange={setViaPush} />
                  </View>
                  <View style={styles.switchItem}>
                    <Text style={styles.switchLabel}>Email</Text>
                    <Switch value={viaEmail} onValueChange={setViaEmail} />
                  </View>
                </View>

                <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={saveAlert} disabled={saving}>
                  {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveBtnText}>Créer l'alerte</Text>}
                </TouchableOpacity>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>
                    {item.from_commune || 'Tous départs'} → {item.to_commune || 'Toutes destinations'}
                  </Text>
                  <Text style={styles.cardMeta}>
                    {formatDay(item.jour_semaine)} · {item.heure_min || 'Tout horaire'}{item.heure_max ? ` - ${item.heure_max}` : ''}
                  </Text>
                </View>
                <Switch
                  value={item.active}
                  onValueChange={() => toggleAlert(item)}
                  trackColor={{ false: Colors.gray200, true: Colors.primaryLight }}
                  thumbColor={item.active ? Colors.primary : Colors.gray400}
                />
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => removeAlert(item)} style={styles.removeBtn}>
                  <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                  <Text style={styles.removeText}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🔔</Text>
                <Text style={styles.emptyTitle}>Aucune alerte trajet</Text>
                <Text style={styles.emptyText}>Créez une alerte pour être notifié dès qu'un trajet correspondant est publié.</Text>
              </View>
            ) : null
          }
          ListFooterComponent={loading ? <ActivityIndicator color={Colors.primary} style={{ paddingVertical: 24 }} /> : null}
        />
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 40 },
  header: { padding: Spacing.lg, paddingTop: 16 },
  headerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  headerText: { marginTop: 6, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  formCard: { marginTop: Spacing.md, backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadow.sm },
  formTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.sm },
  row: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  flex: { flex: 1 },
  input: {
    minHeight: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: FontSize.sm,
    backgroundColor: Colors.gray50,
    color: Colors.text,
  },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text, marginTop: 4, marginBottom: 8 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.sm },
  chip: {
    minHeight: 40,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: Colors.gray50,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  chipTextActive: { color: Colors.white, fontWeight: FontWeight.semibold },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 4 },
  switchItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  saveBtn: { minHeight: 48, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.md },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, ...Shadow.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  cardMeta: { marginTop: 4, fontSize: FontSize.xs, color: Colors.textSecondary },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  removeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, paddingHorizontal: 8 },
  removeText: { color: Colors.danger, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  empty: { paddingHorizontal: Spacing.lg, paddingVertical: 42, alignItems: 'center' },
  emptyIcon: { fontSize: 54 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, marginTop: Spacing.sm },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 },
})
