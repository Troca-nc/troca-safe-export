// ============================================================
//  Kalico Mobile - Paramètres de notification
// ============================================================

import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native'
import { Stack } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme'
import { bonPlansApi, notificationsApi } from '@/lib/api'

type NotificationPrefs = {
  email_new_message: boolean
  push_new_message: boolean
  email_search_alert: boolean
  push_search_alert: boolean
  email_boost_activated: boolean
  email_offer_received: boolean
  email_listing_expiring: boolean
  email_listing_expired: boolean
  email_performance_report: boolean
  push_performance_report: boolean
  performance_report_frequency: 'daily' | 'weekly' | 'monthly' | 'never'
}

type BonPlanPrefs = {
  notify_all: boolean
  notify_categories: string[]
  notify_businesses: string[]
  via_push: boolean
  via_email: boolean
}

const DEFAULT_PREFS: NotificationPrefs = {
  email_new_message: true,
  push_new_message: true,
  email_search_alert: true,
  push_search_alert: true,
  email_boost_activated: true,
  email_offer_received: true,
  email_listing_expiring: true,
  email_listing_expired: true,
  email_performance_report: true,
  push_performance_report: false,
  performance_report_frequency: 'weekly',
}

const DEFAULT_BON_PLAN_PREFS: BonPlanPrefs = {
  notify_all: false,
  notify_categories: [],
  notify_businesses: [],
  via_push: true,
  via_email: false,
}

const FREQUENCIES: Array<{ value: NotificationPrefs['performance_report_frequency']; label: string }> = [
  { value: 'daily', label: 'Quotidien' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuel' },
  { value: 'never', label: 'Jamais' },
]

const BON_PLAN_CATEGORIES = [
  { value: 'alimentation', label: 'Alimentation' },
  { value: 'mode', label: 'Mode' },
  { value: 'beaute', label: 'Beauté' },
  { value: 'high_tech', label: 'High-tech' },
  { value: 'auto_moto', label: 'Auto / Moto' },
  { value: 'maison', label: 'Maison' },
  { value: 'restauration', label: 'Restauration' },
  { value: 'services', label: 'Services' },
  { value: 'sport', label: 'Sport' },
  { value: 'voyages', label: 'Voyages' },
] as const

const toneStyles = {
  coral: { accent: Colors.primaryLight, icon: Colors.primary, border: Colors.border },
  lagoon: { accent: Colors.lagoonLight, icon: Colors.lagoon, border: Colors.lagoonBorder },
  emerald: { accent: Colors.emeraldLight, icon: Colors.emerald, border: Colors.emeraldBorder },
  corail: { accent: Colors.corailLight, icon: Colors.corail, border: Colors.corailBorder },
} as const

function SectionCard({
  icon,
  title,
  description,
  tone = 'coral',
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  description: string
  tone?: keyof typeof toneStyles
  children: ReactNode
}) {
  const palette = toneStyles[tone]
  return (
    <View style={[styles.card, { borderColor: palette.border }]}>
      <View style={styles.cardHead}>
        <View style={[styles.iconWrap, { backgroundColor: palette.accent }]}>
          <Ionicons name={icon} size={18} color={palette.icon} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDesc}>{description}</Text>
        </View>
      </View>
      <View style={{ marginTop: Spacing.md }}>{children}</View>
    </View>
  )
}

function SwitchRow({
  title,
  description,
  value,
  onValueChange,
  tone = 'coral',
}: {
  title: string
  description: string
  value: boolean
  onValueChange: (next: boolean) => void
  tone?: keyof typeof toneStyles
}) {
  const palette = toneStyles[tone]

  return (
    <View style={styles.switchRow}>
      <View style={{ flex: 1, paddingRight: Spacing.sm }}>
        <Text style={styles.switchTitle}>{title}</Text>
        <Text style={styles.switchDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.gray200, true: palette.accent }}
        thumbColor={value ? palette.icon : Colors.gray400}
      />
    </View>
  )
}

function Chip({
  label,
  active,
  onPress,
  tone = 'coral',
}: {
  label: string
  active: boolean
  onPress: () => void
  tone?: keyof typeof toneStyles
}) {
  const palette = toneStyles[tone]
  return (
    <TouchableOpacity
      style={[styles.chip, active && { backgroundColor: palette.icon, borderColor: palette.icon }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  )
}

export default function NotificationSettingsScreen() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS)
  const [bonPlanPrefs, setBonPlanPrefs] = useState<BonPlanPrefs>(DEFAULT_BON_PLAN_PREFS)
  const [bonPlanBusinesses, setBonPlanBusinesses] = useState<Array<{ name: string }>>([])
  const [bonPlanBusinessInput, setBonPlanBusinessInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const update = <K extends keyof NotificationPrefs>(key: K, value: NotificationPrefs[K]) => {
    setPrefs((current) => ({ ...current, [key]: value }))
  }

  const updateBonPlan = <K extends keyof BonPlanPrefs>(key: K, value: BonPlanPrefs[K]) => {
    setBonPlanPrefs((current) => ({ ...current, [key]: value }))
  }

  useEffect(() => {
    let alive = true

    const load = async () => {
      try {
        const [notifRes, bonPlanRes, businessesRes] = await Promise.all([
          notificationsApi.getPreferences(),
          bonPlansApi.getPrefs(),
          bonPlansApi.businesses(),
        ])

        if (!alive) return

        const notificationCurrent = notifRes.data?.data ?? {}
        const bonPlanCurrent = bonPlanRes.data?.data ?? {}

        setPrefs({
          email_new_message: notificationCurrent.email_new_message !== false,
          push_new_message: notificationCurrent.push_new_message !== false,
          email_search_alert: notificationCurrent.email_search_alert !== false,
          push_search_alert: notificationCurrent.push_search_alert !== false,
          email_boost_activated: notificationCurrent.email_boost_activated !== false,
          email_offer_received: notificationCurrent.email_offer_received !== false,
          email_listing_expiring: notificationCurrent.email_listing_expiring !== false,
          email_listing_expired: notificationCurrent.email_listing_expired !== false,
          email_performance_report: notificationCurrent.email_performance_report !== false,
          push_performance_report: notificationCurrent.push_performance_report === true,
          performance_report_frequency: notificationCurrent.performance_report_frequency ?? 'weekly',
        })

        setBonPlanPrefs({
          notify_all: Boolean(bonPlanCurrent.notify_all),
          notify_categories: Array.isArray(bonPlanCurrent.notify_categories) ? bonPlanCurrent.notify_categories : [],
          notify_businesses: Array.isArray(bonPlanCurrent.notify_businesses) ? bonPlanCurrent.notify_businesses : [],
          via_push: bonPlanCurrent.via_push !== false,
          via_email: bonPlanCurrent.via_email === true,
        })
        setBonPlanBusinesses(Array.isArray(businessesRes.data?.data) ? businessesRes.data.data : [])
      } catch {
        if (!alive) return
        setMessage('Les préférences sont momentanément indisponibles.')
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [])

  const save = async () => {
    setSaving(true)
    setMessage(null)

    try {
      await Promise.all([notificationsApi.savePreferences(prefs), bonPlansApi.savePrefs(bonPlanPrefs)])
      setMessage('Préférences enregistrées.')
    } catch {
      Alert.alert('Erreur', 'Impossible d’enregistrer vos préférences.')
    } finally {
      setSaving(false)
    }
  }

  const freqLabel = useMemo(
    () => FREQUENCIES.find((item) => item.value === prefs.performance_report_frequency)?.label ?? 'Hebdomadaire',
    [prefs.performance_report_frequency]
  )

  const activeBonPlanCategories = bonPlanPrefs.notify_categories.length

  const toggleBonPlanCategory = (value: string) => {
    setBonPlanPrefs((current) => ({
      ...current,
      notify_categories: current.notify_categories.includes(value)
        ? current.notify_categories.filter((item) => item !== value)
        : [...current.notify_categories, value],
    }))
  }

  const addBonPlanBusiness = () => {
    const next = bonPlanBusinessInput.trim()
    if (!next) return

    setBonPlanPrefs((current) => ({
      ...current,
      notify_businesses: Array.from(new Set([...current.notify_businesses, next])),
    }))
    setBonPlanBusinessInput('')
  }

  const removeBonPlanBusiness = (business: string) => {
    setBonPlanPrefs((current) => ({
      ...current,
      notify_businesses: current.notify_businesses.filter((item) => item !== business),
    }))
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Notifications',
          headerBackTitle: 'Profil',
          headerTintColor: Colors.primary,
          headerStyle: { backgroundColor: Colors.white },
        }}
      />

      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTag}>Centre unique de notifications</Text>
          <Text style={styles.heroTitle}>Choisissez ce qui vous alerte, et comment.</Text>
          <Text style={styles.heroText}>
            Centralisez ici les messages, les alertes d’offres, les rapports de performance et les Bons Plans.
          </Text>

          <View style={styles.heroBadges}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{prefs.email_new_message || prefs.push_new_message ? 'Messages actifs' : 'Messages off'}</Text>
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{activeBonPlanCategories} catégories Bons Plans</Text>
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Email + push</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickLinks}>
          <View style={styles.quickLink}>
            <Ionicons name="chatbubble-ellipses-outline" size={14} color={Colors.primary} />
            <Text style={styles.quickLinkText}>Messages</Text>
          </View>
          <View style={styles.quickLink}>
            <Ionicons name="megaphone-outline" size={14} color={Colors.lagoon} />
            <Text style={styles.quickLinkText}>Alertes</Text>
          </View>
          <View style={styles.quickLink}>
            <Ionicons name="sparkles-outline" size={14} color={Colors.emerald} />
            <Text style={styles.quickLinkText}>Rapports</Text>
          </View>
          <View style={styles.quickLink}>
            <Ionicons name="storefront-outline" size={14} color={Colors.corail} />
            <Text style={styles.quickLinkText}>Bons Plans</Text>
          </View>
        </View>

        {message && (
          <View style={styles.notice}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
            <Text style={styles.noticeText}>{message}</Text>
          </View>
        )}

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xl }} />
        ) : (
          <>
            <SectionCard
              icon="chatbubble-ellipses-outline"
              title="Nouveau message"
              description="Recevez les réponses et nouvelles conversations via email ou push."
              tone="coral"
            >
              <SwitchRow
                title="Email"
                description="Un email à chaque nouveau message reçu."
                value={prefs.email_new_message}
                onValueChange={(next) => update('email_new_message', next)}
                tone="coral"
              />
              <View style={styles.divider} />
              <SwitchRow
                title="Push mobile"
                description="Une notification discrète sur votre téléphone."
                value={prefs.push_new_message}
                onValueChange={(next) => update('push_new_message', next)}
                tone="coral"
              />
            </SectionCard>

            <SectionCard
              icon="megaphone-outline"
              title="Alertes d’offres"
              description="Recevez les nouvelles annonces correspondant à vos recherches."
              tone="lagoon"
            >
              <SwitchRow
                title="Email"
                description="Les alertes arrivent dans votre boîte de réception."
                value={prefs.email_search_alert}
                onValueChange={(next) => update('email_search_alert', next)}
                tone="lagoon"
              />
              <View style={styles.divider} />
              <SwitchRow
                title="Push mobile"
                description="Complétez l’email par une alerte push."
                value={prefs.push_search_alert}
                onValueChange={(next) => update('push_search_alert', next)}
                tone="lagoon"
              />
            </SectionCard>

            <SectionCard
              icon="sparkles-outline"
              title="Annonces, boosts et expirations"
              description="Suivez les boosts, les offres reçues et les rappels d’expiration."
              tone="corail"
            >
              <SwitchRow
                title="Boost d’annonce"
                description="Un email quand votre boost est activé."
                value={prefs.email_boost_activated}
                onValueChange={(next) => update('email_boost_activated', next)}
                tone="corail"
              />
              <View style={styles.divider} />
              <SwitchRow
                title="Nouvelle offre"
                description="Un email dès qu’une offre arrive dans la messagerie."
                value={prefs.email_offer_received}
                onValueChange={(next) => update('email_offer_received', next)}
                tone="corail"
              />
              <View style={styles.divider} />
              <SwitchRow
                title="Annonce bientôt expirée"
                description="Le rappel 3 jours avant l’échéance."
                value={prefs.email_listing_expiring}
                onValueChange={(next) => update('email_listing_expiring', next)}
                tone="corail"
              />
              <View style={styles.divider} />
              <SwitchRow
                title="Annonce expirée"
                description="Un email quand l’annonce est réellement expirée."
                value={prefs.email_listing_expired}
                onValueChange={(next) => update('email_listing_expired', next)}
                tone="corail"
              />
            </SectionCard>

            <SectionCard
              icon="storefront-outline"
              title="Bons Plans & promotions"
              description="Regroupez les promos par canal, catégorie ou enseigne favorite."
              tone="emerald"
            >
              <SwitchRow
                title="Toutes les nouvelles promos"
                description="Recevoir chaque bon plan publié sur Kalico."
                value={bonPlanPrefs.notify_all}
                onValueChange={(next) => updateBonPlan('notify_all', next)}
                tone="emerald"
              />
              <View style={styles.divider} />
              <SwitchRow
                title="Push mobile"
                description="Recevoir les promotions les plus utiles en notification."
                value={bonPlanPrefs.via_push}
                onValueChange={(next) => updateBonPlan('via_push', next)}
                tone="emerald"
              />
              <View style={styles.divider} />
              <SwitchRow
                title="Par email"
                description="Une synthèse des meilleures promos dans votre boîte de réception."
                value={bonPlanPrefs.via_email}
                onValueChange={(next) => updateBonPlan('via_email', next)}
                tone="emerald"
              />

              <Text style={styles.selectLabel}>Catégories favorites</Text>
              <Text style={styles.helper}>
                Cochez une ou plusieurs familles pour filtrer les promotions utiles.
              </Text>
              <View style={styles.chipsRow}>
                {BON_PLAN_CATEGORIES.map((category) => {
                  const active = bonPlanPrefs.notify_categories.includes(category.value)
                  return (
                    <Chip
                      key={category.value}
                      label={category.label}
                      active={active}
                      onPress={() => toggleBonPlanCategory(category.value)}
                      tone="emerald"
                    />
                  )
                })}
              </View>
              <View style={styles.summaryLine}>
                <Ionicons name="pricetag-outline" size={14} color={Colors.emerald} />
                <Text style={styles.summaryText}>
                  {activeBonPlanCategories} catégorie{activeBonPlanCategories > 1 ? 's' : ''} sélectionnée{activeBonPlanCategories > 1 ? 's' : ''}
                </Text>
              </View>

              <Text style={[styles.selectLabel, { marginTop: Spacing.lg }]}>Enseignes favorites</Text>
              <Text style={styles.helper}>
                Ajoutez les marques ou commerces que vous souhaitez suivre plus attentivement.
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  value={bonPlanBusinessInput}
                  onChangeText={setBonPlanBusinessInput}
                  placeholder="Ajouter une enseigne"
                  placeholderTextColor={Colors.textTertiary}
                  style={styles.input}
                  returnKeyType="done"
                  onSubmitEditing={addBonPlanBusiness}
                />
                <TouchableOpacity style={styles.inputButton} onPress={addBonPlanBusiness} activeOpacity={0.85}>
                  <Text style={styles.inputButtonText}>Ajouter</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.businessesWrap}>
                {bonPlanPrefs.notify_businesses.length === 0 ? (
                  <Text style={styles.emptyChip}>Aucune enseigne enregistrée pour le moment</Text>
                ) : (
                  bonPlanPrefs.notify_businesses.map((business) => (
                    <TouchableOpacity
                      key={business}
                      style={styles.businessChip}
                      onPress={() => removeBonPlanBusiness(business)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.businessChipText}>{business}</Text>
                      <Ionicons name="close" size={12} color={Colors.gray500} />
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </SectionCard>

            <SectionCard
              icon="sparkles-outline"
              title="Rapports de performance"
              description="Suivez les vues, clics et favoris de vos annonces."
              tone="corail"
            >
              <SwitchRow
                title="Email récapitulatif"
                description="Rapport simple ou plus détaillé selon votre activité."
                value={prefs.email_performance_report}
                onValueChange={(next) => update('email_performance_report', next)}
                tone="corail"
              />
              <View style={styles.divider} />
              <SwitchRow
                title="Push mobile"
                description="Recevez un rappel quand un rapport est prêt."
                value={prefs.push_performance_report}
                onValueChange={(next) => update('push_performance_report', next)}
                tone="corail"
              />

              <Text style={styles.selectLabel}>Fréquence du rapport</Text>
              <View style={styles.chipsRow}>
                {FREQUENCIES.map((freq) => {
                  const active = prefs.performance_report_frequency === freq.value
                  return (
                    <TouchableOpacity
                      key={freq.value}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => update('performance_report_frequency', freq.value)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{freq.label}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
              <Text style={styles.helper}>Fréquence actuelle: {freqLabel}</Text>
            </SectionCard>

            <View style={styles.footerCard}>
              <Text style={styles.footerTitle}>Désabonnement et confidentialité</Text>
              <Text style={styles.footerText}>
                Les emails incluent un lien direct de désabonnement par catégorie. Vous pouvez aussi revenir ici à tout moment pour tout modifier.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={save}
              activeOpacity={0.85}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveBtnText}>Enregistrer mes préférences</Text>}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  hero: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heroTag: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginTop: 6,
  },
  heroText: {
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  heroBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: Spacing.md,
  },
  heroBadge: {
    backgroundColor: Colors.gray50,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroBadgeText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  quickLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: Spacing.md,
  },
  quickLink: {
    flexGrow: 1,
    minWidth: 120,
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickLinkText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  noticeText: { flex: 1, fontSize: FontSize.xs, lineHeight: 18, color: Colors.primary },
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    ...Shadow.sm,
    borderWidth: 1,
    backgroundColor: Colors.white,
  },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  iconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  cardDesc: { marginTop: 4, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 19 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, paddingVertical: 4 },
  switchTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  switchDesc: { marginTop: 2, fontSize: FontSize.xs, lineHeight: 17, color: Colors.textSecondary },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: {
    minHeight: 40,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
    backgroundColor: Colors.gray50,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  chipTextActive: { color: Colors.white, fontWeight: FontWeight.semibold },
  selectLabel: { marginTop: 12, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  helper: { marginTop: 8, fontSize: FontSize.xs, color: Colors.textTertiary, lineHeight: 17 },
  summaryLine: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  summaryText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  inputRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  input: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    color: Colors.text,
    fontSize: FontSize.sm,
  },
  inputButton: {
    minHeight: 48,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  inputButtonText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  businessesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  businessChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  businessChipText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  emptyChip: {
    borderRadius: Radius.full,
    backgroundColor: Colors.gray50,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  footerCard: { marginTop: Spacing.md, backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  footerTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text },
  footerText: { marginTop: 6, fontSize: FontSize.sm, lineHeight: 20, color: Colors.textSecondary },
  saveBtn: { minHeight: 50, borderRadius: Radius.lg, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.lg, ...Shadow.sm },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.bold },
})
