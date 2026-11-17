import { Check, GitBranch, GitFork } from 'lucide-react'
import type { GitBranch as Branch } from '../../lib/mygo'
import { Badge } from '../ui/badge'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command'

export function BranchChooser({ branches, selectedRef, currentBranch, onSelect, disabled, label, autoFocus }: {
  branches: Branch[]
  selectedRef: string
  currentBranch?: string
  onSelect: (branch: Branch) => void
  disabled?: boolean
  label: string
  autoFocus?: boolean
}) {
  const groups = [
    { label: '本地分支', branches: branches.filter(branch => !branch.remote) },
    { label: '远程跟踪分支', branches: branches.filter(branch => branch.remote) },
  ]
  return (
    <Command label={label} defaultValue={selectedRef || undefined} className="h-auto min-w-0 border">
      <CommandInput aria-label={label} placeholder="搜索分支名称" disabled={disabled} autoFocus={autoFocus} />
      <CommandList className="max-h-48">
        <CommandEmpty>{branches.length ? '没有匹配的分支' : '此仓库暂无可用分支'}</CommandEmpty>
        {groups.filter(group => group.branches.length).map(group => (
          <CommandGroup key={group.label} heading={group.label}>
            {group.branches.map(branch => (
              <CommandItem key={branch.ref} value={branch.ref} keywords={[branch.name]}
                disabled={disabled} onSelect={() => onSelect(branch)} className="items-start">
                {branch.remote ? <GitFork aria-hidden="true" /> : <GitBranch aria-hidden="true" />}
                <span className="min-w-0 flex-1 font-mono text-xs wrap-anywhere">{branch.name}</span>
                {!branch.remote && branch.name === currentBranch && <Badge variant="outline">当前检出</Badge>}
                {selectedRef === branch.ref && <Check aria-label="已选择" />}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  )
}
