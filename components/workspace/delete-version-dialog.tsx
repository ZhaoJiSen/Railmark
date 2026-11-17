import { useRef, useState } from 'react'
import type { Version } from '../../lib/mygo'
import { readableError } from '../../lib/utils'
import { useWorkspace } from '../../lib/workspace-store'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { ErrorLine } from '../ui/form-parts'
import { Spinner } from '../ui/spinner'
import { useVersionLists } from './version-list-state'

export function DeleteVersionDialog({ version, onClose, restoreFocus }: {
  version: Version
  onClose: () => void
  restoreFocus: () => void
}) {
  const count = useWorkspace(state => state.data?.requirements.filter(item => item.versionId === version.id).length ?? 0)
  const exists = useWorkspace(state => state.data?.versions.some(item => item.id === version.id && item.name === version.name))
  const deleteVersion = useWorkspace(state => state.deleteVersion)
  const reload = useWorkspace(state => state.reload)
  const saving = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function remove(): Promise<void> {
    if (saving.current || !exists) return
    saving.current = true
    setBusy(true)
    setError('')
    try {
      await deleteVersion(version, count)
      useVersionLists.getState().removeVersion(version.id)
      onClose()
    } catch (problem) {
      await reload().catch(() => {})
      setError(readableError(problem))
    } finally {
      saving.current = false
      setBusy(false)
    }
  }

  return (
    <Dialog open onOpenChange={open => { if (!open && !saving.current) onClose() }}>
      <DialogContent role="alertdialog" showCloseButton={false} onInteractOutside={event => event.preventDefault()}
        onCloseAutoFocus={event => { event.preventDefault(); restoreFocus() }}
        className="gap-3 p-4 motion-reduce:animate-none! sm:max-w-sm">
        <DialogHeader className="min-w-0 gap-1 text-left">
          <DialogTitle className="wrap-anywhere">删除版本「{version.name}」？</DialogTitle>
          <DialogDescription className="space-y-1">
            <span className="block">{count > 0 ? `将一并删除该版本的 ${count} 条需求及其日志和交付记录。` : '该版本没有关联需求。'}</span>
            <span className="block">本地项目和 Git 分支会保留。删除后无法撤销。</span>
          </DialogDescription>
        </DialogHeader>
        <ErrorLine message={error} />
        <DialogFooter className="flex-row justify-end">
          <Button type="button" variant="outline" disabled={busy} onClick={onClose}>取消</Button>
          <Button type="button" variant="destructive" disabled={busy || !exists} onClick={() => void remove()}>
            {busy && <Spinner aria-hidden="true" />}
            {busy ? '正在删除…' : '删除版本'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
