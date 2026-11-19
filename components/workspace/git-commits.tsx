import { useLayoutEffect, useRef, useState } from 'react'
import type { GitCommit, GitHistory } from '../../lib/mygo'
import { Desk } from '../../lib/mygo'
import { readableError } from '../../lib/utils'
import { displayDate } from '../../lib/workspace-data'
import { Button } from '../ui/button'
import { ErrorLine } from '../ui/form-parts'

export interface GitCommitGroup {
  title: string
  head?: string
  exclude?: string
  commits?: GitCommit[]
  empty?: string
  error?: string
  more?: boolean
}

export function CommitList({ directoryId, group, selectedHash, onSelect }: {
  directoryId: number
  group: GitCommitGroup
  selectedHash?: string
  onSelect: (commit: GitCommit, button: HTMLButtonElement, keyboard: boolean) => void
}) {
  const { title, head, exclude = '', commits, empty = '暂无提交', error, more } = group
  const [older, setOlder] = useState<GitHistory>()
  const [pageError, setPageError] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeHash, setActiveHash] = useState('')
  const list = useRef<HTMLUListElement>(null)
  const pageTrigger = useRef<HTMLButtonElement>(null)
  const focusIndex = useRef<number | null>(null)
  const items = [...(commits ?? []), ...(older?.commits ?? [])]
  const canLoad = Boolean(head && (older?.more ?? more))
  const tabHash = items.some(commit => commit.fullHash === activeHash) ? activeHash : selectedHash ?? items[0]?.fullHash

  useLayoutEffect(() => {
    const index = focusIndex.current
    focusIndex.current = null
    if (index !== null && (document.activeElement === pageTrigger.current || document.activeElement === document.body)) {
      list.current?.querySelectorAll('button')[index]?.focus()
    }
  }, [older])

  async function loadEarlier(): Promise<void> {
    if (!head || !canLoad || loading) return
    setLoading(true)
    setPageError('')
    try {
      const page = await Desk.gitHistoryPage(directoryId, head, exclude, items.length)
      if (document.activeElement === pageTrigger.current && page.commits.length) focusIndex.current = items.length
      setOlder({ ...page, commits: [...(older?.commits ?? []), ...page.commits] })
    } catch (error) {
      setPageError(readableError(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section aria-label={title}>
      <h3 className="sticky top-0 z-10 truncate border-b bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground"
        title={title}>{title}</h3>
      {error && <div className="p-2"><ErrorLine message={error} /></div>}
      {!commits ? (
        !error && <p role="status" className="p-2.5 text-xs text-muted-foreground">正在读取分支提交…</p>
      ) : items.length ? (
        <ul ref={list} className="divide-y divide-border/70 px-1.5" onKeyDown={event => {
          if (event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing) return
          if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
          const buttons = [...event.currentTarget.querySelectorAll('button')]
          const index = buttons.findIndex(button => button === event.target)
          if (index < 0) return
          const next = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: buttons.length - 1 }[event.key]
          if (next === undefined) return
          event.preventDefault()
          buttons[next]?.focus()
        }}>
          {items.map(commit => {
            const selected = selectedHash === commit.fullHash
            return (
              <li key={commit.fullHash} className="py-0.5">
                <Button type="button" variant={selected ? 'secondary' : 'ghost'} size="sm"
                  className="h-auto min-h-10 w-full justify-start px-2 py-1 text-start text-[0.8125rem] leading-4"
                  tabIndex={tabHash === commit.fullHash ? 0 : -1} onFocus={() => setActiveHash(commit.fullHash)}
                  aria-pressed={selected} onClick={event => onSelect(commit, event.currentTarget, event.detail === 0)}>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{commit.subject || '无提交说明'}</span>
                    <span className="flex min-w-0 items-center gap-1.5 text-xs font-normal text-muted-foreground">
                      <code className="shrink-0 font-mono">{commit.hash}</code>
                      <span className="min-w-0 flex-1 truncate">{commit.author}</span>
                      <time className="shrink-0" dateTime={commit.date}>{displayDate(commit.date)}</time>
                    </span>
                  </span>
                </Button>
              </li>
            )
          })}
        </ul>
      ) : <p className="p-2.5 text-xs text-muted-foreground">{empty}</p>}
      {pageError && <div className="p-2"><ErrorLine message={pageError} /></div>}
      {canLoad ? (
        <div className="px-2.5 py-1.5">
          <Button ref={pageTrigger} type="button" size="sm" variant="outline" aria-disabled={loading}
            onClick={() => void loadEarlier()}>{loading ? '正在加载…' : '加载更早的提交'}</Button>
        </div>
      ) : older && <p role="status" className="px-2.5 py-1.5 text-xs text-muted-foreground">已显示全部 {items.length} 条提交</p>}
    </section>
  )
}
