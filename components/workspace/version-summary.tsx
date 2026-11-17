import { AlertTriangle } from 'lucide-react'
import { Progress } from '../ui/progress'
import { Toggle } from '../ui/toggle'

interface VersionSummaryProps {
  total: number
  done: number
  issues: number
  showIssues: boolean
  onIssues: (value: boolean) => void
}

export function VersionSummary({ total, done, issues, showIssues, onIssues }: VersionSummaryProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
      <span className="whitespace-nowrap">
        <span className="font-medium tabular-nums text-foreground">{total}</span> 条需求
      </span>
      {total > 0 && (
        <>
          <span aria-hidden="true">·</span>
          <span className="whitespace-nowrap">
            已完成 <span className="font-medium tabular-nums text-foreground">{done}</span>
          </span>
          <Progress aria-label="版本完成进度" className="w-16" value={done * 100 / total} />
        </>
      )}
      {(issues > 0 || showIssues) && (
        <Toggle size="sm" pressed={showIssues} onPressedChange={onIssues} title="仅看 Git 异常"
          className="text-destructive hover:text-destructive data-[state=on]:bg-destructive/10 data-[state=on]:text-destructive">
          <AlertTriangle aria-hidden="true" className="size-3.5" />{issues} 个异常项目
        </Toggle>
      )}
    </div>
  )
}
