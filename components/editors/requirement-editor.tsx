'use client'

import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Desk } from '../../lib/mygo'
import type { Project, Requirement, SaveRequirementInput, Version } from '../../lib/mygo'
import { readableError } from '../../lib/utils'
import { FieldGroup } from '../ui/field'
import { Field, StateSelect } from '../ui/form-parts'
import { Input } from '../ui/input'
import { OptionSelect } from '../ui/option-select'
import { EditorSheet } from './editor-sheet'
import { fromDelivery } from './link-draft'
import type { LinkDraft } from './link-draft'
import { ProjectFieldset } from './project-fieldset'
import { RequirementExtraFields } from './requirement-extra-fields'

interface EditorProps {
  requirement?: Requirement
  versionId: number
  versions: Version[]
  projects: Project[]
  requirements: Requirement[]
  directions: string[]
  onClose: () => void
  onSaved: (id: number, versionId: number) => void
}

export function RequirementEditor({ requirement, versionId, versions, projects, requirements, directions, onClose, onSaved }: EditorProps) {
  const [draft, setDraft] = useState<Omit<SaveRequirementInput, 'projects'>>(() => requirement ?? {
    id: 0, versionId, title: '', direction: '', state: 'todo', background: '', scope: '', acceptance: '', sourceUrl: '',
  })
  const [links, setLinks] = useState<LinkDraft[]>(() => requirement?.projects.map(fromDelivery) ?? [])
  const initial = useRef(JSON.stringify({ draft, links })).current
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    if (!links.length) {
      setError(projects.length
        ? '请点击候选目录右侧的「关联」，或导入目录，将它加入当前需求。'
        : '请在前端或后端导入一个本地目录。')
      document.getElementById('request-projects')?.focus()
      return
    }
    setBusy(true)
    setError('')
    try {
      const saved = await Desk.saveRequirement({ ...draft, projects: links })
      return () => onSaved(saved, draft.versionId)
    } catch (error) {
      setError(readableError(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <EditorSheet wide title={requirement ? '编辑需求' : '新建需求'}
      submitLabel={requirement ? '保存需求' : '创建需求'} busy={busy} dirty={JSON.stringify({ draft, links }) !== initial} error={error} onClose={onClose} onSubmit={save}>
      <FieldGroup className="gap-3">
        <Field id="request-title" label="需求标题" required>
          <Input id="request-title" required placeholder="例如 订单详情增加异常原因" value={draft.title}
            onChange={event => setDraft({ ...draft, title: event.target.value })} />
        </Field>
        <div className="grid grid-cols-1 gap-3 @min-[17rem]:grid-cols-2 @min-[27rem]:grid-cols-3">
          <Field id="request-version" label="所属版本">
            <OptionSelect id="request-version" className="w-full" value={String(draft.versionId)}
              options={versions.map(version => ({ value: String(version.id), label: version.name }))}
              onChange={value => setDraft({ ...draft, versionId: Number(value) })} />
          </Field>
          <Field id="request-state" label="需求状态">
            <StateSelect id="request-state" value={draft.state} onChange={state => setDraft({ ...draft, state })} />
          </Field>
          <Field id="request-direction" label="业务方向">
            <Input id="request-direction" list="direction-options" value={draft.direction} placeholder="例如 订单管理"
              onChange={event => setDraft({ ...draft, direction: event.target.value })} />
            <datalist id="direction-options">{directions.map(direction => <option value={direction} key={direction} />)}</datalist>
          </Field>
        </div>
      </FieldGroup>
      <ProjectFieldset projects={projects} requirements={requirements} links={links}
        onChange={items => { setLinks(items); setError('') }} error={error} />
      <RequirementExtraFields draft={draft} onChange={changes => setDraft(current => ({ ...current, ...changes }))} />
    </EditorSheet>
  )
}
