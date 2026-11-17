import { Circle, CircleCheck, CircleDashed, CircleDot } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { requirementCategoryLabel, STATES } from '../../lib/constants'
import { cn } from '../../lib/utils'
import { Badge } from '../ui/badge'

const treatments: Record<string, { Icon: LucideIcon, color: string }> = {
  todo: { Icon: Circle, color: 'text-muted-foreground' },
  in_progress: { Icon: CircleDot, color: 'text-indigo-700 dark:text-indigo-300' },
  testing: { Icon: CircleDashed, color: 'text-amber-800 dark:text-amber-300' },
  done: { Icon: CircleCheck, color: 'text-emerald-700 dark:text-emerald-300' },
}

export function Status({ state }: { state: string }) {
  return <Badge variant="outline" className="px-1.5"><StateLabel state={state} /></Badge>
}

export function StateLabel({ state }: { state: string }) {
  const { Icon, color } = treatments[state] ?? treatments.todo
  const label = STATES.find(item => item.id === state)?.label ?? state
  return <span className={cn('inline-flex items-center gap-1', color)}><Icon aria-hidden="true" className={cn('size-3', color)} />{label}</span>
}

export function RequirementCategory({ category }: { category: string }) {
  return <Badge variant="secondary" className="px-1.5">{requirementCategoryLabel(category)}</Badge>
}

export function VersionStatus({ state }: { state: string }) {
  const open = state === 'open'
  const { Icon, color } = open ? treatments.in_progress : treatments.done
  return (
    <Badge variant="outline" className={cn('px-1.5', color)}>
      <Icon aria-hidden="true" />{open ? '进行中' : '已发布'}
    </Badge>
  )
}
