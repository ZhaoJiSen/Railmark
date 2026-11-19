'use client'

import { I18nProvider } from '@heroui/react/rac'
import type { ReactNode } from 'react'
import { useEffect } from 'react'

// Native macOS appearance changes update prefers-color-scheme in WKWebView.
export function ThemeSync({ children }: { children?: ReactNode }) {
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const sync = () => {
      document.documentElement.dataset.theme = media.matches ? 'dark' : 'light'
      document.documentElement.classList.toggle('dark', media.matches)
    }
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])
  return <I18nProvider locale="zh-CN">{children}</I18nProvider>
}
