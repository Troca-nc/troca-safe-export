// ============================================================
//  Troca Mobile - Onglet Profil
// ============================================================

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { statsApi } from '@/lib/api';
import { disconnectSocket } from '@/lib/socket';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { DEMO_ACCOUNTS, isDemoModeEnabled } from '@/lib/demo';
import { SubscriptionStatusBanner } from '@/components/SubscriptionStatusBanner';

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  value?: string;
  danger?: boolean;
}

export default function ProfilTab() {
  const { user, logout, login } = useAuthStore();
  const [sellerStats, setSellerStats] = useState<any>(null);
  const demoModeEnabled = isDemoModeEnabled();

  useEffect(() => {
    if (!user?.is_pro) return;

    statsApi
      .getSeller()
      .then(({ data }) => setSellerStats(data.data ?? null))
      .catch(() => setSellerStats(null));
  }, [user?.is_pro]);

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnecter',
        style: 'destructive',
        onPress: async () => {
          disconnectSocket();
          await logout();
        },
      },
    ]);
  };

  const switchToDemo = async (email: string, password: string) => {
    try {
      disconnectSocket();
      await login(email, password);
    } catch (err: any) {
      Alert.alert('Changement de rôle impossible', err?.response?.data?.error ?? 'Le backend local n’est pas disponible.');
    }
  };

  if (!user) return null;

  const initials = `${user.prenom[0]}${user.nom[0]}`.toUpperCase();

  const sections: Array<{ title: string; items: MenuItem[] }> = [
    {
      title: 'Mon compte',
      items: [
        { icon: 'person-outline', label: 'Modifier mon profil', onPress: () => router.push('/profil/edit') },
        { icon: 'bag-outline', label: 'Mes annonces', onPress: () => router.push('/profil/mes-annonces') },
        { icon: 'heart-outline', label: 'Mes favoris', onPress: () => router.push('/profil/favoris') },
        {
          icon: 'phone-portrait-outline',
          label: 'Vérification téléphone',
          value: user.telephone_verifie ? '✅ Vérifié' : '⚠️ Non vérifié',
          onPress: () => router.push('/profil/telephone'),
        },
      ],
    },
    {
      title: 'Abonnement',
      items: [
        {
          icon: 'star-outline',
          label: user.is_pro ? '⭐ Compte Pro actif' : 'Passer Pro',
          value: user.is_pro ? 'Actif' : undefined,
          onPress: () => router.push('/profil/abonnement'),
        },
      ],
    },
    {
      title: 'Notifications',
      items: [{ icon: 'notifications-outline', label: 'Mes alertes de recherche', onPress: () => router.push('/profil/alertes') }],
    },
    {
      title: 'Paramètres',
      items: [
        { icon: 'shield-outline', label: 'Confidentialité & RGPD', onPress: () => router.push('/profil/confidentialite') },
        { icon: 'help-circle-outline', label: 'Aide & contact', onPress: () => router.push('/profil/aide') },
      ],
    },
    {
      title: '',
      items: [{ icon: 'log-out-outline', label: 'Se déconnecter', onPress: handleLogout, danger: true }],
    },
  ];

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.profileHeader} onPress={() => router.push('/profil/edit')} activeOpacity={0.88}>
        {user.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}

        <Text style={styles.name}>
          {user.prenom} {user.nom}
        </Text>
        <Text style={styles.email}>{user.email}</Text>

        <View style={styles.badgeRow}>
          {user.email_verified && (
            <View style={[styles.smallBadge, styles.emailBadge]}>
              <Ionicons name="mail" size={11} color={Colors.white} />
              <Text style={styles.smallBadgeText}>Email vérifié</Text>
            </View>
          )}
          {user.telephone_verifie && (
            <View style={[styles.smallBadge, styles.phoneBadge]}>
              <Ionicons name="call" size={11} color={Colors.white} />
              <Text style={styles.smallBadgeText}>Téléphone vérifié</Text>
            </View>
          )}
        </View>

        {user.is_pro && (
          <View style={styles.proBadge}>
            <Ionicons name="star" size={12} color={Colors.warning} />
            <Text style={styles.proText}>Compte Pro</Text>
          </View>
        )}

        <View style={styles.editHint}>
          <Ionicons name="pencil-outline" size={12} color="rgba(255,255,255,0.7)" />
          <Text style={styles.editHintText}>Modifier le profil</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.publicProfileBtn} onPress={() => router.push(`/profil/${user.id}`)} activeOpacity={0.85}>
        <Ionicons name="person-outline" size={15} color={Colors.primary} />
        <Text style={styles.publicProfileBtnText}>Voir ma vitrine publique</Text>
      </TouchableOpacity>

      <SubscriptionStatusBanner />

      {demoModeEnabled && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mode QA local</Text>
          <View style={styles.demoCard}>
            <Text style={styles.demoTitle}>Changer de rôle sans recréer de compte</Text>
            <Text style={styles.demoText}>
              Utilisez les comptes seedés pour explorer les parcours particulier, pro, bon plan et administrateur.
            </Text>
            <View style={styles.demoGrid}>
              {Object.entries(DEMO_ACCOUNTS).map(([key, account]) => (
                <TouchableOpacity
                  key={key}
                  style={styles.demoButton}
                  onPress={() => switchToDemo(account.email, account.password)}
                  activeOpacity={0.84}
                >
                  <Text style={styles.demoButtonLabel}>{account.label}</Text>
                  <Text style={styles.demoButtonText}>{account.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {user.is_pro && sellerStats?.totaux && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tableau de bord</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{Number(sellerStats.totaux.total_vues ?? 0).toLocaleString('fr-FR')}</Text>
              <Text style={styles.statLabel}>Vues</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{Number(sellerStats.totaux.annonces_actives ?? 0).toLocaleString('fr-FR')}</Text>
              <Text style={styles.statLabel}>Actives</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{Number(sellerStats.totaux.annonces_boostees ?? 0).toLocaleString('fr-FR')}</Text>
              <Text style={styles.statLabel}>Boosts</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.proCta} onPress={() => router.push('/profil/abonnement')} activeOpacity={0.85}>
            <Ionicons name="rocket-outline" size={18} color={Colors.white} />
            <Text style={styles.proCtaText}>Activer plus de visibilité</Text>
          </TouchableOpacity>
        </View>
      )}

      {sections.map((section, si) => (
        <View key={si} style={styles.section}>
          {section.title ? <Text style={styles.sectionTitle}>{section.title}</Text> : null}
          <View style={styles.card}>
            {section.items.map((item, ii) => (
              <TouchableOpacity
                key={ii}
                style={[styles.menuItem, ii < section.items.length - 1 && styles.menuItemBorder]}
                onPress={item.onPress}
                activeOpacity={0.75}
              >
                <Ionicons name={item.icon} size={20} color={item.danger ? Colors.danger : Colors.gray600} style={styles.menuIcon} />
                <Text style={[styles.menuLabel, item.danger && styles.menuLabelDanger]}>{item.label}</Text>
                {item.value ? (
                  <Text style={styles.menuValue}>{item.value}</Text>
                ) : (
                  <Ionicons name="chevron-forward" size={16} color={Colors.gray300} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <Text style={styles.version}>Troca v1.0.0 - Nouvelle-Calédonie</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 48 },
  profileHeader: {
    backgroundColor: Colors.primary,
    paddingTop: 56,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  name: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.white, marginTop: Spacing.md },
  email: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  smallBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 7,
    minHeight: 36,
  },
  emailBadge: { backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  phoneBadge: { backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  smallBadgeText: { color: Colors.white, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    minHeight: 36,
    marginTop: Spacing.sm,
  },
  proText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  editHint: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.sm },
  editHintText: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.xs },
  publicProfileBtn: {
    marginTop: Spacing.md,
    marginHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },
  publicProfileBtnText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  demoCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadow.sm },
  demoTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  demoText: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4, lineHeight: 20 },
  demoGrid: { gap: 10, marginTop: Spacing.md },
  demoButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    minHeight: 58,
    backgroundColor: Colors.gray50,
  },
  demoButtonLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },
  demoButtonText: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2, lineHeight: 16 },
  section: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, ...Shadow.sm, overflow: 'hidden' },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    paddingHorizontal: Spacing.md,
    ...Shadow.sm,
    alignItems: 'center',
    minHeight: 76,
  },
  statValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  proCta: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 15,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    ...Shadow.sm,
  },
  proCtaText: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuIcon: { marginRight: Spacing.md },
  menuLabel: { flex: 1, fontSize: FontSize.md, color: Colors.text },
  menuLabelDanger: { color: Colors.danger },
  menuValue: { fontSize: FontSize.sm, color: Colors.textSecondary, marginRight: Spacing.sm },
  version: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: Spacing.xl },
});
