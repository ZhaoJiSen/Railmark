import { RefreshCw, Search, X } from 'lucide-react'
import { useRef } from 'react'
import { STATES } from '../../lib/constants'
import type { Project } from '../../lib/mygo'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group'
import { OptionSelect } from '../ui/option-select'

interface VersionFiltersProps {
  query: string
  projectId: number
  state: string
  projects: Project[]
  checking: boolean
  showIssues: boolean
  onClearIssues: () => void
  onQuery: (value: string) => void
  onProject: (value: number) => void
  onState: (value: string) => void
  onRefresh: () => void
}

export function VersionFilters({
  query, projectId, state, projects, checking, showIssues, onClearIssues, onQuery, onProject, onState, onRefresh,
}: VersionFiltersProps) {
  const search = useRef<HTMLInputElement>(null)

  return (
    <div className="flex min-w-0 flex-1 basis-full flex-wrap items-center gap-2 sm:basis-125 sm:justify-end">
      <InputGroup className="min-w-36 flex-1 basis-full sm:max-w-66 sm:basis-0">
        <InputGroupInput ref={search} aria-label="搜索当前版本需求" placeholder="搜索需求、项目或分支"
          value={query} onChange={event => onQuery(event.target.value)} />
        <InputGroupAddon><Search aria-hidden="true" /></InputGroupAddon>
      </InputGroup>
      <OptionSelect label="按项目筛选" className="max-w-36" value={String(projectId)}
        onChange={value => onProject(Number(value))}
        options={[{ value: '0', label: '全部项目' }, ...projects.map(project => ({
          value: String(project.id), label: project.name,
        }))]} />
      <OptionSelect label="按状态筛选" value={state} onChange={onState}
        options={[{ value: 'all', label: '全部状态' }, ...STATES.map(item => ({
          value: item.id, label: item.label,
        }))]} />
      {showIssues && (
        <Button type="button" variant="secondary" aria-label="清除 Git 异常筛选" onClick={() => {
          onClearIssues()
          search.current?.focus({ preventScroll: true })
        }}>
          仅看 Git 异常<X />
        </Button>
      )}
      <Button type="button" variant="outline" onClick={onRefresh} disabled={checking}>
        <RefreshCw className={cn(checking && 'motion-safe:animate-spin')} />{checking ? '核对中' : '核对 Git'}
      </Button>
    </div>
  )
}
