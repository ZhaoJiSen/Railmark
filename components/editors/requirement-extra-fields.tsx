import { ChevronDown } from 'lucide-react'
import type { SaveRequirementInput } from '../../lib/mygo'
import { Button } from '../ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { FieldGroup } from '../ui/field'
import { Field } from '../ui/form-parts'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'

type ExtraDetails = Pick<SaveRequirementInput, 'scope' | 'acceptance' | 'sourceUrl'>

interface DetailsFieldsProps<Details> {
  draft: Details
  onChange: (changes: Partial<Details>) => void
}

export function RequirementExtraFields({ draft, onChange }: DetailsFieldsProps<ExtraDetails>) {
  const hasDetails = Boolean(draft.scope || draft.acceptance || draft.sourceUrl)

  return (
    <Collapsible defaultOpen={hasDetails} className="border-t pt-2">
      <CollapsibleTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="group -ms-2.5 gap-2">
          <ChevronDown className="size-3 motion-safe:transition-transform group-data-[state=closed]:-rotate-90" />
          更多需求详情<span className="font-normal text-muted-foreground">选填</span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pt-2">
          <ExtraFields draft={draft} onChange={onChange} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function RequirementBackgroundField({ value, onChange, compact = false }: {
  value: string
  onChange: (value: string) => void
  compact?: boolean
}) {
  return (
    <Field id="request-background" label={compact ? '需求背景（选填）' : '需求背景'}>
      <Textarea id="request-background" value={value} rows={compact ? 2 : undefined}
        placeholder={compact ? '这条需求要解决什么问题？' : undefined} onChange={event => onChange(event.target.value)} />
    </Field>
  )
}

export function RequirementContentFields({ draft, onChange }: DetailsFieldsProps<ExtraDetails & { background: string }>) {
  return (
    <FieldGroup className="gap-2.5">
      <RequirementBackgroundField value={draft.background} onChange={background => onChange({ background })} />
      <ExtraFields draft={draft} onChange={onChange} />
    </FieldGroup>
  )
}

function ExtraFields({ draft, onChange }: DetailsFieldsProps<ExtraDetails>) {
  return (
    <FieldGroup className="gap-2.5">
      <div className="grid grid-cols-1 gap-3 @min-[24rem]:grid-cols-2">
        <Field id="request-scope" label="交付范围">
          <Textarea id="request-scope" value={draft.scope} onChange={event => onChange({ scope: event.target.value })} />
        </Field>
        <Field id="request-acceptance" label="验收条件">
          <Textarea id="request-acceptance" value={draft.acceptance}
            onChange={event => onChange({ acceptance: event.target.value })} />
        </Field>
      </div>
      <Field id="request-source" label="原始需求链接">
        <Input id="request-source" type="url" placeholder="https://" value={draft.sourceUrl}
          onChange={event => onChange({ sourceUrl: event.target.value })} />
      </Field>
    </FieldGroup>
  )
}
