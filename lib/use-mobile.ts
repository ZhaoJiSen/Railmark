'use client'

import { useSyncExternalStore } from 'react'

const query = '(max-width: 767px)'

function subscribe(listener: () => void): () => void {
  const media = window.matchMedia(query)
  media.addEventListener('change', listener)
  return () => media.removeEventListener('change', listener)
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false)
}
