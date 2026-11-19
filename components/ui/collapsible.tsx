'use client'
import { Button } from '@heroui/react/button'
import { Disclosure } from '@heroui/react/disclosure'
import { Children, cloneElement, isValidElement, useState } from 'react'
import type { ComponentProps, ReactElement, ReactNode } from 'react'

export function Collapsible({ open, defaultOpen = false, onOpenChange, asChild, children, ...props }:
  Omit<ComponentProps<typeof Disclosure>, 'isExpanded' | 'children'> & {
    open?: boolean, defaultOpen?: boolean, onOpenChange?: (value: boolean) => void, asChild?: boolean, role?: string, children: ReactNode,
  }) {
  const [expanded, setExpanded] = useState(defaultOpen)
  const current = open ?? expanded
  return <Disclosure isExpanded={current} data-state={current ? 'open' : 'closed'}
    onExpandedChange={value => { setExpanded(value); onOpenChange?.(value) }} {...props}>{children}</Disclosure>
}
export function CollapsibleTrigger({ asChild, children, ...props }: ComponentProps<'button'> & { asChild?: boolean }) {
  const child = asChild ? Children.only(children) : null
  if (isValidElement(child)) {
    const el = child as ReactElement<ComponentProps<'button'>>
    if (typeof el.type === 'string') return <Disclosure.Trigger {...{ ...el.props, ...props } as ComponentProps<typeof Disclosure.Trigger>} />
    return cloneElement(el, { slot: 'trigger', ...props })
  }
  return <Button slot="trigger" variant="ghost" size="sm" {...props as ComponentProps<typeof Button>}>{children}</Button>
}
export function CollapsibleContent({ children, className, ...props }: Omit<ComponentProps<typeof Disclosure.Content>, 'children'> & { children: ReactNode }) {
  return <Disclosure.Content {...props}><div className={typeof className === 'string' ? className : undefined}>{children}</div></Disclosure.Content>
}
