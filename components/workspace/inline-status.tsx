import { useId, useRef, useState } from 'react'
import { STATES } from '../../lib/constants'
import type { Requirement } from '../../lib/mygo'
import { readableError } from '../../lib/utils'
import { useWorkspace } from '../../lib/workspace-store'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Spinner } from '../ui/spinner'
import { StateLabel } from './status'

export function InlineStatus({ label, state, onSave }: {
  label: string
  state: string
  onSave: (state: string) => Promise<void>
}) {
  const errorId = useId()
  const pending = useRef(false)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function save(value: string): Promise<void> {
    if (pending.current || value === state) return
    pending.current = true
    setBusy(true)
    setError('')
    try {
      await onSave(value)
    } catch (problem) {
      setError(readableError(problem))
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  return (
    <div className="min-w-0">
      <Select value={state} open={open} onOpenChange={value => { if (!value || !pending.current) setOpen(value) }}
        onValueChange={value => void save(value)}>
        <SelectTrigger size="sm" aria-label={label} aria-disabled={busy} aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="max-w-full gap-1 border-transparent px-1.5 text-xs shadow-none hover:bg-muted dark:bg-transparent dark:hover:bg-muted">
          <SelectValue>
            {busy ? <span role="status" className="flex items-center gap-1"><Spinner className="size-3" />保存中</span> : <StateLabel state={state} />}
          </SelectValue>
        </SelectTrigger>
        <SelectContent position="popper" align="start" className="motion-reduce:animate-none!">
          {STATES.map(item => (
            <SelectItem key={item.id} value={item.id} textValue={item.label}><StateLabel state={item.id} /></SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p id={errorId} role="alert" className="max-w-36 text-xs text-destructive wrap-anywhere whitespace-normal">{error}</p>}
    </div>
  )
}

export function RequirementStatusPicker({ requirement }: { requirement: Requirement }) {
  const update = useWorkspace(state => state.updateRequirementState)
  return (
    <InlineStatus label={`修改「${requirement.title}」的需求状态`} state={requirement.state}
      onSave={state => update(requirement.id, state)} />
  )
}
