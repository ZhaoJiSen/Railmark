'use client'
import { Alert as HeroAlert } from '@heroui/react/alert'
import type { ComponentProps } from 'react'
export function Alert({ variant, ...props }: ComponentProps<'div'> & { variant?: 'default' | 'destructive' }) {
  return <HeroAlert children={props.children} status={variant === 'destructive' ? 'danger' : 'default'} {...props} />
}
export const AlertTitle = HeroAlert.Title
export const AlertDescription = HeroAlert.Description
