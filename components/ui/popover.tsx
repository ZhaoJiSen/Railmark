'use client'
import { Popover as HeroPopover } from '@heroui/react/popover'
import type { ComponentProps, ReactNode } from 'react'
import { useOverlayLifecycle } from './overlay-lifecycle'
import type { OverlayEvents } from './overlay-lifecycle'
export function Popover({ open, ...props }: Omit<ComponentProps<typeof HeroPopover>, 'isOpen'> & { open?: boolean }) {
  return <HeroPopover isOpen={open} {...props} />
}
export function PopoverTrigger({ children }: { children: ReactNode, asChild?: boolean }) { return children }
export function PopoverContent({ children, align = 'center', side = 'bottom', sideOffset, collisionPadding,
  onOpenAutoFocus, onCloseAutoFocus, ...props }: ComponentProps<typeof HeroPopover.Content> & OverlayEvents & {
  side?: 'top' | 'bottom' | 'left' | 'right', align?: 'start' | 'end' | 'center', sideOffset?: number, collisionPadding?: number,
}) {
  return <HeroPopover.Content placement={(side === 'left' || side === 'right' || align === 'center') ? side : `${side} ${align}`} offset={sideOffset}
    containerPadding={collisionPadding} {...props}>
    <PopoverSurface onOpenAutoFocus={onOpenAutoFocus} onCloseAutoFocus={onCloseAutoFocus}>{children}</PopoverSurface>
  </HeroPopover.Content>
}
function PopoverSurface({ onOpenAutoFocus, onCloseAutoFocus, ...props }: ComponentProps<typeof HeroPopover.Dialog> & OverlayEvents) {
  useOverlayLifecycle({ onOpenAutoFocus, onCloseAutoFocus })
  return <HeroPopover.Dialog {...props} />
}
export const PopoverTitle = HeroPopover.Heading
