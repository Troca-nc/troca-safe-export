import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme';

export type SellerProfile = {
  id: number;
  prenom?: string;
  nom?: string;
  avatar_url?: string | null;
  bio?: string | null;
  is_pro?: boolean;
  email_verified?: boolean;
  phone_verified?: boolean;
  note_moyenne?: number | null;
  nb_avis?: number | null;
  nb_annonces?: number | null;
  created_at?: string | null;
  commune_name?: string | null;
  province_name?: string | null;
  total_vues?: number | null;
  total_favoris?: number | null;
  active_listings_count?: number | null;
  annonces_boostees?: number | null;
};

export type SellerListing = {
  id: number | string;
  titre?: string;
  title?: string;
  prix?: number | null;
  price?: number | null;
  image_url?: string | null;
  cover_image?: string | null;
  commune_name?: string | null;
  status?: string;
  is_boosted?: boolean;
};

export type SellerReview = {
  id: number | string;
  note?: number | null;
  commentaire?: string | null;
  created_at?: string | null;
  auteur_prenom?: string | null;
};

type PublicSellerProfileHeroProps = {
  sellerLabel: string;
  initials: string;
  profile: SellerProfile;
  locationLabel: string;
};

export function PublicSellerProfileHero({ sellerLabel, initials, profile, locationLabel }: PublicSellerProfileHeroProps) {
  return (
    <View style={styles.hero}>
      <View style={styles.avatarWrap}>
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
      </View>

      <View style={styles.heroBody}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{sellerLabel}</Text>
          {profile.is_pro && (
            <View style={styles.proBadge}>
              <Ionicons name="star" size={11} color={Colors.warning} />
              <Text style={styles.proText}>Pro ✓</Text>
            </View>
          )}
        </View>

        <Text style={styles.location}>
          <Ionicons name="location-outline" size={13} color={Colors.textSecondary} /> {locationLabel}
        </Text>

        <View style={styles.badgeRow}>
          {profile.email_verified && (
            <View style={styles.smallBadge}>
              <Ionicons name="mail" size={11} color={Colors.white} />
              <Text style={styles.smallBadgeText}>Email verifie</Text>
            </View>
          )}
          {profile.phone_verified && (
            <View style={styles.smallBadge}>
              <Ionicons name="call" size={11} color={Colors.white} />
              <Text style={styles.smallBadgeText}>Telephone verifie</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

type ProfileStatsGridProps = {
  profile: SellerProfile;
};

export function ProfileStatsGrid({ profile }: ProfileStatsGridProps) {
  return (
    <View style={styles.statsGrid}>
      <StatCard label="Note" value={Number(profile.note_moyenne ?? 0).toFixed(1)} />
      <StatCard label="Vues" value={Number(profile.total_vues ?? 0).toLocaleString('fr-FR')} />
      <StatCard
        label="Actives"
        value={Number(profile.active_listings_count ?? profile.nb_annonces ?? 0).toLocaleString('fr-FR')}
      />
      <StatCard label="Boosts" value={Number(profile.annonces_boostees ?? 0).toLocaleString('fr-FR')} />
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

type SellerZoneCardProps = {
  locationLabel: string;
  isPro: boolean | undefined;
};

export function SellerZoneCard({ locationLabel, isPro }: SellerZoneCardProps) {
  return (
    <View style={styles.zoneCard}>
      <Text style={styles.sectionTitle}>Zone de vente</Text>
      <View style={styles.zoneMap}>
        <View style={styles.zoneRingLarge} />
        <View style={styles.zoneRingMedium} />
        <View style={styles.zonePin}>
          <Ionicons name="navigate" size={24} color={Colors.primary} />
        </View>
      </View>
      <Text style={styles.zoneText}>{locationLabel}</Text>
      <Text style={styles.zoneSubText}>
        Profil {isPro ? 'professionnel' : 'particulier'} avec un espace vendeur rassurant et local.
      </Text>
    </View>
  );
}

type SellerListingsSectionProps = {
  listings: SellerListing[];
  onPressListing: (listingId: string | number) => void;
};

export function SellerListingsSection({ listings, onPressListing }: SellerListingsSectionProps) {
  if (!listings.length) return null;

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Ses annonces</Text>
        <Text style={styles.sectionCount}>{listings.length}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.listingsRow}>
        {listings.map((item) => {
          const title = item.titre ?? item.title ?? 'Annonce';
          const price = item.prix ?? item.price ?? null;
          const image = item.image_url ?? item.cover_image ?? null;
          return (
            <TouchableOpacity key={String(item.id)} style={styles.listingCard} onPress={() => onPressListing(item.id)}>
              {image ? (
                <Image source={{ uri: image }} style={styles.listingThumb} />
              ) : (
                <View style={[styles.listingThumb, styles.listingThumbEmpty]}>
                  <Ionicons name="image-outline" size={24} color={Colors.gray400} />
                </View>
              )}
              <Text style={styles.listingTitle} numberOfLines={2}>{title}</Text>
              {price != null && <Text style={styles.listingPrice}>{Number(price).toLocaleString('fr-FR')} XPF</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

type SellerReviewsSectionProps = {
  reviews: SellerReview[];
};

export function SellerReviewsSection({ reviews }: SellerReviewsSectionProps) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Avis</Text>
        <Text style={styles.sectionCount}>{reviews.length}</Text>
      </View>

      {!reviews.length ? (
        <Text style={styles.emptyText}>Aucun avis pour le moment.</Text>
      ) : (
        reviews.map((review) => (
          <View key={String(review.id)} style={styles.reviewCard}>
            <View style={styles.reviewTopRow}>
              <View style={styles.starRow}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Ionicons
                    key={index}
                    name={index < Number(review.note ?? 0) ? 'star' : 'star-outline'}
                    size={14}
                    color={Colors.warning}
                  />
                ))}
              </View>
              <Text style={styles.reviewDate}>{review.created_at ?? ''}</Text>
            </View>
            {!!review.commentaire && <Text style={styles.reviewText}>{review.commentaire}</Text>}
          </View>
        ))
      )}
    </View>
  );
}

type SellerActionsProps = {
  isOwn: boolean;
  isPro: boolean | undefined;
  contacting: boolean;
  onActivateVisibility: () => void;
  onEditProfile: () => void;
  onViewListings: () => void;
  onContact: () => void;
};

export function SellerActions({
  isOwn,
  isPro,
  contacting,
  onActivateVisibility,
  onEditProfile,
  onViewListings,
  onContact,
}: SellerActionsProps) {
  return (
    <View style={styles.actions}>
      {isOwn && isPro ? (
        <>
          <TouchableOpacity style={styles.primaryBtn} onPress={onActivateVisibility}>
            <Ionicons name="rocket-outline" size={18} color={Colors.white} />
            <Text style={styles.primaryBtnText}>Activer plus de visibilite</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={onViewListings}>
            <Text style={styles.secondaryBtnText}>Voir mes annonces</Text>
          </TouchableOpacity>
        </>
      ) : isOwn ? (
        <TouchableOpacity style={styles.primaryBtn} onPress={onEditProfile}>
          <Ionicons name="person-outline" size={18} color={Colors.white} />
          <Text style={styles.primaryBtnText}>Completer mon profil</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.primaryBtn, contacting && styles.btnDisabled]}
          onPress={onContact}
          disabled={contacting}
        >
          {contacting ? (
            <Text style={styles.primaryBtnText}>Ouverture...</Text>
          ) : (
            <>
              <Ionicons name="chatbubble-outline" size={18} color={Colors.white} />
              <Text style={styles.primaryBtnText}>Contacter ce vendeur</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    gap: Spacing.md,
    ...Shadow.sm,
  },
  avatarWrap: { width: 74 },
  avatar: { width: 74, height: 74, borderRadius: 22 },
  avatarFallback: {
    width: 74,
    height: 74,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: Colors.white, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  heroBody: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  name: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text, flexShrink: 1 },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  proText: { color: Colors.primary, fontWeight: FontWeight.bold, fontSize: FontSize.xs },
  location: { marginTop: 6, fontSize: FontSize.sm, color: Colors.textSecondary },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: Spacing.sm },
  smallBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  smallBadgeText: { color: Colors.white, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: Spacing.md },
  statCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadow.sm,
  },
  statValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  statLabel: { marginTop: 2, fontSize: FontSize.xs, color: Colors.textSecondary },
  zoneCard: {
    marginTop: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  sectionCard: {
    marginTop: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionCount: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  zoneMap: {
    marginTop: Spacing.md,
    height: 150,
    borderRadius: Radius.xl,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  zoneRingLarge: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  zoneRingMedium: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  zonePin: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  zoneText: { marginTop: Spacing.md, fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  zoneSubText: { marginTop: 4, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  listingsRow: { gap: 12, paddingTop: Spacing.md, paddingBottom: 4 },
  listingCard: {
    width: 160,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    padding: 10,
  },
  listingThumb: { width: '100%', height: 110, borderRadius: Radius.md, marginBottom: 10 },
  listingThumbEmpty: { backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center' },
  listingTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text, lineHeight: 18 },
  listingPrice: { marginTop: 4, fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },
  reviewCard: {
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  reviewTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  starRow: { flexDirection: 'row', gap: 2 },
  reviewDate: { fontSize: FontSize.xs, color: Colors.textTertiary },
  reviewText: { marginTop: 6, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18 },
  emptyText: { marginTop: Spacing.md, fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  actions: { marginTop: Spacing.md, gap: 10 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    ...Shadow.sm,
  },
  primaryBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  secondaryBtnText: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  btnDisabled: { opacity: 0.65 },
});
