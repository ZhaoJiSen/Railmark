'use client'

import { useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import type { Requirement } from '../../lib/mygo'
import type { GitRequest } from '../../lib/types'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../ui/resizable'
import { GitPanelContent } from './git-panel-content'
import styles from './workspace.module.scss'

interface WorkspacePanelsProps {
  children: ReactNode
  hidden?: boolean
  request?: GitRequest
  onClose: () => void
  onProject: (id: number, source: GitRequest) => void
  onConflict: (requirement: Requirement, source: GitRequest) => void
}

const shortWindowQuery = '(max-height: 28rem)'

function subscribeToWindowHeight(listener: () => void): () => void {
  const media = matchMedia(shortWindowQuery)
  media.addEventListener('change', listener)
  return () => media.removeEventListener('change', listener)
}

export function WorkspacePanels({ children, hidden, request, onClose, onProject, onConflict }: WorkspacePanelsProps) {
  const [displayed, setDisplayed] = useState(request)
  if (request && request !== displayed) setDisplayed(request)

  const pane = useRef<HTMLDivElement>(null)
  const handle = useRef<HTMLDivElement>(null)
  const shortWindow = useSyncExternalStore(subscribeToWindowHeight, () => matchMedia(shortWindowQuery).matches, () => false)
  const closing = !request && !!displayed

  useLayoutEffect(() => {
    if (!closing) return
    const panel = pane.current
    const separator = handle.current
    if (!panel || !separator || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayed(undefined)
      return
    }

    const timing = { duration: 150, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' } as const
    const slide = panel.animate([
      { flexGrow: getComputedStyle(panel).flexGrow, opacity: 1 },
      { flexGrow: 0, opacity: 0 },
    ], timing)
    const shrink = separator.animate([{ height: getComputedStyle(separator).height }, { height: '0px' }], timing)
    let active = true
    void slide.finished.then(() => {
      if (active) setDisplayed(undefined)
    }, () => {})
    return () => {
      active = false
      slide.cancel()
      shrink.cancel()
    }
  }, [closing])

  return (
    <ResizablePanelGroup orientation="vertical" inert={hidden}
      className={`min-h-0 flex-1 touch-auto! ${hidden ? 'hidden!' : ''}`}>
      <ResizablePanel id="workspace-content" minSize="25%" className={`${styles.island} touch-auto!`} style={{ overflow: 'hidden' }}>
        {children}
      </ResizablePanel>
      {displayed && (
        <>
          <ResizableHandle
            elementRef={handle}
            disabled={closing}
            aria-label="调整 Git 面板高度"
            className="group mx-auto cursor-row-resize overflow-hidden rounded-md bg-transparent aria-[orientation=horizontal]:h-4 aria-[orientation=horizontal]:w-12"
          >
            <span
              aria-hidden="true"
              className="h-1 w-7 rounded-full bg-muted-foreground/75 transition-colors group-hover:bg-foreground group-focus-visible:bg-foreground group-data-[separator=active]:bg-foreground"
            />
          </ResizableHandle>
          <ResizablePanel id="git-pane" elementRef={pane} defaultSize={shortWindow ? '72%' : '44%'} minSize="30%"
            className="touch-auto!" style={{ overflow: 'hidden' }}>
            <aside id="git-panel" aria-label="Git 面板" inert={closing}
              className={`${styles.island} h-full min-h-0 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150`}>
              <GitPanelContent
                key={`${displayed.requirementId ?? ''}:${displayed.directoryId}:${displayed.delivery?.group ?? ''}:${displayed.delivery?.baseBranch ?? ''}:${displayed.delivery?.branch ?? ''}`}
                request={displayed}
                onClose={onClose}
                onProject={onProject}
                onConflict={onConflict}
              />
            </aside>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  )
}
