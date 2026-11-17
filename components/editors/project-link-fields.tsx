import { ChevronDown, FolderGit2, X } from 'lucide-react'
import { useId } from 'react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { Field, StateSelect } from '../ui/form-parts'
import { Input } from '../ui/input'
import { Item } from '../ui/item'
import { BranchNameField } from './branch-name-field'
import { DevelopmentBranchFields } from './development-branch-fields'
import type { LinkDraft } from './link-draft'

export function ProjectLinkFields({ link, onChange, onRemove, invalid }: {
  link: LinkDraft
  onChange: (link: LinkDraft) => void
  onRemove: () => void
  invalid: boolean
}) {
  const id = useId()

  return (
    <Item variant="outline" size="sm" className="block w-full min-w-0 px-2.5 py-2" asChild>
      <Collapsible>
        <div className="flex flex-wrap items-start gap-2">
          <FolderGit2 className="mt-1 size-3.5 shrink-0 text-muted-foreground" />
          <div className="min-w-24 flex-1">
            <p className="font-medium [overflow-wrap:anywhere]">{link.projectName || '本地项目'}</p>
            <p className={`text-xs [overflow-wrap:anywhere] ${invalid ? 'text-destructive' : 'text-muted-foreground'}`}>{link.path}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" size="xs" className="group"
                aria-label={`${link.projectName} 的进度与分支`}>
                <ChevronDown className="motion-safe:transition-transform group-data-[state=closed]:-rotate-90" />进度与分支
              </Button>
            </CollapsibleTrigger>
            <Button variant="ghost" type="button" size="icon-sm" title="移除关联"
              aria-label={`移除项目 ${link.projectName}`} onClick={onRemove}><X /></Button>
          </div>
        </div>
        <CollapsibleContent className="space-y-3 pt-3">
          {!link.projectId && (
            <Field id={`${id}-name`} label="项目显示名">
              <Input id={`${id}-name`} value={link.projectName}
                onChange={event => onChange({ ...link, projectName: event.target.value })} />
            </Field>
          )}
          <div className="grid grid-cols-1 gap-3 @min-[24rem]:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <Field id={`${id}-state`} label="交付进度">
              <StateSelect id={`${id}-state`} value={link.state} onChange={state => onChange({ ...link, state })} />
            </Field>
            <DevelopmentBranchFields id={`${id}-branch`} link={link} onChange={onChange} />
          </div>
          {link.currentBranch && (
            <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
              <span>当前分支 <code className="font-mono text-xs [overflow-wrap:anywhere]">{link.currentBranch}</code></span>
              <Button type="button" variant="ghost" size="xs" onClick={() => onChange({ ...link, branch: link.currentBranch })}>填入预期分支</Button>
            </div>
          )}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="group">
                <ChevronDown className="size-3 motion-safe:transition-transform group-data-[state=closed]:-rotate-90" />合入和推送目标
                {(link.baseBranch || link.pushTarget) && <Badge variant="secondary">已设置</Badge>}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2.5">
              <BranchNameField id={`${id}-base`} label="目标合入分支" placeholder="例如 origin/release-5.27.0"
                value={link.baseBranch} onChange={baseBranch => onChange({ ...link, baseBranch })} />
              <BranchNameField id={`${id}-push`} label="预期推送目标" placeholder="例如 origin/feature-5.27.0/order-detail"
                value={link.pushTarget} onChange={pushTarget => onChange({ ...link, pushTarget })} />
            </CollapsibleContent>
          </Collapsible>
        </CollapsibleContent>
      </Collapsible>
    </Item>
  )
}
