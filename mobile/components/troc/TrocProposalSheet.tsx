import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'

import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'
import { listingsApi, trocApi } from '@/lib/api'
import { rememberRedirectAfterLogin } from '@/lib/authRedirect'
import { useAuthStore } from '@/store/authStore'
import type { TrocFeedItem } from '@/lib/trocNormalization'

type OwnListing = {
  id: number
  title?: string | null
  titre?: string | null
  image_url?: string | null
  cover_image?: string | null
}

type Props = {
  visible: boolean
  listing: TrocFeedItem | null
  onClose: () => void
  onSubmitted?: () => void
}

function normalizeOwnListings(rows: unknown[]): OwnListing[] {
  return rows.map((row) => {
    const item = row as Record<string, unknown>
    return {
      id: Number(item.id ?? 0),
      title: typeof item.title === 'string' ? item.title : typeof item.titre === 'string' ? item.titre : null,
      titre: typeof item.titre === 'string' ? item.titre : typeof item.title === 'string' ? item.title : null,
      image_url: typeof item.image_url === 'string' ? item.image_url : null,
      cover_image: typeof item.cover_image === 'string' ? item.cover_image : null,
    }
  })
}

function snapTo10(value: string | number) {
  const parsed = typeof value === 'number' ? value : Number(String(value || '').trim())
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, Math.round(parsed / 10) * 10)
}

export default function TrocProposalSheet({ visible, listing, onClose, onSubmitted }: Props) {
  const { user } = useAuthStore()
  const [mode, setMode] = useState<'listing' | 'describe'>('describe')
  const [selectedListingId, setSelectedListingId] = useState<number | null>(null)
  const [description, setDescription] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [complementDirection, setComplementDirection] = useState<'none' | 'i_pay' | 'they_pay'>('none')
  const [complementXpf, setComplementXpf] = useState('0')
  const [submitting, setSubmitting] = useState(false)

  const ownListingsQuery = useQuery({
    queryKey: ['troc', 'own-listings', user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as OwnListing[]
      const response = await listingsApi.getUserListings(String(user.id), { is_troc: true, status: 'active', limit: 30 })
      const rows = Array.isArray(response.data?.data) ? response.data.data : []
      return normalizeOwnListings(rows)
    },
    enabled: Boolean(visible && user?.id),
    staleTime: 30_000,
  })

  useEffect(() => {
    if (!visible) return
    setMode('describe')
    setSelectedListingId(null)
    setDescription('')
    setPhotos([])
    setMessage('')
    setComplementDirection('none')
    setComplementXpf('0')
  }, [visible, listing?.id])

  const complementMax = listing?.troc_complement_max_xpf ?? 0
  const ownListings = ownListingsQuery.data ?? []

  const pickPhotos = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permission requise', 'Autorisez l’accès aux photos pour joindre des images à votre proposition.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: Math.max(1, 6 - photos.length),
    })

    if (result.canceled) return

    setPhotos((current) => {
      const next = [...current, ...result.assets.map((asset) => asset.uri)]
      return next.slice(0, 6)
    })
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  const removePhoto = (uri: string) => {
    setPhotos((current) => current.filter((item) => item !== uri))
  }

  const submit = async () => {
    if (!listing) return

    if (!user) {
      await rememberRedirectAfterLogin('/tabs/troc')
      router.push('/auth/login')
      return
    }

    if (mode === 'listing' && selectedListingId == null) {
      Alert.alert('Choisissez une annonce', 'Sélectionnez une de vos annonces troc pour continuer.')
      return
    }

    if (mode === 'describe' && !description.trim() && photos.length === 0) {
      Alert.alert('Description requise', 'Décrivez ce que vous proposez ou ajoutez au moins une photo.')
      return
    }

    if (complementDirection !== 'none' && snapTo10(complementXpf) <= 0) {
      Alert.alert('Complément invalide', 'Indiquez un montant supérieur à 0 XPF.')
      return
    }

    setSubmitting(true)
    try {
      await trocApi.sendProposal(listing.id, {
        offered_listing_ids: mode === 'listing' && selectedListingId != null ? [selectedListingId] : [],
        offered_description: mode === 'describe' ? description.trim() : '',
        offered_photos: mode === 'describe' ? photos : [],
        complement_direction: complementDirection,
        complement_xpf: complementDirection === 'none' ? 0 : snapTo10(complementXpf),
        message: message.trim(),
      })

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Alert.alert('Proposition envoyée', 'Votre proposition de troc a bien été transmise.')
      onSubmitted?.()
      onClose()
    } catch (error) {
      const responseError = error as { response?: { data?: { error?: string } } }
      Alert.alert('Impossible d’envoyer', responseError?.response?.data?.error ?? 'Réessayez dans un instant.')
    } finally {
      setSubmitting(false)
    }
  }

  const renderListingChip = ({ item }: { item: OwnListing }) => {
    const active = selectedListingId === item.id
    const image = item.image_url ?? item.cover_image ?? null
    const title = item.title ?? item.titre ?? 'Annonce'

    return (
      <TouchableOpacity
        style={[styles.ownListingCard, active && styles.ownListingCardActive]}
        onPress={() => {
          setSelectedListingId(item.id)
          setMode('listing')
        }}
        activeOpacity={0.85}
      >
        {image ? (
          <Image source={{ uri: image }} style={styles.ownListingImage} />
        ) : (
          <View style={styles.ownListingImagePlaceholder}>
            <Ionicons name="image-outline" size={18} color={Colors.gray300} />
          </View>
        )}
        <Text style={styles.ownListingTitle} numberOfLines={2}>{title}</Text>
      </TouchableOpacity>
    )
  }

  if (!listing) return null

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.sheetWrap}>
          <View style={styles.sheet}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>Proposition structurée</Text>
                <Text style={styles.title} numberOfLines={1}>{listing.title}</Text>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={8} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
              {/* TODO: test E2E sur le drawer de proposition, le choix d'annonce et l'ajout de photos. */}
              {!user ? (
                <View style={styles.notice}>
                  <Text style={styles.noticeTitle}>Connectez-vous pour proposer un échange</Text>
                  <Text style={styles.noticeText}>
                    Le brouillon sera conservé pendant la connexion.
                  </Text>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={async () => {
                      await rememberRedirectAfterLogin('/tabs/troc')
                      router.push('/auth/login')
                    }}
                  >
                    <Text style={styles.primaryBtnText}>Se connecter</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <View style={styles.segmentRow}>
                <TouchableOpacity
                  style={[styles.segment, mode === 'describe' && styles.segmentActive]}
                  onPress={() => setMode('describe')}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.segmentText, mode === 'describe' && styles.segmentTextActive]}>Décrire un objet</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segment, mode === 'listing' && styles.segmentActive]}
                  onPress={() => setMode('listing')}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.segmentText, mode === 'listing' && styles.segmentTextActive]}>Choisir une annonce</Text>
                </TouchableOpacity>
              </View>

              {mode === 'listing' ? (
                <View style={styles.block}>
                  <Text style={styles.blockTitle}>Mes annonces troc</Text>
                  {ownListings.length > 0 ? (
                    <FlatList
                      data={ownListings}
                      renderItem={renderListingChip}
                      keyExtractor={(item) => String(item.id)}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.ownListingRow}
                    />
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>Aucune annonce troc active pour le moment.</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.block}>
                  <Text style={styles.blockTitle}>Ce que vous proposez</Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Décrivez l’objet, la marque, l’état, les accessoires inclus..."
                    placeholderTextColor={Colors.textTertiary}
                    multiline
                    value={description}
                    onChangeText={setDescription}
                    maxLength={2000}
                    textAlignVertical="top"
                  />

                  <TouchableOpacity style={styles.photoBtn} onPress={pickPhotos} activeOpacity={0.86}>
                    <Ionicons name="images-outline" size={18} color={Colors.primary} />
                    <Text style={styles.photoBtnText}>Ajouter des photos</Text>
                  </TouchableOpacity>

                  {photos.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
                      {photos.map((uri) => (
                        <View key={uri} style={styles.photoPreviewWrap}>
                          <Image source={{ uri }} style={styles.photoPreview} />
                          <TouchableOpacity style={styles.photoRemove} onPress={() => removePhoto(uri)}>
                            <Ionicons name="close" size={12} color={Colors.white} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  ) : null}
                </View>
              )}

              <View style={styles.block}>
                <Text style={styles.blockTitle}>Complément XPF</Text>
                <View style={styles.segmentRow}>
                  <TouchableOpacity
                    style={[styles.segment, complementDirection === 'none' && styles.segmentActive]}
                    onPress={() => {
                      setComplementDirection('none')
                      setComplementXpf('0')
                    }}
                  >
                    <Text style={[styles.segmentText, complementDirection === 'none' && styles.segmentTextActive]}>Aucun</Text>
                  </TouchableOpacity>
                  {listing.troc_accepts_complement_xpf ? (
                    <>
                      <TouchableOpacity
                        style={[styles.segment, complementDirection === 'i_pay' && styles.segmentActive]}
                        onPress={() => setComplementDirection('i_pay')}
                      >
                        <Text style={[styles.segmentText, complementDirection === 'i_pay' && styles.segmentTextActive]}>Je propose</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.segment, complementDirection === 'they_pay' && styles.segmentActive]}
                        onPress={() => setComplementDirection('they_pay')}
                      >
                        <Text style={[styles.segmentText, complementDirection === 'they_pay' && styles.segmentTextActive]}>Je demande</Text>
                      </TouchableOpacity>
                    </>
                  ) : null}
                </View>

                {listing.troc_accepts_complement_xpf && complementDirection !== 'none' ? (
                  <View style={styles.complementBox}>
                    <Text style={styles.complementHint}>
                      {complementMax > 0
                        ? `Jusqu’à ${Number(complementMax).toLocaleString('fr-FR')} XPF acceptés`
                        : 'Complément optionnel'}
                    </Text>
                    <TextInput
                      style={styles.complementInput}
                      value={complementXpf}
                      onChangeText={(value) => setComplementXpf(value.replace(/[^0-9]/g, ''))}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor={Colors.textTertiary}
                      onEndEditing={() => setComplementXpf(String(snapTo10(complementXpf)))}
                    />
                  </View>
                ) : listing.troc_accepts_complement_xpf ? null : (
                  <Text style={styles.complementHint}>Cette annonce n’accepte pas de complément XPF.</Text>
                )}
              </View>

              <View style={styles.block}>
                <Text style={styles.blockTitle}>Message court</Text>
                <TextInput
                  style={[styles.textArea, styles.shortArea]}
                  placeholder="Une note simple pour démarrer la conversation..."
                  placeholderTextColor={Colors.textTertiary}
                  multiline
                  value={message}
                  onChangeText={setMessage}
                  maxLength={1000}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={submit}
                activeOpacity={0.88}
                disabled={submitting}
              >
                <Ionicons name="paper-plane-outline" size={18} color={Colors.white} />
                <Text style={styles.submitBtnText}>{submitting ? 'Envoi...' : 'Envoyer ma proposition'}</Text>
              </TouchableOpacity>

              <Text style={styles.footerNote}>
                Le chat prend le relais après acceptation de votre proposition.
              </Text>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 32, 50, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    width: '100%',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    maxHeight: '92%',
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: Colors.gray300,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  eyebrow: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    marginTop: 4,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 28,
    gap: 14,
  },
  notice: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  noticeTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: '#92400E',
  },
  noticeText: {
    marginTop: 4,
    color: '#92400E',
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  primaryBtn: {
    marginTop: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  segment: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  segmentText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  segmentTextActive: {
    color: Colors.white,
  },
  block: {
    gap: 10,
  },
  blockTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  ownListingRow: {
    gap: 10,
    paddingRight: 8,
  },
  ownListingCard: {
    width: 132,
    borderRadius: Radius.lg,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 8,
    gap: 8,
    ...Shadow.sm,
  },
  ownListingCardActive: {
    borderColor: Colors.primary,
  },
  ownListingImage: {
    width: '100%',
    height: 84,
    borderRadius: Radius.md,
    backgroundColor: Colors.gray100,
  },
  ownListingImagePlaceholder: {
    width: '100%',
    height: 84,
    borderRadius: Radius.md,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownListingTitle: {
    fontSize: FontSize.xs,
    color: Colors.text,
    fontWeight: FontWeight.semibold,
  },
  emptyState: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    backgroundColor: Colors.white,
    padding: Spacing.md,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  textArea: {
    minHeight: 110,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    color: Colors.text,
    fontSize: FontSize.sm,
  },
  shortArea: {
    minHeight: 84,
  },
  photoBtn: {
    minHeight: 44,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoBtnText: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
  },
  photoRow: {
    gap: 10,
    paddingRight: 8,
  },
  photoPreviewWrap: {
    position: 'relative',
  },
  photoPreview: {
    width: 84,
    height: 84,
    borderRadius: Radius.md,
    backgroundColor: Colors.gray100,
  },
  photoRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  complementBox: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: 8,
  },
  complementHint: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  complementInput: {
    minHeight: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.gray50,
    paddingHorizontal: Spacing.md,
    color: Colors.text,
    fontSize: FontSize.md,
  },
  submitBtn: {
    minHeight: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.lg,
    ...Shadow.md,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: -2,
  },
})
