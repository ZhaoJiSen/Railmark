'use client'

import { ArrowLeft, Check, Sparkles } from 'lucide-react'
import { useLayoutEffect, useRef, useState } from 'react'
import { Desk } from '../../lib/mygo'
import type { Project, Requirement, Version } from '../../lib/mygo'
import { DocumentImport } from '../automation/document-import'
import { Button } from '../ui/button'
import { EditorSheet } from './editor-sheet'
import { ProjectFieldset } from './project-fieldset'
import { RequirementBackgroundField, RequirementExtraFields, RequirementImplementationField } from './requirement-extra-fields'
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
  const [imported, setImported] = useState(false)
  const [view, setView] = useState<'initial' | 'import' | 'form'>('initial')
  const [importFooter, setImportFooter] = useState<HTMLDivElement | null>(null)
  const importing = view === 'import'
  const importPane = useRef<HTMLDivElement>(null)
  const entryAction = useRef<HTMLButtonElement>(null)
  const focusTitle = useRef(false)

  useLayoutEffect(() => {
    if (view === 'initial') return
    if (view === 'import') importPane.current?.focus()
    else if (focusTitle.current) {
      focusTitle.current = false
      document.getElementById('request-title')?.focus()
    } else entryAction.current?.focus()
  }, [view])

  function showForm(): void {
    setView('form')
  }

  return (
    <EditorSheet wide initialFocus="request-title" title={importing ? 'AI 解析文档' : '新建需求'}
      headerAction={importing ? (
        <Button type="button" variant="ghost" size="sm" onClick={showForm}>
          <ArrowLeft aria-hidden="true" />返回表单
        </Button>
      ) : (
        <Button ref={entryAction} type="button" variant="outline" size="sm" disabled={busy}
          onClick={() => setView('import')}>
          <Sparkles aria-hidden="true" />AI 解析文档
        </Button>
      )}
      submitLabel="创建需求" busy={busy} dirty={dirty} error={error} onClose={onClose}
      footerActions={importing ? <div ref={setImportFooter} className="contents" /> : undefined}
      submitDisabled={importing} onBack={importing ? showForm : undefined}
      onSubmit={async event => {
        event.preventDefault()
        const id = await save(Desk.saveRequirement)
        return id ? () => onSaved(id, draft.versionId) : undefined
      }}>
      <fieldset disabled={importing} hidden={importing} className="min-w-0 space-y-3">
        {imported && (
          <p role="status" className="flex items-start gap-2 text-sm text-muted-foreground">
            <Check aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
            <span>已应用草稿。{links.length === 0 && '关联一个本地项目后即可创建。'}</span>
          </p>
        )}
        <RequirementFields draft={draft} versions={versions} requirements={requirements} onChange={update}>
          <RequirementBackgroundField value={draft.background} onChange={background => update({ background })} compact />
          <RequirementImplementationField value={draft.implementation} onChange={implementation => update({ implementation })} />
        </RequirementFields>
        <ProjectFieldset projects={projects} requirements={requirements} links={links} onChange={setProjects} error={error} />
        <RequirementExtraFields key={imported ? 'imported' : 'manual'} draft={draft} onChange={update} />
      </fieldset>
      {view !== 'initial' && <div ref={importPane} hidden={!importing} tabIndex={-1} role="group"
        aria-label="文档导入" className="outline-none">
        <DocumentImport current={draft} footer={importing ? importFooter : null} onApply={fields => {
          update(fields)
          setImported(true)
          focusTitle.current = true
          showForm()
        }} />
      </div>}
    </EditorSheet>
  )
}
