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
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '../ui/popover'
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
      <header className="flex shrink-0 items-center gap-1.5 border-b px-2 py-1.5">
        <Button type="button" size="icon-xs" variant="ghost" onClick={onClose}
          aria-label="返回提交列表" title="返回提交列表" className="@min-[44rem]/git-history:order-last">
          <ArrowLeft className="@min-[44rem]/git-history:hidden" />
          <PanelRightClose className="hidden @min-[44rem]/git-history:block" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-baseline gap-2">
            <h3 className="min-w-0 truncate text-sm font-medium" title={commit.subject}>{commit.subject || '无提交说明'}</h3>
            <code className="shrink-0 font-mono text-muted-foreground" title={hash}>{commit.hash}</code>
          </div>
          {branchLabel && <p className="break-all font-mono text-xs text-muted-foreground">{branchLabel}</p>}
        </div>
        <CommitInfo commit={commit} parent={data?.parent} />
      </header>
      {error && <div className="overflow-auto p-2"><ErrorLine message={error} /></div>}
      {!data && !error && (
        <p role="status" className="flex items-center gap-1.5 p-2 text-muted-foreground">
          <Spinner aria-hidden="true" className="size-3" />正在读取改动文件…
        </p>
      )}
      {data && files.length === 0 && <p className="p-2 text-muted-foreground">此提交没有文件改动</p>}
      {file && (
        <ResizablePanelGroup orientation="horizontal"
          defaultLayout={filesLayout}
          onLayoutChanged={(layout, { isUserInteraction }) => {
            if (isUserInteraction) onFilesLayoutChange(layout)
          }}
          className="min-h-0 flex-1 touch-auto! @max-[32rem]/git-details:[&>#git-changed-files]:hidden!">
          <ResizablePanel id="git-changed-files" defaultSize="29%" minSize="8rem" style={{ overflow: 'hidden' }}>
            <GitFileList files={files} index={index} onSelect={selectFile} />
          </ResizablePanel>
          <GitColumnHandle label="调整改动文件与差异宽度" className="@max-[32rem]/git-details:hidden" />
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
      <PopoverTrigger asChild>
        <Button type="button" size="icon-xs" variant="ghost" aria-label="查看提交信息" title="查看提交信息">
          <Info />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" aria-label="提交信息"
        className="max-h-(--radix-popover-content-available-height) w-80 max-w-(--radix-popover-content-available-width) space-y-2 overflow-auto p-3 text-xs wrap-anywhere select-text">
        <PopoverTitle>{commit.subject || '无提交说明'}</PopoverTitle>
        {commit.body && <p className="whitespace-pre-wrap">{commit.body}</p>}
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-1">
          <dt className="text-muted-foreground">提交</dt><dd className="font-mono">{commit.fullHash}</dd>
          <dt className="text-muted-foreground">作者</dt><dd>{commit.author}</dd>
          <dt className="text-muted-foreground">时间</dt><dd><time dateTime={commit.date}>{displayDate(commit.date, 'time')}</time></dd>
          {parent && (
            <>
              <dt className="text-muted-foreground">{commit.parents.includes(' ') ? '对比第一父提交' : '对比父提交'}</dt>
              <dd className="font-mono">{parent}</dd>
            </>
          )}
        </dl>
      </PopoverContent>
    </Popover>
  )
}
