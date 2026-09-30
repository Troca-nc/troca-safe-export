'use client'
import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from 'react'
import clsx from 'clsx'

type FieldProps = {
  label: string
  hint?: string
  error?: string
  prefix?: ReactNode
  suffix?: ReactNode
}
function FieldShell({
  id,
  label,
  hint,
  error,
  prefix,
  suffix,
  children,
}: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={id} className="text-label-sm font-semibold text-ink">
        {label}
      </label>
      <div className={clsx('k-field-group', error && 'k-field-group-error')}>
        {prefix && (
          <span
            className="k-field-affix border-r border-sand"
            aria-hidden="true"
          >
            {prefix}
          </span>
        )}
        {children}
        {suffix && (
          <span
            className="k-field-affix border-l border-sand"
            aria-hidden="true"
          >
            {suffix}
          </span>
        )}
      </div>
      {(error || hint) && (
        <p
          id={id + '-message'}
          className={clsx(
            'text-meta',
            error ? 'text-alert-error' : 'text-ink/70',
          )}
          role={error ? 'alert' : undefined}
        >
          {error || hint}
        </p>
      )}
    </div>
  )
}
function useField(
  id: string | undefined,
  describedBy: string | undefined,
  hint?: string,
  error?: string,
) {
  const generated = useId()
  const fieldId = id || generated
  return {
    id: fieldId,
    'aria-describedby':
      [describedBy, (hint || error) && fieldId + '-message']
        .filter(Boolean)
        .join(' ') || undefined,
    'aria-invalid': error ? (true as const) : undefined,
  }
}
export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & FieldProps
>(function Input(
  {
    label,
    hint,
    error,
    prefix,
    suffix,
    id,
    className,
    'aria-describedby': describedBy,
    ...props
  },
  ref,
) {
  const field = useField(id, describedBy, hint, error)
  return (
    <FieldShell {...{ label, hint, error, prefix, suffix }} id={field.id}>
      <input
        {...props}
        {...field}
        ref={ref}
        className={clsx('k-field', className)}
      />
    </FieldShell>
  )
})
export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & FieldProps
>(function Select(
  {
    label,
    hint,
    error,
    id,
    className,
    children,
    'aria-describedby': describedBy,
    ...props
  },
  ref,
) {
  const field = useField(id, describedBy, hint, error)
  return (
    <FieldShell {...{ label, hint, error }} id={field.id}>
      <select
        {...props}
        {...field}
        ref={ref}
        className={clsx('k-field cursor-pointer', className)}
      >
        {children}
      </select>
    </FieldShell>
  )
})
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps
>(function Textarea(
  {
    label,
    hint,
    error,
    id,
    className,
    rows = 5,
    'aria-describedby': describedBy,
    ...props
  },
  ref,
) {
  const field = useField(id, describedBy, hint, error)
  return (
    <FieldShell {...{ label, hint, error }} id={field.id}>
      <textarea
        {...props}
        {...field}
        ref={ref}
        rows={rows}
        className={clsx('k-field k-textarea', className)}
      />
    </FieldShell>
  )
})
