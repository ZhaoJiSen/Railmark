'use client'
import { Chip } from '@heroui/react/chip'
import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'

export function Badge({ variant = 'default', className, ...props }: Omit<ComponentProps<typeof Chip>, 'variant'> & {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost'
}) {
  return <Chip size="sm" color={variant === 'destructive' ? 'danger' : 'default'}
    variant="soft" className={cn('[&>svg]:size-3 [&>svg]:shrink-0', className)} {...props} />
}
