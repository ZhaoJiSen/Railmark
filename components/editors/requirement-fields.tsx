import type { ReactNode } from 'react'
import { REQUIREMENT_CATEGORIES } from '../../lib/constants'
import type { Requirement, Version } from '../../lib/mygo'
import { FieldGroup } from '../ui/field'
import { Field, StateSelect } from '../ui/form-parts'
import { Input } from '../ui/input'
import { OptionSelect } from '../ui/option-select'
import type { RequirementFieldsDraft } from './use-requirement-draft'

export function RequirementFields({ draft, versions, requirements, onChange, children }: {
  draft: RequirementFieldsDraft
  versions: Version[]
  requirements: Requirement[]
  onChange: (changes: Partial<RequirementFieldsDraft>) => void
  children?: ReactNode
}) {
  const category = draft.category || 'uncategorized'
  const directions = [...new Set(requirements
    .filter(item => !item.category || item.category === draft.category)
    .map(item => item.direction).filter(Boolean))].sort()
  const directionLabel = category === 'business' ? '业务方向' : category === 'technical' ? '技术方向' : '方向'

  return (
    <FieldGroup className="gap-3">
      <div className="grid min-w-0 items-end gap-3 @min-[24rem]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Field id="request-title" label="需求标题" required>
          <Input id="request-title" required placeholder="例如 订单详情增加异常原因" value={draft.title}
            onChange={event => onChange({ title: event.target.value })} />
        </Field>
        <Field id="request-category" label="需求类型">
          <OptionSelect id="request-category" className="w-full" value={category}
            options={draft.id ? REQUIREMENT_CATEGORIES : REQUIREMENT_CATEGORIES.slice(0, 2)}
            onChange={value => onChange({ category: value === 'uncategorized' ? '' : value })} />
        </Field>
      </div>
      {children}
      <div className="grid grid-cols-1 gap-3 @min-[17rem]:grid-cols-2 @min-[27rem]:grid-cols-3">
        <Field id="request-version" label="所属版本">
          <OptionSelect id="request-version" className="w-full" value={String(draft.versionId)}
            options={versions.map(version => ({ value: String(version.id), label: version.name }))}
            onChange={value => onChange({ versionId: Number(value) })} />
        </Field>
        <Field id="request-state" label="需求状态">
          <StateSelect id="request-state" value={draft.state} onChange={state => onChange({ state })} />
        </Field>
        <Field id="request-direction" label={directionLabel}>
          <Input id="request-direction" list="direction-options" value={draft.direction} placeholder={category === 'technical' ? '例如 工程效率' : '例如 订单管理'}
            onChange={event => onChange({ direction: event.target.value })} />
          <datalist id="direction-options">{directions.map(direction => <option value={direction} key={direction} />)}</datalist>
        </Field>
      </div>
    </FieldGroup>
  )
}
