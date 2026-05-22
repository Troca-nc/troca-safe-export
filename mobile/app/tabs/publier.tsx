// ============================================================
//  Troca Mobile - Onglet Publier une annonce
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import * as Haptics from 'expo-haptics'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme'
import { MOBILE_FALLBACK_CATEGORIES } from '@/lib/categoryCatalog'
import { metaApi } from '@/lib/api'
import { useAutosave } from '@/hooks/useAutosave'
import { useImageUpload } from '@/hooks/useImageUpload'
import { createListing } from '@/lib/publishListing'
import ImageUploader from '@/components/ImageUploader'
import {
  CategoriesSection,
  ChipsSection,
  ControlledInputSection,
  PublishCategory,
  PublishCommune,
  SubmitButton,
} from '@/components/publier/PublishFormSections'

const CONDITIONS = [
  { value: 'new', label: 'Neuf' },
  { value: 'like_new', label: 'Comme neuf' },
  { value: 'good', label: 'Bon etat' },
  { value: 'fair', label: 'Etat correct' },
  { value: 'for_parts', label: 'Pour pieces' },
] as const

const schema = z.object({
  titre: z.string().min(5, 'Minimum 5 caracteres').max(150),
  description: z.string().min(20, 'Minimum 20 caracteres').max(3000),
  price: z.string().optional(),
  category_id: z.number({ required_error: 'Choisissez une categorie' }),
  commune_id: z.number({ required_error: 'Choisissez une commune' }),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'for_parts']),
  contre_quoi: z.string().max(200).optional(),
})

type FormData = z.infer<typeof schema>

type Commune = PublishCommune
type PublishDraft = {
  form: FormData
  photos: string[]
}

export default function PublierScreen() {
  const [loading, setLoading] = useState(false)
  const [listingId, setListingId] = useState<string | number | null>(null)
  const [categories, setCategories] = useState<PublishCategory[]>([])
  const [communes, setCommunes] = useState<Commune[]>([])
  const [communesLoading, setCommunesLoading] = useState(true)
  const imageUpload = useImageUpload()

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { condition: 'good' },
  })

  const watchedForm = watch()
  const draftPhotos = useMemo(() => imageUpload.items.map((item) => item.uri), [imageUpload.items])
  const autosave = useAutosave<PublishDraft>('draft_listing', { form: watchedForm, photos: draftPhotos }, 30_000)

  const selectedCategory = watch('category_id')
  const selectedCommune = watch('commune_id')
  const selectedCondition = watch('condition')
  const visibleCategories = categories.length > 0 ? categories : (MOBILE_FALLBACK_CATEGORIES as PublishCategory[])

  useEffect(() => {
    metaApi
      .getCategories()
      .then(({ data }) => {
        const raw = Array.isArray(data.data) ? data.data : []
        setCategories(raw)
      })
      .catch(() => {
        setCategories(MOBILE_FALLBACK_CATEGORIES as PublishCategory[])
      })
  }, [])

  useEffect(() => {
    metaApi
      .getCommunes()
      .then(({ data }) => {
        const provinces = Array.isArray(data.data) ? data.data : []
        const flat = provinces.flatMap((province: { communes?: Commune[] }) => province.communes ?? [])
        setCommunes(flat)
      })
      .catch(() => {
        Alert.alert('Erreur', 'Impossible de charger les communes')
      })
      .finally(() => setCommunesLoading(false))
  }, [])

  // TODO: test E2E sur le flux upload d'images, retry individuel et réordonnancement.
  const pickPhoto = async () => {
    if (imageUpload.items.length >= 8) {
      Alert.alert('Maximum 8 photos')
      return
    }

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permission refusee', "Autorisez l'acces aux photos dans les reglages.")
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 8 - imageUpload.items.length,
      quality: 0.8,
    })

    if (!result.canceled) {
      imageUpload.addPhotos(result.assets.map((asset) => asset.uri))
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  }

  const removePhoto = (idx: number) => {
    imageUpload.removeImage(idx)
  }

  const finalizePublication = async () => {
    await autosave.clearDraft().catch(() => undefined)
    imageUpload.resetUploads()
    setListingId(null)

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    Alert.alert('Annonce publiee !', 'Votre annonce est en ligne.', [
      { text: 'Voir mes annonces', onPress: () => router.push('/profil') },
      { text: 'Accueil', onPress: () => router.push('/tabs/accueil') },
    ])
  }

  const uploadPendingPhotos = async (currentListingId: string | number) => {
    const uploadResult = await imageUpload.uploadQueued(currentListingId)
    if (uploadResult.hasErrors) {
      Alert.alert(
        'Certaines photos ont échoué',
        'Vous pouvez réessayer individuellement sans perdre le brouillon.',
      )
      return false
    }

    await finalizePublication()
    return true
  }

  const onSubmit = async (data: FormData) => {
    if (imageUpload.items.length === 0) {
      Alert.alert('Photos requises', 'Ajoutez au moins une photo a votre annonce.')
      return
    }

    setLoading(true)
    try {
      let currentListingId = listingId
      if (currentListingId == null) {
        const created = await createListing(data)
        currentListingId = created.id
        setListingId(currentListingId)
      }

      await uploadPendingPhotos(currentListingId)
    } catch (err: unknown) {
      const responseError = err as { response?: { data?: { error?: string } } }
      Alert.alert('Erreur', responseError?.response?.data?.error ?? "Impossible de publier l'annonce")
    } finally {
      setLoading(false)
    }
  }

  const retryPhoto = async (index: number) => {
    imageUpload.queueRetry(index)

    if (listingId == null) {
      return
    }

    setLoading(true)
    try {
      await uploadPendingPhotos(listingId)
    } finally {
      setLoading(false)
    }
  }

  const restoreDraft = () => {
    const draft = autosave.pendingDraft
    if (!draft) return
    reset(draft.data.form)
    imageUpload.replacePhotos(draft.data.photos)
    autosave.acceptDraft(draft)
  }

  const ignoreDraft = () => {
    void autosave.discardDraft()
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Publier une annonce</Text>
      </View>

      {autosave.pendingDraft ? (
        <View style={styles.draftBanner}>
          {/* TODO: test E2E */}
          <Text style={styles.draftTitle}>Brouillon restaure</Text>
          <Text style={styles.draftText}>
            Brouillon restaure{autosave.draftAgeLabel ? ` - ${autosave.draftAgeLabel}` : ''}
          </Text>
          <View style={styles.draftActions}>
            <TouchableOpacity style={styles.draftPrimary} onPress={restoreDraft} accessibilityRole="button">
              <Text style={styles.draftPrimaryText}>Restaurer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.draftSecondary} onPress={ignoreDraft} accessibilityRole="button">
              <Text style={styles.draftSecondaryText}>Ignorer</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <ImageUploader
        items={imageUpload.items}
        onAdd={pickPhoto}
        onRemove={removePhoto}
        onRetry={retryPhoto}
        onReorder={(nextItems) => {
          const nextUris = nextItems.map((item) => item.uri)
          imageUpload.replacePhotos(nextUris)
        }}
        disabled={loading}
      />

      <CategoriesSection
        categories={visibleCategories}
        selectedCategory={selectedCategory}
        onSelect={(categoryId) => setValue('category_id', categoryId, { shouldValidate: true })}
        error={errors.category_id?.message}
      />

      <ChipsSection
        title="Commune"
        required
        items={communes}
        selected={selectedCommune}
        loading={communesLoading}
        onSelect={(communeId) => setValue('commune_id', Number(communeId), { shouldValidate: true })}
        error={errors.commune_id?.message}
      />

      <ChipsSection
        title="Etat de l'objet"
        required
        items={CONDITIONS as unknown as { value: string; label: string }[]}
        selected={selectedCondition}
        onSelect={(condition) => setValue('condition', condition as FormData['condition'], { shouldValidate: true })}
        error={errors.condition?.message}
      />

      <ControlledInputSection
        control={control}
        name="titre"
        title="Titre"
        required
        placeholder="Ex: iPhone 14 Pro 256 Go comme neuf"
        maxLength={150}
        error={errors.titre?.message}
      />

      <ControlledInputSection
        control={control}
        name="description"
        title="Description"
        required
        hint="Decrivez votre article : etat, caracteristiques, raison de la vente..."
        placeholder="Decrivez votre article..."
        multiline
        maxLength={3000}
        error={errors.description?.message}
      />

      <ControlledInputSection
        control={control}
        name="price"
        title="Prix (XPF)"
        hint="Laisser vide = prix a debattre"
        placeholder="Laisser vide = prix a debattre"
        keyboardType="numeric"
      />

      <ControlledInputSection
        control={control}
        name="contre_quoi"
        title="Troc (optionnel)"
        hint="Laissez vide si vous vendez. Indiquez ce que vous souhaitez en echange."
        placeholder="Ex: smartphone, velo, cours de surf..."
        maxLength={200}
      />

      <SubmitButton loading={loading} onPress={handleSubmit(onSubmit)} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 48 },
  header: {
    backgroundColor: Colors.white,
    paddingTop: 56,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  section: { backgroundColor: Colors.white, marginTop: Spacing.sm, padding: Spacing.lg },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text, marginBottom: 4 },
  draftBanner: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  draftTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  draftText: { marginTop: 4, fontSize: FontSize.sm, color: Colors.textSecondary },
  draftActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  draftPrimary: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  draftPrimaryText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  draftSecondary: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray50,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  draftSecondaryText: { color: Colors.text, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
})
