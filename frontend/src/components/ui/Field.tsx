'use client'
import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from 'react'
import clsx from 'clsx'
import { Check, ChevronDown } from 'lucide-react'

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

type ListboxOption = {
  value: string
  label: string
}

type ListboxProps = FieldProps & {
  value: string
  options: readonly ListboxOption[]
  onChange: (value: string) => void
  placeholder?: string
  id?: string
  className?: string
  disabled?: boolean
  'aria-describedby'?: string
}

export function Listbox({
  label,
  hint,
  error,
  value,
  options,
  onChange,
  placeholder = 'Choisir une option',
  id,
  className,
  disabled = false,
  'aria-describedby': describedBy,
}: ListboxProps) {
  const field = useField(id, describedBy, hint, error)
  const listboxId = `${field.id}-listbox`
  const rootRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<Array<HTMLLIElement | null>>([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const selectedIndex = options.findIndex((option) => option.value === value)
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null

  useEffect(() => {
    if (!open) return
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
  }, [open, selectedIndex])

  useEffect(() => {
    if (!open) return
    optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, open])

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

  const selectOption = (index: number) => {
    const option = options[index]
    if (!option) return
    onChange(option.value)
    setOpen(false)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || options.length === 0) return

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      const direction = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((current) => Math.min(options.length - 1, Math.max(0, current + direction)))
      return
    }

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex(event.key === 'Home' ? 0 : options.length - 1)
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (open) selectOption(activeIndex)
      else setOpen(true)
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div className={clsx('flex min-w-0 flex-col gap-2', className)}>
      <label htmlFor={field.id} className="text-label-sm font-semibold text-ink">
        {label}
      </label>
      <div ref={rootRef} className="relative">
        <div className={clsx('k-field-group', error && 'k-field-group-error')}>
          <button
            id={field.id}
            type="button"
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-activedescendant={open ? `${listboxId}-option-${activeIndex}` : undefined}
            aria-describedby={field['aria-describedby']}
            aria-invalid={field['aria-invalid']}
            disabled={disabled}
            className="k-field flex cursor-pointer items-center justify-between gap-3 text-left"
            onClick={() => setOpen((current) => !current)}
            onKeyDown={handleKeyDown}
          >
            <span className={clsx('truncate', !selectedOption && 'text-ink/55')}>
              {selectedOption?.label || placeholder}
            </span>
            <ChevronDown className={clsx('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')} aria-hidden="true" />
          </button>
        </div>
        {open ? (
          <ul
            id={listboxId}
            role="listbox"
            aria-label={label}
            className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-control border border-warm-border bg-cream-surface p-1.5 shadow-modal"
          >
            {options.map((option, index) => {
              const active = index === activeIndex
              const selected = option.value === value
              return (
                <li
                  key={option.value}
                  id={`${listboxId}-option-${index}`}
                  ref={(node) => { optionRefs.current[index] = node }}
                  role="option"
                  aria-selected={selected}
                  tabIndex={-1}
                  className={clsx(
                    'flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-control px-3 py-2 text-body-sm text-ink outline-none',
                    active ? 'bg-lagoon/25 text-ink' : selected ? 'bg-cream-sunken text-ink' : 'bg-cream-surface text-ink',
                  )}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectOption(index)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      selectOption(index)
                    }
                  }}
                >
                  <span>{option.label}</span>
                  {selected ? <Check className="h-4 w-4 shrink-0 text-reef-text" aria-hidden="true" /> : null}
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>
      {(error || hint) ? (
        <p
          id={`${field.id}-message`}
          className={clsx('text-meta', error ? 'text-alert-error' : 'text-ink/70')}
          role={error ? 'alert' : undefined}
        >
          {error || hint}
        </p>
      ) : null}
    </div>
  )
}

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
