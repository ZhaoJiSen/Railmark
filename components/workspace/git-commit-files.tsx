import { File } from 'lucide-react'
import type { GitCommitFiles } from '../../lib/mygo'
import { cn } from '../../lib/utils'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { GitScrollArea } from './git-scroll-area'

type ChangedFile = GitCommitFiles['files'][number]
type FileSelection = { files: ChangedFile[], index: number, onSelect: (index: number) => void }

const statusLabel: Record<string, string> = {
  A: '新增', D: '删除', M: '修改', R: '重命名', C: '复制', T: '类型变化',
}

const statusColor: Record<string, string> = {
  A: 'text-emerald-700 dark:text-emerald-300',
  D: 'text-destructive',
  M: 'text-amber-800 dark:text-amber-300',
  R: 'text-indigo-700 dark:text-indigo-300',
}

function fullPath({ oldPath, path }: ChangedFile): string {
  return oldPath ? `${oldPath} → ${path}` : path
}

export function GitFileList({ files, index, onSelect }: FileSelection) {
  return (
    <section aria-label="改动文件"
      className="flex h-full min-h-0 min-w-0 flex-col bg-muted/20">
      <h4 className="flex shrink-0 items-center gap-1.5 border-b px-2.5 py-1.5 font-medium">
        改动文件 <span className="tabular-nums text-muted-foreground">{files.length}</span>
      </h4>
      <GitScrollArea className="flex-1">
        <ul className="p-1">
          {files.map((file, fileIndex) => (
            <li key={file.path}>
              <Button type="button" size="xs" variant={index === fileIndex ? 'secondary' : 'ghost'}
                className="w-full justify-start text-start" aria-pressed={index === fileIndex}
                aria-label={`${statusLabel[file.status] ?? '改动'} ${fullPath(file)}`}
                title={`${statusLabel[file.status] ?? '改动'} · ${fullPath(file)}`} onClick={() => onSelect(fileIndex)}>
                <File aria-hidden="true" className="text-muted-foreground" />
                <FileName file={file} />
                <FileStatus status={file.status} />
              </Button>
            </li>
          ))}
        </ul>
      </GitScrollArea>
    </section>
  )
}

export function GitFilePicker({ files, index, onSelect }: FileSelection) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b px-2 py-1 @min-[32rem]/git-details:hidden">
      <span className="shrink-0 text-muted-foreground">文件 {files.length}</span>
      <Select value={String(index)} onValueChange={value => onSelect(Number(value))}>
        <SelectTrigger size="sm" className="min-w-0 flex-1 text-xs [&_[data-slot=select-value]]:min-w-0"
          aria-label="选择改动文件" title={fullPath(files[index])}>
          <SelectValue><FileStatus status={files[index].status} /><FileName file={files[index]} /></SelectValue>
        </SelectTrigger>
        <SelectContent position="popper" align="start"
          className="max-w-[min(28rem,var(--radix-select-content-available-width))]">
          {files.map((file, fileIndex) => (
            <SelectItem key={file.path} value={String(fileIndex)}
              className="min-w-0 text-xs *:[span]:last:min-w-0" title={fullPath(file)}>
              <FileStatus status={file.status} />
              <FileName file={file} />
              <span className="sr-only">{statusLabel[file.status] ?? '改动'} · {fullPath(file)}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function FileStatus({ status }: { status: string }) {
  return (
    <Badge variant="secondary" aria-hidden="true"
      className={cn('min-w-4 px-0.5 py-0 font-mono leading-tight', statusColor[status] ?? 'text-muted-foreground')}>
      {status}
    </Badge>
  )
}

function FileName({ file }: { file: ChangedFile }) {
  const separator = file.path.lastIndexOf('/')
  const name = file.path.slice(separator + 1)
  const folder = separator >= 0 ? file.path.slice(0, separator) : ''
  return (
    <span className="flex min-w-0 flex-1 items-baseline gap-1.5 font-mono">
      <span className="truncate">{name}</span>
      {folder && <span aria-hidden="true" className="min-w-0 flex-1 truncate font-normal text-muted-foreground">{folder}</span>}
    </span>
  )
}
