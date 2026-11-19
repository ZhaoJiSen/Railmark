'use client'

import { useEffect } from 'react'
import { create } from 'zustand'
import { Automation } from '../../lib/mygo-automation'
import type { Capabilities } from '../../lib/mygo-automation'
import { readableError } from '../../lib/utils'

export const PROVIDERS = { codex: 'Codex', claude: 'Claude Code' } as const
export type ProviderId = keyof typeof PROVIDERS
export const providerIds = Object.keys(PROVIDERS) as ProviderId[]

interface AutomationSettings {
  provider?: ProviderId
  capabilities?: Capabilities
  detecting: boolean
  loading: boolean
  saving?: ProviderId
  detectionError: string
  preferenceError: string
  saveError: string
  detect: () => Promise<void>
  load: () => Promise<void>
  setProvider: (provider: ProviderId) => Promise<boolean>
}

const useAutomationSettings = create<AutomationSettings>((set, get) => ({
  detecting: false,
  loading: false,
  detectionError: '',
  preferenceError: '',
  saveError: '',
  async detect() {
    if (get().detecting) return
    set({ detecting: true, detectionError: '' })
    try {
      set({ capabilities: await Automation.capabilities() })
    } catch (error) {
      set({ capabilities: undefined, detectionError: readableError(error) })
    } finally {
      set({ detecting: false })
    }
  },
  async load() {
    if (get().provider || get().loading) return
    set({ loading: true, preferenceError: '' })
    try {
      const provider = await Automation.defaultProvider()
      set({ provider: provider === 'claude' ? 'claude' : 'codex' })
    } catch (error) {
      set({ preferenceError: readableError(error) })
    } finally {
      set({ loading: false })
    }
  },
  async setProvider(provider) {
    if (!get().provider || get().provider === provider || get().saving) return false
    set({ saving: provider, saveError: '' })
    try {
      await Automation.setDefaultProvider(provider)
      set({ provider })
      return true
    } catch (error) {
      set({ saveError: readableError(error) })
      return false
    } finally {
      set({ saving: undefined })
    }
  },
}))

export function useAutomationConfiguration() {
  const settings = useAutomationSettings()
  const { detect, load } = settings
  useEffect(() => { void load(); void detect() }, [detect, load])

  return {
    ...settings,
    available: !settings.detecting && !settings.saving
      && !!settings.capabilities?.providers.find(item => item.id === settings.provider)?.available,
    providerLabel: settings.provider && PROVIDERS[settings.provider],
  }
}
