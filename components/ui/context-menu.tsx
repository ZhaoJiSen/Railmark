'use client'

import { Dropdown } from '@heroui/react/dropdown'
import { Separator } from '@heroui/react/separator'
import { mergeProps } from '@react-aria/utils'
import { Children, cloneElement, createContext, isValidElement, useContext, useId, useRef, useState } from 'react'
import type { ComponentProps, ReactElement, ReactNode, RefObject } from 'react'
import { useOverlayLifecycle } from './overlay-lifecycle'
import type { OverlayEvents } from './overlay-lifecycle'

interface ContextState {
  open: boolean
  setOpen: (value: boolean) => void
  opener: RefObject<HTMLElement | null>
  anchor: RefObject<HTMLDivElement | null>
  show: (x: number, y: number) => void
}
const Context = createContext<ContextState | null>(null)
function useMenu() {
  const menu = useContext(Context)
  if (!menu) throw new Error('Context menu must have a root')
  return menu
}
export function ContextMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [point, setPoint] = useState({ x: 0, y: 0 })
  const anchor = useRef<HTMLDivElement>(null)
  const opener = useRef<HTMLElement>(null)
  return <Context value={{ open, setOpen, anchor, opener, show: (x, y) => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setPoint({ x, y }); setOpen(true)
  } }}>
    <div ref={anchor} aria-hidden="true" className="pointer-events-none fixed size-px" style={{ left: point.x, top: point.y }} />
    {children}
  </Context>
}
export function ContextMenuTrigger({ children, asChild, disabled, onKeyDown, onContextMenu, ...props }:
  ComponentProps<'div'> & { asChild?: boolean, disabled?: boolean }) {
  const menu = useMenu()
  const handlers: ComponentProps<'div'> = {
    ...props,
    'aria-haspopup': 'menu',
    'aria-expanded': menu.open,
    'aria-keyshortcuts': disabled ? undefined : 'Shift+F10',
    onContextMenu: event => {
      onContextMenu?.(event)
      if (disabled || event.defaultPrevented) return
      event.preventDefault()
      event.currentTarget.focus({ preventScroll: true })
      menu.show(event.clientX, event.clientY)
    },
    onKeyDown: event => {
      onKeyDown?.(event)
      if (disabled || event.defaultPrevented || event.nativeEvent.isComposing) return
      if (event.key !== 'ContextMenu' && !(event.key === 'F10' && event.shiftKey)) return
      event.preventDefault()
      const rect = event.currentTarget.getBoundingClientRect()
      menu.show(rect.left + 16, rect.bottom)
    },
  }
  const child = asChild ? Children.only(children) : null
  if (isValidElement(child)) {
    return cloneElement(child as ReactElement<ComponentProps<'div'>>, mergeProps(child.props as ComponentProps<'div'>, handlers))
  }
  return <div {...handlers}>{children}</div>
}
export function ContextMenuContent({ children, onCloseAutoFocus, className, ...props }: ComponentProps<'div'> & OverlayEvents) {
  const { anchor, open, setOpen, opener } = useMenu()
  return <Dropdown isOpen={open} onOpenChange={setOpen}>
    <Dropdown.Trigger aria-hidden="true" excludeFromTabOrder className="sr-only">操作</Dropdown.Trigger>
    <Dropdown.Popover triggerRef={anchor} placement="bottom start">
      <MenuLifecycle onCloseAutoFocus={event => {
        onCloseAutoFocus?.(event)
        if (!event.defaultPrevented && opener.current?.isConnected) opener.current.focus({ preventScroll: true })
      }}>
        <Dropdown.Menu className={className} aria-label={props['aria-label'] ?? '操作'}>{children}</Dropdown.Menu>
      </MenuLifecycle>
    </Dropdown.Popover>
  </Dropdown>
}
function MenuLifecycle({ children, onCloseAutoFocus }: { children: ReactNode } & OverlayEvents) {
  useOverlayLifecycle({ onCloseAutoFocus })
  return children
}
export function ContextMenuItem({ onSelect, disabled, variant, children, ...props }: Omit<ComponentProps<typeof Dropdown.Item>, 'onSelect' | 'variant'> & {
  onSelect?: (event: Event) => void, disabled?: boolean, variant?: 'default' | 'destructive',
}) {
  const id = useId()
  return <Dropdown.Item id={id} isDisabled={disabled} variant={variant === 'destructive' ? 'danger' : undefined}
    onAction={() => onSelect?.(new Event('select', { cancelable: true }))} {...props}>{children}</Dropdown.Item>
}
export const ContextMenuSeparator = Separator
