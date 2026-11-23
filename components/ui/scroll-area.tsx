'use client'
import { ScrollShadow } from '@heroui/react/scroll-shadow'
import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'

export function ScrollArea({ children, className, viewportProps, horizontal, type = 'hover', scrollbarSize, scrollHideDelay, ...props }:
  ComponentProps<'div'> & {
    viewportProps?: Omit<ComponentProps<typeof ScrollShadow>, 'children' | 'orientation'>,
    horizontal?: boolean, type?: 'hover' | 'auto' | 'always' | 'scroll',
    scrollHideDelay?: number, scrollbarSize?: 'default' | 'thin',
  }) {
  const showScrollbarOnHover = type === 'hover'
  return <div data-slot="scroll-area" data-scrollbar={scrollbarSize ?? (showScrollbarOnHover ? 'thin' : undefined)}
    className={cn('relative min-h-0 min-w-0', className)} {...props}>
    <ScrollShadow {...viewportProps} data-slot="scroll-area-viewport" orientation={horizontal ? 'horizontal' : 'vertical'}
      className={cn('size-full overscroll-none',
        showScrollbarOnHover && '[scrollbar-color:transparent_transparent] hover:[scrollbar-color:var(--scrollbar-thumb)_transparent]',
        viewportProps?.className)}>{children}</ScrollShadow>
  </div>
}
