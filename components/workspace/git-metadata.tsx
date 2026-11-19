import { ArrowDown, ArrowUp, ChevronRight, GitBranch, GitMerge } from 'lucide-react'
import type { GitSnapshot } from '../../lib/mygo'
import type { GitRequest, GitStatus } from '../../lib/types'
import { Button } from '../ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'

export function GitMetadata({ request, snapshot, status, mergeMaster, operationsDisabled }: {
  request: GitRequest, snapshot: GitSnapshot, status: GitStatus, mergeMaster?: () => void, operationsDisabled: boolean,
}) {
  const { delivery } = request
  const branch = status.branch || (status.head ? '分离 HEAD' : '未产生提交')
  const changes = [
    { label: '冲突', count: status.conflicted },
    { label: '暂存', count: status.staged },
    { label: '未暂存', count: status.unstaged },
    { label: '未跟踪', count: status.untracked },
  ].filter(item => item.count > 0)
  const rows = [
    ['当前分支', branch],
    ...(delivery ? [['预期开发分支', delivery.branch || '待绑定'], ['目标合入分支', delivery.baseBranch || '未配置']] : []),
    ['本地跟踪上游', status.upstream || '未配置'],
    ...(delivery?.pushTarget ? [['预期推送目标', delivery.pushTarget]] : []),
    ['默认推送目标', status.pushTarget || '未解析'],
    ['远程仓库', snapshot.remote || '未配置'],
  ]

  return (
    <Collapsible className="shrink-0 border-b px-2 py-1">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-2">
        <Tooltip delayDuration={300}>
          <CollapsibleTrigger asChild>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="xs" className="group max-w-full min-w-0 justify-start">
                <GitBranch aria-hidden="true" className="text-muted-foreground" />
                <span className="shrink-0 text-muted-foreground">本地检出</span>
                <span className="min-w-0 truncate font-mono">{branch}</span>
                <ChevronRight aria-hidden="true" className="size-3 text-muted-foreground group-aria-expanded:rotate-90 motion-safe:transition-transform" />
              </Button>
            </TooltipTrigger>
          </CollapsibleTrigger>
          <TooltipContent className="max-w-80 wrap-anywhere font-mono" sideOffset={4}>{branch}</TooltipContent>
        </Tooltip>
        <div role="group" aria-label="工作区状态与操作" className="flex min-h-7 flex-wrap items-center gap-x-2 gap-y-1 px-1.5 text-xs text-muted-foreground">
          {changes.length === 0 && <span>工作区干净</span>}
          {changes.map(({ label, count }) => (
            <span key={label} className={label === '冲突' ? 'text-destructive' : undefined}>
              {label} <span className="font-medium tabular-nums">{count}</span>
            </span>
          ))}
          {status.trackingKnown && (
            <span className="inline-flex items-center gap-0.5 tabular-nums" title={`相对 ${status.upstream}`}>
              <ArrowUp aria-hidden="true" className="size-3" /><span className="sr-only">领先 </span>{status.ahead}
              <ArrowDown aria-hidden="true" className="ms-1 size-3" /><span className="sr-only">落后 </span>{status.behind}
            </span>
          )}
          {mergeMaster && (
            <Button type="button" size="xs" variant="ghost" className="text-xs" disabled={operationsDisabled}
              onClick={mergeMaster} aria-label="合并 master 到当前分支">
              <GitMerge aria-hidden="true" />合并 master
            </Button>
          )}
        </div>
      </div>
      <CollapsibleContent>
        <dl className="grid max-h-[min(6rem,14vh)] grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-1 overflow-auto px-1.5 py-1 text-xs scrollbar-none"
          tabIndex={0} aria-label="Git 工作区详情">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-mono wrap-anywhere select-text">{value}</dd>
            </div>
          ))}
        </dl>
      </CollapsibleContent>
    </Collapsible>
  )
}
