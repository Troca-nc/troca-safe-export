import { useEffect, useMemo, useState } from 'react';
import { Controller } from 'react-hook-form';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

export type PublishCategory = {
  id: number;
  name?: string;
  label?: string;
  icon?: string;
  slug?: string;
  children?: PublishCategory[];
  subcategories?: PublishCategory[];
};

export type PublishCommune = {
  id: number;
  name: string;
};

type SectionTitleProps = {
  title: string;
  required?: boolean;
  hint?: string;
};

function getCategoryChildren(category?: PublishCategory | null) {
  return category?.children || category?.subcategories || [];
}

function isLeafCategory(category?: PublishCategory | null) {
  return getCategoryChildren(category).length === 0;
}

function findCategoryPathById(categories: PublishCategory[], id?: number) {
  if (id == null) return [];

  const walk = (nodes: PublishCategory[], trail: PublishCategory[] = []): PublishCategory[] => {
    for (const node of nodes) {
      const nextTrail = [...trail, node];
      if (node.id === id) {
        return nextTrail;
      }
      const found = walk(getCategoryChildren(node), nextTrail);
      if (found.length) return found;
    }
    return [];
  };

  return walk(categories);
}

export function SectionTitle({ title, required, hint }: SectionTitleProps) {
  return (
    <>
      <Text style={styles.sectionTitle}>
        {title} {required ? <Text style={styles.required}>*</Text> : null}
      </Text>
      {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
    </>
  );
}

type PhotoSectionProps = {
  photos: string[];
  onAdd: () => void;
  onRemove: (index: number) => void;
};

export function PhotoSection({ photos, onAdd, onRemove }: PhotoSectionProps) {
  return (
    <View style={styles.section}>
      <SectionTitle title="Photos" required hint="La 1ere photo sera l'image principale" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
        {photos.map((uri, idx) => (
          <View key={`${uri}-${idx}`} style={styles.photoWrap}>
            <Image source={{ uri }} style={styles.photo} />
            {idx === 0 && (
              <View style={styles.photoPrimary}>
                <Text style={styles.photoPrimaryText}>Principale</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.photoRemove}
              onPress={() => onRemove(idx)}
              accessibilityRole="button"
              accessibilityLabel={`Supprimer la photo ${idx + 1}`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={22} color={Colors.danger} />
            </TouchableOpacity>
          </View>
        ))}
        {photos.length < 8 && (
          <TouchableOpacity
            style={styles.photoAdd}
            onPress={onAdd}
            accessibilityRole="button"
            accessibilityLabel="Ajouter des photos"
          >
            <Ionicons name="camera-outline" size={28} color={Colors.gray400} />
            <Text style={styles.photoAddText}>Ajouter</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

type CategoriesSectionProps = {
  categories: PublishCategory[];
  selectedCategory?: number | null;
  onSelect: (categoryId: number | null) => void;
  error?: string;
};

export function CategoriesSection({ categories, selectedCategory, onSelect, error }: CategoriesSectionProps) {
  const [pathIds, setPathIds] = useState<number[]>([]);

  useEffect(() => {
    if (selectedCategory == null) return;
    const path = findCategoryPathById(categories, selectedCategory);
    if (path.length) {
      setPathIds(path.map((node) => node.id));
    }
  }, [categories, selectedCategory]);

  const breadcrumb = useMemo(() => {
    if (!pathIds.length) return [];
    return findCategoryPathById(categories, pathIds[pathIds.length - 1]);
  }, [categories, pathIds]);

  const activeNode = breadcrumb.length ? breadcrumb[breadcrumb.length - 1] : null;

  const currentCategories = useMemo(() => {
    if (!activeNode) return categories;
    return getCategoryChildren(activeNode);
  }, [activeNode, categories]);

  const openCategory = (category: PublishCategory) => {
    const children = getCategoryChildren(category);
    const nextPath = findCategoryPathById(categories, category.id);
    setPathIds(nextPath.map((node) => node.id));
    if (children.length > 0) {
      onSelect(null);
      return;
    }
    onSelect(category.id);
  };

  const goToBreadcrumb = (index: number) => {
    const next = breadcrumb.slice(0, index + 1);
    setPathIds(next.map((node) => node.id));
    const last = next[next.length - 1];
    onSelect(last && isLeafCategory(last) ? last.id : null);
  };

  return (
    <View style={styles.section}>
      <SectionTitle title="Catégorie" required hint="Choisissez une famille puis la sous-catégorie finale" />

      <View style={styles.categoryPanel}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.breadcrumbRow}>
          {breadcrumb.length > 0 ? (
            breadcrumb.map((node, index) => (
              <TouchableOpacity
                key={node.id}
                style={styles.breadcrumbPill}
                onPress={() => goToBreadcrumb(index)}
                accessibilityRole="button"
                accessibilityLabel={`Retour à ${node.name ?? node.label ?? 'la catégorie'}`}
              >
                <Text style={styles.breadcrumbText}>{node.name ?? node.label}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.categoryHint}>Choisissez une famille</Text>
          )}
        </ScrollView>

        <View style={styles.categoryHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.categoryTitle}>
              {activeNode ? (activeNode.name ?? activeNode.label ?? 'Catégorie') : 'Catégories principales'}
            </Text>
            <Text style={styles.categorySubtitle}>
              {activeNode
                ? 'Choisissez une sous-catégorie finale.'
                : 'Naviguez jusqu’à la catégorie la plus précise.'}
            </Text>
          </View>
          {breadcrumb.length > 0 ? (
            <TouchableOpacity
              style={styles.backPill}
              onPress={() => goToBreadcrumb(Math.max(0, breadcrumb.length - 2))}
              accessibilityRole="button"
            >
              <Text style={styles.backPillText}>{breadcrumb.length > 1 ? 'Retour' : 'Racine'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.categoryGrid}>
          {currentCategories.map((cat) => {
            const children = getCategoryChildren(cat);
            const isActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryCard, isActive && styles.categoryCardActive]}
                onPress={() => openCategory(cat)}
                accessibilityRole="button"
                accessibilityLabel={cat.name ?? cat.label ?? 'Catégorie'}
                accessibilityState={{ selected: isActive }}
                activeOpacity={0.85}
              >
                <View style={[styles.categoryIcon, isActive && styles.categoryIconActive]}>
                  <Ionicons
                    name={(cat.icon as keyof typeof Ionicons.glyphMap) ?? 'grid-outline'}
                    size={18}
                    color={isActive ? Colors.white : Colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.categoryCardTitle, isActive && styles.categoryCardTitleActive]}>
                    {cat.name ?? cat.label}
                  </Text>
                  <Text style={[styles.categoryCardMeta, isActive && styles.categoryCardMetaActive]}>
                    {children.length > 0
                      ? `${children.length} sous-catégorie${children.length > 1 ? 's' : ''}`
                      : 'Catégorie finale'}
                  </Text>
                </View>
                <Ionicons
                  name={children.length > 0 ? 'chevron-forward' : 'checkmark-circle'}
                  size={18}
                  color={isActive ? Colors.white : Colors.gray400}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedCategory != null ? (
          <View style={styles.categorySelectedBox}>
            <Text style={styles.categorySelectedLabel}>Catégorie finale sélectionnée</Text>
            <Text style={styles.categorySelectedValue}>
              {breadcrumb.map((node) => node.name ?? node.label).filter(Boolean).join(' / ')}
            </Text>
          </View>
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

type ChipsSectionProps = {
  title: string;
  required?: boolean;
  items: PublishCommune[] | { value: string; label: string }[];
  selected: number | string | undefined;
  loading?: boolean;
  onSelect: (value: number | string) => void;
  error?: string;
};

export function ChipsSection({ title, required, items, selected, loading, onSelect, error }: ChipsSectionProps) {
  return (
    <View style={styles.section}>
      <SectionTitle title={title} required={required} />
      {loading ? (
        <ActivityIndicator color={Colors.primary} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {items.map((item: any) => {
            const value = item.id ?? item.value;
            const label = item.name ?? item.label;
            const active = selected === value;
            return (
              <TouchableOpacity
                key={String(value)}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => onSelect(value)}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

type ControlledInputSectionProps = {
  control: any;
  name: string;
  title: string;
  required?: boolean;
  hint?: string;
  placeholder: string;
  multiline?: boolean;
  maxLength?: number;
  keyboardType?: 'default' | 'numeric';
  normalizeToStep?: number;
  error?: string;
};

function snapToStep(value: string | number, step: number) {
  const parsed = typeof value === 'number' ? value : Number(String(value || '').trim());
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed / step) * step);
}

export function ControlledInputSection({
  control,
  name,
  title,
  required,
  hint,
  placeholder,
  multiline,
  maxLength,
  keyboardType = 'default',
  normalizeToStep,
  error,
}: ControlledInputSectionProps) {
  return (
    <View style={styles.section}>
      <SectionTitle title={title} required={required} hint={hint} />
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value, onBlur } }) => (
          <TextInput
            style={[styles.input, multiline ? styles.inputMulti : undefined, error ? styles.inputError : undefined]}
            placeholder={placeholder}
            placeholderTextColor={Colors.textTertiary}
            accessibilityLabel={title}
            multiline={multiline}
            numberOfLines={multiline ? 5 : undefined}
            value={value == null ? '' : String(value)}
            onChangeText={(text) => onChange(text)}
            onBlur={() => {
              if (normalizeToStep && String(value ?? '').trim() !== '') {
                onChange(String(snapToStep(value, normalizeToStep)))
              }
              onBlur()
            }}
            maxLength={maxLength}
            keyboardType={keyboardType}
          />
        )}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

type SubmitButtonProps = {
  loading: boolean;
  onPress: () => void;
};

export function SubmitButton({ loading, onPress }: SubmitButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.btn, loading && styles.btnDisabled]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Publier l'annonce"
    >
      {loading ? (
        <ActivityIndicator color={Colors.white} />
      ) : (
        <>
          <Ionicons name="cloud-upload-outline" size={20} color={Colors.white} />
          <Text style={styles.btnText}>Publier l'annonce</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  section: { backgroundColor: Colors.white, marginTop: Spacing.sm, padding: Spacing.lg },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text, marginBottom: 4 },
  sectionHint: { fontSize: FontSize.xs, color: Colors.textTertiary, marginBottom: Spacing.sm },
  required: { color: Colors.danger },
  photoScroll: { flexDirection: 'row' },
  photoWrap: { marginRight: Spacing.sm, position: 'relative' },
  photo: { width: 100, height: 100, borderRadius: Radius.md },
  photoPrimary: {
    position: 'absolute',
    bottom: 4,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(37,99,235,0.85)',
    borderBottomLeftRadius: Radius.md,
    borderBottomRightRadius: Radius.md,
    padding: 3,
  },
  photoPrimaryText: { color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold, textAlign: 'center' },
  photoRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAdd: {
    width: 104,
    height: 104,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.gray300,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAddText: { fontSize: FontSize.xs, color: Colors.gray400, marginTop: 4 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  categoryPanel: {
    marginTop: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.gray50,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  breadcrumbRow: { flexDirection: 'row', gap: Spacing.xs, alignItems: 'center' },
  breadcrumbPill: {
    minHeight: 34,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
  },
  breadcrumbText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  categoryHint: { fontSize: FontSize.xs, color: Colors.textTertiary, paddingVertical: 6 },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  categoryTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  categorySubtitle: { marginTop: 4, fontSize: FontSize.xs, color: Colors.textTertiary, lineHeight: 18 },
  backPill: {
    minHeight: 40,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPillText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  categoryGrid: { gap: Spacing.sm },
  categoryCard: {
    minHeight: 72,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  categoryCardActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconActive: { backgroundColor: 'rgba(255,255,255,0.16)' },
  categoryCardTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  categoryCardTitleActive: { color: Colors.white },
  categoryCardMeta: { marginTop: 2, fontSize: FontSize.xs, color: Colors.textTertiary },
  categoryCardMetaActive: { color: 'rgba(255,255,255,0.72)' },
  categorySelectedBox: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: 'rgba(37,99,235,0.08)',
    padding: Spacing.md,
  },
  categorySelectedLabel: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.bold, textTransform: 'uppercase' },
  categorySelectedValue: { marginTop: 4, fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.semibold },
  cat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.gray50,
    minHeight: 44,
  },
  catActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  catLabelActive: { color: Colors.white },
  chipsRow: { flexDirection: 'row', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.gray50,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    minHeight: 48,
    fontSize: FontSize.md,
    color: Colors.text,
    backgroundColor: Colors.gray50,
  },
  inputError: { borderColor: Colors.danger },
  inputMulti: { height: 120, textAlignVertical: 'top' },
  error: { fontSize: FontSize.xs, color: Colors.danger, marginTop: 4 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    margin: Spacing.lg,
    borderRadius: Radius.md,
    paddingVertical: 16,
    minHeight: 52,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
});
