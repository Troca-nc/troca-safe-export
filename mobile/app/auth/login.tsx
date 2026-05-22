// ============================================================
//  Troca Mobile — Écran de connexion
// ============================================================

import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Link, router }    from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z }               from 'zod';
import { zodResolver }     from '@hookform/resolvers/zod';
import { useAuthStore }    from '@/store/authStore';
import { consumeRedirectAfterLogin } from '@/lib/authRedirect';
import SocialAuthButtons   from '@/components/ui/SocialAuthButtons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { DEMO_ACCOUNTS, isDemoModeEnabled } from '@/lib/demo';

const schema = z.object({
  email:    z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});
type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const { login, isLoading } = useAuthStore();
  const demoModeEnabled = isDemoModeEnabled();

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const loginAsDemo = async (email: string, password: string) => {
    try {
      await login(email, password);
    } catch (err: any) {
      Alert.alert('Connexion démo impossible', err?.response?.data?.error ?? 'Le backend local est indisponible.');
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      router.replace(await consumeRedirectAfterLogin('/tabs/accueil'));
    } catch (err: any) {
      Alert.alert(
        'Connexion impossible',
        err?.response?.data?.error ?? 'Email ou mot de passe incorrect'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={styles.logo}>🔁</Text>
          <Text style={styles.brand}>Troca</Text>
          <Text style={styles.tagline}>Petites annonces Nouvelle-Calédonie</Text>
        </View>

        {/* Carte de connexion */}
        <View style={styles.card}>
          <Text style={styles.title}>Se connecter</Text>

          {/* Email */}
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
                  returnKeyType="next"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
                {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}
              </View>
            )}
          />

          {/* Mot de passe */}
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value, onBlur } }) => (
              <View style={styles.field}>
                <Text style={styles.label}>Mot de passe</Text>
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textTertiary}
                  secureTextEntry
                  autoComplete="password"
                  accessibilityLabel="Mot de passe"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit(onSubmit)}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
                {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}
              </View>
            )}
          />

          {/* Bouton */}
          <TouchableOpacity
            style={[styles.btn, isLoading && styles.btnDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.btnText}>Se connecter</Text>
            }
          </TouchableOpacity>

          {/* Mot de passe oublié */}
          <TouchableOpacity
            style={styles.forgotWrap}
            onPress={() => router.push('/auth/forgot-password')}
            accessibilityRole="button"
            accessibilityLabel="Réinitialiser mon mot de passe"
          >
            <Text style={styles.forgot}>Mot de passe oublié ?</Text>
          </TouchableOpacity>
        </View>

        <SocialAuthButtons />

        {demoModeEnabled && (
          <View style={styles.demoCard}>
            <View style={styles.demoHeader}>
              <View>
                <Text style={styles.demoTitle}>Connexion instantanée locale</Text>
                <Text style={styles.demoSubtitle}>Testez les rôles réels seedés sans créer de compte.</Text>
              </View>
            </View>

            <View style={styles.demoGrid}>
              {Object.entries(DEMO_ACCOUNTS).map(([key, account]) => (
                <TouchableOpacity
                  key={key}
                  style={styles.demoButton}
                  onPress={() => loginAsDemo(account.email, account.password)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={`${account.label}. ${account.description}`}
                >
                  <Text style={styles.demoButtonLabel}>{account.label}</Text>
                  <Text style={styles.demoButtonText}>{account.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Lien inscription */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Pas encore de compte ? </Text>
          <Link href="/auth/register" style={styles.footerLink}>
            S'inscrire
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: Colors.primary },
  scroll:     { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
  logoWrap:   { alignItems: 'center', marginBottom: Spacing.xl },
  logo:       { fontSize: 64 },
  brand:      { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, color: Colors.white, marginTop: Spacing.sm },
  tagline:    { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: Spacing.xs },
  card:       { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.lg, ...Shadow.lg },
  title:      { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.lg },
  field:      { marginBottom: Spacing.md },
  label:      { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.gray700, marginBottom: Spacing.xs },
  input:      {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    fontSize: FontSize.md, color: Colors.text, backgroundColor: Colors.gray50,
  },
  inputError: { borderColor: Colors.danger },
  error:      { fontSize: FontSize.xs, color: Colors.danger, marginTop: 4 },
  btn:        {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: 14, alignItems: 'center', marginTop: Spacing.md,
  },
  btnDisabled:{ opacity: 0.6 },
  btnText:    { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  forgotWrap: { alignItems: 'center', marginTop: Spacing.md },
  forgot:     { color: Colors.primary, fontSize: FontSize.sm },
  demoCard:   {
    marginTop: Spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    padding: Spacing.md,
  },
  demoHeader: { marginBottom: Spacing.md },
  demoTitle:  { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  demoSubtitle: { color: 'rgba(255,255,255,0.76)', fontSize: FontSize.xs, marginTop: 4, lineHeight: 18 },
  demoGrid:   { gap: 10 },
  demoButton: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    minHeight: 60,
  },
  demoButtonLabel: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  demoButtonText: { color: Colors.gray600, fontSize: FontSize.xs, marginTop: 2, lineHeight: 16 },
  footer:     { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl },
  footerText: { color: 'rgba(255,255,255,0.85)', fontSize: FontSize.sm },
  footerLink: { color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
});
