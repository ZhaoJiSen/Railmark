'use client'
import { Spinner as HeroSpinner } from '@heroui/react/spinner'
import { LoaderCircle } from 'lucide-react'
import type { ComponentProps } from 'react'
export function Spinner(props: Omit<ComponentProps<typeof HeroSpinner<'span'>>, 'render'>) {
  return (
    <HeroSpinner size="sm" {...props} render={slotProps => (
      <span {...slotProps}><LoaderCircle aria-hidden="true" className="size-full" /></span>
    )} />
  )
}
