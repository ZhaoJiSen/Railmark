'use client'

import { SearchField } from '@heroui/react/search-field'
import { Search, X } from 'lucide-react'
import type { ComponentProps } from 'react'

export function PickerSearchField({ label, disabled, ...props }: ComponentProps<typeof SearchField.Input> & {
  label: string
  disabled?: boolean
}) {
  return (
    <SearchField aria-label={label} variant="secondary" fullWidth isDisabled={disabled}>
      <SearchField.Group>
        <SearchField.SearchIcon><Search aria-hidden="true" /></SearchField.SearchIcon>
        <SearchField.Input {...props} />
        <SearchField.ClearButton><X aria-hidden="true" data-slot="close-button-icon" /></SearchField.ClearButton>
      </SearchField.Group>
    </SearchField>
  )
}
