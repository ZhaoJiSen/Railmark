'use client'
import { Description } from '@heroui/react/description'
import { Modal } from '@heroui/react/modal'
import { X } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { useOverlayLifecycle } from './overlay-lifecycle'
import type { OverlayEvents } from './overlay-lifecycle'

export function Dialog({ open, defaultOpen, ...props }: Omit<ComponentProps<typeof Modal>, 'isOpen'> & {
  open?: boolean, defaultOpen?: boolean,
}) {
  return <Modal isOpen={open} defaultOpen={defaultOpen} {...props} />
}
export function DialogTrigger({ children }: { children: ReactNode, asChild?: boolean }) { return children }
export function DialogContent({ children, className, showCloseButton = true, onOpenAutoFocus, onCloseAutoFocus,
  onInteractOutside, onEscapeKeyDown, size, scroll, ...props }: Omit<ComponentProps<'div'>, 'role'> & OverlayEvents & {
    role?: 'dialog' | 'alertdialog', showCloseButton?: boolean,
  } & Pick<ComponentProps<typeof Modal.Container>, 'size' | 'scroll'>) {
  return <Modal.Backdrop isDismissable={!onInteractOutside}>
    <Modal.Container size={size} scroll={scroll}>
      <DialogSurface className={className} onOpenAutoFocus={onOpenAutoFocus} onCloseAutoFocus={onCloseAutoFocus}
        onKeyDownCapture={(event: React.KeyboardEvent<HTMLElement>) => onEscapeKeyDown?.(event.nativeEvent)} {...props}>
        {children}
        {showCloseButton && <Modal.CloseTrigger aria-label="关闭"><X aria-hidden="true" /></Modal.CloseTrigger>}
      </DialogSurface>
    </Modal.Container>
  </Modal.Backdrop>
}
function DialogSurface({ onOpenAutoFocus, onCloseAutoFocus, ...props }: ComponentProps<typeof Modal.Dialog> & OverlayEvents) {
  useOverlayLifecycle({ onOpenAutoFocus, onCloseAutoFocus })
  return <Modal.Dialog {...props} />
}
export const DialogHeader = Modal.Header
export const DialogBody = Modal.Body
export const DialogFooter = Modal.Footer
export const DialogTitle = Modal.Heading
export const DialogDescription = Description
