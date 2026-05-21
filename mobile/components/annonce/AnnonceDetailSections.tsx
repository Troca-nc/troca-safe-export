import { useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import {
  ListingUser,
  RelatedListing,
  SellerProfileSummary,
  SellerReview,
  getListingPrice,
  getListingTitle,
  getSellerInitials,
  money,
} from '@/lib/listingDetail';

type ListingHeroGalleryProps = {
  images: string[];
  imageIndex: number;
  onImageIndexChange: (index: number) => void;
};

export function ListingHeroGallery({ images, imageIndex, onImageIndexChange }: ListingHeroGalleryProps) {
  const { width } = useWindowDimensions();
  const heroHeight = width * 0.7;

  if (images.length === 0) {
    return (
      <View style={[styles.heroEmpty, { width, height: heroHeight }]}>
        <Ionicons name="image-outline" size={42} color={Colors.gray300} />
      </View>
    );
  }

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          onImageIndexChange(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
      >
        {images.map((uri, index) => (
          <Image
            key={`${uri}-${index}`}
            source={{ uri }}
            style={[styles.heroImage, { width, height: heroHeight }]}
            resizeMode="cover"
          />
        ))}
      </ScrollView>
      {images.length > 1 && (
        <View style={styles.dots}>
          {images.map((_, index) => (
            <View key={index} style={[styles.dot, index === imageIndex && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

type ListingInfoProps = {
  listingTitle: string;
  priceValue: number | null;
  location: string;
  category: string | null;
  timeAgo: string;
  priceNegotiable?: boolean;
  isFree?: boolean;
};

export function ListingInfo({
  listingTitle,
  priceValue,
  location,
  category,
  timeAgo,
  priceNegotiable,
  isFree,
}: ListingInfoProps) {
  return (
    <>
      <Text style={styles.price}>{money(priceValue)}</Text>
      <Text style={styles.title}>{listingTitle}</Text>

      <View style={styles.metaRow}>
        <InfoChip icon="location-outline" label={location} />
        {category && <InfoChip icon="grid-outline" label={category} />}
        {timeAgo ? <InfoChip icon="time-outline" label={timeAgo} /> : null}
      </View>

      {priceNegotiable && <Notice icon="chatbubble-outline" color={Colors.primary} label="Prix négociable" />}
      {isFree && <Notice icon="gift-outline" color={Colors.success} label="Annonce gratuite" />}
    </>
  );
}

type InfoChipProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
};

function InfoChip({ icon, label }: InfoChipProps) {
  return (
    <View style={styles.metaChip}>
      <Ionicons name={icon} size={14} color={Colors.textSecondary} />
      <Text style={styles.metaText}>{label}</Text>
    </View>
  );
}

type NoticeProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
};

function Notice({ icon, label, color }: NoticeProps) {
  return (
    <View style={styles.notice}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={styles.noticeText}>{label}</Text>
    </View>
  );
}

type SellerSummaryCardProps = {
  seller: ListingUser | undefined;
  sellerName: string;
  sellerSinceText: string | null;
  trustScore: number | null | undefined;
  trustLevel: string | null | undefined;
};

export function SellerSummaryCard({
  seller,
  sellerName,
  sellerSinceText,
  trustScore,
  trustLevel,
}: SellerSummaryCardProps) {
  return (
    <View style={styles.sellerCard}>
      <View style={styles.sellerLeft}>
        {seller?.avatar_url ? (
          <Image source={{ uri: seller.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarText}>{getSellerInitials(seller)}</Text>
          </View>
        )}

        <View style={styles.sellerInfo}>
          <View style={styles.sellerNameRow}>
            <Text style={styles.sellerName}>{sellerName}</Text>
            {seller?.is_pro && (
              <View style={styles.proBadge}>
                <Text style={styles.proText}>PRO</Text>
              </View>
            )}
          </View>

          {sellerSinceText && <Text style={styles.sellerSince}>{sellerSinceText}</Text>}

          {trustScore != null && (
            <View style={styles.trustRow}>
              <Ionicons name="shield-checkmark-outline" size={12} color={Colors.primary} />
              <Text style={styles.trustText}>
                Confiance {trustScore}/100{trustLevel ? ` · ${trustLevel}` : ''}
              </Text>
            </View>
          )}

          <View style={styles.badgeRow}>
            {seller?.email_verified && <PillBadge icon="mail" label="Email vérifié" />}
            {seller?.phone_verified && <PillBadge icon="call" label="Téléphone vérifié" />}
          </View>
        </View>
      </View>
    </View>
  );
}

type PillBadgeProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
};

function PillBadge({ icon, label }: PillBadgeProps) {
  return (
    <View style={styles.smallBadge}>
      <Ionicons name={icon} size={10} color={Colors.white} />
      <Text style={styles.smallBadgeText}>{label}</Text>
    </View>
  );
}

type SellerLoadingRowProps = {
  loading: boolean;
};

export function SellerLoadingRow({ loading }: SellerLoadingRowProps) {
  if (!loading) return null;

  return (
    <View style={styles.sellerLoading}>
      <ActivityIndicator size="small" color={Colors.primary} />
      <Text style={styles.sellerLoadingText}>Chargement des informations vendeur...</Text>
    </View>
  );
}

type SellerZoneCardProps = {
  sellerProfile: SellerProfileSummary | null;
  seller: ListingUser | undefined;
  fallbackLocation: string;
};

export function SellerZoneCard({ sellerProfile, seller, fallbackLocation }: SellerZoneCardProps) {
  const locationText = useMemo(() => {
    const commune = sellerProfile?.commune_name || seller?.commune_name || fallbackLocation;
    const province = sellerProfile?.province_name || seller?.province_name;
    return province ? `${commune}, ${province}` : commune;
  }, [fallbackLocation, seller?.commune_name, seller?.province_name, sellerProfile?.commune_name, sellerProfile?.province_name]);

  if (!sellerProfile?.commune_name && !sellerProfile?.province_name && !seller?.commune_name && !seller?.province_name) {
    return null;
  }

  return (
    <View style={styles.zoneCard}>
      <View style={styles.zoneMiniMap}>
        <View style={styles.zonePin}>
          <Ionicons name="location" size={20} color={Colors.primary} />
        </View>
      </View>
      <View style={styles.zoneTextWrap}>
        <Text style={styles.zoneTitle}>Zone du vendeur</Text>
        <Text style={styles.zoneText}>{locationText}</Text>
        <View style={styles.zoneBadges}>
          {seller?.email_verified && <Text style={styles.zoneBadge}>Email vérifié</Text>}
          {seller?.phone_verified && <Text style={styles.zoneBadge}>Téléphone vérifié</Text>}
        </View>
      </View>
    </View>
  );
}

type SellerStatsRowProps = {
  trustScore: number | null | undefined;
  totalViews: number | null | undefined;
  activeListings: number | null | undefined;
};

export function SellerStatsRow({ trustScore, totalViews, activeListings }: SellerStatsRowProps) {
  return (
    <View style={styles.vendeurStats}>
      <StatItem value={Number(trustScore ?? 0).toFixed(0)} label="Confiance" />
      <StatItem value={Number(totalViews ?? 0).toLocaleString('fr-FR')} label="Vues" />
      <StatItem value={Number(activeListings ?? 0).toLocaleString('fr-FR')} label="Annonces" />
    </View>
  );
}

type StatItemProps = {
  value: string;
  label: string;
};

function StatItem({ value, label }: StatItemProps) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

type SellerProfileButtonProps = {
  onPress: () => void;
};

export function SellerProfileButton({ onPress }: SellerProfileButtonProps) {
  return (
    <TouchableOpacity style={styles.profileBtn} onPress={onPress}>
      <Ionicons name="person-circle-outline" size={18} color={Colors.white} />
      <Text style={styles.profileBtnText}>Voir la vitrine du vendeur</Text>
    </TouchableOpacity>
  );
}

type ReviewsCardProps = {
  reviews: SellerReview[];
};

export function ReviewsCard({ reviews }: ReviewsCardProps) {
  if (reviews.length === 0) return null;

  return (
    <View style={styles.reviewCard}>
      <Text style={styles.sectionTitle}>Avis récents</Text>
      {reviews.slice(0, 3).map((review) => (
        <View key={review.id} style={styles.reviewRow}>
          <Ionicons name="star" size={12} color={Colors.warning} />
          <Text style={styles.reviewText} numberOfLines={2}>
            {(review.note ?? 0)}/5{review.commentaire ? ` · ${review.commentaire}` : ''}
          </Text>
        </View>
      ))}
    </View>
  );
}

type RelatedListingsStripProps = {
  listings: RelatedListing[];
  onSelectListing: (id: string | number) => void;
};

export function RelatedListingsStrip({ listings, onSelectListing }: RelatedListingsStripProps) {
  if (listings.length === 0) return null;

  return (
    <>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Annonces similaires</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedRow}>
        {listings.map((item) => (
          <TouchableOpacity key={String(item.id)} style={styles.relatedCard} onPress={() => onSelectListing(item.id)}>
            <View style={styles.relatedThumb}>
              <Ionicons name="image-outline" size={20} color={Colors.gray300} />
            </View>
            <Text numberOfLines={2} style={styles.relatedTitle}>
              {getListingTitle(item)}
            </Text>
            <Text style={styles.relatedPrice}>{money(getListingPrice(item))}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </>
  );
}

type ListingActionsProps = {
  isOwner: boolean;
  contacting: boolean;
  boosting: boolean;
  reporting: boolean;
  onBoost: () => void;
  onContact: () => void;
  onReport: () => void;
};

export function ListingActions({
  isOwner,
  contacting,
  boosting,
  reporting,
  onBoost,
  onContact,
  onReport,
}: ListingActionsProps) {
  if (isOwner) {
    return (
      <TouchableOpacity style={[styles.boostBtn, boosting && styles.btnDisabled]} onPress={onBoost} disabled={boosting}>
        {boosting ? (
          <ActivityIndicator color={Colors.white} size="small" />
        ) : (
          <>
            <Ionicons name="rocket-outline" size={18} color={Colors.white} />
            <Text style={styles.boostText}>Booster cette annonce</Text>
          </>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.contactBtn, contacting && styles.btnDisabled]}
        onPress={onContact}
        disabled={contacting}
        activeOpacity={0.85}
      >
        {contacting ? (
          <ActivityIndicator color={Colors.white} size="small" />
        ) : (
          <>
            <Ionicons name="chatbubble-outline" size={18} color={Colors.white} />
            <Text style={styles.contactText}>Contacter le vendeur</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.reportBtn, reporting && styles.btnDisabled]}
        onPress={onReport}
        disabled={reporting}
        activeOpacity={0.85}
      >
        {reporting ? (
          <ActivityIndicator color={Colors.primary} size="small" />
        ) : (
          <>
            <Ionicons name="flag-outline" size={18} color={Colors.primary} />
            <Text style={styles.reportText}>Signaler l'annonce</Text>
          </>
        )}
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  heroEmpty: {
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    backgroundColor: Colors.gray100,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    position: 'absolute',
    bottom: Spacing.sm,
    left: 0,
    right: 0,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: Colors.white,
    width: 18,
  },
  price: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginTop: Spacing.xs,
    lineHeight: 26,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.gray100,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  metaText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  notice: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.gray50,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  noticeText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.gray50,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sellerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  sellerName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  sellerSince: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  trustText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  proBadge: {
    backgroundColor: Colors.warning,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  proText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  smallBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  smallBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: FontWeight.semibold,
  },
  sellerLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  sellerLoadingText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  zoneCard: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  zoneMiniMap: {
    width: 110,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 112,
  },
  zonePin: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneTextWrap: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  zoneTitle: {
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  zoneText: {
    marginTop: 4,
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: FontWeight.semibold,
  },
  zoneBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  zoneBadge: {
    fontSize: 10,
    color: Colors.primary,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  vendeurStats: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.lg,
  },
  statItem: {
    flex: 1,
    backgroundColor: Colors.gray50,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  profileBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 13,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  profileBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  sectionTitleRow: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  relatedRow: {
    gap: 10,
    paddingBottom: 2,
  },
  relatedCard: {
    width: 150,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  relatedThumb: {
    height: 82,
    borderRadius: Radius.md,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  relatedTitle: {
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 18,
  },
  relatedPrice: {
    marginTop: 4,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  reviewCard: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 8,
  },
  reviewText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  boostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.warning,
    borderRadius: Radius.md,
    paddingVertical: 14,
    marginTop: Spacing.lg,
  },
  boostText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 14,
    marginTop: Spacing.lg,
  },
  contactText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingVertical: 12,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reportText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
