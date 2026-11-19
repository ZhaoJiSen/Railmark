'use client'

import { ChevronDown, FolderGit2, Search } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Project, Requirement } from '../../lib/mygo'
import { readableError } from '../../lib/utils'
import { groupProjectsByParent, parentDirectory } from '../../lib/project-directory-groups'
import { matchesQuery } from '../../lib/workspace-data'
import { useWorkspace } from '../../lib/workspace-store'
import { Button } from '../ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { ErrorLine } from '../ui/form-parts'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group'
import { Separator } from '../ui/separator'
import { ListBox } from '@heroui/react/list-box'
import { Label } from '@heroui/react/label'
import { Description } from '@heroui/react/description'
import { Disclosure } from '@heroui/react/disclosure'
import { Toggle } from '../ui/toggle'
import { EmptyPanel } from './empty-panel'

export function ProjectLibrary({ projects, requirements, onOpen, onImport, importing }: {
  projects: Project[]
  requirements: Requirement[]
  onOpen: (id: number) => void
  onImport: () => void
  importing: boolean
}) {
  const [query, setQuery] = useState('')
  const [savingGrouping, setSavingGrouping] = useState(false)
  const [groupingError, setGroupingError] = useState('')
  const groupByDirectory = useWorkspace(state => state.data?.projectGrouping ?? false)
  const setGroupByDirectory = useWorkspace(state => state.setProjectGrouping)
  const directoryGroups = groupProjectsByParent(projects)
  const filtered = projects.filter(project => matchesQuery(query, project.name,
    ...project.directories.flatMap(dir => [dir.path, dir.remote])))
  const visibleIds = new Set(filtered.map(project => project.id))
  const folders = groupByDirectory
    ? Array.from(directoryGroups, ([parent, siblings]) => ({
      parent,
      projects: siblings.filter(project => visibleIds.has(project.id)),
    })).filter(folder => folder.projects.length)
    : []
  const groupedIds = new Set(folders.flatMap(folder => folder.projects.map(project => project.id)))
  const ungrouped = filtered.filter(project => !groupedIds.has(project.id))
  const sharedParent = !groupByDirectory
    ? [...directoryGroups].find(([, siblings]) => siblings.length === projects.length)?.[0]
    : undefined
  const counts = new Map<number, number>()
  for (const requirement of requirements) {
    for (const id of new Set(requirement.projects.map(project => project.projectId))) {
      counts.set(id, (counts.get(id) ?? 0) + 1)
    }
  }

  async function changeGrouping(enabled: boolean): Promise<void> {
    if (savingGrouping) return
    setSavingGrouping(true)
    setGroupingError('')
    try {
      await setGroupByDirectory(enabled)
    } catch (error) {
      setGroupingError(`无法保存目录分组设置。 ${readableError(error)}`)
    } finally {
      setSavingGrouping(false)
    }
  }

  return (
    <section className="grid min-w-0 grid-cols-1 gap-3" aria-labelledby="project-library-title">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 id="project-library-title" tabIndex={-1} className="text-2xl font-semibold tracking-tight outline-none">本地项目</h1>
        <div className="flex flex-wrap items-center gap-1.5">
          {directoryGroups.size > 0 && (
            <Toggle size="sm" pressed={groupByDirectory} aria-disabled={savingGrouping} aria-busy={savingGrouping}
              onPressedChange={enabled => void changeGrouping(enabled)}>
              按目录分组
            </Toggle>
          )}
          <Button type="button" size="sm" onClick={onImport} disabled={importing}>导入目录</Button>
        </div>
      </header>
      {projects.length > 0 && (
        <div>
          <InputGroup variant="secondary" className="w-full max-w-sm">
            <InputGroupInput aria-label="搜索项目" className="min-w-0" placeholder="搜索项目名、目录或仓库地址"
              value={query} onChange={event => setQuery(event.target.value)} />
            <InputGroupAddon><Search aria-hidden="true" className="size-4" /></InputGroupAddon>
          </InputGroup>
        </div>
      )}
      <ErrorLine message={groupingError} />
      {projects.length > 0 && <Separator variant="secondary" isDecorative />}
      {filtered.length ? (
        <div className="space-y-3">
          {folders.map(folder => (
            <ProjectFolder key={folder.parent} parent={folder.parent} query={query.trim().toLowerCase()} count={folder.projects.length}>
              {folder.projects.map(project => (
                <ProjectRow key={project.id} project={project} count={counts.get(project.id) ?? 0} parentShown onOpen={onOpen} />
              ))}
            </ProjectFolder>
          ))}
          {ungrouped.length > 0 && (
            <div>
              {sharedParent && <p className="truncate px-3 py-1 text-xs text-muted" title={sharedParent}>{sharedParent}</p>}
              <ListBox aria-label="项目列表">
                {ungrouped.map(project => (
                  <ProjectRow key={project.id} project={project} count={counts.get(project.id) ?? 0}
                    parentShown={!!sharedParent} onOpen={onOpen} />
                ))}
              </ListBox>
            </div>
          )}
        </div>
      ) : (
        <EmptyPanel icon={<FolderGit2 />} title={projects.length ? '没有匹配的项目' : '暂无本地项目'}
          body={projects.length ? undefined : '导入后，创建需求时可以直接选择该项目和本地目录。'} />
      )}
    </section>
  )
}

function ProjectFolder({ parent, query, count, children }: {
  parent: string
  query: string
  count: number
  children: ReactNode
}) {
  const name = directoryName(parent)

  return (
    <Collapsible key={query} defaultOpen>
      <CollapsibleTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="w-full justify-start" aria-label={parent}>
          <Disclosure.Indicator><ChevronDown aria-hidden="true" /></Disclosure.Indicator>
          <span className="min-w-0 truncate text-start">{name}</span>
          <span className="min-w-0 flex-1 truncate text-start text-xs text-muted" title={parent}>{parentDirectory(parent)}</span>
          <span className="shrink-0 text-xs text-muted tabular-nums">{count} 个项目</span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="ps-6">
        <ListBox aria-label={`${name}下的项目`}>{children}</ListBox>
      </CollapsibleContent>
    </Collapsible>
  )
}

function ProjectRow({ project, count, parentShown = false, onOpen }: {
  project: Project
  count: number
  parentShown?: boolean
  onOpen: (id: number) => void
}) {
  const detail = projectDirectoryLabel(project, parentShown)
  const singlePath = project.directories.length === 1 ? project.directories[0].path : undefined
  return (
    <ListBox.Item id={project.id} textValue={project.name} onAction={() => onOpen(project.id)}>
      <div className="min-w-0 flex-1" title={singlePath}>
        <Label className="block max-w-full wrap-anywhere">{project.name}</Label>
        {detail && <Description className="block truncate">{detail}</Description>}
      </div>
      <span className="shrink-0 text-xs text-muted tabular-nums">{count} 条需求</span>
    </ListBox.Item>
  )
}

function directoryName(path: string): string {
  const normalized = path.replace(/\/+$/, '')
  return normalized.slice(normalized.lastIndexOf('/') + 1) || path
}

function projectDirectoryLabel(project: Project, parentShown: boolean): string | undefined {
  const { directories, name } = project
  if (directories.length > 1) return `${directories.length} 个目录`
  const path = directories[0]?.path
  if (!path) return
  const folder = directoryName(path)
  if (parentShown) return folder === name ? undefined : folder
  return folder === name ? parentDirectory(path) : path
}
