import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist'

import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme'

export type MobileUploadStatus = 'queued' | 'uploading' | 'done' | 'error'

export type MobileUploadItem = {
  id: string
  uri: string
  status: MobileUploadStatus
  progress: number
  error?: string
}

type Props = {
  items: MobileUploadItem[]
  onAdd: () => void
  onRemove: (index: number) => void
  onRetry: (index: number) => void
  onReorder: (items: MobileUploadItem[]) => void
  disabled?: boolean
}

function UploadTile({
  item,
  index,
  total,
  drag,
  isActive,
  disabled,
  onRemove,
  onRetry,
  onMoveUp,
  onMoveDown,
}: {
  item: MobileUploadItem
  index: number
  total: number
  drag: () => void
  isActive: boolean
  disabled: boolean
  onRemove: () => void
  onRetry: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const previewSource = Image.resolveAssetSource({ uri: item.uri })?.uri ?? item.uri
  const progress = Math.max(0, Math.min(100, item.progress))

  return (
    <View style={[styles.tile, isActive && styles.tileActive]}>
      <TouchableOpacity
        onLongPress={() => {
          if (!disabled) drag()
        }}
        delayLongPress={120}
        activeOpacity={0.9}
        disabled={disabled}
        style={[styles.dragHandle, disabled && styles.dragHandleDisabled]}
        accessibilityRole="button"
        accessibilityLabel="Déplacer la photo"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="reorder-three" size={24} color={Colors.white} />
      </TouchableOpacity>

      <Image source={{ uri: previewSource }} style={styles.image} />

      {index === 0 && (
        <View style={styles.primaryBadge}>
          <Text style={styles.primaryText}>Principale</Text>
        </View>
      )}

      {item.status === 'uploading' && (
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>Envoi {progress}%</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>
      )}

      {item.status === 'error' && (
        <View style={styles.overlay}>
          <Text style={styles.overlayError}>Échec de l’envoi</Text>
          <TouchableOpacity
            onPress={onRetry}
            style={[styles.retryBtn, disabled && styles.retryBtnDisabled]}
            disabled={disabled}
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'done' && (
        <View style={styles.doneBadge}>
          <Ionicons name="checkmark-circle" size={12} color={Colors.white} />
          <Text style={styles.doneText}>OK</Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={onMoveUp}
          disabled={disabled || index === 0}
          style={[styles.actionBtn, (disabled || index === 0) && styles.actionBtnDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Déplacer vers le haut"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-up" size={16} color={Colors.white} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onMoveDown}
          disabled={disabled || index === total - 1}
          style={[styles.actionBtn, (disabled || index === total - 1) && styles.actionBtnDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Déplacer vers le bas"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-down" size={16} color={Colors.white} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onRemove}
          disabled={disabled}
          style={[styles.actionBtn, styles.removeBtn, disabled && styles.actionBtnDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Supprimer la photo"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={16} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default function ImageUploader({ items, onAdd, onRemove, onRetry, onReorder, disabled = false }: Props) {
  const remaining = Math.max(0, 8 - items.length)

  const renderItem = ({ item, drag, isActive }: RenderItemParams<MobileUploadItem>) => {
    const currentIndex = items.findIndex((entry) => entry.id === item.id)
    return (
      <UploadTile
        item={item}
        index={Math.max(0, currentIndex)}
        total={items.length}
        drag={drag}
        isActive={isActive}
        disabled={disabled}
        onRemove={() => onRemove(Math.max(0, currentIndex))}
        onRetry={() => onRetry(Math.max(0, currentIndex))}
        onMoveUp={() => !disabled && onReorder(moveItem(items, currentIndex, currentIndex - 1))}
        onMoveDown={() => !disabled && onReorder(moveItem(items, currentIndex, currentIndex + 1))}
      />
    )
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Photos</Text>
        <Text style={styles.hint}>La 1re photo sera l’image principale</Text>
      </View>

      <DraggableFlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onDragEnd={({ data }) => {
          if (!disabled) onReorder(data)
        }}
        scrollEnabled={false}
        contentContainerStyle={styles.grid}
        activationDistance={12}
        dragItemOverflow={false}
      />

      {remaining > 0 && (
        <TouchableOpacity
          style={[styles.add, disabled && styles.addDisabled]}
          onPress={onAdd}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel="Ajouter des photos"
        >
          <Ionicons name="camera-outline" size={28} color={Colors.gray400} />
          <Text style={styles.addText}>Ajouter</Text>
        </TouchableOpacity>
      )}
      {/* TODO: test E2E sur le flux upload d’images, retry individuel et réordonnancement. */}
    </View>
  )
}

function moveItem<T>(items: T[], from: number, to: number) {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length || from === to) return items
  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

const styles = StyleSheet.create({
  section: { backgroundColor: Colors.white, marginTop: Spacing.sm, padding: Spacing.lg },
  header: { marginBottom: Spacing.sm },
  title: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  hint: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tile: { width: '31%', aspectRatio: 1, borderRadius: Radius.md, overflow: 'hidden', position: 'relative', backgroundColor: Colors.gray50, borderWidth: 1, borderColor: 'transparent' },
  tileActive: { borderColor: Colors.primary, opacity: 0.92 },
  image: { width: '100%', height: '100%' },
  dragHandle: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 44,
    height: 44,
    minWidth: 44,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15,23,42,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  dragHandleDisabled: { opacity: 0.4 },
  primaryBadge: { position: 'absolute', left: 6, top: 6, backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 3, zIndex: 5 },
  primaryText: { color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.62)', alignItems: 'center', justifyContent: 'center', padding: Spacing.sm, zIndex: 3 },
  overlayText: { color: Colors.white, fontSize: FontSize.xs, fontWeight: FontWeight.semibold, marginBottom: 6 },
  overlayError: { color: Colors.white, fontSize: FontSize.xs, fontWeight: FontWeight.semibold, marginBottom: 8, textAlign: 'center' },
  progressTrack: { width: '100%', height: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.white },
  retryBtn: {
    minHeight: 44,
    minWidth: 88,
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  retryBtnDisabled: { opacity: 0.75 },
  retryText: { color: Colors.text, fontSize: 12, fontWeight: FontWeight.semibold },
  doneBadge: { position: 'absolute', top: 6, right: 6, flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#16a34a', borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 3, zIndex: 4 },
  doneText: { color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold },
  actions: { position: 'absolute', left: 6, right: 6, bottom: 6, flexDirection: 'row', gap: 6, justifyContent: 'space-between', zIndex: 4 },
  actionBtn: {
    width: 44,
    height: 44,
    minWidth: 44,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15,23,42,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDisabled: { opacity: 0.35 },
  removeBtn: { backgroundColor: 'rgba(220,38,38,0.85)' },
  add: { marginTop: Spacing.sm, width: '31%', aspectRatio: 1, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.gray300, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', minHeight: 104 },
  addDisabled: { opacity: 0.5 },
  addText: { fontSize: FontSize.xs, color: Colors.gray400, marginTop: 4 },
})
