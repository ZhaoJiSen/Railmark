import { useLayoutEffect } from 'react'
import type { FormEvent } from 'react'
import type { Project, Requirement, Version } from '../../lib/mygo'
import { useWorkspace } from '../../lib/workspace-store'
import { ProjectFieldset } from '../editors/project-fieldset'
import { RequirementContentFields } from '../editors/requirement-extra-fields'
import { RequirementFields } from '../editors/requirement-fields'
import type { useRequirementDraft } from '../editors/use-requirement-draft'
import { Button } from '../ui/button'
import { ErrorLine } from '../ui/form-parts'
import { Spinner } from '../ui/spinner'

export type RequirementEditTarget = 'request-title' | 'request-background' | 'request-projects'

const editLabels = {
  'request-title': '编辑需求属性',
  'request-background': '编辑需求内容',
  'request-projects': '编辑关联项目',
}

export function RequirementInlineForm({ target, editor, projects, requirements, versions, onCancel, onSaved }: {
  target: RequirementEditTarget
  editor: ReturnType<typeof useRequirementDraft>
  projects: Project[]
  requirements: Requirement[]
  versions: Version[]
  onCancel: () => void
  onSaved: () => void
}) {
  const { draft, links, initialState, update, setProjects, busy, dirty, error, save } = editor
  const commit = useWorkspace(state => state.saveRequirementEdit)

  useLayoutEffect(() => {
    document.getElementById(target)?.focus()
  }, [target])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!dirty || busy) return
    const id = await save(input => {
      const { title, category, versionId, state, direction, background, scope, acceptance, sourceUrl } = input
      if (target === 'request-title') {
        return commit(input.id, { title, category, versionId, direction, ...(state !== initialState && { state }) })
      }
      if (target === 'request-background') return commit(input.id, { background, scope, acceptance, sourceUrl })
      return commit(input.id, { projects: input.projects })
    })
    if (id) onSaved()
  }

  return (
    <form aria-label={editLabels[target]} className="@container space-y-2.5 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150"
      onSubmit={submit}
      onKeyDown={event => {
        if (busy || event.defaultPrevented || event.nativeEvent.isComposing || event.repeat || event.key !== 'Enter'
          || !(event.metaKey || event.ctrlKey) || !event.currentTarget.contains(event.target as Node)) return
        event.preventDefault()
        event.currentTarget.requestSubmit()
      }}>
      <fieldset disabled={busy} className="min-w-0">
        {target === 'request-title' && <RequirementFields draft={draft} versions={versions} requirements={requirements} onChange={update} />}
        {target === 'request-background' && <RequirementContentFields draft={draft} onChange={update} />}
        {target === 'request-projects' && (
          <ProjectFieldset projects={projects} requirements={requirements} links={links} onChange={setProjects} error={error} />
        )}
      </fieldset>
      <ErrorLine message={error} />
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={busy}>取消</Button>
        <Button type="submit" size="sm" disabled={busy || !dirty} aria-keyshortcuts="Meta+Enter Control+Enter">
          {busy && <Spinner aria-hidden="true" />}
          {busy ? '保存中…' : '保存需求'}
        </Button>
      </div>
    </form>
  )
}
