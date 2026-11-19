import { useLayoutEffect, useRef } from 'react'

export interface ViewPosition {
  top: number
  triggerId?: string
}

export function useListReturn(location: string) {
  const viewport = useRef<HTMLDivElement>(null)
  const versionPositions = useRef(new Map<string, number>())
  const pendingReturn = useRef<{ location: string, position: ViewPosition }>(null)
  const previous = useRef(location)

  function rememberVersion(): void {
    if (location.startsWith('version:') && viewport.current) {
      versionPositions.current.set(location, viewport.current.scrollTop)
    }
  }

  function capturePosition(triggerId?: string): ViewPosition {
    return { top: viewport.current?.scrollTop ?? 0, triggerId }
  }

  function restorePosition(target: string, position: ViewPosition): void {
    pendingReturn.current = { location: target, position }
  }

  useLayoutEffect(() => {
    if (previous.current === location) return
    previous.current = location
    const pending = pendingReturn.current
    pendingReturn.current = null
    const saved = pending?.location === location ? pending.position : undefined

    viewport.current?.scrollTo({ top: saved?.top ?? versionPositions.current.get(location) ?? 0 })
    const anchor = saved?.triggerId ? document.getElementById(saved.triggerId) : null
    const trigger = anchor?.closest<HTMLElement>('[role="option"]') ?? anchor
    const fallback = saved ? '[data-detail-heading], h1[tabindex="-1"]' : '[data-detail-heading]'
    const headings = Array.from(viewport.current?.querySelectorAll<HTMLElement>(fallback) ?? [])
    const target = trigger?.getClientRects().length ? trigger : headings.find(heading => heading.getClientRects().length)
    target?.focus({ preventScroll: true })
  }, [location])

  return { viewport, rememberVersion, capturePosition, restorePosition }
}
