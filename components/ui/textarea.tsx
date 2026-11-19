'use client'
import { TextArea } from '@heroui/react/textarea'
import type { ComponentProps } from 'react'
export function Textarea(props: ComponentProps<typeof TextArea>) {
  return <TextArea variant="secondary" {...props} />
}
