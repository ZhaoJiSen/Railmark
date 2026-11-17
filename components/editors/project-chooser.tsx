'use client'

import { FolderGit2 } from 'lucide-react'
import type { DirectoryPreview, Project } from '../../lib/mygo'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command'

export function ProjectChooser({ projects, preferredIds, linkedPaths, onChoose, label }: {
  projects: Project[]
  preferredIds: ReadonlySet<number>
  linkedPaths: ReadonlySet<string>
  onChoose: (preview: DirectoryPreview) => void
  label: string
}) {
  const groups = [
    { title: `曾用于${label}`, projects: projects.filter(project => preferredIds.has(project.id)) },
    { title: '其他项目', projects: projects.filter(project => !preferredIds.has(project.id)) },
  ]

  return (
    <Command label={`${label}已有项目`} className="h-auto border">
      <CommandInput autoFocus aria-label={`筛选${label}项目`} placeholder="搜索项目名或本地目录" />
      <CommandList className="max-h-47">
        <CommandEmpty>{projects.length ? '没有匹配的项目' : '项目库为空，请先导入目录'}</CommandEmpty>
        {groups.filter(group => group.projects.length > 0).map(group => (
          <CommandGroup key={group.title} heading={preferredIds.size ? group.title : '项目'}>
            {group.projects.flatMap(project => project.directories.map(dir => {
              const linked = linkedPaths.has(dir.path)
              return (
                <CommandItem key={dir.id} value={String(dir.id)} keywords={[project.name, dir.path]}
                  disabled={linked} className="cursor-pointer"
                  onSelect={() => onChoose({
                    directoryId: dir.id, projectId: project.id, name: project.name, path: dir.path, remote: dir.remote, branch: '',
                  })}>
                  <FolderGit2 aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium [overflow-wrap:anywhere]">{project.name}</span>
                    <span className="block text-xs [overflow-wrap:anywhere] text-muted-foreground">{dir.path}</span>
                  </span>
                  <span className="shrink-0 text-xs font-medium">{linked ? '已关联' : '关联'}</span>
                </CommandItem>
              )
            }))}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  )
}
