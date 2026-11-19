'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

interface Option {
  value: string
  label: string
}

export function OptionSelect({ value, options, onChange, id, label, className }: {
  value: string
  options: readonly Option[]
  onChange: (value: string) => void
  id?: string
  label?: string
  className?: string
}) {
  return (
    <Select aria-label={label} aria-labelledby={!label && id ? `${id}-label` : undefined} value={value} onValueChange={onChange}>
      <SelectTrigger id={id} aria-label={label} className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(option => <SelectItem value={option.value} key={option.value}>{option.label}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}
