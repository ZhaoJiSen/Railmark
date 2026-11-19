import type { GitCommitFiles } from '../../lib/mygo'
import { cn } from '../../lib/utils'
import { Chip } from '@heroui/react/chip'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { GitScrollArea } from './git-scroll-area'

type ChangedFile = GitCommitFiles['files'][number]
type FileSelection = { files: ChangedFile[], index: number, onSelect: (index: number) => void }

const statusLabel: Record<string, string> = {
  A: '新增', D: '删除', M: '修改', R: '重命名', C: '复制', T: '类型变化',
}

const statusColor = { A: 'success', D: 'danger', M: 'warning', R: 'accent' } as const

function fullPath({ oldPath, path }: ChangedFile): string {
  return oldPath ? `${oldPath} → ${path}` : path
}

function fileName(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1)
}

export function GitFileList({ files, index, onSelect }: FileSelection) {
  const byName = Map.groupBy(files, file => fileName(file.path))
  return (
    <section aria-label="改动文件"
      className="flex h-full min-h-0 min-w-0 flex-col bg-default/20">
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
                <FileName file={file} showFolder={(byName.get(fileName(file.path))?.length ?? 0) > 1} />
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
    <div className="flex shrink-0 items-center gap-2 border-b px-2 py-1 @min-[36rem]/git-details:hidden">
      <span className="shrink-0 text-muted-foreground">文件 {files.length}</span>
      <Select aria-label="改动文件" value={String(index)} className="min-w-0 flex-1" onValueChange={value => onSelect(Number(value))}>
        <SelectTrigger size="sm" className="w-full [&_[data-slot=select-value]]:min-w-0"
          aria-label="选择改动文件" title={fullPath(files[index])}>
          <SelectValue><FileStatus status={files[index].status} /><FileName file={files[index]} /></SelectValue>
        </SelectTrigger>
        <SelectContent position="popper" align="start"
          className="max-w-[min(28rem,var(--available-width))]">
          {files.map((file, fileIndex) => (
            <SelectItem key={file.path} value={String(fileIndex)}
              className="min-w-0 *:[span]:last:min-w-0" title={fullPath(file)}>
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
  return <Chip size="sm" variant="soft" aria-hidden="true"
    color={statusColor[status as keyof typeof statusColor] ?? 'default'}>{status}</Chip>
}

function FileName({ file, showFolder = true }: { file: ChangedFile, showFolder?: boolean }) {
  const separator = file.path.lastIndexOf('/')
  const folder = separator >= 0 ? file.path.slice(0, separator) : ''
  return (
    <span className="flex min-w-0 flex-1 items-baseline gap-1.5 font-mono">
      <span className="truncate">{fileName(file.path)}</span>
      {showFolder && folder && <span aria-hidden="true" className="min-w-0 flex-1 truncate font-normal text-muted-foreground">{folder}</span>}
    </span>
  )
}
