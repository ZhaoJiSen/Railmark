import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import '@fontsource-variable/geist'
import '@fontsource/ibm-plex-mono/400.css'
import './globals.css'

export const metadata: Metadata = { title: 'Railmark' }
export const viewport: Viewport = { colorScheme: 'light dark' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
