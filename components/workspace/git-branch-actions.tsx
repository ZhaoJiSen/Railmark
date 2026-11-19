import { AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'
import type { GitBranch } from '../../lib/mygo'
import { Alert, AlertDescription } from '../ui/alert'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'

export type GitBranchAction = { kind: 'pull' } | { kind: 'checkout' | 'merge', branch: GitBranch }

export const gitActionLabels = {
  checkout: { pending: '正在切换分支…', done: '已切换到' },
  pull: { pending: '正在拉取上游…', done: '已拉取' },
  merge: { pending: '正在合并分支…', done: '已合并' },
}

export function ConfirmGitMerge({ source, target, onClose, onConfirm }: {
  source: GitBranch, target: string, onClose: () => void, onConfirm: () => void,
}) {
  return (
    <Dialog open onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent size="sm" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>合并分支</DialogTitle>
          <DialogDescription className="space-y-1.5">
            <span className="block">来源分支 <code className="font-mono text-foreground wrap-anywhere">{source.name}</code></span>
            <span className="block">当前目标 <code className="font-mono text-foreground wrap-anywhere">{target}</code></span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} autoFocus>取消</Button>
          <Button type="button" onClick={onConfirm}>确认合并</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function GitIssues({ issues, children }: { issues: string[], children?: ReactNode }) {
  return (
    <Alert variant="destructive">
      <AlertTriangle aria-hidden="true" />
      <AlertDescription>
        <ul className="space-y-1">{issues.map(issue => <li className="wrap-anywhere" key={issue}>{issue}</li>)}</ul>
        {children && <div className="mt-2 flex flex-wrap items-center gap-2">{children}</div>}
      </AlertDescription>
    </Alert>
  )
}
