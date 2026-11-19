'use client'
import { Description } from '@heroui/react/description'
import { Fieldset } from '@heroui/react/fieldset'
import { Label } from '@heroui/react/label'
import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'

export const FieldSet = Fieldset
export const FieldGroup = Fieldset.Group
export const FieldLegend = Fieldset.Legend
export const FieldLabel = Label
export const FieldDescription = Description
export function Field({ className, ...props }: ComponentProps<'div'>) {
  return <div role="group" data-slot="field" className={cn('flex min-w-0 flex-col gap-2', className)} {...props} />
}
