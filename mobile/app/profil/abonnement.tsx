// ============================================================
//  Troca Mobile — Abonnement Pro (Stripe PaymentSheet)
//  /app/profil/abonnement.tsx
// ============================================================

import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';
import * as Haptics from 'expo-haptics';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';

type Plan = 'pro_mensuel' | 'pro_annuel' | 'pro_plus_mensuel' | 'pro_plus_annuel';

const PLANS = [
  {
    id:        'pro_mensuel' as Plan,
    label:     'Pro Mensuel',
    price:     '15 000',
    period:    'par mois',
    saving:    null,
    highlight: false,
  },
  {
    id:        'pro_annuel' as Plan,
    label:     'Pro Annuel',
    price:     '144 000',
    period:    'par an',
    saving:    '2 mois offerts',
    highlight: true,
  },
  {
    id:        'pro_plus_mensuel' as Plan,
    label:     'Pro Plus Mensuel',
    price:     '35 000',
    period:    'par mois',
    saving:    null,
    highlight: false,
  },
  {
    id:        'pro_plus_annuel' as Plan,
    label:     'Pro Plus Annuel',
    price:     '312 000',
    period:    'par an',
    saving:    '2 mois offerts',
    highlight: false,
  },
];

const FEATURES = [
  { icon: '🚀', text: 'Annonces boostées prioritaires' },
  { icon: '♾️',  text: 'Annonces illimitées (vs 5 gratuites)' },
  { icon: '📸', text: "Jusqu'à 15 photos par annonce" },
  { icon: '📊', text: 'Statistiques de vues détaillées' },
  { icon: '🏷️', text: 'Badge Pro visible sur votre profil' },
  { icon: '⚡', text: 'Support prioritaire' },
  { icon: '✨', text: 'Pro Plus pour vendeurs intensifs' },
];

export default function AbonnementScreen() {
  const { user, refreshMe }        = useAuthStore();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [selectedPlan, setSelected] = useState<Plan>('pro_annuel');
  const [loading, setLoading]       = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      // 1. Créer la session Stripe côté backend
      const { data } = await api.post('/payment/subscribe/mobile', { plan: selectedPlan });

      // 2. Initialiser le PaymentSheet Stripe
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName:       'Troca NC',
        paymentIntentClientSecret: data.data.client_secret,
        customerId:                data.data.customer_id,
        customerEphemeralKeySecret:data.data.ephemeral_key,
        defaultBillingDetails:     { name: `${user?.prenom} ${user?.nom}` },
        allowsDelayedPaymentMethods: false,
        returnURL: 'troca://payment-return',
      });

      if (initError) throw new Error(initError.message);

      // 3. Afficher le formulaire de paiement natif Stripe
      const { error: payError } = await presentPaymentSheet();

      if (payError) {
        if (payError.code !== 'Canceled') Alert.alert('Paiement échoué', payError.message);
        return;
      }

      // 4. Rafraîchir le profil (is_pro sera maintenant true)
      await refreshMe();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('🎉 Bienvenue Pro !', 'Votre abonnement est actif. Profitez de toutes les fonctionnalités Pro.');
    } catch (err: any) {
      Alert.alert('Erreur', err?.response?.data?.error ?? err.message ?? 'Impossible de finaliser l\'abonnement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{
        headerShown: true, headerTitle: 'Compte Pro',
        headerBackTitle: 'Profil', headerTintColor: Colors.primary,
        headerStyle: { backgroundColor: Colors.white },
      }} />

      <ScrollView style={styles.root} contentContainerStyle={styles.content}>

        {/* Déjà Pro */}
        {user?.is_pro && (
          <View style={styles.alreadyPro}>
            <Ionicons name="star" size={24} color={Colors.warning} />
            <View>
              <Text style={styles.alreadyProTitle}>Vous êtes déjà Pro ⭐</Text>
              <Text style={styles.alreadyProSub}>Gérez votre abonnement sur troca.nc</Text>
            </View>
          </View>
        )}

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>⭐</Text>
          <Text style={styles.heroTitle}>Passez Pro</Text>
          <Text style={styles.heroSub}>
            Vendez plus vite avec des fonctionnalités exclusives adaptées aux particuliers et professionnels de Nouvelle-Calédonie.
          </Text>
        </View>

        {/* Fonctionnalités */}
        <View style={styles.features}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.feature}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Plans */}
        <Text style={styles.plansTitle}>Choisissez votre formule</Text>
        {PLANS.map(plan => (
          <TouchableOpacity
            key={plan.id}
            style={[styles.planCard, selectedPlan === plan.id && styles.planCardActive, plan.highlight && styles.planCardHighlight]}
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

        {/* CTA */}
        {!user?.is_pro && (
          <TouchableOpacity
            style={[styles.cta, loading && styles.ctaDisabled]}
            onPress={handleSubscribe}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <>
                  <Ionicons name="star-outline" size={20} color={Colors.white} />
                  <Text style={styles.ctaText}>S'abonner maintenant</Text>
                </>
            }
            </TouchableOpacity>
        )}

        <Text style={styles.legal}>
          Paiement sécurisé par Stripe. Résiliation possible à tout moment depuis votre espace client sur troca.nc. Conformément aux CGU, aucun remboursement n'est effectué pour la période en cours.
        </Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  root:              { flex: 1, backgroundColor: Colors.background },
  content:           { paddingBottom: 48 },
  alreadyPro:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.warningLight, margin: Spacing.lg, padding: Spacing.md, borderRadius: Radius.lg },
  alreadyProTitle:   { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.gray800 },
  alreadyProSub:     { fontSize: FontSize.sm, color: Colors.gray600, marginTop: 2 },
  hero:              { alignItems: 'center', padding: Spacing.xl, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  heroEmoji:         { fontSize: 56 },
  heroTitle:         { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, color: Colors.text, marginTop: Spacing.sm },
  heroSub:           { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 20 },
  features:          { backgroundColor: Colors.white, margin: Spacing.lg, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md, ...Shadow.sm },
  feature:           { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  featureIcon:       { fontSize: 20, width: 28, textAlign: 'center' },
  featureText:       { fontSize: FontSize.md, color: Colors.text, flex: 1 },
  plansTitle:        { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  planCard:          { backgroundColor: Colors.white, marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 2, borderColor: Colors.border, ...Shadow.sm },
  planCardActive:    { borderColor: Colors.primary },
  planCardHighlight: { borderColor: Colors.primary },
  planBadge:         { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: Spacing.sm },
  planBadgeText:     { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.white },
  planRow:           { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  radio:             { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.gray300, alignItems: 'center', justifyContent: 'center' },
  radioActive:       { borderColor: Colors.primary },
  radioDot:          { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  planInfo:          { flex: 1 },
  planLabel:         { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  planSaving:        { fontSize: FontSize.xs, color: Colors.success, marginTop: 2 },
  planPriceWrap:     { alignItems: 'flex-end' },
  planPrice:         { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.primary },
  planPeriod:        { fontSize: FontSize.xs, color: Colors.textTertiary },
  cta:               { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, margin: Spacing.lg, borderRadius: Radius.md, paddingVertical: 16, ...Shadow.md },
  ctaDisabled:       { opacity: 0.6 },
  ctaText:           { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  legal:             { fontSize: FontSize.xs, color: Colors.textTertiary, textAlign: 'center', marginHorizontal: Spacing.xl, lineHeight: 17 },
});
