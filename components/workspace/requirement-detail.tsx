'use client'

import { ArrowLeft, FolderGit2, Pencil, Tag } from 'lucide-react'
import { useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import type { Ref } from 'react'
import type { Project, Requirement, Version } from '../../lib/mygo'
import type { GitRequest } from '../../lib/types'
import { displayDate } from '../../lib/workspace-data'
import { DiscardChangesDialog } from '../editors/discard-changes-dialog'
import { useRequirementDraft } from '../editors/use-requirement-draft'
import { Badge } from '../ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Activity } from './activity'
import { DeliveryGroups } from './delivery-groups'
import { RequirementStatusPicker } from './inline-status'
import { ProjectIconAction } from './project-icon-action'
import { RequirementContent } from './requirement-content'
import { RequirementInlineForm } from './requirement-inline-form'
import type { RequirementEditTarget } from './requirement-inline-form'
import { RequirementCategory, Status } from './status'

interface DetailProps {
  ref?: Ref<RequirementNavigation>
  requirement: Requirement
  projects: Project[]
  requirements: Requirement[]
  versions: Version[]
  onBack: () => void
  backLabel: string
  onChanged: () => void
  onProject: (id: number, triggerId: string) => void
  onGit: (request?: GitRequest) => void
}

export interface RequirementNavigation {
  leave: (navigate: () => void) => void
}

export function RequirementDetail({ ref, requirement, projects, requirements, versions, onBack, backLabel, onChanged, onProject, onGit }: DetailProps) {
  const editor = useRequirementDraft(requirement.versionId, projects, requirement)
  const [editing, setEditing] = useState<RequirementEditTarget>()
  const [discard, setDiscard] = useState<{ run: () => void }>()
  const returnFocus = useRef<RequirementEditTarget>(undefined)

  useLayoutEffect(() => {
    if (editing || !returnFocus.current) return
    document.getElementById(`edit-${returnFocus.current}`)?.focus({ preventScroll: true })
    returnFocus.current = undefined
  }, [editing])

  function beginEdit(target: RequirementEditTarget): void {
    editor.reset(requirement)
    onGit(undefined)
    returnFocus.current = target
    setEditing(target)
  }

  function leave(run: () => void): void {
    if (editor.busy) return
    if (editing && editor.dirty) {
      setDiscard({ run })
    } else {
      run()
    }
  }

  useImperativeHandle(ref, () => ({ leave }))

  const inlineForm = editing && (
    <RequirementInlineForm target={editing} editor={editor} projects={projects} requirements={requirements}
      versions={versions} onSaved={() => setEditing(undefined)} onCancel={() => leave(() => setEditing(undefined))} />
  )

  return (
    <article className="@container">
      <header className="mb-3 grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2 gap-y-1">
        <ProjectIconAction label={backLabel} className="mt-0.5 text-muted-foreground"
          onClick={onBack} disabled={editor.busy}>
          <ArrowLeft aria-hidden="true" />
        </ProjectIconAction>
        <h1 id="requirement-detail-title" data-detail-heading tabIndex={-1} className="min-w-0 text-2xl font-semibold tracking-tight wrap-anywhere outline-none">
          {editing ? requirement.title : (
            <button id="edit-request-title" type="button" className="group inline-flex max-w-full items-center gap-2 rounded-md text-start outline-none hover:text-foreground/85 focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`编辑需求标题「${requirement.title}」`} title="编辑需求标题" onClick={() => beginEdit('request-title')}>
              <span className="min-w-0 wrap-anywhere">{requirement.title}</span>
              <Pencil aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
            </button>
          )}
        </h1>
        <div className="col-start-2 flex min-h-6.5 flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {editing ? <Status state={requirement.state} /> : <RequirementStatusPicker requirement={requirement} />}
          <RequirementCategory category={requirement.category} />
          {requirement.direction && (
            <Badge variant="outline" className="max-w-full justify-start text-muted-foreground">
              <Tag aria-hidden="true" className="shrink-0" />
              <span className="min-w-0 wrap-anywhere whitespace-normal">
                <span className="sr-only">方向：</span>{requirement.direction}
              </span>
            </Badge>
          )}
          <time dateTime={requirement.updatedAt}>{displayDate(requirement.updatedAt, 'time')} 更新</time>
        </div>
      </header>
      <div className="grid items-start gap-3 @min-[48rem]:grid-cols-[minmax(0,1.7fr)_minmax(255px,1fr)]">
        <div className="min-w-0 space-y-3">
          {editing === 'request-title' && (
            <Card className="gap-2 py-2.5">
              <CardHeader className="px-3"><CardTitle role="heading" aria-level={2}>需求属性</CardTitle></CardHeader>
              <CardContent className="px-3">{inlineForm}</CardContent>
            </Card>
          )}
          <Card className="gap-1.5 py-2.5">
            <CardHeader className="flex min-h-6.5 items-center justify-between px-3">
              <CardTitle role="heading" aria-level={2}>需求内容</CardTitle>
              {!editing && (
                <ProjectIconAction id="edit-request-background" label="编辑需求内容" className="text-muted-foreground"
                  onClick={() => beginEdit('request-background')}><Pencil aria-hidden="true" /></ProjectIconAction>
              )}
            </CardHeader>
            <CardContent className="px-3">
              {editing === 'request-background' ? inlineForm : (
                <RequirementContent requirement={requirement} onEdit={editing ? undefined : () => beginEdit('request-background')} />
              )}
            </CardContent>
          </Card>
          <Card className="gap-2 py-2.5">
            <CardHeader className="flex min-h-6.5 items-center justify-between px-3">
              <CardTitle role="heading" aria-level={2} className="flex items-center gap-2">
                <FolderGit2 aria-hidden="true" className="size-4 shrink-0" />关联项目
              </CardTitle>
              {!editing && (
                <ProjectIconAction id="edit-request-projects" label="管理关联项目" className="text-muted-foreground"
                  onClick={() => beginEdit('request-projects')}><Pencil aria-hidden="true" /></ProjectIconAction>
              )}
            </CardHeader>
            <CardContent className="px-3">
              {editing === 'request-projects' ? inlineForm : (
                <DeliveryGroups scope="requirement" requirementId={requirement.id} deliveries={requirement.projects}
                  onProject={editing ? undefined : onProject} onGit={editing ? undefined : onGit} editable={!editing} />
              )}
            </CardContent>
          </Card>
        </div>
        <Activity key={requirement.id} id={requirement.id} updatedAt={requirement.updatedAt} onChanged={onChanged} />
      </div>
      {discard && <DiscardChangesDialog onKeep={() => setDiscard(undefined)} onDiscard={() => {
        setDiscard(undefined)
        discard.run()
      }} />}
    </article>
  )
}
