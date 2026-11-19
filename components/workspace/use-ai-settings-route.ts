import { useLayoutEffect, useRef, useSyncExternalStore } from 'react'

export const aiSettingsRoute = '#/settings/ai'
export const aiSettingsTriggerId = 'open-ai-settings'
export const aiSettingsHeadingId = 'ai-settings-heading'

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange)
  window.addEventListener('popstate', onChange)
  return () => {
    window.removeEventListener('hashchange', onChange)
    window.removeEventListener('popstate', onChange)
  }
}

function isSettingsRoute(): boolean {
  return window.location.hash === aiSettingsRoute
}

function serverRoute(): boolean {
  return false
}

export function useAISettingsRoute() {
  const open = useSyncExternalStore(subscribe, isSettingsRoute, serverRoute)
  const wasOpen = useRef(false)
  const restoreFocus = useRef(true)

  useLayoutEffect(() => {
    if (open || (wasOpen.current && restoreFocus.current)) {
      document.getElementById(open ? aiSettingsHeadingId : aiSettingsTriggerId)?.focus({ preventScroll: true })
    }
    wasOpen.current = open
    restoreFocus.current = true
  }, [open])

  function show(): void {
    if (isSettingsRoute()) return
    window.history.pushState({ fromRailmarkWorkspace: true }, '', aiSettingsRoute)
    window.dispatchEvent(new Event('hashchange'))
  }

  function close(focus = true): void {
    if (!isSettingsRoute()) return
    restoreFocus.current = focus
    if (window.history.state?.fromRailmarkWorkspace) {
      window.history.back()
    } else {
      window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
      window.dispatchEvent(new Event('hashchange'))
    }
  }

  return { open, show, close }
}
