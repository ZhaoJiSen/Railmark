import { Autocomplete } from '@heroui/react/autocomplete'
import { Chip } from '@heroui/react/chip'
import { Header } from '@heroui/react/header'
import { Label } from '@heroui/react/label'
import { ListBox } from '@heroui/react/list-box'
import { useFilter } from '@heroui/react/rac'
import { Check } from 'lucide-react'
import type { GitBranch as Branch } from '../../lib/mygo'
import { PickerSearchField } from '../ui/picker-search-field'

export function BranchChooser({ branches, selectedRef, currentBranch, onSelect, disabled, label, autoFocus }: {
  branches: Branch[]
  selectedRef: string
  currentBranch?: string
  onSelect: (branch: Branch) => void
  disabled?: boolean
  label: string
  autoFocus?: boolean
}) {
  const { contains } = useFilter({ sensitivity: 'base' })
  const groups = [
    { label: '本地分支', branches: branches.filter(branch => !branch.remote) },
    { label: '远程跟踪分支', branches: branches.filter(branch => branch.remote) },
  ]
  return (
    <div className="grid min-w-0 grid-cols-1 gap-3">
      <Autocomplete.Filter filter={contains}>
        <PickerSearchField label={label} placeholder="搜索分支名称" disabled={disabled} autoFocus={autoFocus} />
        <ListBox aria-label="可选分支" selectionMode="single" disallowEmptySelection selectedKeys={selectedRef ? [selectedRef] : []}
          onSelectionChange={keys => {
            if (keys === 'all') return
            const branch = branches.find(item => keys.has(item.ref))
            if (branch) onSelect(branch)
          }}
          className="max-h-60 overflow-y-auto scrollbar"
          renderEmptyState={() => branches.length ? '没有匹配的分支' : '此仓库暂无可用分支'}>
          {groups.filter(group => group.branches.length).map(group => (
            <ListBox.Section key={group.label}>
              <Header>{group.label}</Header>
              {group.branches.map(branch => (
                <ListBox.Item key={branch.ref} id={branch.ref} textValue={`${branch.name} ${branch.ref}`}
                  isDisabled={disabled}>
                  <Label className="min-w-0 flex-1 font-mono wrap-anywhere">{branch.name}</Label>
                  {!branch.remote && branch.name === currentBranch && <Chip size="sm" variant="soft">当前检出</Chip>}
                  <ListBox.ItemIndicator>
                    {({ isSelected }) => isSelected ? <Check aria-hidden="true" className="size-3.5" /> : null}
                  </ListBox.ItemIndicator>
                </ListBox.Item>
              ))}
            </ListBox.Section>
          ))}
        </ListBox>
      </Autocomplete.Filter>
    </div>
  )
}
