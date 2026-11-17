'use client'

import { ArrowLeft, ExternalLink, FolderGit2, Pencil, Tag } from 'lucide-react'
import { useState } from 'react'
import { Desk } from '../../lib/mygo'
import type { Requirement } from '../../lib/mygo'
import type { GitRequest } from '../../lib/types'
import { readableError } from '../../lib/utils'
import { displayDate } from '../../lib/workspace-data'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { ErrorLine } from '../ui/form-parts'
import { Activity } from './activity'
import { DeliveryGroups } from './delivery-groups'
import { Status } from './status'

interface DetailProps {
  requirement: Requirement
  onBack: () => void
  backLabel: string
  onEdit: () => void
  onChanged: () => void
  onGit: (request: GitRequest) => void
}

export function RequirementDetail({ requirement, onBack, backLabel, onEdit, onChanged, onGit }: DetailProps) {
  const [error, setError] = useState('')
  const content = [
    ['需求背景', requirement.background],
    ['交付范围', requirement.scope],
    ['验收条件', requirement.acceptance],
  ]
  const filled = content.filter(([, value]) => value.trim())
  const missing = content.filter(([, value]) => !value.trim()).map(([label]) => label)

  return (
    <article>
      <Button type="button" variant="ghost" size="sm" className="-ms-1.5 mb-1 text-muted-foreground" onClick={onBack}>
        <ArrowLeft />{backLabel}
      </Button>
      <header className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 data-detail-heading tabIndex={-1} className="text-2xl font-semibold tracking-tight outline-none [overflow-wrap:anywhere]">{requirement.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <Status state={requirement.state} />
            {requirement.direction && (
              <Badge variant="outline" className="max-w-full justify-start text-muted-foreground">
                <Tag aria-hidden="true" className="shrink-0" />
                <span className="min-w-0 wrap-anywhere whitespace-normal">
                  <span className="sr-only">业务方向：</span>{requirement.direction}
                </span>
              </Badge>
            )}
            <time dateTime={requirement.updatedAt}>{displayDate(requirement.updatedAt, 'time')} 更新</time>
          </div>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={onEdit}><Pencil />编辑需求</Button>
      </header>
      <div className="grid items-start gap-3 min-[1060px]:grid-cols-[minmax(0,1.7fr)_minmax(255px,1fr)]">
        <div className="min-w-0 space-y-3">
          <Card className="gap-2 py-3">
            <CardHeader className="px-3"><CardTitle role="heading" aria-level={2}>需求内容</CardTitle></CardHeader>
            <CardContent className="px-3">
              {filled.length > 0 && (
                <dl className="divide-y">
                  {filled.map(([label, value]) => (
                    <div key={label} className="py-2 first:pt-0 last:pb-0">
                      <dt className="mb-1 font-medium">{label}</dt>
                      <dd className="text-base leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere] text-muted-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {missing.length > 0 && <p className="text-xs text-muted-foreground not-first:mt-2">未填写：{missing.join('、')}</p>}
              {requirement.sourceUrl && (
                <div className="pt-2">
                  <Button type="button" variant="outline" size="sm"
                    onClick={() => { setError(''); void Desk.openLink(requirement.sourceUrl).catch(error => setError(readableError(error))) }}>
                    <ExternalLink />打开原始需求
                  </Button>
                </div>
              )}
              <ErrorLine message={error} />
            </CardContent>
          </Card>
          <Card className="gap-2 py-3">
            <CardHeader className="px-3">
              <CardTitle role="heading" aria-level={2} className="flex items-center gap-2">
                <FolderGit2 aria-hidden="true" className="size-4 shrink-0" />关联项目
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3">
              <DeliveryGroups deliveries={requirement.projects} snapshots={{}} onGit={onGit} showPath />
            </CardContent>
          </Card>
        </div>
        <Activity key={requirement.id} id={requirement.id} onChanged={onChanged} />
      </div>
    </article>
  )
}
