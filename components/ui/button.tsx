'use client'

import { Button as HeroButton, buttonVariants as heroButtonVariants } from '@heroui/react/button'
import { Tooltip } from '@heroui/react/tooltip'
import { Children, cloneElement, isValidElement } from 'react'
import type { ComponentProps, ReactElement } from 'react'

const variants = { default: 'primary', destructive: 'danger', outline: 'outline', secondary: 'secondary', ghost: 'ghost', link: 'ghost' } as const
const sizes = { default: 'sm', xs: 'sm', sm: 'sm', lg: 'lg', icon: 'sm', 'icon-xs': 'sm', 'icon-sm': 'sm', 'icon-lg': 'lg' } as const

type ButtonProps = Omit<ComponentProps<'button'>, 'value'> & {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  asChild?: boolean
}

export function buttonVariants({ variant = 'default', size = 'default', className }: {
  variant?: keyof typeof variants, size?: keyof typeof sizes, className?: string,
} = {}) {
  return heroButtonVariants({ variant: variants[variant], size: sizes[size], isIconOnly: size.startsWith('icon'), className })
}

// Preserve the app's event and sizing API while HeroUI owns visual states and dimensions.
export function Button({ variant = 'default', size = 'default', asChild, children, disabled, title, tabIndex, ...props }: ButtonProps) {
  if (asChild) {
    const child = Children.only(children)
    if (!isValidElement(child)) return null
    const element = child as ReactElement<ComponentProps<'a'>>
    return cloneElement(element, { ...props, ...element.props, className: buttonVariants({ variant, size, className: props.className }) } as ComponentProps<'a'>)
  }
  const button = <HeroButton {...(props as ComponentProps<typeof HeroButton>)}
    aria-label={props['aria-label'] ?? title} excludeFromTabOrder={tabIndex === -1} size={sizes[size]} variant={variants[variant]} isIconOnly={size.startsWith('icon')}
    isDisabled={disabled}>{children}</HeroButton>
  return title ? <Tooltip delay={400}>{button}<Tooltip.Content>{title}</Tooltip.Content></Tooltip> : button
}
