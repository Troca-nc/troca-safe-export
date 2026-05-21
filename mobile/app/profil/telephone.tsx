// ============================================================
//  Troca Mobile — Vérification téléphone (Twilio Verify)
//  /app/profil/telephone.tsx
// ============================================================

import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState } from 'react';
import { router, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';

type Step = 'input' | 'code';

export default function TelephoneScreen() {
  const { user, refreshMe } = useAuthStore();
  const [step, setStep]         = useState<Step>('input');
  const [phone, setPhone]       = useState('');
  const [code, setCode]         = useState('');
  const [loading, setLoading]   = useState(false);

  // Normaliser : si 6 chiffres NC sans indicatif → ajouter +687
  const normalize = (val: string) => {
    const digits = val.replace(/\D/g, '');
    if (digits.length <= 6) return digits; // saisie en cours
    return digits.startsWith('687') ? `+${digits}` : `+687${digits}`;
  };

  // ── Étape 1 : envoyer le SMS ──────────────────────────────
  const sendCode = async () => {
    const normalized = normalize(phone);
    if (normalized.replace(/\D/g, '').length < 6) {
      Alert.alert('Numéro invalide', 'Entrez votre numéro de téléphone NC (6 chiffres).');
      return;
    }
    setLoading(true);
    try {
      await api.post('/phone/send', { telephone: normalized });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep('code');
    } catch (err: any) {
      Alert.alert('Erreur', err?.response?.data?.error ?? 'Impossible d\'envoyer le SMS');
    } finally { setLoading(false); }
  };

  // ── Étape 2 : vérifier le code ────────────────────────────
  const verifyCode = async () => {
    if (code.length !== 6) { Alert.alert('Code invalide', 'Le code doit contenir 6 chiffres.'); return; }
    setLoading(true);
    try {
      await api.post('/phone/verify', { telephone: normalize(phone), code });
      await refreshMe();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ Téléphone vérifié !', '', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err: any) {
      Alert.alert('Code incorrect', err?.response?.data?.error ?? 'Réessayez');
      setCode('');
    } finally { setLoading(false); }
  };

  return (
    <>
      <Stack.Screen options={{
        headerShown: true, headerTitle: 'Vérification téléphone',
        headerBackTitle: 'Profil', headerTintColor: Colors.primary,
        headerStyle: { backgroundColor: Colors.white },
      }} />

      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: Colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.root}>

          {/* Statut actuel */}
          {user?.telephone_verifie && (
            <View style={styles.verifiedBanner}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              <Text style={styles.verifiedText}>Numéro vérifié</Text>
            </View>
          )}

          <View style={styles.card}>
            {step === 'input' ? (
              <>
                <Text style={styles.title}>Votre numéro de téléphone</Text>
                <Text style={styles.hint}>
                  Entrez votre numéro NC (6 chiffres). Vous recevrez un SMS de vérification.
                </Text>

                <View style={styles.phoneRow}>
                  <View style={styles.flag}>
                    <Text style={{ fontSize: 20 }}>🇳🇨</Text>
                    <Text style={styles.dialCode}>+687</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    value={phone}
                    onChangeText={v => setPhone(v.replace(/\D/g, '').slice(0, 6))}
                    placeholder="XX XX XX"
                    placeholderTextColor={Colors.textTertiary}
                    keyboardType="phone-pad"
                    maxLength={6}
                    autoFocus
                  />
                </View>

                <TouchableOpacity
                  style={[styles.btn, (loading || phone.length < 6) && styles.btnDisabled]}
                  onPress={sendCode}
                  disabled={loading || phone.length < 6}
                >
                  {loading
                    ? <ActivityIndicator color={Colors.white} />
                    : <Text style={styles.btnText}>Recevoir le code SMS</Text>
                  }
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.title}>Code de vérification</Text>
                <Text style={styles.hint}>
                  Entrez le code à 6 chiffres envoyé au{'\n'}
                  <Text style={{ fontWeight: FontWeight.bold }}>+687 {phone}</Text>
                </Text>

                <TextInput
                  style={styles.codeInput}
                  value={code}
                  onChangeText={v => setCode(v.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="number-pad"
                  maxLength={6}
                  textAlign="center"
                  autoFocus
                />

                <TouchableOpacity
                  style={[styles.btn, (loading || code.length !== 6) && styles.btnDisabled]}
                  onPress={verifyCode}
                  disabled={loading || code.length !== 6}
                >
                  {loading
                    ? <ActivityIndicator color={Colors.white} />
                    : <Text style={styles.btnText}>Vérifier le code</Text>
                  }
                </TouchableOpacity>

                <TouchableOpacity style={styles.resend} onPress={() => { setStep('input'); setCode(''); }}>
                  <Text style={styles.resendText}>Modifier le numéro / Renvoyer</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, padding: Spacing.lg, backgroundColor: Colors.background },
  verifiedBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.successLight, padding: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.md },
  verifiedText:   { fontSize: FontSize.sm, color: Colors.success, fontWeight: FontWeight.semibold },
  card:           { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.lg },
  title:          { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.sm },
  hint:           { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.xl },
  phoneRow:       { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, overflow: 'hidden', marginBottom: Spacing.lg },
  flag:           { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: 12, backgroundColor: Colors.gray50, borderRightWidth: 1, borderRightColor: Colors.border },
  dialCode:       { fontSize: FontSize.md, color: Colors.text, fontWeight: FontWeight.medium },
  phoneInput:     { flex: 1, paddingHorizontal: Spacing.md, paddingVertical: 12, fontSize: FontSize.xl, letterSpacing: 4, color: Colors.text },
  codeInput:      { fontSize: FontSize.xxxl, letterSpacing: 12, borderWidth: 1, borderColor: Colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.md, marginBottom: Spacing.lg, color: Colors.text },
  btn:            { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center' },
  btnDisabled:    { opacity: 0.5 },
  btnText:        { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  resend:         { alignItems: 'center', marginTop: Spacing.lg },
  resendText:     { color: Colors.primary, fontSize: FontSize.sm },
});
