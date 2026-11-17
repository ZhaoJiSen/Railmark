import { useLayoutEffect, useRef } from 'react'

interface ListPosition {
  list: string
  top: number
  triggerId: string
}

export function useListReturn(location: string) {
  const viewport = useRef<HTMLDivElement>(null)
  const positions = useRef(new Map<string, ListPosition>())
  const previous = useRef(location)

  function rememberList(detail: string, triggerId: string): void {
    positions.current.set(detail, { list: location, top: viewport.current?.scrollTop ?? 0, triggerId })
  }

  useLayoutEffect(() => {
    const from = previous.current
    if (from === location) return
    previous.current = location
    const saved = positions.current.get(from)
    const returning = saved?.list === location
    const entering = positions.current.get(location)?.list === from

    viewport.current?.scrollTo({ top: returning ? saved.top : 0 })
    if (returning) {
      positions.current.delete(from)
      document.getElementById(saved.triggerId)?.focus({ preventScroll: true })
    } else {
      if (!entering) positions.current.clear()
      viewport.current?.querySelector<HTMLElement>('[data-detail-heading]')?.focus({ preventScroll: true })
    }
  }, [location])

  return { viewport, rememberList }
}
