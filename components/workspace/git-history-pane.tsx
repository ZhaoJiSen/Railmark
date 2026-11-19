import { type ReactNode, type RefObject, useLayoutEffect, useRef, useState } from 'react'
import type { Layout } from 'react-resizable-panels'
import type { GitCommit } from '../../lib/mygo'
import { cn } from '../../lib/utils'
import { ResizablePanel, ResizablePanelGroup } from '../ui/resizable'
import { GitColumnHandle } from './git-column-handle'
import { GitCommitDetails } from './git-commit-details'
import { CommitList, type GitCommitGroup } from './git-commits'
import { GitScrollArea } from './git-scroll-area'

export function GitHistoryPane({
  directoryId, groups, branchLabel, header, children, history, historyLayout, onHistoryLayoutChange, filesLayout, onFilesLayoutChange,
}: {
  directoryId: number
  groups: GitCommitGroup[]
  branchLabel: string
  header: ReactNode
  children: ReactNode
  history: RefObject<HTMLDivElement | null>
  historyLayout?: Layout
  onHistoryLayoutChange: (layout: Layout) => void
  filesLayout?: Layout
  onFilesLayoutChange: (layout: Layout) => void
}) {
  const [selection, select] = useState<{ commit: GitCommit, group: number }>()
  const details = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const moveToDetails = useRef(false)
  const selected = selection?.commit

  useLayoutEffect(() => {
    if (selected && (moveToDetails.current || history.current?.getClientRects().length === 0)) {
      details.current?.focus({ preventScroll: true })
    }
    moveToDetails.current = false
    if (!selected && trigger.current) {
      const target = trigger.current.isConnected ? trigger.current : history.current
      target?.focus({ preventScroll: true })
      trigger.current = null
    }
  }, [history, selection, selected])

  return (
    <div className="@container/git-history h-full min-h-0 min-w-0"
      onKeyDown={event => {
        if (!selected || event.key !== 'Escape' || event.defaultPrevented || event.nativeEvent.isComposing
          || !(event.target instanceof Node) || !event.currentTarget.contains(event.target)) return
        event.stopPropagation()
        select(undefined)
      }}>
      <ResizablePanelGroup orientation="horizontal"
        defaultLayout={selected ? historyLayout : undefined}
        onLayoutChanged={(layout, { isUserInteraction }) => {
          if (isUserInteraction && selected) onHistoryLayoutChange(layout)
        }}
        className={cn(
          'touch-auto!',
          selected && '@max-[44rem]/git-history:[&>#git-commit-list]:hidden!',
        )}>
        <ResizablePanel id="git-commit-list" defaultSize="33%" minSize="10rem"
          className="flex min-h-0 min-w-0 flex-col" style={{ overflow: 'hidden' }}>
          {header}
          <GitScrollArea viewportProps={{ ref: history, tabIndex: -1, className: '[scrollbar-width:none]!' }} className="flex-1">
            {children}
            {groups.map((group, groupIndex) => (
              <CommitList key={`${groupIndex}:${group.head ?? ""}:${group.exclude ?? ""}`} directoryId={directoryId} group={group} selectedHash={selection?.group === groupIndex ? selected?.fullHash : undefined}
                onSelect={(commit, button, keyboard) => {
                  trigger.current = button
                  moveToDetails.current = keyboard
                  select({ commit, group: groupIndex })
                }} />
            ))}
          </GitScrollArea>
        </ResizablePanel>
        {selected && (
          <>
            <GitColumnHandle label="调整提交列表与提交详情宽度" className="@max-[44rem]/git-history:hidden" />
            <ResizablePanel id="git-commit-detail" minSize="28rem" className="touch-auto!" style={{ overflow: 'hidden' }}>
              <div ref={details} tabIndex={-1} role="region" aria-label="选中提交的详情"
                className="h-full min-h-0 min-w-0 bg-(--background-secondary) outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring">
                <GitCommitDetails key={selected.fullHash} directoryId={directoryId} commit={selected} branchLabel={branchLabel} onClose={() => select(undefined)}
                  filesLayout={filesLayout} onFilesLayoutChange={onFilesLayoutChange} />
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  )
}
