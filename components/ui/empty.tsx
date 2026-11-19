'use client'
import { EmptyState } from '@heroui/react/empty-state'
import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'
export const Empty = EmptyState
export function EmptyHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col items-center gap-2', className)} {...props} />
}
export function EmptyTitle({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('text-base font-medium', className)} {...props} />
}
export function EmptyDescription({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('text-sm text-muted', className)} {...props} />
}
export function EmptyContent({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col items-center gap-3', className)} {...props} />
}
export function EmptyMedia({ variant, ...props }: ComponentProps<'div'> & { variant?: string }) {
  return <div {...props} />
}
