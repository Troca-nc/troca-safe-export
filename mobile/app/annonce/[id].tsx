import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ActionSheetIOS,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useStripe } from '@stripe/stripe-react-native';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { api, listingsApi, usersApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { recordRecentlyViewedListing } from '@/lib/queryClient';
import { useFavorite } from '@/hooks/useFavorite';
import { Colors, Radius, Spacing } from '@/constants/theme';
import {
  buildMobileShareLinks,
  copyShareLink,
  copyShareMessage,
  shareNatively,
  shareViaAppOrFallback,
  type MobileShareContent,
} from '@/lib/share';
import {
  ListingDetail,
  RelatedListing,
  SellerProfileSummary,
  SellerReview,
  getListingCategory,
  getListingLocation,
  getListingPrice,
  getListingTitle,
  getSellerDisplayName,
  money,
} from '@/lib/listingDetail';
import {
  ListingActions,
  ListingHeroGallery,
  ListingInfo,
  RelatedListingsStrip,
  ReviewsCard,
  SellerLoadingRow,
  SellerProfileButton,
  SellerStatsRow,
  SellerSummaryCard,
  SellerZoneCard,
} from '@/components/annonce/AnnonceDetailSections';
import { isDemoModeEnabled } from '@/lib/demo';

export default function AnnonceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { toggleFavorite } = useFavorite();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [annonce, setAnnonce] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);
  const [contacting, setContacting] = useState(false);
  const [boosting, setBoosting] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<SellerProfileSummary | null>(null);
  const [sellerReviews, setSellerReviews] = useState<SellerReview[]>([]);
  const [relatedListings, setRelatedListings] = useState<RelatedListing[]>([]);
  const [sellerLoading, setSellerLoading] = useState(false);
  const reportMutation = useMutation({
    mutationFn: async ({ reason }: { reason: 'spam' | 'fake' | 'prohibited' | 'offensive' | 'other' }) => {
      if (!annonce) return;
      await api.post(`/listings/${annonce.id}/signaler`, { reason });
    },
    onMutate: () => {
      setReporting(true);
    },
    onError: (err: any) => {
      Alert.alert('Erreur', err?.response?.data?.error ?? "Impossible d'envoyer le signalement");
    },
    onSettled: () => {
      setReporting(false);
    },
  });

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    api
      .get(`/listings/${id}`)
      .then(({ data }) => {
        const detail = data.data ?? data;
        const detailUser = detail.user as Partial<ListingDetail['user']> | undefined;
        const mergedUser = detail.user
          ? {
              ...detail.user,
              email_verified: detail.seller_email_verified ?? detail.user.email_verified,
              phone_verified: detail.seller_phone_verified ?? detail.user.phone_verified,
              commune_name: detail.seller_commune_name ?? detail.user.commune_name,
              province_name: detail.seller_province_name ?? detailUser?.province_name ?? null,
            }
          : detail.user;

        setAnnonce({ ...detail, user: mergedUser ?? detail.user });
        setFavorited(Boolean(detail.is_favorited));
        recordRecentlyViewedListing(detail);
      })
      .catch(() => {
        Alert.alert('Erreur', 'Annonce introuvable');
        router.back();
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!annonce?.user?.id) return;

    let alive = true;
    setSellerLoading(true);

    Promise.all([
      usersApi.getProfile(String(annonce.user.id)),
      usersApi.getReviews(String(annonce.user.id)),
      listingsApi.search({
        category_id: annonce.category_id ?? undefined,
        commune_id: annonce.commune_id ?? undefined,
        limit: 6,
      }),
    ])
      .then(([profileRes, reviewsRes, relatedRes]) => {
        if (!alive) return;
        setSellerProfile(profileRes.data?.data ?? null);
        setSellerReviews(reviewsRes.data?.data ?? []);
        const related = (relatedRes.data?.data ?? [])
          .filter((item: any) => String(item.id) !== String(annonce.id))
          .slice(0, 6);
        setRelatedListings(related);
      })
      .catch(() => {
        if (!alive) return;
        setSellerProfile(null);
        setSellerReviews([]);
        setRelatedListings([]);
      })
      .finally(() => {
        if (alive) setSellerLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [annonce?.id, annonce?.user?.id, annonce?.category_id, annonce?.commune_id]);

  const images = useMemo(() => {
    const raw = annonce?.images ?? [];
    return raw
      .map((img) => img?.url ?? img?.thumbnail_url ?? null)
      .filter((uri): uri is string => Boolean(uri));
  }, [annonce?.images]);

  const sellerName = useMemo(() => getSellerDisplayName(annonce?.user), [annonce?.user]);
  const title = getListingTitle(annonce);
  const priceValue = getListingPrice(annonce);
  const location = getListingLocation(annonce);
  const category = getListingCategory(annonce);
  const publishedAt = annonce?.published_at ?? annonce?.created_at;
  const timeAgo = publishedAt
    ? formatDistanceToNow(new Date(publishedAt), { addSuffix: true, locale: fr })
    : '';
  const sellerSince = annonce?.user?.membre_depuis ?? annonce?.user?.created_at ?? null;
  const sellerSinceText = sellerSince
    ? `Membre ${formatDistanceToNow(new Date(sellerSince), { addSuffix: true, locale: fr })}`
    : null;
  const trustScore = annonce?.user?.trust_score;
  const trustLevel = annonce?.user?.trust_level;
  const listingTitle = title;
  const listingPrice = priceValue;
  const isOwner = annonce?.user?.id === Number(user?.id);
  const shareContent = useMemo<MobileShareContent | null>(() => {
    if (!annonce) return null;
    const location = [annonce.commune_name, annonce.user?.province_name].filter(Boolean).join(', ');
    return {
      kind: 'annonce',
      itemId: annonce.id,
      title: `${listingTitle} | Troca`,
      description: [listingPrice ? money(listingPrice) : null, location || 'Nouvelle-Caledonie'].filter(Boolean).join(' • '),
      url: `https://troca.nc/annonces/${annonce.id}`,
    };
  }, [annonce, listingPrice, listingTitle]);
  const shareLinks = useMemo(() => (shareContent ? buildMobileShareLinks(shareContent) : null), [shareContent]);

  const handleContact = async () => {
    if (!annonce) return;
    if (annonce.user?.id === Number(user?.id)) {
      Alert.alert('Info', "C'est votre propre annonce.");
      return;
    }

    setContacting(true);
    try {
      const { data } = await api.post('/messages/conversations', {
        listing_id: annonce.id,
        annonce_id: annonce.id,
      });
      const conversation = data.data ?? data;
      const conversationId =
        conversation.id ??
        conversation.conversation_id ??
        conversation.conversationId ??
        data.conversation_id ??
        data.conversationId;

      if (!conversationId) {
        throw new Error('Conversation introuvable');
      }

      router.push(`/messages/${conversationId}`);
    } catch (err: any) {
      Alert.alert('Erreur', err?.response?.data?.error ?? "Impossible d'ouvrir la conversation");
    } finally {
      setContacting(false);
    }
  };

  const handleBoost = async () => {
    if (!annonce) return;
    if (isDemoModeEnabled()) {
      Alert.alert('Paiement simulé — Mode démo actif', 'Votre boost a été enregistré en simulation.');
      return;
    }
    setBoosting(true);
    try {
      const { data } = await api.post('/payment/boost/mobile', {
        annonce_id: annonce.id,
        listing_id: annonce.id,
        boost_type: 'une',
        boost_duration: 7,
      });

      const payload = data.data ?? data;
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Troca NC',
        paymentIntentClientSecret: payload.client_secret,
        customerId: payload.customer_id,
        customerEphemeralKeySecret: payload.ephemeral_key,
        defaultBillingDetails: { name: `${user?.prenom ?? ''} ${user?.nom ?? ''}`.trim() },
        allowsDelayedPaymentMethods: false,
      });
      if (initError) throw new Error(initError.message);

      const { error: payError } = await presentPaymentSheet();
      if (payError) {
        if (payError.code !== 'Canceled') {
          Alert.alert('Paiement échoué', payError.message);
        }
        return;
      }

      Alert.alert('Boost activé', 'Votre annonce apparaitra en tête des resultats pendant 7 jours.');
    } catch (err: any) {
      Alert.alert('Erreur', err?.response?.data?.error ?? 'Erreur lors du boost');
    } finally {
      setBoosting(false);
    }
  };

  const handleFavorite = async () => {
    if (!annonce) return;
    const next = !favorited;
    setFavorited(next);
    try {
      await toggleFavorite({
        id: String(annonce.id),
        titre: listingTitle,
        prix: listingPrice,
        cover_image: images[0] ?? null,
        commune: annonce.commune_name ?? null,
        category: annonce.category_name ?? null,
      });
    } catch {
      setFavorited(!next);
    }
  };

  const handleShare = async () => {
    if (!shareContent || !shareLinks) return;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
          {
          title: 'Partager cette annonce',
          message: shareContent.title,
          options: [
            'Partager',
            'WhatsApp',
            'Messenger',
            'Telegram',
            'Facebook',
            'Instagram',
            'X / Twitter',
            'Email',
            'SMS',
            'Copier le lien',
            'Annuler',
          ],
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

    Alert.alert(
      'Partager cette annonce',
      shareContent.title,
      [
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
      ]
    );
  };

  const submitReport = async (reason: 'spam' | 'fake' | 'prohibited' | 'offensive' | 'other') => {
    if (!annonce || reporting) return;
    try {
      await reportMutation.mutateAsync({ reason });
      Alert.alert('Merci', 'Le signalement a été envoyé à notre équipe de moderation.');
    } catch {
      // rollback handled by the mutation
    }
  };

  const handleReport = () => {
    if (!annonce) return;

    const reasons: Array<{ label: string; value: 'spam' | 'fake' | 'prohibited' | 'offensive' | 'other' }> = [
      { label: 'Spam', value: 'spam' },
      { label: 'Fausse annonce', value: 'fake' },
      { label: 'Contenu interdit', value: 'prohibited' },
      { label: 'Comportement offensant', value: 'offensive' },
      { label: 'Autre', value: 'other' },
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...reasons.map((r) => r.label), 'Annuler'],
          cancelButtonIndex: reasons.length,
          title: 'Signaler cette annonce',
        },
        (buttonIndex) => {
          if (buttonIndex < reasons.length) {
            submitReport(reasons[buttonIndex].value);
          }
        }
      );
      return;
    }

    Alert.alert(
      'Signaler cette annonce',
      'Choisissez un motif pour envoyer le signalement.',
      [
        ...reasons.map((reason) => ({ text: reason.label, onPress: () => submitReport(reason.value) })),
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!annonce) return null;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: '',
          headerBackTitle: 'Retour',
          headerTintColor: Colors.primary,
          headerStyle: { backgroundColor: Colors.white },
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 16, marginRight: Spacing.md }}>
              {!isOwner && (
                <TouchableOpacity
                  onPress={handleFavorite}
                  accessibilityLabel="Favori"
                  style={styles.headerIconBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={favorited ? 'heart' : 'heart-outline'}
                    size={22}
                    color={favorited ? Colors.danger : Colors.primary}
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleShare}
                accessibilityLabel="Partager"
                style={styles.headerIconBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="share-outline" size={22} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <View style={styles.root}>
        <ListingHeroGallery images={images} imageIndex={imgIndex} onImageIndexChange={setImgIndex} />

        <View style={styles.body}>
          <ListingInfo
            listingTitle={title}
            priceValue={priceValue}
            location={location}
            category={category}
            timeAgo={timeAgo}
            priceNegotiable={annonce.price_negotiable}
            isFree={annonce.is_free}
          />

          {!!annonce.description && (
            <View style={styles.sectionGap}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionTitleDot} />
                <View>
                  <Text style={styles.sectionTitle}>Description</Text>
                </View>
              </View>
              <Text style={styles.desc}>{annonce.description}</Text>
            </View>
          )}

          <SellerSummaryCard
            seller={annonce.user}
            sellerName={sellerName}
            sellerSinceText={sellerSinceText}
            trustScore={trustScore}
            trustLevel={trustLevel}
          />

          <SellerLoadingRow loading={sellerLoading} />

          <SellerZoneCard sellerProfile={sellerProfile} seller={annonce.user} fallbackLocation={location} />

          <SellerStatsRow
            trustScore={trustScore}
            totalViews={sellerProfile?.total_vues}
            activeListings={sellerProfile?.active_listings_count ?? annonce.user?.nb_annonces ?? 0}
          />

          <SellerProfileButton onPress={() => router.push(`/profil/${annonce.user?.id}`)} />

          <ReviewsCard reviews={sellerReviews} />

          <RelatedListingsStrip
            listings={relatedListings}
            onSelectListing={(listingId) => router.push(`/annonce/${listingId}`)}
          />

          <ListingActions
            isOwner={isOwner}
            contacting={contacting}
            boosting={boosting}
            reporting={reporting}
            onBoost={handleBoost}
            onContact={handleContact}
            onReport={handleReport}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  body: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    marginTop: -Radius.xl,
  },
  sectionGap: {
    marginTop: Spacing.lg,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  sectionTitleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  desc: {
    fontSize: 14,
    color: Colors.gray700,
    lineHeight: 24,
  },
  headerIconBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
