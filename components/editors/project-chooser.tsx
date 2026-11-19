'use client'

import { Autocomplete } from '@heroui/react/autocomplete'
import { Chip } from '@heroui/react/chip'
import { Description } from '@heroui/react/description'
import { Header } from '@heroui/react/header'
import { Label } from '@heroui/react/label'
import { ListBox } from '@heroui/react/list-box'
import { useFilter } from '@heroui/react/rac'
import type { DirectoryPreview, Project } from '../../lib/mygo'
import { PickerSearchField } from '../ui/picker-search-field'

export function ProjectChooser({ projects, preferredIds, linkedPaths, onChoose, label }: {
  projects: Project[]
  preferredIds: ReadonlySet<number>
  linkedPaths: ReadonlySet<string>
  onChoose: (preview: DirectoryPreview) => void
  label: string
}) {
  const { contains } = useFilter({ sensitivity: 'base' })
  const groups = [
    { title: `曾用于${label}`, projects: projects.filter(project => preferredIds.has(project.id)) },
    { title: '其他项目', projects: projects.filter(project => !preferredIds.has(project.id)) },
  ]

  return (
    <div className="grid min-w-0 grid-cols-1 gap-3">
      <Autocomplete.Filter filter={contains}>
        <PickerSearchField autoFocus label={`筛选${label}项目`} placeholder="搜索项目名或本地目录" />
        <ListBox aria-label={`${label}已有项目`} className="max-h-48 overflow-y-auto scrollbar"
          renderEmptyState={() => projects.length ? '没有匹配的项目' : '项目库为空，请先导入目录'}>
          {groups.filter(group => group.projects.length > 0).map(group => (
            <ListBox.Section key={group.title}>
              <Header>{preferredIds.size ? group.title : '项目'}</Header>
              {group.projects.flatMap(project => project.directories.map(dir => {
                const linked = linkedPaths.has(dir.path)
                return (
                  <ListBox.Item key={dir.id} id={dir.id} textValue={`${project.name} ${dir.path}`}
                    isDisabled={linked} onAction={() => onChoose({
                      directoryId: dir.id, projectId: project.id, name: project.name, path: dir.path, remote: dir.remote, branch: '',
                    })}>
                    <div className="min-w-0 flex-1">
                      <Label className="block max-w-full wrap-anywhere">{project.name}</Label>
                      <Description className="block wrap-anywhere">{dir.path}</Description>
                    </div>
                    {linked && <Chip size="sm" variant="soft">已关联</Chip>}
                  </ListBox.Item>
                )
              }))}
            </ListBox.Section>
          ))}
        </ListBox>
      </Autocomplete.Filter>
    </div>
  )
}
