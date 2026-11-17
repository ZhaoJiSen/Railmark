'use client'

import { ChevronRight, Folder, FolderGit2, FolderPlus, Folders, Search } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Project, Requirement } from '../../lib/mygo'
import { readableError } from '../../lib/utils'
import { groupProjectsByParent } from '../../lib/project-directory-groups'
import { matchesQuery } from '../../lib/workspace-data'
import { useWorkspace } from '../../lib/workspace-store'
import { Button } from '../ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { ErrorLine } from '../ui/form-parts'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '../ui/item'
import { Toggle } from '../ui/toggle'
import { EmptyPanel } from './empty-panel'
import { projectItemClassName, projectItemTriggerClassName } from './project-item'

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
    <section>
      <header className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <h1 tabIndex={-1} className="text-2xl font-semibold tracking-tight outline-none">本地项目</h1>
        <div className="flex flex-wrap items-center gap-1.5">
          {directoryGroups.size > 0 && (
            <Toggle size="sm" pressed={groupByDirectory} aria-disabled={savingGrouping} aria-busy={savingGrouping}
              onPressedChange={enabled => void changeGrouping(enabled)}>
              <Folders aria-hidden="true" className="size-3.5" />按目录分组
            </Toggle>
          )}
          <Button type="button" size="sm" onClick={onImport} disabled={importing}><FolderPlus />导入目录</Button>
        </div>
      </header>
      {projects.length > 0 && (
        <InputGroup className="mb-2.5">
          <InputGroupInput aria-label="搜索项目" placeholder="搜索项目名、目录或仓库地址"
            value={query} onChange={event => setQuery(event.target.value)} />
          <InputGroupAddon><Search aria-hidden="true" /></InputGroupAddon>
        </InputGroup>
      )}
      <ErrorLine message={groupingError} />
      {filtered.length ? (
        <ItemGroup className="gap-0.5" aria-label="项目列表">
          {folders.map(folder => (
            <ProjectFolder key={folder.parent} parent={folder.parent} query={query.trim().toLowerCase()} count={folder.projects.length}>
              {folder.projects.map(project => (
                <ProjectRow key={project.id} project={project} count={counts.get(project.id) ?? 0} onOpen={onOpen} />
              ))}
            </ProjectFolder>
          ))}
          {filtered.filter(project => !groupedIds.has(project.id)).map(project => (
            <ProjectRow key={project.id} project={project} count={counts.get(project.id) ?? 0} onOpen={onOpen} />
          ))}
        </ItemGroup>
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
  const name = parent.slice(parent.lastIndexOf('/') + 1) || parent

  return (
    <Collapsible key={query} role="listitem" defaultOpen className="group/folder">
      <Item size="sm" className={projectItemClassName}>
        <ItemMedia className="!self-center !translate-y-0 gap-1.5 text-muted-foreground">
          <ChevronRight aria-hidden="true" className="size-3 group-data-[state=open]/folder:rotate-90 motion-safe:transition-transform" />
          <Folder aria-hidden="true" className="size-3.5" />
        </ItemMedia>
        <ItemContent className="min-w-0 gap-0">
          <ItemTitle className="block max-w-full">
            <CollapsibleTrigger asChild>
              <button type="button" className={projectItemTriggerClassName}>{name}</button>
            </CollapsibleTrigger>
          </ItemTitle>
          {name !== parent && <ItemDescription className="block truncate">{parent}</ItemDescription>}
        </ItemContent>
        <ItemActions className="shrink-0 text-xs text-muted-foreground">
          <span className="whitespace-nowrap tabular-nums">{count} 个项目</span>
        </ItemActions>
      </Item>
      <CollapsibleContent>
        <ItemGroup className="ms-4 gap-0.5 border-s ps-2" aria-label={`${name}下的项目`}>{children}</ItemGroup>
      </CollapsibleContent>
    </Collapsible>
  )
}

function ProjectRow({ project, count, onOpen }: {
  project: Project
  count: number
  onOpen: (id: number) => void
}) {
  return (
    <Item role="listitem" size="sm" className={projectItemClassName}>
      <ItemMedia className="!self-center !translate-y-0"><FolderGit2 aria-hidden="true" className="size-3.5 text-muted-foreground" /></ItemMedia>
      <ItemContent className="min-w-0 gap-0">
        <ItemTitle className="block max-w-full">
          <button id={`project-link-${project.id}`} type="button" className={projectItemTriggerClassName}
            onClick={() => onOpen(project.id)}>{project.name}</button>
        </ItemTitle>
        <ItemDescription className="block truncate">{project.directories[0]?.path}</ItemDescription>
      </ItemContent>
      <ItemActions className="shrink-0 flex-wrap justify-end gap-x-2 gap-y-0 text-xs text-muted-foreground">
        <span className="whitespace-nowrap tabular-nums">{project.directories.length} 个目录</span>
        <span className="whitespace-nowrap tabular-nums">{count} 条需求</span>
        <ChevronRight aria-hidden="true" className="size-3" />
      </ItemActions>
    </Item>
  )
}
