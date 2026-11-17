'use client'

import { FolderOpen, Link2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { GROUPS } from '../../lib/constants'
import { Desk } from '../../lib/mygo'
import type { DirectoryPreview, Project, Requirement } from '../../lib/mygo'
import type { Group } from '../../lib/types'
import { readableError } from '../../lib/utils'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { FieldDescription } from '../ui/field'
import { ErrorLine } from '../ui/form-parts'
import { fromPreview } from './link-draft'
import type { LinkDraft } from './link-draft'
import { ProjectChooser } from './project-chooser'
import { ProjectLinkFields } from './project-link-fields'

export function ProjectFieldset({ projects, requirements, links, onChange, error }: {
  projects: Project[]
  requirements: Requirement[]
  links: LinkDraft[]
  onChange: (links: LinkDraft[]) => void
  error: string
}) {
  const [choosing, setChoosing] = useState<Group>()
  const [picking, setPicking] = useState<Group>()
  const [groupError, setGroupError] = useState<{ group: Group, text: string }>()
  const chooserTrigger = useRef<HTMLButtonElement>(null)

  function closeChooser(): void {
    chooserTrigger.current?.focus({ preventScroll: true })
    chooserTrigger.current = null
    setChoosing(undefined)
  }

  function link(preview: DirectoryPreview, group: Group): void {
    if (links.some(item => item.group === group && item.path === preview.path)) {
      setGroupError({ group, text: '该目录已关联到当前分组' })
      return
    }
    onChange([...links, fromPreview(preview, group)])
    closeChooser()
    setGroupError(undefined)
  }

  async function pick(group: Group): Promise<void> {
    if (picking) return
    setPicking(group)
    setGroupError(undefined)
    try {
      const preview = await Desk.pickDirectory()
      if (preview.path) link(preview, group)
    } catch (error) {
      setGroupError({ group, text: readableError(error) })
    } finally {
      setPicking(undefined)
    }
  }

  function previouslyUsed(group: Group): Set<number> {
    return new Set(requirements.flatMap(requirement => requirement.projects
      .filter(project => project.group === group)
      .map(project => project.projectId)))
  }

  return (
    <section aria-labelledby="request-projects" aria-describedby="request-projects-hint">
      <div className="mb-2">
        <div className="mb-1 flex items-center gap-2">
          <h3 id="request-projects" tabIndex={-1} className="text-sm font-semibold">本地项目</h3>
          {!links.length && <Badge variant="secondary">必填</Badge>}
        </div>
        <FieldDescription id="request-projects-hint" role="status">
          {links.length ? `已关联 ${links.length} 个目录` : '在前端或后端添加一个本地目录即可。'}
        </FieldDescription>
      </div>
      <div className="divide-y rounded-lg border">
        {GROUPS.map(group => (
          <section key={group.id} aria-label={group.label} className="px-3 py-2">
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
              <h4 className="text-sm font-medium">{group.label}</h4>
              <div className="flex flex-wrap gap-1">
                {projects.length > 0 && (
                  <Button type="button" variant="ghost" size="sm" aria-label={`${group.label}关联已有项目`}
                    aria-expanded={choosing === group.id} disabled={!!picking}
                    onClick={event => {
                      chooserTrigger.current = event.currentTarget
                      if (choosing === group.id) closeChooser()
                      else setChoosing(group.id)
                    }}>
                    <Link2 />关联已有
                  </Button>
                )}
                <Button type="button" variant={projects.length ? 'ghost' : 'secondary'} size="sm" aria-label={`${group.label}导入目录`}
                  disabled={!!picking} onClick={() => void pick(group.id)}>
                  <FolderOpen />{picking === group.id ? '选择中…' : '导入目录'}
                </Button>
              </div>
            </div>
            <div className="space-y-2 pt-2 empty:hidden">
              {choosing === group.id && (
                <div data-editor-picker onKeyDown={event => {
                  if (event.key !== 'Escape' || event.nativeEvent.isComposing) return
                  event.stopPropagation()
                  closeChooser()
                }}>
                  <ProjectChooser projects={projects} preferredIds={previouslyUsed(group.id)}
                    linkedPaths={new Set(links.filter(item => item.group === group.id).map(item => item.path))}
                    onChoose={preview => link(preview, group.id)} label={group.label} />
                </div>
              )}
              <ErrorLine message={groupError?.group === group.id ? groupError.text : ''} />
              {links.filter(item => item.group === group.id).map(item => (
                <ProjectLinkFields key={item.draftId} link={item} invalid={error.includes(item.path)}
                  onChange={updated => onChange(links.map(row => row.draftId === item.draftId ? updated : row))}
                  onRemove={() => onChange(links.filter(row => row.draftId !== item.draftId))} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}
