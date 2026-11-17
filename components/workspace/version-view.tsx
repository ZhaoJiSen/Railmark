'use client'

import { CalendarDays, FilePlus2, Pencil, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Desk } from '../../lib/mygo'
import type { Project, Requirement, Version } from '../../lib/mygo'
import type { GitByDirectory, GitRequest } from '../../lib/types'
import { readableError } from '../../lib/utils'
import { deliveryIssues, requirementMatches, versionDates } from '../../lib/workspace-data'
import { Button } from '../ui/button'
import { ErrorLine } from '../ui/form-parts'
import { Separator } from '../ui/separator'
import { EmptyPanel } from './empty-panel'
import { RequirementList } from './requirement-list'
import { VersionStatus } from './status'
import { VersionFilters } from './version-filters'
import { VersionSummary } from './version-summary'

interface VersionProps {
  version: Version
  requirements: Requirement[]
  projects: Project[]
  newRequirementId: number
  onEdit: () => void
  onCreate: () => void
  onOpen: (requirement: Requirement) => void
  onGit: (request: GitRequest) => void
}

const emptyFilters = { query: '', projectId: 0, state: 'all', showIssues: false }

export function VersionView(props: VersionProps) {
  const { version, requirements, projects, newRequirementId, onEdit, onCreate, onOpen, onGit } = props
  const [filters, setFilters] = useState(emptyFilters)
  const [lastCreated, setLastCreated] = useState(newRequirementId)
  if (newRequirementId && newRequirementId !== lastCreated) {
    setLastCreated(newRequirementId)
    setFilters(emptyFilters)
  }
  const { query, projectId, state, showIssues } = filters
  const [refresh, setRefresh] = useState(0)
  const [result, setResult] = useState<{ refresh: number, snapshots: GitByDirectory, error: string }>()
  const snapshots = result?.snapshots ?? {}
  const checking = requirements.length > 0 && result?.refresh !== refresh
  const dates = versionDates(version)

  useEffect(() => {
    if (!requirements.length) return
    let ignore = false
    Desk.gitOverview(version.id).then(values => {
      if (!ignore) setResult({ refresh, snapshots: Object.fromEntries(values.map(value => [value.directoryId, value])), error: '' })
    }).catch(error => {
      if (!ignore) setResult(current => ({ refresh, snapshots: current?.snapshots ?? {}, error: readableError(error) }))
    })
    return () => { ignore = true }
  }, [version.id, requirements.length, refresh])

  const problemProjects = new Set<number>()
  const versionProjects = new Set<number>()
  const issueRequirements = new Set<number>()
  for (const item of requirements) {
    for (const delivery of item.projects) {
      versionProjects.add(delivery.projectId)
      if (deliveryIssues(delivery, snapshots[delivery.directoryId]).length) {
        problemProjects.add(delivery.projectId)
        issueRequirements.add(item.id)
      }
    }
  }

  const filtered = requirements.filter(item => requirementMatches(item, query)
    && (state === 'all' || state === item.state)
    && (!projectId || item.projects.some(project => project.projectId === projectId))
    && (!showIssues || issueRequirements.has(item.id)))

  return (
    <section className="min-w-0">
      <header className="space-y-2 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2.5">
            <h1 className="min-w-0 text-2xl font-semibold break-words tracking-tight">{version.name}</h1>
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
            issues={problemProjects.size} showIssues={showIssues} onIssues={showIssues => setFilters(current => ({ ...current, showIssues }))} />
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
          <VersionFilters query={query} projectId={projectId} state={state} checking={checking} showIssues={showIssues}
            projects={projects.filter(project => versionProjects.has(project.id))}
            onClearIssues={() => setFilters(current => ({ ...current, showIssues: false }))}
            onQuery={query => setFilters(current => ({ ...current, query }))}
            onProject={projectId => setFilters(current => ({ ...current, projectId }))}
            onState={state => setFilters(current => ({ ...current, state }))}
            onRefresh={() => setRefresh(value => value + 1)} />
        )}
      </div>

      <ErrorLine message={result?.error ? `Git 核对失败，${Object.keys(snapshots).length ? '显示上次核对结果' : '暂时无法判断工作区异常'}。 ${result.error}` : ''} />
      {filtered.length > 0 ? (
        <RequirementList requirements={filtered} snapshots={snapshots} selectedId={newRequirementId}
          onOpen={onOpen} onGit={onGit} />
      ) : (
        <EmptyPanel icon={<FilePlus2 />}
          title={requirements.length ? showIssues && result?.error ? '当前筛选下暂无可显示的异常结果' : '没有符合条件的需求' : '当前版本还没有需求'}
          body={requirements.length ? undefined : '新建需求后，可在这里跟进进度与关联项目的 Git 状态。'}
          action={requirements.length ? (
            <Button type="button" variant="outline" onClick={() => setFilters(emptyFilters)}>
              清除筛选
            </Button>
          ) : undefined} />
      )}
    </section>
  )
}
