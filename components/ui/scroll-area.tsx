'use client'
import { ScrollShadow } from '@heroui/react/scroll-shadow'
import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'

export function ScrollArea({ children, className, viewportProps, horizontal, type, scrollbarSize, scrollHideDelay, ...props }:
  ComponentProps<'div'> & {
    viewportProps?: ComponentProps<'div'>, horizontal?: boolean, type?: 'hover' | 'auto' | 'always' | 'scroll',
    scrollHideDelay?: number, scrollbarSize?: 'default' | 'thin',
  }) {
  return <div data-slot="scroll-area" className={cn('relative min-h-0 min-w-0', className)} {...props}>
    <ScrollShadow {...viewportProps} data-slot="scroll-area-viewport" orientation={horizontal ? 'horizontal' : 'vertical'}
      className={cn('size-full overscroll-none', viewportProps?.className)}>{children}</ScrollShadow>
  </div>
}
