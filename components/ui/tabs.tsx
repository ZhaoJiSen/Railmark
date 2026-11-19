'use client'
import { Tabs as HeroTabs, tabsVariants } from '@heroui/react/tabs'
import type { ComponentProps, ReactNode } from 'react'
export function Tabs({ value, defaultValue, onValueChange, ...props }: Omit<ComponentProps<typeof HeroTabs>, 'selectedKey'> & {
  value?: string, defaultValue?: string, onValueChange?: (value: string) => void,
}) {
  return <HeroTabs selectedKey={value} defaultSelectedKey={defaultValue} onSelectionChange={key => onValueChange?.(String(key))} {...props} />
}
export function TabsList({ children, variant, ...props }: Omit<ComponentProps<typeof HeroTabs.List>, 'children'> & {
  children: ReactNode, variant?: string,
}) {
  return (
    <div className={tabsVariants().tabListContainer({ className: 'overflow-x-auto' })}>
      <HeroTabs.List {...props}>{children}</HeroTabs.List>
    </div>
  )
}
export function TabsTrigger({ value, children, disabled, ...props }: Omit<ComponentProps<typeof HeroTabs.Tab>, 'id' | 'children'> & { value: string, children: ReactNode, disabled?: boolean }) {
  return <HeroTabs.Tab isDisabled={disabled} id={value} {...props}>{children}<HeroTabs.Indicator /></HeroTabs.Tab>
}
export function TabsContent({ value, ...props }: Omit<ComponentProps<typeof HeroTabs.Panel>, 'id'> & { value: string }) {
  return <HeroTabs.Panel id={value} {...props} />
}
