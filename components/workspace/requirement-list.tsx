'use client'

import { AlertTriangle, ArrowRight, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { GitChecksByDirectory } from '../../lib/git-checks'
import type { Requirement } from '../../lib/mygo'
import type { GitRequest } from '../../lib/types'
import { cn } from '../../lib/utils'
import { deliveryIssues, displayDate } from '../../lib/workspace-data'
import { Button } from '../ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { DeliveryGroups } from './delivery-groups'
import { RequirementStatusPicker } from './inline-status'
import { RequirementBackground } from './requirement-background'
import { RequirementCategory } from './status'
import { emptyOpenRows, useVersionLists } from './version-list-state'

interface ListProps {
  versionId: number
  requirements: Requirement[]
  selectedId: number
  checks: GitChecksByDirectory
  onOpen: (requirement: Requirement) => void
  onProject: (id: number, triggerId: string) => void
  onGit: (request: GitRequest) => void
}

export function RequirementList({ versionId, requirements, selectedId, checks, onOpen, onProject, onGit }: ListProps) {
  const openRows = useVersionLists(state => state.openRows[versionId] ?? emptyOpenRows)
  const setOpen = useVersionLists(state => state.setOpen)
  const [initialExpanded] = useState(requirements[0]?.id)
  const preferred = selectedId || initialExpanded
  const defaultExpanded = requirements.find(item => item.id === preferred)?.id ?? requirements[0]?.id
  const directions = Map.groupBy(requirements, item => item.direction || '未分组')

  useEffect(() => {
    if (selectedId) document.getElementById(`requirement-${selectedId}`)?.scrollIntoView({ block: 'nearest' })
  }, [selectedId])

  return (
    <div className="space-y-4">
      {[...directions].map(([direction, items]) => (
        <section key={direction}>
          <h3 className="flex items-baseline gap-2 border-b px-1 pb-1.5 text-sm font-semibold text-foreground/85 wrap-anywhere">
            {direction}<span className="text-xs font-normal tabular-nums text-muted-foreground">{items.length}</span>
          </h3>
          <div className="divide-y divide-border/60">
            {items.map(item => {
              const open = openRows[item.id] ?? item.id === defaultExpanded
              const issueCount = new Set(item.projects.filter(project => deliveryIssues(project, checks[project.directoryId]?.status).length)
                .map(project => project.projectId)).size

              return (
                <Collapsible key={item.id} asChild open={open}
                  onOpenChange={value => setOpen(versionId, item.id, value)}>
                  <article id={`requirement-${item.id}`} aria-labelledby={`requirement-link-${item.id}`} className="@container">
                    <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 px-1 py-1.5">
                      <CollapsibleTrigger asChild>
                        <Button type="button" size="icon-sm" variant="ghost"

                          aria-label={`${open ? '收起' : '展开'} ${item.title} 的项目`}>
                          <ChevronRight aria-hidden="true" className={cn('size-3.5 motion-safe:transition-transform', open && 'rotate-90')} />
                        </Button>
                      </CollapsibleTrigger>
                      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                        <Button id={`requirement-link-${item.id}`} type="button" variant="ghost"
                          className="-ms-2 max-w-[calc(100%+var(--spacing)*2)] justify-start px-2 text-start whitespace-normal"
                          onClick={() => onOpen(item)}>
                          <span className="wrap-anywhere">{item.title}</span>
                          <ArrowRight aria-hidden="true" className="size-3 text-muted-foreground" />
                        </Button>
                        {item.category && <RequirementCategory category={item.category} />}
                      </div>
                      <div className="flex items-center gap-2">
                        {issueCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs tabular-nums text-destructive" title={`${issueCount} 个异常项目`}>
                            <AlertTriangle className="size-3" aria-hidden="true" />
                            {issueCount}<span className="sr-only"> 个异常项目</span>
                          </span>
                        )}
                        <RequirementStatusPicker requirement={item} />
                        <time dateTime={item.updatedAt} className="hidden w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground @min-[24rem]:block">
                          {displayDate(item.updatedAt)}
                        </time>
                      </div>
                      <RequirementBackground background={item.background} />
                    </div>
                    <CollapsibleContent className="px-1 pb-2.5 @min-[24rem]:ps-10 md:@min-[24rem]:ps-9">
                      <DeliveryGroups scope="version" requirementId={item.id} deliveries={item.projects}
                        onProject={onProject} onGit={onGit} />
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
