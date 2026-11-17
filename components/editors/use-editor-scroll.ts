import { useLayoutEffect, useState } from 'react'

export function useEditorScroll() {
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null)
  const [more, setMore] = useState(false)

  useLayoutEffect(() => {
    if (!viewport) return
    const update = () => setMore(viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop > 2)
    const resize = new ResizeObserver(update)
    resize.observe(viewport)
    if (viewport.firstElementChild) resize.observe(viewport.firstElementChild)
    viewport.addEventListener('scroll', update, { passive: true })
    update()
    return () => {
      resize.disconnect()
      viewport.removeEventListener('scroll', update)
    }
  }, [viewport])

  return { setViewport, more }
}
