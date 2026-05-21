// ============================================================
//  Troca Mobile — Confidentialité, RGPD et cookies
//  /app/profil/confidentialite.tsx
// ============================================================

import { useCallback } from 'react';
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

export default function ConfidentialiteScreen() {
  const openPrivacy = useCallback(() => openUrl(`${WEB_URL}/confidentialite`), []);
  const openCgu = useCallback(() => openUrl(`${WEB_URL}/cgu`), []);
  const openLegal = useCallback(() => openUrl(`${WEB_URL}/mentions-legales`), []);
  const openCookies = useCallback(() => openUrl(`${WEB_URL}/parametres#cookies`), []);
  const openSupport = useCallback(() => Linking.openURL('mailto:dpo@troca.nc').catch(() => {}), []);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Confidentialité & RGPD',
          headerBackTitle: 'Profil',
          headerTintColor: Colors.primary,
          headerStyle: { backgroundColor: Colors.white },
        }}
      />

      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTag}>Vie privée</Text>
          <Text style={styles.heroTitle}>Vos données et vos droits</Text>
          <Text style={styles.heroText}>
            Retrouvez ici les informations essentielles sur les données collectées, les cookies,
            la confidentialité et les documents juridiques de Troca.
          </Text>
        </View>

        <View style={styles.notice}>
          <Ionicons name="shield-checkmark-outline" size={18} color={Colors.primary} />
          <Text style={styles.noticeText}>
            La mesure d’audience first-party n’est activée qu’avec votre accord. Aucun ciblage
            publicitaire n’est activé par défaut.
          </Text>
        </View>

        <ActionCard
          icon="lock-closed-outline"
          title="Politique de confidentialité"
          description="Consultez les données collectées, les bases légales, la conservation et vos droits RGPD."
          actionLabel="Ouvrir la politique"
          onPress={openPrivacy}
        />

        <ActionCard
          icon="document-text-outline"
          title="Conditions générales"
          description="Consultez les règles d’utilisation de la plateforme et les services payants."
          actionLabel="Ouvrir les CGU"
          onPress={openCgu}
        />

        <ActionCard
          icon="newspaper-outline"
          title="Mentions légales"
          description="Retrouvez les informations sur l’éditeur, l’hébergement et les contacts."
          actionLabel="Ouvrir les mentions"
          onPress={openLegal}
        />

        <ActionCard
          icon="cookie-outline"
          title="Cookies et consentement"
          description="Modifier vos préférences de cookies et relire l’information sur la mesure d’audience."
          actionLabel="Gérer les cookies"
          onPress={openCookies}
        />

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconWrap}>
              <Ionicons name="mail-outline" size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Contact vie privée</Text>
              <Text style={styles.cardDesc}>
                Pour toute question sur vos données personnelles, écrivez à dpo@troca.nc.
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.mailBtn} onPress={openSupport} activeOpacity={0.85}>
            <Text style={styles.mailBtnText}>Contacter le DPO</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerBox}>
          <Text style={styles.footerTitle}>Pour vos demandes RGPD</Text>
          <Text style={styles.footerText}>
            L’export des données et la suppression de compte restent disponibles dans la version
            web et dans les paramètres du compte lorsque vous êtes connecté.
          </Text>
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
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  noticeText: {
    flex: 1,
    fontSize: FontSize.xs,
    lineHeight: 18,
    color: Colors.primary,
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
  footerBox: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  footerTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  footerText: {
    marginTop: 6,
    fontSize: FontSize.sm,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
});
