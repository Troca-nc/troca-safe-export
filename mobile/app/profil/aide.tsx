// ============================================================
//  Troca Mobile — Aide & contact
//  /app/profil/aide.tsx
// ============================================================

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';

const WEB_URL = 'https://troca.nc';

function openUrl(url: string) {
  return WebBrowser.openBrowserAsync(url).catch(() => Linking.openURL(url).catch(() => {}));
}

function ActionCard({
  icon,
  title,
  description,
  actionLabel,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionLabel: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardHeader}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={18} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDesc}>{description}</Text>
        </View>
      </View>
      <View style={styles.cardActionRow}>
        <Text style={styles.cardAction}>{actionLabel}</Text>
        <Ionicons name="open-outline" size={14} color={Colors.primary} />
      </View>
    </TouchableOpacity>
  );
}

export default function AideScreen() {
  const contactEmail = () => Linking.openURL('mailto:contact@troca.nc').catch(() => {});
  const contactSecurity = () => Linking.openURL('mailto:securite@troca.nc').catch(() => {});
  const openHelpWeb = () => openUrl(`${WEB_URL}/contact`);
  const openPrivacy = () => openUrl(`${WEB_URL}/profil/confidentialite`);
  const openSupport = () => openUrl(WEB_URL);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Aide & contact',
          headerBackTitle: 'Profil',
          headerTintColor: Colors.primary,
          headerStyle: { backgroundColor: Colors.white },
        }}
      />

      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTag}>Support</Text>
          <Text style={styles.heroTitle}>Besoin d’aide ?</Text>
          <Text style={styles.heroText}>
            Retrouvez ici les bons contacts et les pages utiles pour obtenir de l’aide, gérer
            votre compte ou signaler un problème de sécurité.
          </Text>
        </View>

        <ActionCard
          icon="chatbubbles-outline"
          title="Support général"
          description="Questions sur l’app, les annonces, les paiements ou la publication."
          actionLabel="Écrire au support"
          onPress={contactEmail}
        />

        <ActionCard
          icon="shield-checkmark-outline"
          title="Sécurité"
          description="Signaler une arnaque, un contenu suspect ou un incident de sécurité."
          actionLabel="Écrire à la sécurité"
          onPress={contactSecurity}
        />

        <ActionCard
          icon="help-circle-outline"
          title="Centre d’aide"
          description="Accédez à la page de contact et aux informations générales du site."
          actionLabel="Ouvrir le centre d’aide"
          onPress={openHelpWeb}
        />

        <ActionCard
          icon="lock-closed-outline"
          title="Vie privée et RGPD"
          description="Consultez vos droits, les cookies et les informations de confidentialité."
          actionLabel="Ouvrir la confidentialité"
          onPress={openPrivacy}
        />

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconWrap}>
              <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Conseil rapide</Text>
              <Text style={styles.cardDesc}>
                Pour un problème urgent lié à un compte, commencez par la page de confidentialité
                ou écrivez directement à la bonne adresse email.
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.mailBtn} onPress={openSupport} activeOpacity={0.85}>
            <Text style={styles.mailBtnText}>Retour à Troca</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: 48 },
  hero: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  heroTag: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginTop: 6,
  },
  heroText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    ...Shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  cardDesc: {
    marginTop: 4,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  cardActionRow: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardAction: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  mailBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mailBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
});
