'use client'
import { Input as HeroInput } from '@heroui/react/input'
import type { ComponentProps } from 'react'
export function Input(props: ComponentProps<typeof HeroInput>) {
  return <HeroInput variant="secondary" {...props} />
}
