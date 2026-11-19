'use client'
import { InputGroup as HeroInputGroup } from '@heroui/react/input-group'
import { Children, isValidElement } from 'react'
import type { ComponentProps } from 'react'
export function InputGroup({ children, ...props }: Omit<ComponentProps<typeof HeroInputGroup>, 'children'> & { children: React.ReactNode }) {
  const parts = Children.toArray(children)
  const prefix = parts.filter(part => isValidElement<{ align?: string }>(part) && part.type === InputGroupAddon && part.props.align !== 'inline-end')
  return <HeroInputGroup {...props}>{prefix}{parts.filter(part => !prefix.includes(part))}</HeroInputGroup>
}
export const InputGroupInput = HeroInputGroup.Input
export const InputGroupTextarea = HeroInputGroup.TextArea
export function InputGroupAddon({ align = 'inline-start', ...props }: ComponentProps<typeof HeroInputGroup.Prefix> & {
  align?: 'inline-start' | 'inline-end'
}) {
  const Comp = align === 'inline-start' ? HeroInputGroup.Prefix : HeroInputGroup.Suffix
  return <Comp {...props} />
}
