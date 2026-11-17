'use client'

import { Desk } from '../../lib/mygo'
import type { Project, Requirement, Version } from '../../lib/mygo'
import { EditorSheet } from './editor-sheet'
import { ProjectFieldset } from './project-fieldset'
import { RequirementBackgroundField, RequirementExtraFields } from './requirement-extra-fields'
import { RequirementFields } from './requirement-fields'
import { useRequirementDraft } from './use-requirement-draft'

interface EditorProps {
  versionId: number
  versions: Version[]
  projects: Project[]
  requirements: Requirement[]
  onClose: () => void
  onSaved: (id: number, versionId: number) => void
}

export function RequirementEditor({ versionId, versions, projects, requirements, onClose, onSaved }: EditorProps) {
  const { draft, links, update, setProjects, busy, dirty, error, save } = useRequirementDraft(versionId, projects)

  return (
    <EditorSheet wide title="新建需求" submitLabel="创建需求" busy={busy} dirty={dirty} error={error} onClose={onClose}
      onSubmit={async event => {
        event.preventDefault()
        const id = await save(Desk.saveRequirement)
        return id ? () => onSaved(id, draft.versionId) : undefined
      }}>
      <RequirementFields draft={draft} versions={versions} requirements={requirements} onChange={update}>
        <RequirementBackgroundField value={draft.background} onChange={background => update({ background })} compact />
      </RequirementFields>
      <ProjectFieldset projects={projects} requirements={requirements} links={links} onChange={setProjects} error={error} />
      <RequirementExtraFields draft={draft} onChange={update} />
    </EditorSheet>
  )
}
