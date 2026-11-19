'use client'

import { Header } from '@heroui/react/header'
import { ListBox } from '@heroui/react/list-box'
import { Select as HeroSelect } from '@heroui/react/select'
import { ChevronDown } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'

type RootProps = { 'aria-label'?: string, 'aria-labelledby'?: string, className?: string, children: ReactNode, value?: string, defaultValue?: string, disabled?: boolean,
  open?: boolean, onOpenChange?: (open: boolean) => void, onValueChange?: (value: string) => void }

export function Select({ value, defaultValue, disabled, open, onValueChange, ...props }: RootProps) {
  return <HeroSelect variant="secondary" value={value} defaultValue={defaultValue} isDisabled={disabled} isOpen={open}
    onChange={key => { if (key !== null) onValueChange?.(String(key)) }} {...props} />
}
export function SelectTrigger({ children, size, disabled, ...props }: Omit<ComponentProps<typeof HeroSelect.Trigger>, 'children'> & {
  children?: ReactNode, size?: 'sm' | 'default', disabled?: boolean, title?: string,
}) {
  return (
    <HeroSelect.Trigger isDisabled={disabled} {...props}>
      {children}
      <HeroSelect.Indicator className="size-4"><ChevronDown aria-hidden="true" /></HeroSelect.Indicator>
    </HeroSelect.Trigger>
  )
}
export function SelectValue({ placeholder, children, ...props }: ComponentProps<typeof HeroSelect.Value> & { placeholder?: string }) {
  return <HeroSelect.Value {...props}>{children ? <span className="flex items-center gap-2">{children as ReactNode}</span> : placeholder ? ({ isPlaceholder, defaultChildren }) => isPlaceholder ? placeholder : defaultChildren : undefined}</HeroSelect.Value>
}
export function SelectContent({ children, align = 'start', position, ...props }: ComponentProps<typeof HeroSelect.Popover> & {
  align?: 'start' | 'end' | 'center', position?: string,
}) {
  return <HeroSelect.Popover placement={align === 'center' ? 'bottom' : `bottom ${align}`} {...props}>
    <ListBox>{children}</ListBox>
  </HeroSelect.Popover>
}
export function SelectItem({ value, disabled, ...props }: Omit<ComponentProps<typeof ListBox.Item>, 'id'> & {
  value: string, disabled?: boolean, title?: string,
}) {
  return <ListBox.Item id={value} isDisabled={disabled} {...props} />
}
export const SelectGroup = ListBox.Section
export const SelectLabel = Header
