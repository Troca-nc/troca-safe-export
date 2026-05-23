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
  selectedCategory?: number;
  onSelect: (categoryId: number) => void;
  error?: string;
};

export function CategoriesSection({ categories, selectedCategory, onSelect, error }: CategoriesSectionProps) {
  return (
    <View style={styles.section}>
      <SectionTitle title="Catégorie" required />
      <View style={styles.chipsWrap}>
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.cat, isActive && styles.catActive]}
              onPress={() => onSelect(cat.id)}
              accessibilityRole="button"
              accessibilityLabel={cat.name ?? cat.label ?? 'Catégorie'}
              accessibilityState={{ selected: isActive }}
            >
              <Ionicons name={(cat.icon as keyof typeof Ionicons.glyphMap) ?? 'grid-outline'} size={18} color={isActive ? Colors.white : Colors.gray600} />
              <Text style={[styles.catLabel, isActive && styles.catLabelActive]}>{cat.name ?? cat.label}</Text>
            </TouchableOpacity>
          );
        })}
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
  error?: string;
};

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
            onBlur={onBlur}
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
