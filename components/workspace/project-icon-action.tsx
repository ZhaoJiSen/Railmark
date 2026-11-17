import type { ComponentProps } from 'react'
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'

export function ProjectIconAction({ label, tooltipSide, size = 'icon-sm', ...props }: ComponentProps<typeof Button> & {
  label: string
  tooltipSide?: ComponentProps<typeof TooltipContent>['side']
}) {
  return (
    <Tooltip delayDuration={300} disableHoverableContent>
      <TooltipTrigger asChild>
        <Button type="button" size={size} variant="ghost" aria-label={label} {...props} />
      </TooltipTrigger>
      <TooltipContent side={tooltipSide} sideOffset={5} className="max-w-80 wrap-anywhere data-[state=closed]:animate-none! motion-reduce:animate-none!">
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
