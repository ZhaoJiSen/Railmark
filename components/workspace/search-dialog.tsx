'use client'

import { FileText, FolderGit2 } from 'lucide-react'
import { useState } from 'react'
import type { Requirement, Workspace } from '../../lib/mygo'
import { matchesQuery, requirementMatches } from '../../lib/workspace-data'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'

export function SearchDialog({ data, onClose, onRequirement, onProject }: {
  data: Workspace
  onClose: () => void
  onRequirement: (requirement: Requirement) => void
  onProject: (id: number) => void
}) {
  const [query, setQuery] = useState('')
  const requirements = data.requirements.filter(req => requirementMatches(req, query)).slice(0, 12)
  const projects = query.trim() ? data.projects.filter(p => matchesQuery(query, p.name, ...p.directories.map(d => d.path))).slice(0, 8) : []
  const versionNames = new Map(data.versions.map(version => [version.id, version.name]))

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="gap-0 p-0 sm:max-w-xl" showCloseButton={false}>
        <DialogHeader className="sr-only">
          <DialogTitle>搜索工作区</DialogTitle>
          <DialogDescription>跨版本查找需求和项目</DialogDescription>
        </DialogHeader>
        <Command shouldFilter={false} label="搜索工作区">
          <CommandInput aria-label="搜索全部版本和项目" placeholder="输入需求、项目或分支"
            className="h-11" value={query} onValueChange={setQuery} />
          <CommandList className="max-h-[55dvh]">
            <CommandEmpty>暂无匹配结果</CommandEmpty>
            {requirements.length > 0 && (
              <CommandGroup heading={query ? '需求' : '最近更新的需求'}>
                {requirements.map(req => (
                  <CommandItem key={req.id} value={`req-${req.id}`} className="py-2.5"
                    onSelect={() => { onClose(); onRequirement(req) }}>
                    <FileText /><span className="min-w-0 flex-1 truncate">{req.title}</span>
                    <span className="font-mono text-xs text-muted-foreground">{versionNames.get(req.versionId)}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {projects.length > 0 && (
              <CommandGroup heading="项目">
                {projects.map(project => (
                  <CommandItem key={project.id} value={`project-${project.id}`} className="py-2.5"
                    onSelect={() => { onClose(); onProject(project.id) }}>
                    <FolderGit2 /><span className="min-w-0 truncate">{project.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
