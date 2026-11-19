import { FolderGit2, FolderOpen, GitBranch, RefreshCw, X } from 'lucide-react'
import type { Ref } from 'react'
import { cn } from '../../lib/utils'
import { ProjectIconAction } from './project-icon-action'

export function GitPanelFooter({ heading, name, path, status, loading, busy, onProject, onRefresh, onDirectory, onClose }: {
  heading: Ref<HTMLHeadingElement>
  name: string
  path: string
  status: string
  loading: boolean
  busy: boolean
  onProject?: () => void
  onRefresh: () => void
  onDirectory: () => void
  onClose: () => void
}) {
  return (
    <footer className="flex min-h-9 shrink-0 items-center justify-between gap-2 border-t bg-surface px-2 py-0.5">
      <div className="flex min-w-0 items-center gap-2 text-xs">
        <h2 id="git-panel-title" ref={heading} tabIndex={-1} className="flex min-w-0 items-center gap-1.5 font-medium outline-none"
          title={path} aria-label={`Git 面板，${name}`}>
          <GitBranch aria-hidden="true" className="size-3 shrink-0 text-muted-foreground" />
          <span className="truncate">Git · {name}</span>
        </h2>
        <span role="status" className="min-w-0 truncate text-muted-foreground" title={status || undefined}>{status}</span>
      </div>
      <div role="group" aria-label="Git 面板操作" className="flex shrink-0 items-center gap-0.5">
        {onProject && (
          <ProjectIconAction id="git-view-project" label="查看项目" size="icon-xs" onClick={onProject}>
            <FolderGit2 aria-hidden="true" />
          </ProjectIconAction>
        )}
        <ProjectIconAction label="刷新 Git" size="icon-xs" onClick={onRefresh} disabled={loading || busy}>
          <RefreshCw aria-hidden="true" className={cn(loading && 'motion-safe:animate-spin')} />
        </ProjectIconAction>
        <ProjectIconAction label="在 Finder 中打开" size="icon-xs" onClick={onDirectory}>
          <FolderOpen aria-hidden="true" />
        </ProjectIconAction>
        <div className="ms-1 border-s ps-1">
          <ProjectIconAction label="关闭 Git 面板" size="icon-xs" onClick={onClose}>
            <X aria-hidden="true" />
          </ProjectIconAction>
        </div>
      </div>
    </footer>
  )
}
