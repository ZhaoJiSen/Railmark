'use client'

import { AlertTriangle, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Requirement } from '../../lib/mygo'
import type { GitByDirectory, GitRequest } from '../../lib/types'
import { cn } from '../../lib/utils'
import { deliveryIssues, displayDate } from '../../lib/workspace-data'
import { Button } from '../ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { DeliveryGroups } from './delivery-groups'
import { Status } from './status'

interface ListProps {
  requirements: Requirement[]
  selectedId: number
  snapshots: GitByDirectory
  onOpen: (requirement: Requirement) => void
  onGit: (request: GitRequest) => void
}

export function RequirementList({ requirements, selectedId, snapshots, onOpen, onGit }: ListProps) {
  const [openRows, setOpenRows] = useState<Record<number, boolean>>({})
  const defaultExpanded = requirements.find(item => item.id === selectedId)?.id ?? requirements[0]?.id
  const directions = Map.groupBy(requirements, item => item.direction || '未分组')

  useEffect(() => {
    if (selectedId) document.getElementById(`requirement-${selectedId}`)?.scrollIntoView({ block: 'nearest' })
  }, [selectedId])

  return (
    <div className="divide-y border-y">
      {[...directions].map(([direction, items]) => (
        <section key={direction}>
          <h3 className="flex items-baseline gap-2 bg-muted/50 px-2.5 py-1.5 text-sm font-semibold [overflow-wrap:anywhere]">
            {direction}<span className="text-xs font-normal tabular-nums text-muted-foreground">{items.length}</span>
          </h3>
          <div className="divide-y">
            {items.map(item => {
              const open = openRows[item.id] ?? item.id === defaultExpanded
              const issueCount = item.projects.filter(project => deliveryIssues(project, snapshots[project.directoryId]).length).length

              return (
                <Collapsible key={item.id} asChild open={open}
                  onOpenChange={value => setOpenRows(rows => ({ ...rows, [item.id]: value }))}>
                  <article id={`requirement-${item.id}`} className="@container">
                    <div className="flex min-w-0 items-center gap-2 px-2 py-1">
                      <CollapsibleTrigger asChild>
                        <Button type="button" size="icon-sm" variant="ghost" className="text-muted-foreground"
                          aria-label={`${open ? '收起' : '展开'} ${item.title} 的项目`}>
                          <ChevronRight className={cn('size-3 motion-safe:transition-transform', open && 'rotate-90')} />
                        </Button>
                      </CollapsibleTrigger>
                      <div className="min-w-0 flex-1">
                        <Button id={`requirement-link-${item.id}`} type="button" variant="link" className="h-auto max-w-full justify-start p-0 text-start font-semibold whitespace-normal has-[>svg]:px-0"
                          onClick={() => onOpen(item)}>
                          <span className="[overflow-wrap:anywhere]">{item.title}</span>
                          <ChevronRight aria-hidden="true" className="size-3 text-muted-foreground" />
                        </Button>
                        {item.latestLog && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground" title={item.latestLog}>
                            {item.latestLog}
                          </p>
                        )}
                      </div>
                      {issueCount > 0 && (
                        <span className="flex shrink-0 items-center gap-1 text-xs text-destructive">
                          <AlertTriangle className="size-3" aria-hidden="true" />
                          {issueCount}<span className="sr-only"> 个异常项目</span>
                        </span>
                      )}
                      <Status state={item.state} />
                      <time dateTime={item.updatedAt} className="hidden w-11 shrink-0 text-right text-xs tabular-nums text-muted-foreground @min-[24rem]:block">
                        {displayDate(item.updatedAt)}
                      </time>
                    </div>
                    <CollapsibleContent className="me-2 ms-3 pb-2 @min-[24rem]:ms-10">
                      <DeliveryGroups deliveries={item.projects} snapshots={snapshots} onGit={onGit} />
                    </CollapsibleContent>
                  </article>
                </Collapsible>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
