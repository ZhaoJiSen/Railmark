import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { STATES } from '../../lib/constants'
import { Alert, AlertDescription } from './alert'
import { Badge } from './badge'
import { Field as ShadcnField, FieldLabel } from './field'
import { OptionSelect } from './option-select'

export function Field({ id, label, required, children }: { id: string, label: string, required?: boolean, children: ReactNode }) {
  return (
    <ShadcnField className="min-w-0 gap-1">
      <FieldLabel htmlFor={id} className="items-center">
        {label}
        {required && <Badge variant="secondary" aria-hidden="true">必填</Badge>}
      </FieldLabel>
      {children}
    </ShadcnField>
  )
}

export function StateSelect({ id, value, onChange }: {
  id: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <OptionSelect id={id} className="w-full bg-card" value={value} onChange={onChange}
      options={STATES.map(state => ({ value: state.id, label: state.label }))} />
  )
}

export function ErrorLine({ message }: { message: string }) {
  if (!message) return null
  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertDescription className="break-words">{message}</AlertDescription>
    </Alert>
  )
}
