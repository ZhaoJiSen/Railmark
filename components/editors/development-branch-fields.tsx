import { GitBranch, Plus } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '../ui/button'
import { BranchDialog } from './branch-dialog'
import { BranchNameField } from './branch-name-field'
import type { LinkDraft } from './link-draft'

export function DevelopmentBranchFields({ id, link, onChange }: {
  id: string
  link: LinkDraft
  onChange: (link: LinkDraft) => void
}) {
  const [mode, setMode] = useState<'select' | 'create'>()
  const trigger = useRef<HTMLButtonElement>(null)

  return (
    <div className="min-w-0 space-y-1.5">
      <BranchNameField id={id} label="预期开发分支（选填）" value={link.branch}
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
      {mode && (
        <BranchDialog link={link} mode={mode} returnFocus={trigger.current} onClose={() => setMode(undefined)}
          onSelect={branch => onChange({ ...link, branch })} />
      )}
    </div>
  )
}
