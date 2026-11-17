import { Field } from '../ui/form-parts'
import { Textarea } from '../ui/textarea'

export function BranchNameField({ id, label, value, onChange, placeholder, disabled }: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <Field id={id} label={label}>
      <Textarea id={id} value={value} placeholder={placeholder} disabled={disabled} rows={2}
        className="max-h-24 min-h-7 min-w-0 resize-none px-2.5 py-1 font-mono wrap-anywhere"
        autoCapitalize="off" autoComplete="off" spellCheck={false}
        onKeyDown={event => {
          if (event.key === 'Enter' && !event.nativeEvent.isComposing) event.preventDefault()
        }}
        onChange={event => onChange(event.target.value.replace(/[\r\n]/g, ''))} />
    </Field>
  )
}
