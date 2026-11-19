import { FieldError } from '@heroui/react/field-error'
import { Input } from '@heroui/react/input'
import { Label } from '@heroui/react/label'
import { TextArea } from '@heroui/react/textarea'
import { TextField } from '@heroui/react/textfield'
import { ChevronDown } from 'lucide-react'
import type { SaveRequirementInput } from '../../lib/mygo'
import { Button } from '../ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { FieldGroup } from '../ui/field'

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
        <Button type="button" variant="ghost" size="sm" className="group -ms-2.5">
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
    <TextField id="request-background" variant="secondary" fullWidth value={value} onChange={onChange}>
      <Label>{compact ? '需求背景（选填）' : '需求背景'}</Label>
      <TextArea rows={compact ? 2 : undefined} placeholder={compact ? '这条需求要解决什么问题？' : undefined} />
    </TextField>
  )
}

export function RequirementImplementationField({ value, onChange }: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <TextField id="request-implementation" variant="secondary" fullWidth value={value} onChange={onChange}>
      <Label>实现逻辑（选填）</Label>
      <TextArea placeholder="简述主要处理流程、关键判断或涉及的模块" />
    </TextField>
  )
}

export function RequirementContentFields({ draft, onChange }: DetailsFieldsProps<ExtraDetails & Pick<SaveRequirementInput, 'background' | 'implementation'>>) {
  return (
    <FieldGroup>
      <RequirementBackgroundField value={draft.background} onChange={background => onChange({ background })} />
      <RequirementImplementationField value={draft.implementation} onChange={implementation => onChange({ implementation })} />
      <ExtraFields draft={draft} onChange={onChange} />
    </FieldGroup>
  )
}

function ExtraFields({ draft, onChange }: DetailsFieldsProps<ExtraDetails>) {
  return (
    <FieldGroup>
      <div className="grid gap-4 @min-[24rem]:grid-cols-2">
        <TextField id="request-scope" variant="secondary" fullWidth value={draft.scope} onChange={scope => onChange({ scope })}>
          <Label>交付范围</Label>
          <TextArea />
        </TextField>
        <TextField id="request-acceptance" variant="secondary" fullWidth value={draft.acceptance} onChange={acceptance => onChange({ acceptance })}>
          <Label>验收条件</Label>
          <TextArea />
        </TextField>
      </div>
      <TextField id="request-source" type="url" variant="secondary" fullWidth value={draft.sourceUrl} onChange={sourceUrl => onChange({ sourceUrl })}>
        <Label>原始需求链接</Label>
        <Input placeholder="https://" />
        <FieldError>请输入有效的链接。</FieldError>
      </TextField>
    </FieldGroup>
  )
}
