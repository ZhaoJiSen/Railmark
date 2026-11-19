import { Chip } from '@heroui/react/chip'
import { Circle, CircleCheck, CircleDashed, CircleDot } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { requirementCategoryLabel, STATES } from '../../lib/constants'

type StatusColor = 'default' | 'accent' | 'warning' | 'success'
const treatments: Record<string, { Icon: LucideIcon, color: StatusColor }> = {
  todo: { Icon: Circle, color: 'default' },
  in_progress: { Icon: CircleDot, color: 'accent' },
  testing: { Icon: CircleDashed, color: 'warning' },
  done: { Icon: CircleCheck, color: 'success' },
}

export function Status({ state }: { state: string }) {
  return <StateLabel state={state} />
}

export function StateLabel({ state }: { state: string }) {
  const { Icon, color } = treatments[state] ?? treatments.todo
  const label = STATES.find(item => item.id === state)?.label ?? state
  return <StatusChip icon={Icon} color={color} label={label} />
}

export function RequirementCategory({ category }: { category: string }) {
  return <Chip size="sm" variant="soft">{requirementCategoryLabel(category)}</Chip>
}

export function VersionStatus({ state }: { state: string }) {
  const open = state === 'open'
  return <Chip size="sm" variant="tertiary" color={open ? 'accent' : 'success'}>
    <Chip.Label>{open ? '进行中' : '已发布'}</Chip.Label>
  </Chip>
}

function StatusChip({ icon: Icon, color, label }: { icon: LucideIcon, color: StatusColor, label: string }) {
  return (
    <Chip size="sm" variant="soft" color={color}>
      <Icon aria-hidden="true" className="size-3 shrink-0" />
      <Chip.Label>{label}</Chip.Label>
    </Chip>
  )
}
