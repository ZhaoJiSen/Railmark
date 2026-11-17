import type { ReactNode } from 'react'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../ui/empty'

export function EmptyPanel({ icon, title, body, action }: {
  icon: ReactNode
  title: string
  body?: string
  action?: ReactNode
}) {
  return (
    <Empty className="flex-row flex-wrap justify-between gap-2 border px-3 py-3 text-start text-wrap md:p-3">
      <EmptyHeader className="max-w-none min-w-0 flex-1 flex-row gap-2.5 text-start">
        <EmptyMedia variant="icon" className="mb-0">{icon}</EmptyMedia>
        <div className="min-w-0">
          <EmptyTitle role="heading" aria-level={2}>{title}</EmptyTitle>
          {body && <EmptyDescription>{body}</EmptyDescription>}
        </div>
      </EmptyHeader>
      {action && <EmptyContent className="w-auto">{action}</EmptyContent>}
    </Empty>
  )
}
