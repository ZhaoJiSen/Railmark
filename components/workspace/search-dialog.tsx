'use client'

import { Autocomplete } from '@heroui/react/autocomplete'
import { Header } from '@heroui/react/header'
import { Label } from '@heroui/react/label'
import { ListBox } from '@heroui/react/list-box'
import { useState } from 'react'
import type { Requirement, Workspace } from '../../lib/mygo'
import { matchesQuery, requirementMatches } from '../../lib/workspace-data'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { PickerSearchField } from '../ui/picker-search-field'

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
      <DialogContent size="lg" scroll="inside" showCloseButton={false}>
        <DialogHeader className="sr-only">
          <DialogTitle>搜索工作区</DialogTitle>
          <DialogDescription>跨版本查找需求和项目</DialogDescription>
        </DialogHeader>
        <DialogBody className="grid grid-cols-1 gap-3">
          <Autocomplete.Filter inputValue={query} onInputChange={setQuery}>
            <PickerSearchField label="搜索全部版本和项目" placeholder="输入需求、项目或分支" autoFocus />
            <ListBox aria-label="搜索工作区" className="max-h-[55dvh] overflow-y-auto scrollbar"
              renderEmptyState={() => '暂无匹配结果'}>
              {requirements.length > 0 && (
                <ListBox.Section>
                  <Header>{query ? '需求' : '最近更新的需求'}</Header>
                  {requirements.map(req => (
                    <ListBox.Item key={req.id} id={`req-${req.id}`} textValue={req.title}
                      onAction={() => { onClose(); onRequirement(req) }}>
                      <Label className="min-w-0 flex-1 wrap-anywhere">{req.title}</Label>
                      <span className="shrink-0 font-mono text-xs text-muted">{versionNames.get(req.versionId)}</span>
                    </ListBox.Item>
                  ))}
                </ListBox.Section>
              )}
              {projects.length > 0 && (
                <ListBox.Section>
                  <Header>项目</Header>
                  {projects.map(project => (
                    <ListBox.Item key={project.id} id={`project-${project.id}`} textValue={project.name}
                      onAction={() => { onClose(); onProject(project.id) }}>
                      <Label className="min-w-0 wrap-anywhere">{project.name}</Label>
                    </ListBox.Item>
                  ))}
                </ListBox.Section>
              )}
            </ListBox>
          </Autocomplete.Filter>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
