// ============================================================
//  Troca Mobile — Écran d'inscription
// ============================================================

import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Link }                from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z }                   from 'zod';
import { zodResolver }         from '@hookform/resolvers/zod';
import { useAuthStore }        from '@/store/authStore';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';

const schema = z.object({
  prenom:   z.string().min(1, 'Prénom requis').max(50),
  nom:      z.string().min(1, 'Nom requis').max(50),
  email:    z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
});
type FormData = z.infer<typeof schema>;

export default function RegisterScreen() {
  const { register: registerUser, isLoading } = useAuthStore();

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser(data);
    } catch (err: any) {
      Alert.alert(
        'Inscription impossible',
        err?.response?.data?.error ?? 'Une erreur est survenue'
      );
    }
  };

  const fields: Array<{
    name: keyof FormData;
    label: string;
    placeholder: string;
    keyboard?: 'email-address' | 'default';
    secure?: boolean;
    autoComplete?: string;
  }> = [
    { name: 'prenom',   label: 'Prénom',          placeholder: 'Jean' },
    { name: 'nom',      label: 'Nom',              placeholder: 'Dupont' },
    { name: 'email',    label: 'Email',            placeholder: 'jean@email.com', keyboard: 'email-address', autoComplete: 'email' },
    { name: 'password', label: 'Mot de passe',     placeholder: '8 caractères minimum', secure: true, autoComplete: 'new-password' },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoWrap}>
          <Text style={styles.logo}>🔁</Text>
          <Text style={styles.brand}>Troca</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Créer un compte</Text>

          {fields.map((f) => (
            <Controller
              key={f.name}
              control={control}
              name={f.name}
              render={({ field: { onChange, value, onBlur } }) => (
                <View style={styles.field}>
                  <Text style={styles.label}>{f.label}</Text>
                  <TextInput
                    style={[styles.input, errors[f.name] && styles.inputError]}
                    placeholder={f.placeholder}
                    placeholderTextColor={Colors.textTertiary}
                    keyboardType={f.keyboard ?? 'default'}
                    autoCapitalize={f.keyboard === 'email-address' ? 'none' : 'words'}
                    secureTextEntry={f.secure}
                    autoComplete={f.autoComplete as any}
                    accessibilityLabel={f.label}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                  {errors[f.name] && (
                    <Text style={styles.error}>{errors[f.name]?.message}</Text>
                  )}
                </View>
              )}
            />
          ))}

          <TouchableOpacity
            style={[styles.btn, isLoading && styles.btnDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.btnText}>Créer mon compte</Text>
            }
          </TouchableOpacity>

          <Text style={styles.cgu}>
            En créant un compte, vous acceptez nos{' '}
            <Text style={styles.cguLink}>CGU</Text> et notre{' '}
            <Text style={styles.cguLink}>politique de confidentialité</Text>.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Déjà un compte ? </Text>
          <Link href="/auth/login" style={styles.footerLink}>Se connecter</Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: Colors.primary },
  scroll:     { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
  logoWrap:   { alignItems: 'center', marginBottom: Spacing.lg },
  logo:       { fontSize: 48 },
  brand:      { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.white, marginTop: Spacing.xs },
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
  cgu:        { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.md, lineHeight: 18 },
  cguLink:    { color: Colors.primary },
  footer:     { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  footerText: { color: 'rgba(255,255,255,0.85)', fontSize: FontSize.sm },
  footerLink: { color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
});
