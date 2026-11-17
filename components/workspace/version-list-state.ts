'use client'

import { create } from 'zustand'

export const emptyVersionFilters = {
  query: '', projectId: 0, state: 'all', category: 'all', showIssues: false,
}

type VersionFilters = typeof emptyVersionFilters
type OpenRows = Record<number, boolean>

export const emptyOpenRows: OpenRows = {}

interface VersionLists {
  filters: Partial<Record<number, VersionFilters>>
  openRows: Partial<Record<number, OpenRows>>
  setFilters: (versionId: number, filters: VersionFilters) => void
  setOpen: (versionId: number, requirementId: number, open: boolean) => void
  removeVersion: (versionId: number) => void
}

export const useVersionLists = create<VersionLists>(set => ({
  filters: {},
  openRows: {},
  setFilters: (versionId, filters) => set(state => ({
    filters: { ...state.filters, [versionId]: filters },
  })),
  setOpen: (versionId, requirementId, open) => set(state => ({
    openRows: { ...state.openRows, [versionId]: { ...state.openRows[versionId], [requirementId]: open } },
  })),
  removeVersion: versionId => set(state => {
    const filters = { ...state.filters }
    const openRows = { ...state.openRows }
    delete filters[versionId]
    delete openRows[versionId]
    return { filters, openRows }
  }),
}))
