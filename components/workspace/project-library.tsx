'use client'

import { ChevronRight, Folder, FolderGit2, FolderPlus, Folders, Search } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Project, Requirement } from '../../lib/mygo'
import { groupProjectsByParent } from '../../lib/project-directory-groups'
import { matchesQuery } from '../../lib/workspace-data'
import { useWorkspace } from '../../lib/workspace-store'
import { Button } from '../ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '../ui/item'
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
  const groupByDirectory = useWorkspace(state => state.projectGrouping)
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

  return (
    <section>
      <header className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">本地项目</h1>
        <div className="flex flex-wrap items-center gap-1.5">
          {directoryGroups.size > 0 && (
            <Toggle size="sm" pressed={groupByDirectory} onPressedChange={setGroupByDirectory}>
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
      {filtered.length ? (
        <ItemGroup className="divide-y border-y">
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
    <div role="listitem">
      <Collapsible key={query} defaultOpen>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="group h-auto min-h-7 w-full px-2 py-1 text-start">
            <ChevronRight aria-hidden="true" className="size-3 text-muted-foreground group-aria-expanded:rotate-90 motion-safe:transition-transform" />
            <Folder aria-hidden="true" className="size-3.5 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate" title={parent}>
              {name}
              {name !== parent && <span className="ms-2 text-xs font-normal text-muted-foreground">{parent}</span>}
            </span>
            <span className="shrink-0 text-xs font-normal text-muted-foreground">{count} 个项目</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ItemGroup className="divide-y ps-5">{children}</ItemGroup>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

function ProjectRow({ project, count, onOpen }: {
  project: Project
  count: number
  onOpen: (id: number) => void
}) {
  return (
    <div role="listitem">
      <Item size="sm" asChild>
        <Button id={`project-link-${project.id}`} type="button" variant="ghost" size="sm"
          className="h-auto min-h-9 w-full gap-2 px-2 py-1.5 whitespace-normal text-start" onClick={() => onOpen(project.id)}>
          <ItemMedia><FolderGit2 aria-hidden="true" className="size-3.5 text-muted-foreground" /></ItemMedia>
          <ItemContent className="min-w-0 gap-0">
            <ItemTitle className="[overflow-wrap:anywhere]">{project.name}</ItemTitle>
            <ItemDescription className="truncate">{project.directories[0]?.path}</ItemDescription>
          </ItemContent>
          <ItemActions className="flex-wrap justify-end gap-x-2 gap-y-0 text-xs text-muted-foreground">
            <span className="whitespace-nowrap tabular-nums">{project.directories.length} 个目录</span>
            <span className="whitespace-nowrap tabular-nums">{count} 条需求</span>
            <ChevronRight aria-hidden="true" className="size-3" />
          </ItemActions>
        </Button>
      </Item>
    </div>
  )
}
