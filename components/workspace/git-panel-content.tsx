'use client'

import { AlertTriangle, FolderOpen, GitBranch, RefreshCw, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import type { Layout } from 'react-resizable-panels'
import { Desk } from '../../lib/mygo'
import type { GitHistory, GitSnapshot } from '../../lib/mygo'
import type { GitRequest } from '../../lib/types'
import { cn, readableError } from '../../lib/utils'
import { deliveryIssues, displayDate } from '../../lib/workspace-data'
import { Alert, AlertDescription } from '../ui/alert'
import { Button } from '../ui/button'
import { ErrorLine } from '../ui/form-parts'
import { ResizablePanel, ResizablePanelGroup } from '../ui/resizable'
import { GitBranches } from './git-branches'
import { GitColumnHandle } from './git-column-handle'
import type { GitCommitGroup } from './git-commits'
import { GitHistoryPane } from './git-history-pane'
import { GitMetadata } from './git-metadata'
import { GitScrollArea } from './git-scroll-area'

export function GitPanelContent({ request, onClose, onProject }: {
  request: GitRequest
  onClose: () => void
  onProject: (id: number) => void
}) {
  const { directoryId, delivery } = request
  const base = delivery?.baseBranch ?? ''
  const [refresh, setRefresh] = useState(0)
  const [data, setData] = useState<{ refresh: number, snapshot?: GitSnapshot, error?: string }>()
  const [chosenRef, selectBranch] = useState<string>()
  const [branchData, setBranchData] = useState<{ ref: string, history?: GitHistory, error?: string }>()
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const [historyLayout, setHistoryLayout] = useState<Layout>()
  const [filesLayout, setFilesLayout] = useState<Layout>()
  const heading = useRef<HTMLHeadingElement>(null)
  const priorFocus = useRef<HTMLElement | null>(null)
  const snapshot = data?.snapshot
  const checking = data?.refresh !== refresh
  const bound = delivery?.branch?.replace(/^refs\/heads\//, '')
  const boundRef = bound && snapshot?.branches.find(item => !item.remote && item.name === bound)?.ref
  const currentRef = snapshot?.branch ? `refs/heads/${snapshot.branch}` : ''
  const selectedRef = chosenRef ?? boundRef ?? ''
  const branch = snapshot?.branches.find(item => item.ref === selectedRef && item.ref !== currentRef)
  const branchLabel = branch?.name || snapshot?.branch || (snapshot?.head ? '分离 HEAD' : '未产生提交')
  const history = branchData?.ref === branch?.ref ? branchData : undefined
  const issues = delivery ? deliveryIssues(delivery, snapshot) : snapshot?.issue ? [snapshot.issue] : []
  if (bound && snapshot && !snapshot.issue && !snapshot.branchesIssue && !boundRef && bound !== snapshot.branch) {
    issues.push(`本地找不到需求绑定分支 ${bound}`)
  }
  const groups: GitCommitGroup[] = []
  if (branch) {
    groups.push({
      title: branch.ref === boundRef ? `需求绑定分支 · ${branch.name}` : `正在查看 · ${branch.name}`,
      head: history?.history?.head, commits: history?.history?.commits, more: history?.history?.more, error: history?.error,
    })
  } else if (snapshot) {
    groups.push({
      title: `当前检出 · ${branchLabel}`, head: snapshot.head,
      commits: snapshot.commits, more: snapshot.moreCommits, error: snapshot.historyIssue,
    })
    if (base) {
      groups.push({
        title: `相对 ${base} 的提交`, head: snapshot.head, exclude: snapshot.releaseBase,
        commits: snapshot.releaseCommits, more: snapshot.moreRelease,
        empty: snapshot.baseIssue || '当前分支没有额外提交',
      })
    }
  }

  useEffect(() => {
    const active = document.activeElement
    if (active !== heading.current) {
      priorFocus.current = active instanceof HTMLElement && active !== document.body
        ? active : document.querySelector<HTMLElement>('[aria-controls="git-panel"]')
    }
    heading.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    let ignore = false
    Desk.inspectGit(directoryId, base).then(snapshot => {
      if (!ignore) setData({ refresh, snapshot })
    }).catch(error => {
      if (!ignore) setData(current => ({ refresh, snapshot: current?.snapshot, error: readableError(error) }))
    })
    return () => { ignore = true }
  }, [directoryId, base, refresh])

  const ref = branch?.ref
  useEffect(() => {
    if (!ref) return
    let ignore = false
    Desk.gitHistory(directoryId, ref).then(history => {
      if (!ignore) setBranchData({ ref, history })
    }).catch(error => {
      if (!ignore) setBranchData(current => ({
        ref, history: current?.ref === ref ? current.history : undefined, error: readableError(error),
      }))
    })
    return () => { ignore = true }
  }, [directoryId, ref, refresh])

  function close(): void {
    onClose()
    if (priorFocus.current?.isConnected) priorFocus.current.focus({ preventScroll: true })
  }

  function openDirectory(): void {
    setActionError('')
    setNotice('')
    void Desk.openDirectory(directoryId).catch(error => setActionError(readableError(error)))
  }

  function refreshGit(): void {
    setActionError('')
    setNotice('')
    setRefresh(value => value + 1)
  }

  function copyBranch(value: string): void {
    setActionError('')
    setNotice('')
    void Desk.copyText(value).then(() => setNotice(`已复制 ${value}`))
      .catch(error => setActionError(readableError(error)))
  }

  function showBranch(ref: string): void {
    if (ref === selectedRef || (!ref && selectedRef === currentRef)) return
    setNotice('')
    selectBranch(ref)
  }

  return (
    <div className="flex h-full min-h-0 flex-col border-t bg-background"
      onKeyDown={event => {
        if (event.key !== 'Escape' || event.defaultPrevented || event.nativeEvent.isComposing) return
        if (event.target instanceof Element && event.target.closest('[role="menu"], [role="listbox"], [data-slot="popover-content"]')) return
        event.stopPropagation()
        close()
      }}>
      {(actionError || data?.error) && <div className="px-3 pt-2"><ErrorLine message={actionError || data?.error || ''} /></div>}
      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)] overflow-hidden">
        {snapshot && !snapshot.issue ? (
          <ResizablePanelGroup orientation="horizontal" className="min-h-0 touch-auto!">
            <ResizablePanel id="git-branches" defaultSize="18%" minSize="7rem" maxSize="38%"
              style={{ overflow: 'hidden' }}>
              <GitBranches snapshot={snapshot} selectedRef={branch?.ref ?? ''} boundRef={boundRef || undefined} onSelect={showBranch} onCopy={copyBranch} />
            </ResizablePanel>
            <GitColumnHandle label="调整分支与提交列表宽度" />
            <ResizablePanel id="git-history" className="touch-auto!" style={{ overflow: 'hidden' }}>
              <GitHistoryPane key={branch?.ref ?? 'head'} directoryId={directoryId} groups={groups} branchLabel={branchLabel}
                historyLayout={historyLayout} onHistoryLayoutChange={setHistoryLayout}
                filesLayout={filesLayout} onFilesLayoutChange={setFilesLayout}>
                <div className="space-y-2 px-2.5 pt-1.5">
                  {issues.length > 0 && <GitIssues issues={issues}>
                    {boundRef && boundRef !== (selectedRef || currentRef) && (
                      <Button type="button" size="xs" variant="outline" className="mt-1.5"
                        onClick={() => {
                          heading.current?.focus({ preventScroll: true })
                          showBranch(boundRef)
                        }}>查看需求绑定分支</Button>
                    )}
                  </GitIssues>}
                  <GitMetadata request={request} snapshot={snapshot} />
                </div>
              </GitHistoryPane>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <GitScrollArea>
            <div className="space-y-2 p-3">
              {checking && <p role="status" className="text-muted-foreground">正在读取本地 Git 状态…</p>}
              {issues.length > 0 && <GitIssues issues={issues} />}
            </div>
          </GitScrollArea>
        )}
      </div>
      <footer className="flex min-h-8 shrink-0 items-center justify-between gap-2 border-t px-2">
        <div className="flex min-w-0 items-center gap-2 text-xs">
          <h2 id="git-panel-title" ref={heading} tabIndex={-1} className="flex min-w-0 items-center gap-1 font-medium outline-none"
            title={request.path} aria-label={`Git 面板，${request.name}`}>
            <GitBranch aria-hidden="true" className="size-3 shrink-0 text-muted-foreground" />
            <span className="truncate">Git · {request.name}</span>
          </h2>
          <span role="status" className="truncate text-muted-foreground" title={notice || undefined}>
            {notice || (checking ? '读取中…' : snapshot ? displayDate(snapshot.checkedAt, 'time') : '')}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {delivery && (
            <Button type="button" variant="ghost" size="xs" title={request.path}
              onClick={() => onProject(delivery.projectId)}>查看项目</Button>
          )}
          <Button type="button" variant="ghost" size="icon-xs" onClick={refreshGit} disabled={checking}
            aria-label="刷新 Git" title="刷新 Git"><RefreshCw className={cn(checking && 'motion-safe:animate-spin')} /></Button>
          <Button type="button" variant="ghost" size="icon-xs" onClick={openDirectory}
            aria-label="在 Finder 中打开" title={`在 Finder 中打开 ${request.path}`}><FolderOpen /></Button>
          <Button type="button" variant="outline" size="xs" className="ms-1" onClick={close}
            aria-label="关闭 Git 面板"><X />关闭</Button>
        </div>
      </footer>
    </div>
  )
}

function GitIssues({ issues, children }: { issues: string[], children?: ReactNode }) {
  return (
    <Alert variant="destructive">
      <AlertTriangle />
      <AlertDescription>
        <ul className="space-y-1">{issues.map(issue => <li className="wrap-anywhere" key={issue}>{issue}</li>)}</ul>
        {children}
      </AlertDescription>
    </Alert>
  )
}
