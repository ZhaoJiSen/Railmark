import { FileText } from 'lucide-react'
import { useRef } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'

export function RequirementBackground({ background }: { background: string }) {
  const preview = useRef<HTMLDivElement>(null)
  const text = background.trim()
  if (!text) return null
  const summary = text.split(/\r?\n[^\S\n]*\n/, 1)[0]

  return (
    <Tooltip delayDuration={250}>
      <TooltipTrigger asChild>
        <p tabIndex={0}
          className="col-span-2 col-start-2 flex w-fit min-w-0 max-w-[min(100%,48rem)] items-center gap-1.5 rounded-sm text-xs leading-5 text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onKeyDown={event => {
            const content = preview.current
            if (!content || content.scrollHeight <= content.clientHeight) return
            if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
            event.preventDefault()
            content.scrollTop += event.key === 'ArrowDown' ? 32 : -32
          }}>
          <FileText aria-hidden="true" className="size-3 shrink-0" />
          <span className="sr-only">需求背景：</span>
          <span className="truncate">{summary}</span>
        </p>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="start" sideOffset={5} collisionPadding={12} showArrow={false}
        className="w-96 max-w-(--radix-tooltip-content-available-width) border bg-popover p-0 text-start text-popover-foreground text-wrap shadow-md data-[state=closed]:animate-none! motion-reduce:animate-none!">
        <div ref={preview} className="max-h-[min(22rem,var(--radix-tooltip-content-available-height))] overflow-auto overscroll-contain px-3 py-2.5">
          <p className="mb-1 text-xs font-medium text-muted-foreground">需求背景</p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap wrap-anywhere">{text}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
