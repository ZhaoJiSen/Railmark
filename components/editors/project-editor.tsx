'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { Desk } from '../../lib/mygo'
import type { DirectoryPreview, Project } from '../../lib/mygo'
import { readableError } from '../../lib/utils'
import { Field } from '../ui/form-parts'
import { Input } from '../ui/input'
import { EditorSheet } from './editor-sheet'

export type ProjectEditorInput = { kind: 'rename', project: Project }
  | { kind: 'import', preview: DirectoryPreview, project?: Project }

export function ProjectEditor({ input, onClose, onSaved }: {
  input: ProjectEditorInput
  onClose: () => void
  onSaved: (projectId: number) => void
}) {
  const initialName = input.project?.name ?? (input.kind === 'import' ? input.preview.name : '')
  const [name, setName] = useState(initialName)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const fixed = input.kind === 'import' && !!(input.project || input.preview.projectId)
  const title = input.kind === 'rename' ? '重命名项目' : input.project ? '添加项目目录' : '导入本地项目'

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      if (input.kind === 'rename') {
        const id = input.project.id
        await Desk.renameProject(id, name)
        return () => onSaved(id)
      }
      const dir = await Desk.importProject(input.preview.path, input.project?.id ?? input.preview.projectId, name)
      return () => onSaved(dir.projectId)
    } catch (error) {
      setError(readableError(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <EditorSheet title={title} description={input.kind === 'import' ? input.preview.path : undefined}
      submitLabel={input.kind === 'rename' ? '保存名称' : '确认导入'}
      busy={busy} dirty={name !== initialName} error={error} onClose={onClose} onSubmit={save}>
      <Field id="project-display-name" label="项目显示名" required={!fixed}>
        <Input id="project-display-name" required readOnly={fixed} value={name}
          onChange={event => setName(event.target.value)} />
      </Field>
      {input.kind === 'import' && input.preview.branch && (
        <p className="text-xs text-muted-foreground">
          当前分支 <code className="wrap-anywhere font-mono">{input.preview.branch}</code>
        </p>
      )}
    </EditorSheet>
  )
}
