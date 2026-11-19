import { CircleCheck, GitBranch, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { localBranchName } from '../../lib/workspace-data'
import { Button } from '../ui/button'
import { FieldDescription } from '../ui/field'
import { BranchDialog } from './branch-dialog'
import { BranchNameField } from './branch-name-field'
import type { LinkDraft } from './link-draft'

export function DevelopmentBranchFields({ id, label = '预期开发分支（选填）', link, onChange }: {
  id: string
  label?: string
  link: LinkDraft
  onChange: (link: LinkDraft) => void
}) {
  const [mode, setMode] = useState<'select' | 'create'>()
  const [createdBranch, setCreatedBranch] = useState('')
  const trigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (mode || !trigger.current) return
    const button = trigger.current
    trigger.current = null
    button.focus({ preventScroll: true })
  }, [mode])

  return (
    <div className="min-w-0 space-y-1.5">
      <BranchNameField id={id} label={label} value={link.branch}
        onChange={branch => onChange({ ...link, branch })} placeholder="待绑定" />
      <div className="flex flex-wrap gap-1">
        <Button type="button" size="xs" variant="outline" onClick={event => {
          trigger.current = event.currentTarget
          setMode('select')
        }}><GitBranch />选择已有</Button>
        <Button type="button" size="xs" variant="outline" onClick={event => {
          trigger.current = event.currentTarget
          setMode('create')
        }}><Plus />新建分支</Button>
      </div>
      <div role="status">
        {createdBranch && (
          <FieldDescription className="flex items-start gap-1.5 text-xs wrap-anywhere">
            <CircleCheck aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
            {localBranchName(link.branch) === createdBranch
              ? <span>本地分支已创建，保存后会关联到需求。</span>
              : <span>本地分支 <code className="font-mono text-foreground">{createdBranch}</code> 已创建。</span>}
          </FieldDescription>
        )}
      </div>
      {mode && (
        <BranchDialog link={link} mode={mode} onClose={() => setMode(undefined)}
          onSelect={branch => {
            if (mode === 'create') setCreatedBranch(branch)
            onChange({ ...link, branch })
          }} />
      )}
    </div>
  )
}
