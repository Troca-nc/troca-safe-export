// ============================================================
//  Troca Mobile — Mot de passe oublié
// ============================================================

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { API_ORIGIN } from '@/lib/api';

const schema = z.object({
  email: z.string().email('Email invalide'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setSending(true);
    try {
      await axios.post(`${API_ORIGIN}/api/auth/forgot-password`, { email: data.email });
      setSent(true);
      Alert.alert('Email envoyé', 'Si le compte existe, un lien de réinitialisation a été envoyé.');
    } catch (err: any) {
      Alert.alert('Erreur', err?.response?.data?.error ?? 'Impossible d’envoyer la demande.');
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Mot de passe oublié</Text>
          <Text style={styles.subtitle}>
            Entrez votre email. Si un compte existe, nous enverrons un lien de réinitialisation.
          </Text>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value, onBlur } }) => (
              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="votre@email.com"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  accessibilityLabel="Adresse email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
                {errors.email ? <Text style={styles.error}>{errors.email.message}</Text> : null}
              </View>
            )}
          />

          <TouchableOpacity
            style={[styles.btn, sending && styles.btnDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={sending}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Envoyer le lien de réinitialisation"
          >
            {sending ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Envoyer le lien</Text>}
          </TouchableOpacity>

          {sent ? (
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Demande envoyée</Text>
              <Text style={styles.infoText}>Vérifiez votre boîte de réception puis revenez vous connecter.</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Retour à la connexion ? </Text>
          <Link href="/auth/login" style={styles.footerLink}>Se connecter</Link>
        </View>

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primary },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
  card: { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.lg, ...Shadow.lg },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  subtitle: { marginTop: Spacing.sm, marginBottom: Spacing.lg, color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },
  field: { marginBottom: Spacing.md },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.gray700, marginBottom: Spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: FontSize.md,
    color: Colors.text,
    backgroundColor: Colors.gray50,
  },
  inputError: { borderColor: Colors.danger },
  error: { fontSize: FontSize.xs, color: Colors.danger, marginTop: 4 },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.sm,
    minHeight: 52,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  infoBox: { marginTop: Spacing.md, borderRadius: Radius.md, backgroundColor: Colors.primaryLight, padding: Spacing.md },
  infoTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primaryDark },
  infoText: { marginTop: 4, fontSize: FontSize.sm, color: Colors.primaryDark, lineHeight: 20 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  footerText: { color: 'rgba(255,255,255,0.85)', fontSize: FontSize.sm },
  footerLink: { color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  backBtn: { marginTop: Spacing.md, alignItems: 'center' },
  backText: { color: 'rgba(255,255,255,0.9)', fontSize: FontSize.sm, textDecorationLine: 'underline' },
});
