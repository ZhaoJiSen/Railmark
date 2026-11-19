import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import '@fontsource-variable/geist'
import '@fontsource/ibm-plex-mono/400.css'
import './globals.css'
import { ThemeSync } from '../components/ui/theme-sync'

export const metadata: Metadata = { title: 'Railmark' }
export const viewport: Viewport = { colorScheme: 'light dark' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `const dark = matchMedia('(prefers-color-scheme: dark)').matches; document.documentElement.dataset.theme = dark ? 'dark' : 'light'; document.documentElement.classList.toggle('dark', dark);` }} />
      </head>
      <body><ThemeSync>{children}</ThemeSync></body>
    </html>
  )
}
