import { cn } from '../../lib/utils'
import { ResizableHandle } from '../ui/resizable'

export function GitColumnHandle({ label, className }: { label: string, className?: string }) {
  return (
    <ResizableHandle
      aria-label={label}
      className={cn('group z-10 cursor-col-resize focus-visible:z-20', className)}
    >
      <span aria-hidden="true"
        className="pointer-events-none absolute h-7 w-1 rounded-full bg-muted-foreground/50 group-hover:bg-foreground group-focus-visible:bg-foreground group-data-[separator=active]:bg-foreground"
      />
    </ResizableHandle>
  )
}
