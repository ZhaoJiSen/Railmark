import { Check, RefreshCw, Search, X } from 'lucide-react'
import { useRef } from 'react'
import { REQUIREMENT_CATEGORIES, STATES } from '../../lib/constants'
import type { Project } from '../../lib/mygo'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group'
import { OptionSelect } from '../ui/option-select'

interface VersionFiltersProps {
  query: string
  projectId: number
  state: string
  category: string
  projects: Project[]
  checking: boolean
  recentlyChecked: boolean
  showIssues: boolean
  onClearIssues: () => void
  onQuery: (value: string) => void
  onProject: (value: number) => void
  onState: (value: string) => void
  onCategory: (value: string) => void
  onRefresh: () => void
}

export function VersionFilters({
  query, projectId, state, category, projects, checking, recentlyChecked, showIssues,
  onClearIssues, onQuery, onProject, onState, onCategory, onRefresh,
}: VersionFiltersProps) {
  const search = useRef<HTMLInputElement>(null)

  return (
    <div className="flex min-w-0 flex-1 basis-full flex-wrap items-center gap-2 sm:basis-125 sm:justify-end">
      <InputGroup variant="secondary" className="min-w-36 flex-1 basis-full sm:max-w-66 sm:basis-0">
        <InputGroupInput ref={search} aria-label="搜索当前版本需求" className="min-w-0" placeholder="搜索需求、项目或分支"
          value={query} onChange={event => onQuery(event.target.value)} />
        <InputGroupAddon><Search aria-hidden="true" className="size-4" /></InputGroupAddon>
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
      <OptionSelect label="按类型筛选" value={category} onChange={onCategory}
        options={[{ value: 'all', label: '全部类型' }, ...REQUIREMENT_CATEGORIES]} />
      {showIssues && (
        <Button type="button" variant="secondary" aria-label="清除 Git 异常筛选" onClick={() => {
          onClearIssues()
          search.current?.focus({ preventScroll: true })
        }}>
          仅看 Git 异常<X />
        </Button>
      )}
      <Button type="button" variant="outline" onClick={onRefresh} disabled={checking} aria-busy={checking}>
        {recentlyChecked ? <Check aria-hidden="true" /> : (
          <RefreshCw aria-hidden="true" className={cn(checking && 'motion-safe:animate-spin')} />
        )}
        核对 Git
      </Button>
      <span role="status" className="sr-only">{checking ? '正在核对 Git' : recentlyChecked ? 'Git 核对完成' : ''}</span>
    </div>
  )
}
