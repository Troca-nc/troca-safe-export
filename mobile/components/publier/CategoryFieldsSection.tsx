import { Controller, type Control, type FieldErrors } from 'react-hook-form'
import type { ReactNode } from 'react'
import { Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme'
import { getCategoryFields, type CategoryField } from '@/types/categoryFields'

type Props = {
  categorySlug: string
  control: Control<any>
  errors: FieldErrors<any>
  onChangeMetadata?: (next: Record<string, unknown>) => void
}

function getErrorMessage(errors: Record<string, unknown>, path: string): string | undefined {
  const segments = path.split('.')
  let current: unknown = errors
  for (const segment of segments) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[segment]
  }

  const message = (current as { message?: unknown } | undefined)?.message
  return typeof message === 'string' ? message : undefined
}

function FieldShell({
  field,
  error,
  children,
}: {
  field: CategoryField
  error?: string
  children: ReactNode
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>
        {field.label} {field.required ? <Text style={styles.required}>*</Text> : null}
      </Text>
      {children}
      {field.helper ? <Text style={styles.helper}>{field.helper}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

export default function CategoryFieldsSection({
  categorySlug,
  control,
  errors,
  onChangeMetadata,
}: Props) {
  const fields = getCategoryFields(categorySlug)
  if (!fields.length) return null

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Caracteristiques specifiques</Text>
      <View style={styles.grid}>
        {fields.map((field) => {
          const error = getErrorMessage(errors as Record<string, unknown>, field.name)

          if (field.type === 'checkbox') {
            return (
              <Controller
                key={field.name}
                control={control}
                name={field.name as never}
                rules={field.required ? { required: `${field.label} est requis.` } : undefined}
                render={({ field: { value, onChange } }) => (
                  <FieldShell field={field} error={error}>
                    <TouchableOpacity
                      style={[styles.checkboxCard, value ? styles.checkboxCardActive : null]}
                      onPress={() => {
                        const next = !Boolean(value)
                        onChange(next)
                        if (onChangeMetadata) {
                          onChangeMetadata({ [field.name.replace(/^metadata\./, '')]: next })
                        }
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: Boolean(value) }}
                    >
                      <Ionicons name={Boolean(value) ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={Boolean(value) ? Colors.white : Colors.gray500} />
                      <Text style={[styles.checkboxText, Boolean(value) ? styles.checkboxTextActive : null]}>
                        {field.helper || 'Activer'}
                      </Text>
                    </TouchableOpacity>
                  </FieldShell>
                )}
              />
            )
          }

          if (field.type === 'checkbox-group') {
            return (
              <Controller
                key={field.name}
                control={control}
                name={field.name as never}
                rules={field.required ? { required: `${field.label} est requis.` } : undefined}
                render={({ field: { value, onChange } }) => {
                  const selectedValues = Array.isArray(value as unknown)
                    ? (value as unknown[]).map((item: unknown) => String(item))
                    : []
                  return (
                    <FieldShell field={field} error={error}>
                      <View style={styles.chipsRow}>
                        {field.options?.map((option: { value: string; label: string }) => {
                          const active = selectedValues.includes(option.value)
                          return (
                            <TouchableOpacity
                              key={option.value}
                              style={[styles.chip, active ? styles.chipActive : null]}
                              onPress={() => {
                                const next = active
                                  ? selectedValues.filter((item) => item !== option.value)
                                  : [...selectedValues, option.value]
                                onChange(next)
                                if (onChangeMetadata) {
                                  onChangeMetadata({ [field.name.replace(/^metadata\./, '')]: next })
                                }
                              }}
                            >
                              <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{option.label}</Text>
                            </TouchableOpacity>
                          )
                        })}
                      </View>
                    </FieldShell>
                  )
                }}
              />
            )
          }

          if (field.type === 'radio') {
            return (
              <Controller
                key={field.name}
                control={control}
                name={field.name as never}
                rules={field.required ? { required: `${field.label} est requis.` } : undefined}
                render={({ field: { value, onChange } }) => (
                  <FieldShell field={field} error={error}>
                    <View style={styles.chipsRow}>
                      {field.options?.map((option) => {
                        const active = String(value ?? '') === option.value
                        return (
                          <TouchableOpacity
                            key={option.value}
                            style={[styles.radioCard, active ? styles.radioCardActive : null]}
                            onPress={() => {
                              onChange(option.value)
                              if (onChangeMetadata) {
                                onChangeMetadata({ [field.name.replace(/^metadata\./, '')]: option.value })
                              }
                            }}
                          >
                            <Text style={[styles.radioText, active ? styles.radioTextActive : null]}>{option.label}</Text>
                          </TouchableOpacity>
                        )
                      })}
                    </View>
                  </FieldShell>
                )}
              />
            )
          }

          if (field.type === 'select' || field.type === 'text' || field.type === 'number' || field.type === 'date' || field.type === 'textarea') {
            return (
              <Controller
                key={field.name}
                control={control}
                name={field.name as never}
                rules={field.required ? { required: `${field.label} est requis.` } : undefined}
                render={({ field: { value, onChange, onBlur } }) => (
                  <FieldShell field={field} error={error}>
                    {field.type === 'select' ? (
                      <View style={styles.selectWrap}>
                        {(field.options ?? []).map((option) => {
                          const active = String(value ?? '') === option.value
                          return (
                            <TouchableOpacity
                              key={option.value}
                              style={[styles.selectOption, active ? styles.selectOptionActive : null]}
                              onPress={() => {
                                onChange(option.value)
                                if (onChangeMetadata) {
                                  onChangeMetadata({ [field.name.replace(/^metadata\./, '')]: option.value })
                                }
                              }}
                            >
                              <Text style={[styles.selectText, active ? styles.selectTextActive : null]}>{option.label}</Text>
                            </TouchableOpacity>
                          )
                        })}
                      </View>
                    ) : (
                      <TextInput
                        style={[styles.input, field.type === 'textarea' ? styles.inputMulti : null]}
                        value={value == null ? '' : String(value)}
                        onChangeText={(next) => {
                          const nextValue = field.type === 'number'
                            ? (next === '' ? '' : Number(next))
                            : next
                          onChange(nextValue)
                          if (onChangeMetadata) {
                            onChangeMetadata({ [field.name.replace(/^metadata\./, '')]: nextValue })
                          }
                        }}
                        onBlur={onBlur}
                        keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                        multiline={field.type === 'textarea'}
                        placeholder={field.placeholder}
                        placeholderTextColor={Colors.gray400}
                        accessibilityLabel={field.label}
                      />
                    )}
                  </FieldShell>
                )}
              />
            )
          }

          return null
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: Colors.white,
    marginTop: Spacing.sm,
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  grid: { gap: Spacing.md },
  fieldWrap: { gap: 6 },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  required: { color: Colors.danger },
  helper: { fontSize: FontSize.xs, color: Colors.textTertiary },
  error: { fontSize: FontSize.xs, color: Colors.danger },
  input: {
    minHeight: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.gray50,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  inputMulti: { minHeight: 96, textAlignVertical: 'top' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.gray50,
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  checkboxCard: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.gray50,
  },
  checkboxCardActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkboxText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  checkboxTextActive: { color: Colors.white },
  radioCard: {
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.gray50,
  },
  radioCardActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  radioText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  radioTextActive: { color: Colors.white },
  selectWrap: { gap: Spacing.sm },
  selectOption: {
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.gray50,
  },
  selectOptionActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  selectText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  selectTextActive: { color: Colors.white },
})
