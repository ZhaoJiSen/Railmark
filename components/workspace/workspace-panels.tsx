'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { GitRequest } from '../../lib/types'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../ui/resizable'
import { GitPanelContent } from './git-panel-content'

interface WorkspacePanelsProps {
  children: ReactNode
  request?: GitRequest
  onClose: () => void
  onProject: (id: number) => void
}

export function WorkspacePanels({ children, request, onClose, onProject }: WorkspacePanelsProps) {
  const [displayed, setDisplayed] = useState(request)
  if (request && request !== displayed) setDisplayed(request)

  const pane = useRef<HTMLDivElement>(null)
  const handle = useRef<HTMLDivElement>(null)
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
    <ResizablePanelGroup orientation="vertical" className="min-h-0 flex-1 touch-auto!">
      <ResizablePanel id="workspace-content" minSize="25%" className="touch-auto!" style={{ overflow: 'hidden' }}>
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
              className="h-1 w-7 rounded-full bg-muted-foreground/50 transition-colors group-hover:bg-foreground group-data-[separator=active]:bg-foreground"
            />
          </ResizableHandle>
          <ResizablePanel id="git-pane" elementRef={pane} defaultSize="50%" minSize="30%" className="touch-auto!" style={{ overflow: 'hidden' }}>
            <aside id="git-panel" aria-label="Git 面板" inert={closing}
              className="h-full min-h-0 overflow-hidden motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150">
              <GitPanelContent
                key={`${displayed.directoryId}:${displayed.delivery?.baseBranch ?? ''}:${displayed.delivery?.branch ?? ''}`}
                request={displayed}
                onClose={onClose}
                onProject={onProject}
              />
            </aside>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  )
}
