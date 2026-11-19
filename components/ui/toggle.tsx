'use client'
import { ToggleButton } from '@heroui/react/toggle-button'
import type { ComponentProps } from 'react'
export function Toggle({ pressed, onPressedChange, disabled, size, variant, ...props }: Omit<ComponentProps<typeof ToggleButton>, 'size' | 'variant'> & {
  title?: string, pressed?: boolean, onPressedChange?: (value: boolean) => void, disabled?: boolean,
  size?: 'sm' | 'default' | 'lg', variant?: 'default' | 'outline',
}) {
  return <ToggleButton size={size === 'lg' ? 'lg' : 'sm'} isSelected={pressed} onChange={onPressedChange} isDisabled={disabled} {...props} />
}
