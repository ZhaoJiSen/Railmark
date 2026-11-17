'use client'

import { CalendarDays, FilePlus2, Pencil, Plus } from 'lucide-react'
import type { Project, Requirement, Version } from '../../lib/mygo'
import type { GitRequest } from '../../lib/types'
import { deliveryIssues, requirementMatches, versionDates } from '../../lib/workspace-data'
import { Button } from '../ui/button'
import { ErrorLine } from '../ui/form-parts'
import { Separator } from '../ui/separator'
import { EmptyPanel } from './empty-panel'
import { useVersionGitOverview } from './use-version-git-overview'
import { RequirementList } from './requirement-list'
import { VersionStatus } from './status'
import { VersionFilters } from './version-filters'
import { emptyVersionFilters, useVersionLists } from './version-list-state'
import { VersionSummary } from './version-summary'

interface VersionProps {
  version: Version
  requirements: Requirement[]
  projects: Project[]
  newRequirementId: number
  onEdit: () => void
  onCreate: () => void
  onOpen: (requirement: Requirement) => void
  onProject: (id: number, triggerId: string) => void
  onGit: (request: GitRequest) => void
}

export function VersionView(props: VersionProps) {
  const { version, requirements, projects, newRequirementId, onEdit, onCreate, onOpen, onProject, onGit } = props
  const filters = useVersionLists(state => state.filters[version.id] ?? emptyVersionFilters)
  const setFilters = useVersionLists(state => state.setFilters)
  const { query, projectId, state, category, showIssues } = filters
  const { checks, checking, recentlyChecked, error, refresh } = useVersionGitOverview(version.id, requirements)
  const dates = versionDates(version)

  const problemProjects = new Set<number>()
  const versionProjects = new Set<number>()
  const issueRequirements = new Set<number>()
  for (const item of requirements) {
    for (const delivery of item.projects) {
      versionProjects.add(delivery.projectId)
      if (deliveryIssues(delivery, checks[delivery.directoryId]?.status).length) {
        problemProjects.add(delivery.projectId)
        issueRequirements.add(item.id)
      }
    }
  }

  const filtered = requirements.filter(item => requirementMatches(item, query)
    && (state === 'all' || state === item.state)
    && (category === 'all' || category === (item.category || 'uncategorized'))
    && (!projectId || item.projects.some(project => project.projectId === projectId))
    && (!showIssues || issueRequirements.has(item.id)))

  return (
    <section className="min-w-0">
      <header className="space-y-2 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2.5">
            <h1 tabIndex={-1} className="min-w-0 text-2xl font-semibold break-words tracking-tight outline-none">{version.name}</h1>
            <VersionStatus state={version.state} />
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="icon-sm" aria-label="编辑版本" title="编辑版本" onClick={onEdit}>
              <Pencil />
            </Button>
            <Button type="button" size="sm" onClick={onCreate}><Plus />新建需求</Button>
          </div>
        </div>
        {version.description && (
          <p className="max-w-2xl text-base leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere] text-muted-foreground">{version.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <VersionSummary total={requirements.length} done={requirements.filter(item => item.state === 'done').length}
            issues={problemProjects.size} affectedRequirements={issueRequirements.size}
            showIssues={showIssues} onIssues={showIssues => setFilters(version.id, { ...filters, showIssues })} />
          {dates && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays aria-hidden="true" className="size-3" />{dates}
            </span>
          )}
        </div>
      </header>
      <Separator />
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-2.5">
        <h2 className="flex basis-full items-baseline gap-2 text-base font-semibold sm:basis-auto">
          需求
          {showIssues && (
            <span className="text-xs font-normal tabular-nums text-muted-foreground">{filtered.length} / {requirements.length} 条</span>
          )}
        </h2>
        {requirements.length > 0 && (
          <VersionFilters query={query} projectId={projectId} state={state} category={category} checking={checking}
            recentlyChecked={recentlyChecked} showIssues={showIssues}
            projects={projects.filter(project => versionProjects.has(project.id))}
            onClearIssues={() => setFilters(version.id, { ...filters, showIssues: false })}
            onQuery={query => setFilters(version.id, { ...filters, query })}
            onProject={projectId => setFilters(version.id, { ...filters, projectId })}
            onState={state => setFilters(version.id, { ...filters, state })}
            onCategory={category => setFilters(version.id, { ...filters, category })}
            onRefresh={refresh} />
        )}
      </div>

      <ErrorLine message={error} />
      {filtered.length > 0 ? (
        <RequirementList versionId={version.id} requirements={filtered} checks={checks} selectedId={newRequirementId}
          onOpen={onOpen} onProject={onProject} onGit={onGit} />
      ) : (
        <EmptyPanel icon={<FilePlus2 />}
          title={requirements.length ? showIssues && error ? '当前筛选下暂无可显示的异常结果' : '没有符合条件的需求' : '当前版本还没有需求'}
          body={requirements.length ? undefined : '新建需求后，可在这里跟进进度与关联项目的 Git 状态。'}
          action={requirements.length ? (
            <Button type="button" variant="outline" onClick={() => setFilters(version.id, emptyVersionFilters)}>
              清除筛选
            </Button>
          ) : undefined} />
      )}
    </section>
  )
}
