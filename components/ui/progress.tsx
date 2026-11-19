'use client'
import { ProgressBar } from '@heroui/react/progress-bar'
import type { ComponentProps } from 'react'
export function Progress({ value = 0, ...props }: Omit<ComponentProps<typeof ProgressBar>, 'children'>) {
  return <ProgressBar value={value} {...props}><ProgressBar.Track><ProgressBar.Fill /></ProgressBar.Track></ProgressBar>
}
