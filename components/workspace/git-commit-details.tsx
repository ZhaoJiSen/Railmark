import { Popover } from '@heroui/react/popover'
import { ArrowLeft, Info, PanelRightClose } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Layout } from 'react-resizable-panels'
import type { GitCommit, GitCommitFiles } from '../../lib/mygo'
import { Desk } from '../../lib/mygo'
import { readableError } from '../../lib/utils'
import { displayDate } from '../../lib/workspace-data'
import { Button } from '../ui/button'
import { ErrorLine } from '../ui/form-parts'
import { Spinner } from '../ui/spinner'
import { ResizablePanel, ResizablePanelGroup } from '../ui/resizable'
import { GitColumnHandle } from './git-column-handle'
import { GitFileList, GitFilePicker } from './git-commit-files'
import { GitFileDiff } from './git-file-diff'

export function GitCommitDetails({ directoryId, commit, branchLabel, onClose, filesLayout, onFilesLayoutChange }: {
  directoryId: number
  commit: GitCommit
  branchLabel: string
  onClose: () => void
  filesLayout?: Layout
  onFilesLayoutChange: (layout: Layout) => void
}) {
  const [data, setData] = useState<GitCommitFiles>()
  const [error, setError] = useState('')
  const [index, selectFile] = useState(0)
  const hash = commit.fullHash
  const files = data?.files ?? []
  const file = files[index]

  useEffect(() => {
    let active = true
    Desk.gitCommitFiles(directoryId, hash).then(result => {
      if (active) setData(result)
    }).catch(error => {
      if (active) setError(readableError(error))
    })
    return () => { active = false }
  }, [directoryId, hash])

  return (
    <div className="@container/git-details flex h-full min-h-0 min-w-0 flex-col text-xs">
      <header className="flex shrink-0 items-start gap-1.5 border-b bg-surface px-2 py-1.5">
        <Button type="button" size="icon-xs" variant="ghost" onClick={onClose}
          aria-label="返回提交列表" title="返回提交列表" className="@min-[44rem]/git-history:order-last">
          <ArrowLeft className="@min-[44rem]/git-history:hidden" />
          <PanelRightClose className="hidden @min-[44rem]/git-history:block" />
        </Button>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-medium wrap-anywhere" title={commit.subject}>{commit.subject || '无提交说明'}</h3>
          <div className="mt-0.5 flex min-w-0 items-baseline gap-2 text-muted-foreground">
            <code className="shrink-0 font-mono text-muted-foreground" title={hash}>{commit.hash}</code>
            <span className="truncate" title={commit.author}>{commit.author}</span>
            <time className="shrink-0 tabular-nums" dateTime={commit.date}>{displayDate(commit.date)}</time>
            {branchLabel && <span className="hidden truncate font-mono @min-[25rem]/git-details:block" title={branchLabel}>{branchLabel}</span>}
          </div>
        </div>
        <CommitInfo commit={commit} parent={data?.parent} />
      </header>
      {error && <div className="overflow-auto p-2"><ErrorLine message={error} /></div>}
      {!data && !error && (
        <p role="status" className="flex items-center gap-1.5 p-2 text-muted-foreground">
          <Spinner aria-hidden="true" />正在读取改动文件…
        </p>
      )}
      {data && files.length === 0 && <p className="p-2 text-muted-foreground">此提交没有文件改动</p>}
      {file && (
        <ResizablePanelGroup orientation="horizontal"
          defaultLayout={filesLayout}
          onLayoutChanged={(layout, { isUserInteraction }) => {
            if (isUserInteraction) onFilesLayoutChange(layout)
          }}
          className="min-h-0 flex-1 touch-auto! @max-[36rem]/git-details:[&>#git-changed-files]:hidden!">
          <ResizablePanel id="git-changed-files" defaultSize="36%" minSize="8rem" style={{ overflow: 'hidden' }}>
            <GitFileList files={files} index={index} onSelect={selectFile} />
          </ResizablePanel>
          <GitColumnHandle label="调整改动文件与差异宽度" className="@max-[36rem]/git-details:hidden" />
          <ResizablePanel id="git-file-diff" minSize="14rem" className="flex min-h-0 min-w-0 flex-col touch-auto!"
            style={{ overflow: 'hidden' }}>
            <GitFilePicker files={files} index={index} onSelect={selectFile} />
            <GitFileDiff key={index} directoryId={directoryId} hash={hash} index={index} path={file.path} />
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  )
}

function CommitInfo({ commit, parent }: { commit: GitCommit, parent?: string }) {
  return (
    <Popover>
      <Button type="button" size="icon-xs" variant="ghost" aria-label="查看提交信息" title="查看提交信息">
        <Info aria-hidden="true" />
      </Button>
      <Popover.Content placement="top end" offset={6} className="w-80 max-w-[calc(100vw-1.5rem)]">
        <Popover.Dialog aria-label="提交信息"
          className="max-h-[min(22rem,var(--available-height,22rem))] space-y-3 overflow-auto text-xs wrap-anywhere select-text">
          <Popover.Heading className="text-sm">{commit.subject || '无提交说明'}</Popover.Heading>
          {commit.body && <p className="whitespace-pre-wrap">{commit.body}</p>}
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 border-t pt-2">
            <dt className="text-muted-foreground">提交哈希</dt><dd className="font-mono">{commit.fullHash}</dd>
            <dt className="text-muted-foreground">作者</dt><dd>{commit.author}</dd>
            <dt className="text-muted-foreground">时间</dt><dd><time dateTime={commit.date}>{displayDate(commit.date, 'time')}</time></dd>
            {parent && (
              <>
                <dt className="text-muted-foreground">{commit.parents.includes(' ') ? '对比第一父提交' : '对比父提交'}</dt>
                <dd className="font-mono">{parent}</dd>
              </>
            )}
          </dl>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  )
}
