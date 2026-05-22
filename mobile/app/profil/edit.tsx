// ============================================================
//  Troca Mobile — Édition du profil
//  /app/profil/edit.tsx
// ============================================================

import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState } from 'react';
import { router, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';

const schema = z.object({
  prenom:       z.string().min(1, 'Requis').max(50),
  nom:          z.string().min(1, 'Requis').max(50),
  current_password: z.string().optional(),
  new_password:     z.string().min(8, 'Minimum 8 caractères').optional().or(z.literal('')),
}).refine(d => {
  if (d.new_password && !d.current_password) return false;
  return true;
}, { message: 'Mot de passe actuel requis', path: ['current_password'] });

type FormData = z.infer<typeof schema>;

export default function EditProfilScreen() {
  const { user, refreshMe } = useAuthStore();
  const [loading, setLoading]       = useState(false);
  const [avatarUri, setAvatarUri]   = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      prenom: user?.prenom ?? '',
      nom:    user?.nom    ?? '',
    },
  });

  // ── Changer la photo de profil ────────────────────────────
  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission refusée'); return; }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:  ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect:      [1, 1],
      quality:     0.8,
    });
    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  };

  // ── Sauvegarder ───────────────────────────────────────────
  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Upload avatar si modifié
      if (avatarUri) {
        const form = new FormData();
        form.append('file', { uri: avatarUri, name: 'avatar.jpg', type: 'image/jpeg' } as any);
        const { data: up } = await api.post('/upload', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        await api.put('/users/me', { avatar_url: up.url });
      }

      // Mettre à jour le profil
      const payload: Record<string, string> = {
        prenom: data.prenom,
        nom:    data.nom,
      };
      if (data.new_password && data.current_password) {
        payload.current_password = data.current_password;
        payload.new_password     = data.new_password;
      }

      await api.put('/users/me', payload);
      await refreshMe();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ Profil mis à jour', '', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err: any) {
      Alert.alert('Erreur', err?.response?.data?.error ?? 'Impossible de sauvegarder');
    } finally {
      setLoading(false);
    }
  };

  const initials = `${user?.prenom?.[0] ?? ''}${user?.nom?.[0] ?? ''}`.toUpperCase();
  const avatarSrc = avatarUri ?? user?.avatar_url;

  return (
    <>
      <Stack.Screen options={{
        headerShown:    true,
        headerTitle:    'Modifier le profil',
        headerBackTitle:'Profil',
        headerTintColor: Colors.primary,
        headerStyle:    { backgroundColor: Colors.white },
      }} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickAvatar} style={styles.avatarWrap}>
              {avatarSrc
                ? <Image source={{ uri: avatarSrc }} style={styles.avatar} />
                : <View style={styles.avatarFallback}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
              }
              <View style={styles.avatarEdit}>
                <Ionicons name="camera" size={14} color={Colors.white} />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Touchez pour modifier</Text>
          </View>

          {/* Infos personnelles */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Informations personnelles</Text>

            {([
              { name: 'prenom' as const, label: 'Prénom' },
              { name: 'nom'    as const, label: 'Nom' },
            ]).map(f => (
              <Controller key={f.name} control={control} name={f.name}
                render={({ field: { onChange, value, onBlur } }) => (
                  <View style={styles.field}>
                    <Text style={styles.label}>{f.label}</Text>
                    <TextInput
                      style={[styles.input, errors[f.name] && styles.inputError]}
                      value={value} onChangeText={onChange} onBlur={onBlur}
                      autoCapitalize="words"
                    />
                    {errors[f.name] && <Text style={styles.error}>{errors[f.name]?.message}</Text>}
                  </View>
                )}
              />
            ))}
          </View>

          {/* Mot de passe */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Changer le mot de passe</Text>
            <Text style={styles.cardHint}>Laissez vide pour ne pas modifier</Text>

            {([
              { name: 'current_password' as const, label: 'Mot de passe actuel' },
              { name: 'new_password'     as const, label: 'Nouveau mot de passe' },
            ]).map(f => (
              <Controller key={f.name} control={control} name={f.name}
                render={({ field: { onChange, value, onBlur } }) => (
                  <View style={styles.field}>
                    <Text style={styles.label}>{f.label}</Text>
                    <TextInput
                      style={[styles.input, errors[f.name] && styles.inputError]}
                      value={value} onChangeText={onChange} onBlur={onBlur}
                      secureTextEntry placeholder="••••••••"
                      placeholderTextColor={Colors.textTertiary}
                    />
                    {errors[f.name] && <Text style={styles.error}>{errors[f.name]?.message}</Text>}
                  </View>
                )}
              />
            ))}
          </View>

          {/* Bouton sauvegarder */}
          <TouchableOpacity
            style={[styles.btn, (loading || !isDirty && !avatarUri) && styles.btnDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={loading || (!isDirty && !avatarUri)}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.btnText}>Enregistrer les modifications</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: Colors.background },
  content:        { paddingBottom: 48 },
  avatarSection:  { alignItems: 'center', paddingVertical: Spacing.xl, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  avatarWrap:     { position: 'relative' },
  avatar:         { width: 90, height: 90, borderRadius: 45 },
  avatarFallback: { width: 90, height: 90, borderRadius: 45, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText:     { color: Colors.white, fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  avatarEdit:     { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.white },
  avatarHint:     { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: Spacing.sm },
  card:           { backgroundColor: Colors.white, margin: Spacing.md, marginBottom: 0, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadow.sm },
  cardTitle:      { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text, marginBottom: 4 },
  cardHint:       { fontSize: FontSize.xs, color: Colors.textTertiary, marginBottom: Spacing.md },
  field:          { marginBottom: Spacing.md },
  label:          { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.gray700, marginBottom: 6 },
  input:          { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 11, fontSize: FontSize.md, color: Colors.text, backgroundColor: Colors.gray50 },
  inputError:     { borderColor: Colors.danger },
  error:          { fontSize: FontSize.xs, color: Colors.danger, marginTop: 4 },
  btn:            { backgroundColor: Colors.primary, margin: Spacing.lg, borderRadius: Radius.md, paddingVertical: 15, alignItems: 'center' },
  btnDisabled:    { opacity: 0.5 },
  btnText:        { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.bold },
});
