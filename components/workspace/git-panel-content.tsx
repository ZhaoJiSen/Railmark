'use client'

import { GitPullRequestArrow } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Layout } from 'react-resizable-panels'
import { beginGitCheck, publishGitChecks, useGitChecks } from '../../lib/git-checks'
import { Desk } from '../../lib/mygo'
import type { GitBranch as Branch, GitHistory, GitSnapshot, Requirement } from '../../lib/mygo'
import type { GitRequest } from '../../lib/types'
import { readableError } from '../../lib/utils'
import { deliveryIssues, displayDate, localBranchName } from '../../lib/workspace-data'
import { Button } from '../ui/button'
import { ErrorLine } from '../ui/form-parts'
import { ResizablePanel, ResizablePanelGroup } from '../ui/resizable'
import { ConfirmGitMerge, GitIssues, gitActionLabels } from './git-branch-actions'
import type { GitBranchAction } from './git-branch-actions'
import { GitBranches } from './git-branches'
import { GitColumnHandle } from './git-column-handle'
import { GitConflictLinks } from './git-conflict-links'
import type { GitCommitGroup } from './git-commits'
import { GitHistoryPane } from './git-history-pane'
import { GitMetadata } from './git-metadata'
import { GitPanelFooter } from './git-panel-footer'
import { GitScrollArea } from './git-scroll-area'

export function GitPanelContent({ request, onClose, onProject, onConflict }: {
  request: GitRequest
  onClose: () => void
  onProject: (id: number, source: GitRequest) => void
  onConflict: (requirement: Requirement, source: GitRequest) => void
}) {
  const { directoryId, delivery, resume } = request
  const base = delivery?.baseBranch ?? ''
  const [refresh, setRefresh] = useState(0)
  const [data, setData] = useState<{ refresh: number, snapshot?: GitSnapshot, error?: string }>()
  const [chosenRef, selectBranch] = useState(resume?.branchRef)
  const [branchData, setBranchData] = useState<{ ref: string, refresh: number, history?: GitHistory, error?: string }>()
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const [pending, setPending] = useState<GitBranchAction['kind']>()
  const [merge, setMerge] = useState<{ source: Branch, target: string }>()
  const [historyLayout, setHistoryLayout] = useState<Layout>()
  const [filesLayout, setFilesLayout] = useState<Layout>()
  const heading = useRef<HTMLHeadingElement>(null)
  const historyViewport = useRef<HTMLDivElement>(null)
  const appliedResume = useRef<GitRequest['resume']>(undefined)
  const priorFocus = useRef<HTMLElement | null>(null)
  const requested = useRef(0)
  const snapshot = data?.snapshot
  const latest = useGitChecks(state => state.checks[directoryId])
  const status = latest?.status ?? snapshot
  const checking = data?.refresh !== refresh
  const operationsDisabled = checking || Boolean(pending || data?.error)
  const bound = localBranchName(delivery?.branch ?? '')
  const boundBranch = bound ? snapshot?.branches.find(item => !item.remote && item.name === bound) : undefined
  const boundRef = boundBranch?.ref
  const currentRef = snapshot?.branch ? `refs/heads/${snapshot.branch}` : ''
  const master = currentRef && currentRef !== 'refs/heads/master'
    ? snapshot?.branches.find(item => item.ref === 'refs/heads/master') : undefined
  const selectedRef = chosenRef === '' || snapshot?.branches.some(item => item.ref === chosenRef)
    ? chosenRef ?? '' : boundRef || ''
  const branch = snapshot?.branches.find(item => item.ref === selectedRef && item.ref !== currentRef)
  const branchLabel = branch?.name || snapshot?.branch || (snapshot?.head ? '分离 HEAD' : '未产生提交')
  const history = branchData?.ref === branch?.ref ? branchData : undefined
  const loading = checking || Boolean(branch && history?.refresh !== refresh)
  const issues = delivery ? deliveryIssues(delivery, status) : status?.issue ? [status.issue] : []
  if (!delivery && status?.conflicted) issues.push(`工作区有 ${status.conflicted} 个冲突项`)
  if (bound && snapshot && !snapshot.issue && !snapshot.branchesIssue && !boundRef && bound !== snapshot.branch) {
    issues.push(`本地找不到需求绑定分支 ${bound}`)
  }
  const groups: GitCommitGroup[] = []
  const comparison = history?.history?.comparison
  if (snapshot && base && (!branch || !history?.error)) {
    const error = branch ? comparison?.issue : snapshot.baseIssue
    groups.push({
      title: `${branchLabel} 相对 ${base} 的提交`,
      head: branch ? history?.history?.head : snapshot.head,
      exclude: branch ? comparison?.base : snapshot.releaseBase,
      commits: error ? undefined : branch ? comparison?.commits : snapshot.releaseCommits,
      more: branch ? comparison?.more : snapshot.moreRelease,
      error, empty: '当前查看的分支没有额外提交',
    })
  }
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
    const order = beginGitCheck()
    requested.current = order
    Desk.inspectGit(directoryId, base).then(snapshot => {
      if (!ignore) {
        publishGitChecks(order, [snapshot])
        setData({ refresh, snapshot })
      }
    }).catch(error => {
      if (!ignore) setData(current => ({ refresh, snapshot: current?.snapshot, error: readableError(error) }))
    })
    return () => { ignore = true }
  }, [directoryId, base, refresh])

  useEffect(() => {
    if (latest && latest.order > requested.current && !checking) setRefresh(value => value + 1)
  }, [latest, checking])

  const ref = branch?.ref
  useEffect(() => {
    if (!ref || checking) return
    let ignore = false
    Desk.gitHistory(directoryId, ref, base).then(history => {
      if (!ignore) setBranchData({ ref, refresh, history })
    }).catch(error => {
      if (!ignore) setBranchData({ ref, refresh, error: readableError(error) })
    })
    return () => { ignore = true }
  }, [directoryId, ref, base, refresh, checking])

  useEffect(() => {
    if (!resume || appliedResume.current === resume || loading) return
    const viewport = historyViewport.current
    if (!viewport) return
    appliedResume.current = resume
    viewport.scrollTop = resume.scrollTop
    const target = document.getElementById(resume.focusId) ?? heading.current
    target?.focus({ preventScroll: true })
  }, [resume, loading])

  function resumeRequest(focusId: string): GitRequest {
    return { ...request, resume: {
      branchRef: chosenRef, scrollTop: historyViewport.current?.scrollTop ?? 0, focusId,
    } }
  }

  function openConflict(item: Requirement): void {
    onConflict(item, resumeRequest(`git-conflict-${item.id}`))
  }

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
    setBranchData(undefined)
    selectBranch(ref)
  }

  async function runBranchAction(action: GitBranchAction, target: string, upstream = ''): Promise<void> {
    const source = action.kind === 'pull' ? undefined : action.branch
    setPending(action.kind)
    setActionError('')
    setNotice('')
    try {
      await Desk.operateGitBranch(directoryId, action.kind, source?.ref ?? '', target, upstream)
      if (action.kind !== 'pull') selectBranch('')
      setNotice(`${gitActionLabels[action.kind].done} ${source?.name ?? upstream}`)
    } catch (error) {
      setActionError(readableError(error))
    } finally {
      setPending(undefined)
      setRefresh(value => value + 1)
      if (!heading.current) {
        const order = beginGitCheck()
        void Desk.inspectGit(directoryId, base).then(value => publishGitChecks(order, [value])).catch(() => {})
      }
    }
  }

  function requestBranchAction(action: GitBranchAction): void {
    if (!snapshot || operationsDisabled) return
    if (action.kind === 'merge') setMerge({ source: action.branch, target: snapshot.branch })
    else void runBranchAction(action, snapshot.branch, snapshot.upstream)
  }
  return (
    <div className="flex h-full min-h-0 flex-col"
      onKeyDown={event => {
        if (event.key !== 'Escape' || event.defaultPrevented || event.nativeEvent.isComposing) return
        if (event.target instanceof Element && event.target.closest('[role="menu"], [role="dialog"], [role="listbox"], [data-slot="popover-content"]')) return
        event.stopPropagation()
        close()
      }}>
      {(actionError || data?.error) && <div className="px-3 pt-2"><ErrorLine message={actionError || data?.error || ''} /></div>}
      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)] overflow-hidden">
        {snapshot && !snapshot.issue ? (
          <ResizablePanelGroup orientation="horizontal" className="min-h-0 touch-auto!">
            <ResizablePanel id="git-branches" defaultSize="21%" minSize="7rem" maxSize="38%"
              style={{ overflow: 'hidden' }}>
              <GitBranches snapshot={snapshot} selectedRef={branch?.ref ?? ''} boundRef={boundRef}
                onSelect={showBranch} onCopy={copyBranch} onOperate={requestBranchAction} operationsDisabled={operationsDisabled} master={master} />
            </ResizablePanel>
            <GitColumnHandle label="调整分支与提交列表宽度" />
            <ResizablePanel id="git-history" className="touch-auto!" style={{ overflow: 'hidden' }}>
              <GitHistoryPane key={branch?.ref ?? 'head'} directoryId={directoryId} groups={groups} branchLabel={branchLabel} history={historyViewport}
                historyLayout={historyLayout} onHistoryLayoutChange={setHistoryLayout}
                filesLayout={filesLayout} onFilesLayoutChange={setFilesLayout}
                header={<GitMetadata request={request} snapshot={snapshot} status={status ?? snapshot}
                  mergeMaster={master && (() => requestBranchAction({ kind: 'merge', branch: master }))}
                  operationsDisabled={operationsDisabled} />}>
                {issues.length > 0 && (
                  <div className="px-2.5 py-1.5">
                    <GitIssues issues={issues}>
                      {boundBranch && boundRef !== currentRef && (
                        <Button type="button" size="xs" variant="outline" disabled={operationsDisabled}
                          onClick={() => {
                            heading.current?.focus({ preventScroll: true })
                            requestBranchAction({ kind: 'checkout', branch: boundBranch })
                          }}>
                          <GitPullRequestArrow aria-hidden="true" />切换到需求分支
                        </Button>
                      )}
                      <GitConflictLinks request={request} onOpen={openConflict} />
                      {boundRef && boundRef !== (selectedRef || currentRef) && (
                        <Button type="button" size="xs" variant="outline"
                          onClick={() => {
                            heading.current?.focus({ preventScroll: true })
                            showBranch(boundRef)
                          }}>查看需求绑定分支</Button>
                      )}
                    </GitIssues>
                  </div>
                )}
              </GitHistoryPane>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <GitScrollArea viewportProps={{ ref: historyViewport }}>
            <div className="space-y-2 p-3">
              {checking && <p role="status" className="text-muted-foreground">正在读取本地 Git 状态…</p>}
              {issues.length > 0 && <GitIssues issues={issues}>
                <GitConflictLinks request={request} onOpen={openConflict} />
              </GitIssues>}
            </div>
          </GitScrollArea>
        )}
      </div>
      <GitPanelFooter heading={heading} name={request.name} path={request.path}
        status={pending ? gitActionLabels[pending].pending
          : notice || (loading ? '读取中…' : data?.error || history?.error ? '读取失败' : snapshot ? displayDate(snapshot.checkedAt, 'time') : '')}
        loading={loading} busy={Boolean(pending)} onRefresh={refreshGit} onDirectory={openDirectory} onClose={close}
        onProject={delivery && (() => onProject(delivery.projectId, resumeRequest('git-view-project')))} />
      {merge && <ConfirmGitMerge source={merge.source} target={merge.target} onClose={() => setMerge(undefined)}
        onConfirm={() => {
          setMerge(undefined)
          void runBranchAction({ kind: 'merge', branch: merge.source }, merge.target)
        }} />}
    </div>
  )
}
