// ============================================================
//  Troca Mobile - Prefs Bons Plans
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Stack, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { bonPlansApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme'

const CATEGORIES = ['alimentation', 'mode', 'beaute', 'high_tech', 'auto_moto', 'maison', 'restauration', 'services', 'sport', 'voyages']

export default function BonPlansPrefsScreen() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [businessQuery, setBusinessQuery] = useState('')
  const [businesses, setBusinesses] = useState<Array<{ name: string }>>([])
  const [prefs, setPrefs] = useState({
    notify_all: false,
    notify_categories: [] as string[],
    notify_businesses: [] as string[],
    via_push: true,
    via_email: false,
  })

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const [prefsRes, businessesRes] = await Promise.all([bonPlansApi.getPrefs(), bonPlansApi.businesses()])
        if (!alive) return
        const current = prefsRes.data?.data ?? {}
        setPrefs({
          notify_all: Boolean(current.notify_all),
          notify_categories: Array.isArray(current.notify_categories) ? current.notify_categories : [],
          notify_businesses: Array.isArray(current.notify_businesses) ? current.notify_businesses : [],
          via_push: current.via_push !== false,
          via_email: Boolean(current.via_email),
        })
        setBusinesses(Array.isArray(businessesRes.data?.data) ? businessesRes.data.data : [])
      } catch {
        if (!alive) return
        Alert.alert('Erreur', 'Impossible de charger les préférences Bons Plans.')
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [])

  const filteredBusinesses = useMemo(
    () => businesses.filter((business) => business.name.toLowerCase().includes(businessQuery.trim().toLowerCase())).slice(0, 8),
    [businessQuery, businesses],
  )

  const save = async () => {
    setSaving(true)
    try {
      await bonPlansApi.savePrefs(prefs)
      Alert.alert('Préférences enregistrées')
    } catch {
      Alert.alert('Erreur', 'Impossible d’enregistrer vos préférences.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Bons Plans',
          headerBackTitle: 'Profil',
          headerTintColor: Colors.primary,
          headerStyle: { backgroundColor: Colors.white },
        }}
      />

      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Notifications Bons Plans</Text>
          <Text style={styles.title}>Choisissez les promos que vous voulez voir</Text>
          <Text style={styles.subtitle}>Vous pouvez suivre toutes les promos, seulement certaines catégories, ou vos enseignes favorites.</Text>
        </View>

        {loading ? (
          <View style={styles.card}>
            <Text style={styles.helper}>Chargement…</Text>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Canaux</Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Notifications push</Text>
                <Switch
                  value={prefs.via_push}
                  onValueChange={(value) => setPrefs((current) => ({ ...current, via_push: value }))}
                  trackColor={{ false: Colors.gray200, true: Colors.primaryLight }}
                  thumbColor={prefs.via_push ? Colors.primary : Colors.gray400}
                />
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Par email</Text>
                <Switch
                  value={prefs.via_email}
                  onValueChange={(value) => setPrefs((current) => ({ ...current, via_email: value }))}
                  trackColor={{ false: Colors.gray200, true: Colors.primaryLight }}
                  thumbColor={prefs.via_email ? Colors.primary : Colors.gray400}
                />
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Toutes les promos</Text>
                  <Text style={styles.helper}>Recevoir chaque bon plan publié sur Troca.</Text>
                </View>
                <Switch
                  value={prefs.notify_all}
                  onValueChange={(value) => setPrefs((current) => ({ ...current, notify_all: value }))}
                  trackColor={{ false: Colors.gray200, true: Colors.primaryLight }}
                  thumbColor={prefs.notify_all ? Colors.primary : Colors.gray400}
                />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Par catégorie</Text>
              <View style={styles.chipWrap}>
                {CATEGORIES.map((category) => {
                  const active = prefs.notify_categories.includes(category)
                  return (
                    <TouchableOpacity
                      key={category}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setPrefs((current) => ({
                        ...current,
                        notify_categories: active
                          ? current.notify_categories.filter((value) => value !== category)
                          : [...current.notify_categories, category],
                      }))}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{category.replace('_', ' ')}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Par enseigne</Text>
              <View style={styles.businesses}>
                {prefs.notify_businesses.map((business) => (
                  <View key={business} style={styles.businessChip}>
                    <Text style={styles.businessChipText}>{business}</Text>
                    <TouchableOpacity onPress={() => setPrefs((current) => ({
                      ...current,
                      notify_businesses: current.notify_businesses.filter((value) => value !== business),
                    }))}>
                      <Ionicons name="close-circle" size={16} color={Colors.gray400} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  value={businessQuery}
                  onChangeText={setBusinessQuery}
                  placeholder="Ajouter une enseigne"
                  style={styles.input}
                />
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => {
                    const next = businessQuery.trim()
                    if (!next) return
                    setPrefs((current) => ({
                      ...current,
                      notify_businesses: Array.from(new Set([...current.notify_businesses, next])),
                    }))
                    setBusinessQuery('')
                  }}
                >
                  <Text style={styles.addBtnText}>Ajouter</Text>
                </TouchableOpacity>
              </View>
              {filteredBusinesses.length > 0 && (
                <View style={styles.suggestions}>
                  {filteredBusinesses.map((business) => (
                    <TouchableOpacity
                      key={business.name}
                      style={styles.suggestionItem}
                      onPress={() => {
                        setPrefs((current) => ({
                          ...current,
                          notify_businesses: Array.from(new Set([...current.notify_businesses, business.name])),
                        }))
                        setBusinessQuery('')
                      }}
                    >
                      <Text style={styles.suggestionText}>{business.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={save} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Enregistrement…' : 'Enregistrer les préférences'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkBtn} onPress={() => router.push('/bons-plans' as any)}>
              <Ionicons name="pricetag-outline" size={16} color={Colors.primary} />
              <Text style={styles.linkBtnText}>Voir les bons plans</Text>
            </TouchableOpacity>
          </>
        )}

        {user?.is_pro ? (
          <View style={styles.noteCard}>
            <Text style={styles.noteText}>En tant que compte Pro, vous pouvez aussi bénéficier du tarif réduit sur les bons plans.</Text>
          </View>
        ) : null}
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: 36, gap: Spacing.md },
  hero: { backgroundColor: Colors.primary, borderRadius: Radius.xl, padding: Spacing.lg, ...Shadow.sm },
  kicker: { color: 'rgba(255,255,255,0.75)', fontSize: FontSize.xs, fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 1.5 },
  title: { color: Colors.white, fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginTop: 6 },
  subtitle: { color: 'rgba(255,255,255,0.85)', fontSize: FontSize.sm, marginTop: 6, lineHeight: 20 },
  card: { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.md, ...Shadow.sm },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  helper: { marginTop: 4, fontSize: FontSize.xs, color: Colors.textTertiary },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  rowLabel: { fontSize: FontSize.sm, color: Colors.text },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  chip: { borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  chipTextActive: { color: Colors.white, fontWeight: FontWeight.semibold },
  businesses: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: Spacing.sm },
  businessChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: Colors.gray100 },
  businessChipText: { fontSize: FontSize.xs, color: Colors.text },
  inputRow: { flexDirection: 'row', gap: 8, marginTop: Spacing.md },
  input: { flex: 1, minHeight: 44, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, paddingHorizontal: 14, backgroundColor: Colors.white, color: Colors.text },
  addBtn: { minHeight: 44, borderRadius: Radius.lg, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary },
  addBtnText: { color: Colors.white, fontWeight: FontWeight.bold },
  suggestions: { marginTop: 10, gap: 8 },
  suggestionItem: { borderRadius: Radius.md, padding: 10, backgroundColor: Colors.gray100 },
  suggestionText: { color: Colors.text },
  saveBtn: { minHeight: 48, borderRadius: Radius.lg, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: Colors.white, fontWeight: FontWeight.bold },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center' },
  linkBtnText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  noteCard: { backgroundColor: Colors.primaryLight, borderRadius: Radius.lg, padding: Spacing.md },
  noteText: { color: Colors.primaryDark, fontSize: FontSize.sm, lineHeight: 20 },
})
