// ============================================================
//  Troca Mobile - Abonnement Pro (Stripe / PayPlug)
//  /app/profil/abonnement.tsx
// ============================================================

import { useMemo, useState } from 'react'
import { Alert, ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Stack } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useStripe } from '@stripe/stripe-react-native'
import * as Haptics from 'expo-haptics'
import { WebView } from 'react-native-webview'

import { PaymentProviderSelector, type PaymentProvider } from '@/components/PaymentProviderSelector'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'
import { api } from '@/lib/api'
import { isDemoModeEnabled } from '@/lib/demo'
import { useAuthStore } from '@/store/authStore'

type Plan = 'pro_mensuel' | 'pro_annuel'

type ErrorLike = {
  response?: {
    data?: {
      error?: string
    }
  }
  message?: string
}

const PLANS = [
  {
    id: 'pro_mensuel' as Plan,
    label: 'Pro Mensuel',
    price: '15 000',
    period: 'par mois',
    saving: null,
    highlight: false,
  },
  {
    id: 'pro_annuel' as Plan,
    label: 'Pro Annuel',
    price: '144 000',
    period: 'par an',
    saving: '2 mois offerts',
    highlight: true,
  },
] as const

const FEATURES = [
  { icon: '🚀', text: 'Annonces boostées prioritaires' },
  { icon: '♾️', text: 'Annonces illimitées (vs 5 gratuites)' },
  { icon: '📸', text: "Jusqu'à 15 photos par annonce" },
  { icon: '📊', text: 'Statistiques de vues détaillées' },
  { icon: '🏷️', text: 'Badge Pro visible sur votre profil' },
  { icon: '⚡', text: 'Support prioritaire' },
]

function getSubscriptionPayload(plan: Plan) {
  return {
    plan_id: 'pro',
    billing_period: plan.includes('annuel') ? 'yearly' : 'monthly',
  } as const
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), ms)
  })
}

function getErrorMessage(err: unknown, fallback: string) {
  const error = err as ErrorLike
  return error?.response?.data?.error ?? error?.message ?? fallback
}

export default function AbonnementScreen() {
  const { user, refreshMe } = useAuthStore()
  const { initPaymentSheet, presentPaymentSheet } = useStripe()
  const [selectedPlan, setSelected] = useState<Plan>('pro_annuel')
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>('stripe')
  const [payplugCheckoutUrl, setPayplugCheckoutUrl] = useState<string | null>(null)
  const [verifyingPayplug, setVerifyingPayplug] = useState(false)
  const [loading, setLoading] = useState(false)
  const demoModeEnabled = isDemoModeEnabled()

  const subscriptionPayload = useMemo(() => getSubscriptionPayload(selectedPlan), [selectedPlan])

  const handleStripeSubscription = async () => {
    if (demoModeEnabled) {
      Alert.alert('Paiement simulé — Mode démo actif', 'Votre abonnement a été enregistré en simulation.');
      return;
    }

    const { data } = await api.post('/payment/subscribe/mobile', { plan: selectedPlan })

    const { error: initError } = await initPaymentSheet({
      merchantDisplayName: 'Troca NC',
      paymentIntentClientSecret: data.data.client_secret,
      customerId: data.data.customer_id,
      customerEphemeralKeySecret: data.data.ephemeral_key,
      defaultBillingDetails: { name: `${user?.prenom ?? ''} ${user?.nom ?? ''}`.trim() },
      allowsDelayedPaymentMethods: false,
      returnURL: 'troca://payment-return',
    })

    if (initError) throw new Error(initError.message)

    const { error: payError } = await presentPaymentSheet()
    if (payError) {
      if (payError.code !== 'Canceled') Alert.alert('Paiement échoué', payError.message)
      return
    }

    await refreshMe()
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    Alert.alert('🎉 Bienvenue Pro !', 'Votre abonnement est actif. Profitez de toutes les fonctionnalités Pro.')
  }

  const confirmPayplugSubscription = async (paymentId: string) => {
    setVerifyingPayplug(true)

    try {
      if (demoModeEnabled) {
        setPayplugCheckoutUrl(null)
        await refreshMe()
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        Alert.alert('Paiement simulé — Mode démo actif', 'Votre abonnement a été enregistré en simulation.');
        return
      }

      for (let attempt = 0; attempt < 10; attempt += 1) {
        const { data } = await api.get('/payment/verify-payplug', {
          params: {
            id: paymentId,
            type: 'subscription',
            resource_type: 'subscription',
          },
        })

        if (data.status === 'ok_subscription' || data.status === 'ok_trial') {
          setPayplugCheckoutUrl(null)
          await refreshMe()
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          Alert.alert('🎉 Bienvenue Pro !', 'Votre abonnement est actif. Profitez de toutes les fonctionnalités Pro.')
          return
        }

        if (attempt < 9) {
          await sleep(3000)
        }
      }

      Alert.alert(
        'Validation en cours',
        'Votre abonnement PayPlug est en cours de validation. Réessayez dans quelques instants.',
      )
    } catch (err: unknown) {
      Alert.alert('Erreur', getErrorMessage(err, 'Impossible de vérifier le paiement PayPlug'))
    } finally {
      setVerifyingPayplug(false)
    }
  }

  const handlePayplugNavigation = async (url: string) => {
    try {
      const parsed = new URL(url)
      if (!parsed.pathname.includes('/abonnement/confirmation')) return

      const paymentId = parsed.searchParams.get('payment_id')
      if (!paymentId) return

      void confirmPayplugSubscription(paymentId)
    } catch {
      // URL parsing can fail on internal WebView schemes.
    }
  }

  const handleSubscribe = async () => {
    setLoading(true)

    try {
      if (demoModeEnabled) {
        Alert.alert('Paiement simulé — Mode démo actif', 'Votre abonnement a été enregistré en simulation.');
        return
      }

      if (paymentProvider === 'payplug') {
        const { data } = await api.post('/payment/subscribe', {
          ...subscriptionPayload,
          provider: 'payplug',
        })

        if (!data?.checkout_url) {
          throw new Error('Lien PayPlug indisponible')
        }

        setPayplugCheckoutUrl(data.checkout_url)
        return
      }

      await handleStripeSubscription()
    } catch (err: unknown) {
      Alert.alert('Erreur', getErrorMessage(err, "Impossible de finaliser l'abonnement"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Compte Pro',
          headerBackTitle: 'Profil',
          headerTintColor: Colors.primary,
          headerStyle: { backgroundColor: Colors.white },
        }}
      />

      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        {user?.is_pro && (
          <View style={styles.alreadyPro}>
            <Ionicons name="star" size={24} color={Colors.warning} />
            <View>
              <Text style={styles.alreadyProTitle}>Vous êtes déjà Pro ⭐</Text>
              <Text style={styles.alreadyProSub}>Gérez votre abonnement sur troca.nc</Text>
            </View>
          </View>
        )}

        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>⭐</Text>
          <Text style={styles.heroTitle}>Passez Pro</Text>
          <Text style={styles.heroSub}>
            Vendez plus vite avec des fonctionnalités exclusives adaptées aux particuliers et
            professionnels de Nouvelle-Calédonie.
          </Text>
        </View>

        {demoModeEnabled && (
          <View style={styles.demoNotice}>
            <Ionicons name="warning" size={16} color="#7C2D12" />
            <Text style={styles.demoNoticeText}>Mode démonstration — Aucun paiement réel ne sera effectué.</Text>
          </View>
        )}

        <View style={styles.features}>
          {FEATURES.map((feature, index) => (
            <View key={`${feature.text}-${index}`} style={styles.feature}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.plansTitle}>Choisissez votre formule</Text>
        {PLANS.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.planCard,
              selectedPlan === plan.id && styles.planCardActive,
              plan.highlight && styles.planCardHighlight,
            ]}
            onPress={() => setSelected(plan.id)}
            activeOpacity={0.85}
          >
            {plan.highlight && (
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>Le plus populaire</Text>
              </View>
            )}

            <View style={styles.planRow}>
              <View style={[styles.radio, selectedPlan === plan.id && styles.radioActive]}>
                {selectedPlan === plan.id && <View style={styles.radioDot} />}
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planLabel}>{plan.label}</Text>
                {plan.saving && <Text style={styles.planSaving}>{plan.saving}</Text>}
              </View>
              <View style={styles.planPriceWrap}>
                <Text style={styles.planPrice}>{plan.price} XPF</Text>
                <Text style={styles.planPeriod}>{plan.period}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.providerSection}>
          <PaymentProviderSelector value={paymentProvider} onChange={setPaymentProvider} />
        </View>

        {!user?.is_pro && (
          <TouchableOpacity
            style={[styles.cta, loading && styles.ctaDisabled]}
            onPress={handleSubscribe}
            disabled={loading || verifyingPayplug}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="star-outline" size={20} color={Colors.white} />
                <Text style={styles.ctaText}>
                  {paymentProvider === 'payplug' ? 'Continuer vers PayPlug' : "S'abonner maintenant"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <Text style={styles.legal}>
          Paiement sécurisé par Stripe ou PayPlug. Résiliation possible à tout moment depuis votre
          espace client sur troca.nc. Conformément aux CGU, aucun remboursement n&apos;est effectué
          pour la période en cours.
        </Text>
      </ScrollView>

      <Modal
        visible={Boolean(payplugCheckoutUrl)}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPayplugCheckoutUrl(null)}
      >
        <View style={styles.webviewModal}>
          <View style={styles.webviewHeader}>
            <View style={styles.webviewHeaderText}>
              <Text style={styles.webviewTitle}>Paiement PayPlug</Text>
              <Text style={styles.webviewSubtitle}>
                Votre tunnel sécurisé local s&apos;ouvre dans cette fenêtre.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setPayplugCheckoutUrl(null)}
              style={styles.webviewClose}
              activeOpacity={0.85}
            >
              <Ionicons name="close" size={20} color={Colors.gray700} />
            </TouchableOpacity>
          </View>

          <View style={styles.webviewBody}>
            {demoModeEnabled ? (
              <View style={styles.demoNoticeModal}>
                <Ionicons name="warning" size={16} color="#7C2D12" />
                <Text style={styles.demoNoticeText}>Mode démonstration — Aucun paiement réel ne sera effectué.</Text>
              </View>
            ) : null}

            {payplugCheckoutUrl ? (
              <WebView
                source={{ uri: payplugCheckoutUrl }}
                style={styles.webviewFrame}
                onNavigationStateChange={(navState) => {
                  if (verifyingPayplug) return
                  void handlePayplugNavigation(navState.url)
                }}
                startInLoadingState
                javaScriptEnabled
                domStorageEnabled
                renderLoading={() => (
                  <View style={styles.webviewLoading}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.webviewLoadingText}>Chargement du paiement sécurisé...</Text>
                  </View>
                )}
              />
            ) : null}

            {verifyingPayplug && (
              <View style={styles.webviewOverlay}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.webviewLoadingText}>Validation en cours...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 48 },
  alreadyPro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.warningLight,
    margin: Spacing.lg,
    padding: Spacing.md,
    borderRadius: Radius.lg,
  },
  alreadyProTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.gray800 },
  alreadyProSub: { fontSize: FontSize.sm, color: Colors.gray600, marginTop: 2 },
  hero: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  heroEmoji: { fontSize: 56 },
  heroTitle: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, color: Colors.text, marginTop: Spacing.sm },
  heroSub: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 20 },
  features: { backgroundColor: Colors.white, margin: Spacing.lg, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md, ...Shadow.sm },
  feature: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  featureIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  featureText: { fontSize: FontSize.md, color: Colors.text, flex: 1 },
  demoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  demoNoticeModal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: Spacing.lg,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  demoNoticeText: {
    flex: 1,
    color: '#7C2D12',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    lineHeight: 20,
  },
  plansTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  planCard: { backgroundColor: Colors.white, marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 2, borderColor: Colors.border, ...Shadow.sm },
  planCardActive: { borderColor: Colors.primary },
  planCardHighlight: { borderColor: Colors.primary },
  planBadge: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: Spacing.sm },
  planBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.white },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.gray300, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  planInfo: { flex: 1 },
  planLabel: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  planSaving: { fontSize: FontSize.xs, color: Colors.success, marginTop: 2 },
  planPriceWrap: { alignItems: 'flex-end' },
  planPrice: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.primary },
  planPeriod: { fontSize: FontSize.xs, color: Colors.textTertiary },
  providerSection: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    margin: Spacing.lg,
    borderRadius: Radius.md,
    paddingVertical: 16,
    ...Shadow.md,
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  legal: { fontSize: FontSize.xs, color: Colors.textTertiary, textAlign: 'center', marginHorizontal: Spacing.xl, lineHeight: 17 },
  webviewModal: { flex: 1, backgroundColor: Colors.background },
  webviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingTop: 16,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  webviewHeaderText: { flex: 1, gap: 4 },
  webviewTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  webviewSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18 },
  webviewClose: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray100,
  },
  webviewBody: { flex: 1, backgroundColor: Colors.white },
  webviewFrame: { flex: 1 },
  webviewLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
    backgroundColor: Colors.white,
  },
  webviewLoadingText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  webviewOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.88)',
  },
})
