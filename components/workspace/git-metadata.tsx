import { ArrowDown, ArrowUp, ChevronRight, GitBranch } from 'lucide-react'
import type { GitSnapshot } from '../../lib/mygo'
import type { GitRequest } from '../../lib/types'
import { Button } from '../ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'

export function GitMetadata({ request, snapshot }: { request: GitRequest, snapshot: GitSnapshot }) {
  const { delivery } = request
  const branch = snapshot.branch || (snapshot.head ? '分离 HEAD' : '未产生提交')
  const changes = [
    { label: '冲突', count: snapshot.conflicted },
    { label: '暂存', count: snapshot.staged },
    { label: '未暂存', count: snapshot.unstaged },
    { label: '未跟踪', count: snapshot.untracked },
  ].filter(item => item.count > 0)
  const rows = [
    ['当前分支', branch],
    ...(delivery ? [['预期开发分支', delivery.branch || '待绑定'], ['目标合入分支', delivery.baseBranch || '未配置']] : []),
    ['本地跟踪上游', snapshot.upstream || '未配置'],
    ...(delivery?.pushTarget ? [['预期推送目标', delivery.pushTarget]] : []),
    ['默认推送目标', snapshot.pushTarget || '未解析'],
    ['远程仓库', snapshot.remote || '未配置'],
  ]

  return (
    <Collapsible className="border-b pb-1.5">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <Tooltip delayDuration={300}>
          <CollapsibleTrigger asChild>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="xs" className="group max-w-full min-w-0 justify-start px-1.5">
                <GitBranch aria-hidden="true" className="text-muted-foreground" />
                <span className="shrink-0 text-muted-foreground">本地检出</span>
                <span className="min-w-0 truncate font-mono">{branch}</span>
                <ChevronRight aria-hidden="true" className="size-3 text-muted-foreground group-aria-expanded:rotate-90 motion-safe:transition-transform" />
              </Button>
            </TooltipTrigger>
          </CollapsibleTrigger>
          <TooltipContent className="max-w-80 wrap-anywhere font-mono data-[state=closed]:animate-none! motion-reduce:animate-none!" sideOffset={4}>{branch}</TooltipContent>
        </Tooltip>
        <div aria-label="工作区改动" className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1.5 text-xs text-muted-foreground">
          {changes.length === 0 && <span>工作区干净</span>}
          {changes.map(({ label, count }) => (
            <span key={label} className={label === '冲突' ? 'text-destructive' : undefined}>
              {label} <span className="font-medium tabular-nums">{count}</span>
            </span>
          ))}
          {snapshot.trackingKnown && (
            <span className="inline-flex items-center gap-0.5 tabular-nums" title={`相对 ${snapshot.upstream}`}>
              <ArrowUp aria-hidden="true" className="size-3" /><span className="sr-only">领先 </span>{snapshot.ahead}
              <ArrowDown aria-hidden="true" className="ms-1 size-3" /><span className="sr-only">落后 </span>{snapshot.behind}
            </span>
          )}
        </div>
      </div>
      <CollapsibleContent>
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-1 py-1 text-xs">
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
