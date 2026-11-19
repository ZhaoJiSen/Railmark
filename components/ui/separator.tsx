'use client'
import { Separator as HeroSeparator } from '@heroui/react/separator'
import type { ComponentProps } from 'react'
export function Separator({ decorative, ...props }: ComponentProps<typeof HeroSeparator> & { decorative?: boolean }) {
  return <HeroSeparator {...props} />
}
