'use client'
import { Tooltip as HeroTooltip } from '@heroui/react/tooltip'
import { Focusable } from '@heroui/react/rac'
import type { ComponentProps, ReactElement, ReactNode } from 'react'

export function TooltipProvider({ children }: { children: ReactNode, delayDuration?: number }) { return children }
export function Tooltip({ delayDuration, disableHoverableContent, ...props }: ComponentProps<typeof HeroTooltip> & {
  delayDuration?: number, disableHoverableContent?: boolean,
}) {
  return <HeroTooltip delay={delayDuration} {...props} />
}
export function TooltipTrigger({ asChild, children, ...props }: ComponentProps<'div'> & { asChild?: boolean }) {
  if (asChild) return <Focusable>{children as ComponentProps<typeof Focusable>['children']}</Focusable>
  return <HeroTooltip.Trigger {...props}>{children}</HeroTooltip.Trigger>
}
export function TooltipContent({ side = 'top', align = 'center', sideOffset, collisionPadding, ...props }:
  ComponentProps<typeof HeroTooltip.Content> & { side?: 'top' | 'bottom' | 'left' | 'right', align?: 'start' | 'end' | 'center',
    sideOffset?: number, collisionPadding?: number,
  }) {
  return <HeroTooltip.Content placement={(side === 'left' || side === 'right' || align === 'center') ? side : `${side} ${align}`}
    offset={sideOffset} containerPadding={collisionPadding} {...props} />
}
