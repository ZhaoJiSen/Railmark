'use client'
import { Description } from '@heroui/react/description'
import { Drawer } from '@heroui/react/drawer'
import { X } from 'lucide-react'
import { Children, cloneElement, isValidElement } from 'react'
import type { ComponentProps, ReactElement, ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { useOverlayLifecycle } from './overlay-lifecycle'
import type { OverlayEvents } from './overlay-lifecycle'

export function Sheet({ open, ...props }: Omit<ComponentProps<typeof Drawer>, 'isOpen'> & { open?: boolean }) {
  return <Drawer isOpen={open} {...props} />
}
export function SheetClose({ children }: { children: ReactNode, asChild?: boolean }) {
  const child = Children.only(children)
  return isValidElement(child) ? cloneElement(child as ReactElement<{ slot?: string }>, { slot: 'close' }) : null
}
export function SheetContent({ children, className, overlayClassName, side = 'right', showCloseButton = true,
  onOpenAutoFocus, onCloseAutoFocus, onInteractOutside, onEscapeKeyDown, ...props }: Omit<ComponentProps<'div'>, 'role'> & OverlayEvents & { role?: 'dialog' | 'alertdialog' } & {
  side?: 'left' | 'right' | 'top' | 'bottom', showCloseButton?: boolean, overlayClassName?: string,
}) {
  const lateral = side === 'left' || side === 'right'
  return <Drawer.Backdrop isDismissable={!onInteractOutside} className={overlayClassName}>
    <Drawer.Content placement={side} className={lateral ? 'p-(--workspace-gap)' : undefined}>
      <SheetSurface className={cn(lateral && 'data-[placement]:rounded-xl', className)} onOpenAutoFocus={onOpenAutoFocus} onCloseAutoFocus={onCloseAutoFocus}
        onKeyDownCapture={(event: React.KeyboardEvent<HTMLElement>) => onEscapeKeyDown?.(event.nativeEvent)} {...props}>
        {children}
        {showCloseButton && <Drawer.CloseTrigger aria-label="关闭"><X aria-hidden="true" /></Drawer.CloseTrigger>}
      </SheetSurface>
    </Drawer.Content>
  </Drawer.Backdrop>
}
function SheetSurface({ onOpenAutoFocus, onCloseAutoFocus, ...props }: ComponentProps<typeof Drawer.Dialog> & OverlayEvents) {
  useOverlayLifecycle({ onOpenAutoFocus, onCloseAutoFocus })
  return <Drawer.Dialog {...props} />
}
export const SheetHeader = Drawer.Header
export const SheetFooter = Drawer.Footer
export const SheetTitle = Drawer.Heading
export const SheetDescription = Description
