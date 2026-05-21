// ============================================================
//  Troca Mobile — Boutons de connexion sociale
// ============================================================

import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGoogleSignIn, useAppleSignIn } from '@/hooks/useSocialAuth';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';

export default function SocialAuthButtons() {
  const google = useGoogleSignIn();
  const apple  = useAppleSignIn();
  const socialAvailable = google.available || apple.available;

  return (
    <View style={styles.root}>
      {/* Séparateur */}
      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>ou continuer avec</Text>
        <View style={styles.line} />
      </View>

      {socialAvailable ? (
        <>
          {/* Google */}
          <TouchableOpacity
            style={styles.btn}
            onPress={google.signIn}
            disabled={google.loading}
            activeOpacity={0.8}
          >
            {google.loading
              ? <ActivityIndicator color={Colors.gray700} size="small" />
              : <>
                  <Text style={styles.googleIcon}>G</Text>
                  <Text style={styles.btnText}>Continuer avec Google</Text>
                </>
            }
          </TouchableOpacity>

          {/* Apple — iOS uniquement */}
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.btn, styles.appleBtn]}
              onPress={apple.signIn}
              disabled={apple.loading}
              activeOpacity={0.8}
            >
              {apple.loading
                ? <ActivityIndicator color={Colors.white} size="small" />
                : <>
                    <Ionicons name="logo-apple" size={20} color={Colors.white} />
                    <Text style={[styles.btnText, styles.appleBtnText]}>Continuer avec Apple</Text>
                  </>
              }
            </TouchableOpacity>
          )}
        </>
      ) : (
        <Text style={styles.disabledNote}>Connexion sociale désactivée hors ligne.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:         { width: '100%' },
  divider:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginVertical: Spacing.lg },
  line:         { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText:  { fontSize: FontSize.xs, color: Colors.textTertiary, whiteSpace: 'nowrap' } as any,
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, paddingVertical: 12, marginBottom: Spacing.sm,
    backgroundColor: Colors.white,
  },
  appleBtn:     { backgroundColor: Colors.black, borderColor: Colors.black },
  googleIcon:   { fontSize: 16, fontWeight: FontWeight.bold, color: '#4285F4', width: 20, textAlign: 'center' },
  btnText:      { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.gray800 },
  appleBtnText: { color: Colors.white },
  disabledNote: { fontSize: FontSize.sm, color: Colors.textTertiary, textAlign: 'center' },
});
