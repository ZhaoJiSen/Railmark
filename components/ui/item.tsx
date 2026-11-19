'use client'
import { Surface } from '@heroui/react/surface'
import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'
import * as Slot from '@radix-ui/react-slot'

export function ItemGroup({ className, ...props }: ComponentProps<'div'>) {
  return <div role="list" className={cn('flex flex-col gap-2', className)} {...props} />
}
export function Item({ asChild, variant, size, className, ...props }: ComponentProps<'div'> & {
  asChild?: boolean, variant?: 'default' | 'outline' | 'muted', size?: 'default' | 'sm',
}) {
  return <Surface children={props.children} className={cn('flex min-w-0 flex-wrap items-center gap-3', className)}
    {...props} {...(asChild && { render: renderProps => <Slot.Root {...renderProps} /> })} />
}
export function ItemContent({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex min-w-0 flex-1 flex-col gap-1', className)} {...props} />
}
export function ItemMedia({ className, variant, ...props }: ComponentProps<'div'> & { variant?: string }) {
  return <div className={cn('flex shrink-0 items-center justify-center', className)} {...props} />
}
export function ItemActions({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex items-center gap-2', className)} {...props} />
}
export function ItemTitle({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex min-w-0 items-center gap-2 font-medium', className)} {...props} />
}
export function ItemDescription({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('text-sm text-muted', className)} {...props} />
}
