'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { Desk } from '../../lib/mygo'
import type { Version } from '../../lib/mygo'
import { readableError } from '../../lib/utils'
import { FieldGroup } from '../ui/field'
import { Field } from '../ui/form-parts'
import { Input } from '../ui/input'
import { OptionSelect } from '../ui/option-select'
import { Textarea } from '../ui/textarea'
import { EditorSheet } from './editor-sheet'
import { VersionDatePicker } from './version-date-picker'

const blankVersion: Version = { id: 0, name: '', state: 'open', startDate: '', releaseDate: '', description: '' }
const fieldColumns = 'grid grid-cols-1 gap-3 @min-[18rem]:grid-cols-2'

export function VersionEditor({ version, onClose, onSaved }: {
  version?: Version
  onClose: () => void
  onSaved: (id: number) => void
}) {
  const [draft, setDraft] = useState(version ?? blankVersion)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const id = await Desk.saveVersion(draft)
      return () => onSaved(id)
    } catch (error) {
      setError(readableError(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <EditorSheet title={version ? '编辑版本' : '新建版本'}
      submitLabel={version ? '保存版本' : '创建版本'} busy={busy} dirty={JSON.stringify(draft) !== JSON.stringify(version ?? blankVersion)} error={error} onClose={onClose} onSubmit={save}>
      <FieldGroup className={fieldColumns}>
        <Field id="version-name" label="版本名称" required>
          <Input id="version-name" required placeholder="例如 5.27.0" value={draft.name}
            onChange={event => setDraft({ ...draft, name: event.target.value })} />
        </Field>
        <Field id="version-state" label="版本状态">
          <OptionSelect id="version-state" className="w-full" value={draft.state}
            options={[{ value: 'open', label: '进行中' }, { value: 'released', label: '已发布' }]}
            onChange={state => setDraft({ ...draft, state })} />
        </Field>
      </FieldGroup>
      <FieldGroup role="group" aria-labelledby="version-schedule" className="gap-2">
        <p id="version-schedule" className="text-sm font-medium">迭代排期 <span className="font-normal text-muted-foreground">选填</span></p>
        <div className={fieldColumns}>
          <Field id="version-start" label="开始日期">
            <VersionDatePicker id="version-start" value={draft.startDate}
              onChange={startDate => setDraft({ ...draft, startDate })} />
          </Field>
          <Field id="version-release" label="发布日期">
            <VersionDatePicker id="version-release" value={draft.releaseDate} min={draft.startDate || undefined}
              onChange={releaseDate => setDraft({ ...draft, releaseDate })} />
          </Field>
        </div>
      </FieldGroup>
      <Field id="version-description" label="版本备注（选填）">
        <Textarea id="version-description" value={draft.description}
          onChange={event => setDraft({ ...draft, description: event.target.value })} />
      </Field>
    </EditorSheet>
  )
}
