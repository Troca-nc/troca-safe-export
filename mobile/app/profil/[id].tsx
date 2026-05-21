// ============================================================
//  Troca Mobile - Profil public vendeur
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { ActionSheetIOS, ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { api, usersApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Colors, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { buildMobileShareLinks, copyShareLink, copyShareMessage, shareNatively, shareViaAppOrFallback, type MobileShareContent } from '@/lib/share';
import {
  PublicSellerProfileHero,
  ProfileStatsGrid,
  SellerActions,
  SellerListingsSection,
  SellerReviewsSection,
  SellerZoneCard,
  type SellerListing,
  type SellerProfile,
  type SellerReview,
} from '@/components/profil/PublicSellerProfileSections';

export default function PublicSellerProfileMobile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: me } = useAuthStore();

  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [contacting, setContacting] = useState(false);
  const shareContent = useMemo<MobileShareContent | null>(() => {
    if (!profile) return null;
    const fullName = `${profile.prenom ?? 'Vendeur'} ${profile.nom ?? ''}`.trim();
    return {
      kind: 'profil',
      itemId: profile.id,
      title: `${fullName} | Troca`,
      description: [
        profile.commune_name ? `Basé à ${profile.commune_name}` : null,
        profile.is_pro ? 'Compte professionnel' : 'Profil particulier',
        profile.active_listings_count != null ? `${profile.active_listings_count} annonce${profile.active_listings_count > 1 ? 's' : ''}` : null,
      ].filter(Boolean).join(' • '),
      url: `https://troca.nc/profil/${profile.id}`,
    };
  }, [profile]);
  const shareLinks = useMemo(() => (shareContent ? buildMobileShareLinks(shareContent) : null), [shareContent]);

  useEffect(() => {
    if (!id) return;

    let alive = true;
    setLoading(true);

    Promise.all([
      usersApi.getProfile(id),
      usersApi.getUserListings(id, { limit: 8 }),
      usersApi.getReviews(id),
    ])
      .then(([profileRes, listingsRes, reviewsRes]) => {
        if (!alive) return;
        setProfile(profileRes.data?.data ?? null);
        setListings((listingsRes.data?.data ?? []).slice(0, 8));
        setReviews((reviewsRes.data?.data ?? []).slice(0, 6));
      })
      .catch(() => {
        if (!alive) return;
        Alert.alert('Erreur', 'Profil vendeur introuvable');
        router.back();
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [id]);

  const initials = useMemo(() => {
    const first = profile?.prenom?.[0] ?? '?';
    const last = profile?.nom?.[0] ?? '?';
    return `${first}${last}`.toUpperCase();
  }, [profile?.prenom, profile?.nom]);

  const sellerLabel = useMemo(
    () => `${profile?.prenom ?? 'Vendeur'} ${profile?.nom ?? ''}`.trim(),
    [profile?.prenom, profile?.nom]
  );

  const locationLabel = useMemo(() => {
    const parts = [profile?.commune_name, profile?.province_name].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Nouvelle-Caledonie';
  }, [profile?.commune_name, profile?.province_name]);

  const handleContact = async () => {
    if (!profile || me?.id === profile.id || contacting) return;

    const firstListing = listings.find((item) => item.status === 'active') ?? listings[0];
    if (!firstListing) {
      Alert.alert('Info', "Ce vendeur n'a pas encore d'annonce active.");
      return;
    }

    setContacting(true);
    try {
      const subject = firstListing.titre ?? firstListing.title ?? 'votre annonce';
      const { data } = await api.post('/messages/conversations', {
        listing_id: firstListing.id,
        message: `Bonjour, je vous contacte au sujet de ${subject}.`,
      });
      const conversationId =
        data?.data?.conversationId ??
        data?.data?.conversation_id ??
        data?.conversationId ??
        data?.conversation_id;

      if (!conversationId) throw new Error('Conversation introuvable');
      router.push(`/messages/${conversationId}`);
    } catch (err: any) {
      Alert.alert('Erreur', err?.response?.data?.error ?? 'Impossible de demarrer la conversation');
    } finally {
      setContacting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, headerTitle: 'Profil vendeur', headerBackTitle: 'Retour' }} />
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </>
    );
  }

  if (!profile) return null;

  const isOwn = Number(me?.id) === Number(profile.id);
  const sellerSince = profile.created_at
    ? `Membre depuis ${formatDistanceToNow(new Date(profile.created_at), { addSuffix: true, locale: fr })}`
    : null;

  const handleShare = async () => {
    if (!shareContent || !shareLinks) return;
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: 'Partager ce profil',
          message: shareContent.title,
          options: ['Partager', 'WhatsApp', 'Messenger', 'Telegram', 'Facebook', 'Instagram', 'X / Twitter', 'Email', 'SMS', 'Copier le lien', 'Annuler'],
          cancelButtonIndex: 10,
        },
        async (index) => {
          switch (index) {
            case 0:
              await shareNatively(shareContent);
              break;
            case 1:
              await shareViaAppOrFallback(shareLinks.whatsapp, shareLinks.whatsapp, shareContent);
              break;
            case 2:
              await shareViaAppOrFallback(shareLinks.messengerApp, shareLinks.messenger, shareContent);
              break;
            case 3:
              await shareViaAppOrFallback(shareLinks.telegram, shareLinks.telegram, shareContent);
              break;
            case 4:
              await shareViaAppOrFallback(shareLinks.facebook, shareLinks.facebook, shareContent);
              break;
            case 5:
              await copyShareMessage(shareContent);
              break;
            case 6:
              await shareViaAppOrFallback(shareLinks.x, shareLinks.x, shareContent);
              break;
            case 7:
              await shareViaAppOrFallback(shareLinks.email, shareLinks.email, shareContent);
              break;
            case 8:
              await shareViaAppOrFallback(shareLinks.sms, shareLinks.sms, shareContent);
              break;
            case 9:
              await copyShareLink(shareContent);
              break;
            default:
              break;
          }
        }
      );
      return;
    }

    Alert.alert('Partager ce profil', shareContent.title, [
      { text: 'Partager', onPress: async () => { await shareNatively(shareContent); } },
      { text: 'WhatsApp', onPress: async () => { await shareViaAppOrFallback(shareLinks.whatsapp, shareLinks.whatsapp, shareContent); } },
      { text: 'Messenger', onPress: async () => { await shareViaAppOrFallback(shareLinks.messengerApp, shareLinks.messenger, shareContent); } },
      { text: 'Telegram', onPress: async () => { await shareViaAppOrFallback(shareLinks.telegram, shareLinks.telegram, shareContent); } },
      { text: 'Facebook', onPress: async () => { await shareViaAppOrFallback(shareLinks.facebook, shareLinks.facebook, shareContent); } },
      { text: 'Instagram', onPress: async () => { await copyShareMessage(shareContent); } },
      { text: 'X / Twitter', onPress: async () => { await shareViaAppOrFallback(shareLinks.x, shareLinks.x, shareContent); } },
      { text: 'Email', onPress: async () => { await shareViaAppOrFallback(shareLinks.email, shareLinks.email, shareContent); } },
      { text: 'SMS', onPress: async () => { await shareViaAppOrFallback(shareLinks.sms, shareLinks.sms, shareContent); } },
      { text: 'Copier le lien', onPress: async () => { await copyShareLink(shareContent); } },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: sellerLabel,
          headerBackTitle: 'Retour',
          headerTintColor: Colors.primary,
          headerStyle: { backgroundColor: Colors.white },
          headerRight: () => (
            <TouchableOpacity onPress={handleShare} accessibilityLabel="Partager ce profil" style={{ marginRight: 6 }}>
              <Ionicons name="share-outline" size={22} color={Colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <PublicSellerProfileHero
          sellerLabel={sellerLabel}
          initials={initials}
          profile={profile}
          locationLabel={locationLabel}
        />

        {sellerSince && (
          <View style={styles.subtleCard}>
            <Text style={styles.subtleText}>{sellerSince}</Text>
          </View>
        )}

        <ProfileStatsGrid profile={profile} />
        <SellerZoneCard locationLabel={locationLabel} isPro={profile.is_pro} />

        {profile.bio && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>A propos</Text>
            <Text style={styles.bio}>{profile.bio}</Text>
          </View>
        )}

        <SellerListingsSection
          listings={listings}
          onPressListing={(listingId) => router.push(`/annonce/${listingId}`)}
        />

        <SellerReviewsSection reviews={reviews} />

        <SellerActions
          isOwn={isOwn}
          isPro={profile.is_pro}
          contacting={contacting}
          onActivateVisibility={() => router.push('/profil/abonnement')}
          onEditProfile={() => router.push('/profil/edit')}
          onViewListings={() => router.push('/profil/mes-annonces')}
          onContact={handleContact}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  root: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: 32 },
  subtleCard: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  subtleText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  sectionCard: {
    marginTop: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: 22,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
});
