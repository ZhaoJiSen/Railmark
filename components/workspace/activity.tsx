'use client'

import { Clock3, MessageSquarePlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Desk } from '../../lib/mygo'
import type { LogEntry } from '../../lib/mygo'
import { readableError } from '../../lib/utils'
import { useNoteDrafts } from '../../lib/note-drafts'
import { displayDate } from '../../lib/workspace-data'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Separator } from '../ui/separator'
import { ErrorLine } from '../ui/form-parts'
import { Textarea } from '../ui/textarea'

export function Activity({ id, updatedAt, onChanged }: { id: number, updatedAt: string, onChanged: () => void }) {
  const text = useNoteDrafts(state => state.noteDrafts[id] ?? '')
  const setNoteDraft = useNoteDrafts(state => state.setNoteDraft)
  const saving = useNoteDrafts(state => state.savingNotes.has(id))
  const saveNote = useNoteDrafts(state => state.saveNote)
  const [error, setError] = useState('')
  const [result, setResult] = useState<LogEntry[]>()

  useEffect(() => {
    if (saving) return
    let ignore = false
    Desk.logs(id).then(entries => {
      if (!ignore) setResult(entries)
    }).catch(error => {
      if (!ignore) setError(readableError(error))
    })
    return () => { ignore = true }
  }, [id, saving, updatedAt])

  async function addNote(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (!text.trim() || saving) return
    setError('')
    try {
      await saveNote(id, text)
      onChanged()
    } catch (error) {
      setError(readableError(error))
    }
  }

  return (
    <Card variant="transparent" className="p-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5" role="heading" aria-level={2}>
          <Clock3 aria-hidden="true" className="size-4 shrink-0" />修改日志
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={addNote} className="space-y-2">
          <Textarea aria-label="日志内容" placeholder="记录这次改动或联调进展…" rows={3} value={text}
            className="w-full" disabled={saving} onChange={event => setNoteDraft(id, event.target.value)} />
          <div className="flex justify-end">
            <Button type="submit" size="sm" variant="secondary" disabled={saving || !text.trim()}>
              <MessageSquarePlus />{saving ? '保存中' : '记一条日志'}
            </Button>
          </div>
          <ErrorLine message={error} />
        </form>
        <Separator className="my-2.5" />
        <ol className="divide-y">
          {result?.map(entry => (
            <li key={entry.id} className="py-2 first:pt-0 last:pb-0">
              <div className="mb-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                <span>{entry.kind === 'note' ? '工作日志' : '自动记录'}</span>
                <time dateTime={entry.createdAt}>{displayDate(entry.createdAt, 'time')}</time>
              </div>
              <p className="text-base leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">{entry.text}</p>
            </li>
          ))}
          {!result && !error && <li className="py-3 text-muted-foreground">正在读取日志…</li>}
          {result?.length === 0 && <li className="py-3 text-muted-foreground">暂无日志</li>}
        </ol>
      </CardContent>
    </Card>
  )
}
