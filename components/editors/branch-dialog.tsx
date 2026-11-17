import { useEffect, useId, useRef, useState } from 'react'
import type { GitBranch } from '../../lib/mygo'
import { Desk } from '../../lib/mygo'
import { readableError } from '../../lib/utils'
import { localBranchName } from '../../lib/workspace-data'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { ErrorLine } from '../ui/form-parts'
import { Spinner } from '../ui/spinner'
import { BranchChooser } from './branch-chooser'
import { BranchNameField } from './branch-name-field'
import type { LinkDraft } from './link-draft'

export function BranchDialog({ link, mode, onSelect, onClose, returnFocus }: {
  link: LinkDraft
  mode: 'select' | 'create'
  onSelect: (name: string) => void
  onClose: () => void
  returnFocus: HTMLElement | null
}) {
  const id = useId()
  const { directoryId, path, baseBranch } = link
  const creating = mode === 'create'
  const [branches, setBranches] = useState<GitBranch[]>()
  const [error, setError] = useState('')
  const [startRef, setStartRef] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)

  useEffect(() => {
    let active = true
    Desk.gitBranches(directoryId, path).then(items => {
      if (!active) return
      setBranches(items)
      const matches = baseBranch ? items.filter(branch => branch.ref === baseBranch || branch.name === baseBranch) : []
      if (matches.length === 1) setStartRef(matches[0].ref)
    }).catch(error => {
      if (active) setError(readableError(error))
    })
    return () => { active = false }
  }, [directoryId, path, baseBranch])

  const start = branches?.find(branch => branch.ref === startRef)

  async function create(): Promise<void> {
    const branchName = name.trim()
    if (!branchName || !start || pending.current) return
    pending.current = true
    setBusy(true)
    setError('')
    try {
      await Desk.createGitBranch(directoryId, path, branchName, start.ref)
      onSelect(branchName)
      onClose()
    } catch (error) {
      setError(readableError(error))
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  return (
    <Dialog open onOpenChange={open => { if (!open && !pending.current) onClose() }}>
      <DialogContent className="flex max-h-[calc(100dvh-3rem)] min-w-0 flex-col gap-3 overflow-hidden p-4 sm:max-w-lg"
        showCloseButton={!busy}
        onCloseAutoFocus={event => {
          if (returnFocus?.isConnected) {
            event.preventDefault()
            returnFocus.focus()
          }
        }}>
        <DialogHeader className="min-w-0 gap-1 pe-8 text-left">
          <DialogTitle>{creating ? '新建本地分支' : '选择已有开发分支'}</DialogTitle>
          <DialogDescription className="wrap-anywhere" title={path}>{link.projectName} · {path}</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 min-w-0 space-y-3 overflow-y-auto p-1">
          {creating && (
            <BranchNameField id={id} label="新分支名称" value={name} onChange={setName} disabled={busy}
              placeholder="输入项目约定的分支名" />
          )}
          {creating && (
            <p className="text-xs text-muted-foreground wrap-anywhere">
              起点 {start ? <code className="font-mono text-foreground">{start.name}</code> : '待选择'}
            </p>
          )}
          {branches && (
            <BranchChooser label={creating ? '搜索起点分支' : '搜索本地开发分支'} disabled={busy} autoFocus={!creating}
              branches={creating ? branches : branches.filter(branch => !branch.remote)}
              currentBranch={link.currentBranch}
              selectedRef={creating ? startRef : `refs/heads/${localBranchName(link.branch)}`}
              onSelect={branch => {
                if (creating) {
                  setStartRef(branch.ref)
                } else {
                  onSelect(branch.name)
                  onClose()
                }
              }} />
          )}
          {!branches && !error && <p role="status" className="text-xs text-muted-foreground">正在读取分支…</p>}
          <ErrorLine message={error} />
        </div>
        {creating && <p className="text-xs text-muted-foreground">立即创建本地分支。保存后才会关联到需求。</p>}
        <DialogFooter className="flex-row flex-wrap justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>{creating ? '取消' : '关闭'}</Button>
          {creating && (
            <Button type="button" onClick={() => void create()} disabled={!name.trim() || !start || busy}>
              {busy && <Spinner aria-hidden="true" className="size-3.5" />}
              {busy ? '创建中…' : '创建并填入'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
