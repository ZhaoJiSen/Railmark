import { ChevronDown } from 'lucide-react'
import type { SaveRequirementInput } from '../../lib/mygo'
import { Button } from '../ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { FieldGroup } from '../ui/field'
import { Field } from '../ui/form-parts'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'

type Details = Pick<SaveRequirementInput, 'background' | 'scope' | 'acceptance' | 'sourceUrl'>

export function RequirementExtraFields({ draft, onChange }: {
  draft: Details
  onChange: (changes: Partial<Details>) => void
}) {
  const hasDetails = Boolean(draft.background || draft.scope || draft.acceptance || draft.sourceUrl)

  return (
    <Collapsible defaultOpen={hasDetails} className="border-t pt-2">
      <CollapsibleTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="group -ms-2.5 gap-2">
          <ChevronDown className="size-3 motion-safe:transition-transform group-data-[state=closed]:-rotate-90" />
          需求详情<span className="font-normal text-muted-foreground">选填</span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <FieldGroup className="gap-3 pt-2">
          <Field id="request-background" label="需求背景">
            <Textarea id="request-background" value={draft.background}
              onChange={event => onChange({ background: event.target.value })} />
          </Field>
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
      </CollapsibleContent>
    </Collapsible>
  )
}
