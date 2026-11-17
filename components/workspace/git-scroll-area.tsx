import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'
import { ScrollArea } from '../ui/scroll-area'

export function GitScrollArea({ className, viewportProps, ...props }: ComponentProps<typeof ScrollArea>) {
  return (
    <ScrollArea
      {...props}
      type="hover"
      scrollHideDelay={0}
      scrollbarSize="thin"
      className={cn('min-h-0 min-w-0', className)}
      viewportProps={{
        ...viewportProps,
        className: cn('[&>div]:block!', viewportProps?.className),
      }}
    />
  )
}
