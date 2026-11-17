import { Check, GitBranch, Pencil, Plus } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Delivery } from '../../lib/mygo'
import { readableError } from '../../lib/utils'
import { localBranchName } from '../../lib/workspace-data'
import { useWorkspace } from '../../lib/workspace-store'
import { DevelopmentBranchFields } from '../editors/development-branch-fields'
import { fromDelivery } from '../editors/link-draft'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { ErrorLine } from '../ui/form-parts'
import { Spinner } from '../ui/spinner'

export function DeliveryBranchEditor({ requirementId, delivery, currentBranch, directoryHint = '' }: {
  requirementId: number, delivery: Delivery, currentBranch?: string, directoryHint?: string,
}) {
  const fieldId = useId()
  const pending = useRef(false)
  const update = useWorkspace(state => state.updateDeliveryField)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(delivery.branch)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const branch = localBranchName(draft)
  const savedBranch = localBranchName(delivery.branch)
  const bound = Boolean(savedBranch)
  const removing = bound && !branch

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 2000)
    return () => window.clearTimeout(timer)
  }, [notice])

  async function save(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (pending.current || branch === savedBranch) return
    pending.current = true
    setBusy(true)
    setError('')
    try {
      await update(requirementId, delivery, 'branch', branch)
      setNotice(branch ? '已保存' : '已解除绑定')
      setOpen(false)
    } catch (problem) {
      setError(readableError(problem))
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={next => {
      if (pending.current) return
      if (next) {
        setDraft(delivery.branch)
        setError('')
        setNotice('')
      }
      setOpen(next)
    }}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="xs" aria-label={`${bound ? '修改' : '绑定'} ${delivery.projectName} 的开发分支${directoryHint}`}
          aria-description={[directoryHint ? delivery.path : '', delivery.branch].filter(Boolean).join('；') || undefined}
          title={delivery.branch || '绑定开发分支'}
          className="h-auto min-h-6 max-w-full justify-start gap-1.5 px-1.5 py-0.5 text-start font-normal whitespace-normal">
          {bound ? <GitBranch aria-hidden="true" className="text-muted-foreground" /> : <Plus aria-hidden="true" />}
          <span className={bound ? 'line-clamp-2 min-w-0 flex-1 font-mono wrap-anywhere' : 'wrap-anywhere'}>{delivery.branch || '绑定分支'}</span>
          {notice ? (
            <span className="flex shrink-0 items-center gap-0.5 text-muted-foreground">
              <Check aria-hidden="true" className="size-3" />{notice}
            </span>
          ) : bound && <Pencil aria-hidden="true" className="size-3 shrink-0 text-muted-foreground" />}
        </Button>
      </DialogTrigger>
      <span role="status" className="sr-only">{notice}</span>
      <DialogContent showCloseButton={!busy} onInteractOutside={event => event.preventDefault()}
        className="max-h-[calc(100dvh-3rem)] gap-3 overflow-y-auto p-4 motion-reduce:animate-none! sm:max-w-md">
        <DialogHeader className="gap-1 pe-6 text-left">
          <DialogTitle>{bound ? '修改开发分支' : '绑定开发分支'}</DialogTitle>
          <DialogDescription className="space-y-1 wrap-anywhere">
            <span className="block">{delivery.projectName} · {delivery.path}</span>
            <span className="block">记录此需求预期使用的开发分支。</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="space-y-3">
          <fieldset disabled={busy} className="min-w-0">
            <DevelopmentBranchFields id={fieldId} label="分支名称"
              link={{ ...fromDelivery(delivery), branch: draft, currentBranch: currentBranch ?? '' }}
              onChange={value => setDraft(value.branch)} />
          </fieldset>
          <ErrorLine message={error} />
          <DialogFooter className="flex-row flex-wrap justify-end">
            <Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>取消</Button>
            <Button type="submit" variant={removing ? 'destructive' : 'default'} disabled={busy || branch === savedBranch}>
              {busy && <Spinner aria-hidden="true" />}
              {busy ? '保存中…' : removing ? '解除绑定' : '保存分支'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
