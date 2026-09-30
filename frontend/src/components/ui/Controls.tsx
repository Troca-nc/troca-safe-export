'use client'
import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ButtonHTMLAttributes,
} from 'react'
import clsx from 'clsx'

type ChoiceProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string
  error?: string
}
const Choice = forwardRef<
  HTMLInputElement,
  ChoiceProps & { kind: 'checkbox' | 'radio' | 'switch' }
>(function Choice(
  {
    kind,
    label,
    error,
    className,
    id,
    'aria-describedby': describedBy,
    ...props
  },
  ref,
) {
  const generated = useId()
  const fieldId = id || generated
  return (
    <div className="flex flex-col gap-1">
      <label
        className={clsx(
          'k-choice',
          props.disabled && 'cursor-not-allowed text-ink/55',
          className,
        )}
        htmlFor={fieldId}
      >
        <input
          {...props}
          ref={ref}
          id={fieldId}
          type={kind === 'radio' ? 'radio' : 'checkbox'}
          role={kind === 'switch' ? 'switch' : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            [describedBy, error && fieldId + '-error']
              .filter(Boolean)
              .join(' ') || undefined
          }
          className={clsx(
            'k-choice-input',
            kind === 'switch'
              ? 'k-switch'
              : kind === 'radio'
                ? 'k-radio'
                : 'k-checkbox',
          )}
        />
        <span>{label}</span>
      </label>
      {error && (
        <p
          id={fieldId + '-error'}
          role="alert"
          className="text-meta text-alert-error"
        >
          {error}
        </p>
      )}
    </div>
  )
})
export const Checkbox = forwardRef<HTMLInputElement, ChoiceProps>(
  function Checkbox(props, ref) {
    return <Choice {...props} ref={ref} kind="checkbox" />
  },
)
export const Radio = forwardRef<HTMLInputElement, ChoiceProps>(
  function Radio(props, ref) {
    return <Choice {...props} ref={ref} kind="radio" />
  },
)
export const Switch = forwardRef<HTMLInputElement, ChoiceProps>(
  function Switch(props, ref) {
    return <Choice {...props} ref={ref} kind="switch" />
  },
)
export function FilterChip({
  selected,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean }) {
  return (
    <button
      {...props}
      type="button"
      aria-pressed={selected}
      className={clsx('k-filter', selected && 'k-filter-selected', className)}
    >
      {children}
    </button>
  )
}
export function SegmentedControl({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  options: { value: string; label: string; disabled?: boolean }[]
}) {
  const name = useId()
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-label-sm font-semibold text-ink">
        {label}
      </legend>
      <div className="flex flex-wrap gap-1 rounded-control border border-sand bg-cream-sunken p-1">
        {options.map((option) => (
          <label key={option.value} className="relative min-w-0 flex-1">
            <input
              className="k-segment-input sr-only"
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              disabled={disabled || option.disabled}
              onChange={() => onChange(option.value)}
            />
            <span className="k-segment-label">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
