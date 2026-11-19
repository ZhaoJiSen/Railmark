import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'
import { ScrollArea } from '../ui/scroll-area'

export function GitScrollArea({ className, viewportProps, ...props }: ComponentProps<typeof ScrollArea>) {
  return (
    <ScrollArea
      {...props}
      data-scrollbar="thin"
      className={cn('min-h-0 min-w-0', className)}
      viewportProps={{
        ...viewportProps,
        className: cn(
          'scrollbar-thin [scrollbar-color:transparent_transparent] hover:[scrollbar-color:var(--scrollbar-thumb)_transparent] focus-within:[scrollbar-color:var(--scrollbar-thumb)_transparent]',
          viewportProps?.className,
        ),
      }}
    />
  )
}
