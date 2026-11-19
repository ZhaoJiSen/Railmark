'use client'
import { useLayoutEffect, useRef } from 'react'

export interface OverlayEvents {
  onOpenAutoFocus?: (event: Event) => void
  onCloseAutoFocus?: (event: Event) => void
  onInteractOutside?: (event: Event) => void
  onEscapeKeyDown?: (event: KeyboardEvent) => void
}

export function useOverlayLifecycle({ onOpenAutoFocus, onCloseAutoFocus }: OverlayEvents) {
  const close = useRef(onCloseAutoFocus)
  close.current = onCloseAutoFocus
  useLayoutEffect(() => {
    onOpenAutoFocus?.(new Event('openAutoFocus', { cancelable: true }))
    return () => { close.current?.(new Event('closeAutoFocus', { cancelable: true })) }
  }, [])
}
