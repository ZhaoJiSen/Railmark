import { Dropdown } from '@heroui/react/dropdown'
import { useId, useRef, useState } from 'react'
import { STATES } from '../../lib/constants'
import type { Requirement } from '../../lib/mygo'
import { readableError } from '../../lib/utils'
import { useWorkspace } from '../../lib/workspace-store'
import { Button } from '../ui/button'
import { Spinner } from '../ui/spinner'
import { StateLabel } from './status'

export function InlineStatus({ label, state, onSave, hint }: {
  label: string
  hint?: string
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
      <Dropdown isOpen={open} onOpenChange={value => { if (!value || !pending.current) setOpen(value) }}>
        <Button type="button" variant="ghost" aria-label={label} title={hint} disabled={busy}
          aria-describedby={error ? errorId : undefined}>
          {busy ? <><Spinner />保存中</> : <StateLabel state={state} />}
        </Button>
        <Dropdown.Popover>
          <Dropdown.Menu aria-label={label} selectionMode="single" selectedKeys={[state]}
            onAction={key => void save(String(key))}>
            {STATES.map(item => (
              <Dropdown.Item id={item.id} key={item.id} textValue={item.label}><StateLabel state={item.id} /></Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
      {error && <p id={errorId} role="alert" className="max-w-36 text-xs text-danger wrap-anywhere">{error}</p>}
    </div>
  )
}

export function RequirementStatusPicker({ requirement }: { requirement: Requirement }) {
  const update = useWorkspace(state => state.updateRequirementState)
  return <InlineStatus label={`修改「${requirement.title}」的需求状态`} state={requirement.state} hint="需求状态单独维护，不会同时修改各项目的交付状态。"
    onSave={state => update(requirement.id, state)} />
}
