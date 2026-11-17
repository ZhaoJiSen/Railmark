'use client'

import { create } from 'zustand'
import { Desk } from './mygo'
import type { Workspace } from './mygo'
import type { GitRequest, View } from './types'
import { readableError } from './utils'

interface WorkspaceState {
  data: Workspace | null
  error: string
  versionId: number
  requirementId: number
  projectId: number
  newRequirementId: number
  view: View
  git?: GitRequest
  setGit: (request?: GitRequest) => void
  projectGrouping: boolean
  setProjectGrouping: (enabled: boolean) => void
  reload: () => Promise<void>
  openDashboard: () => void
  openVersion: (id: number, newRequirementId?: number) => void
  openRequirement: (id: number, versionId: number) => void
  openProjects: () => void
  openProject: (id: number) => void
}

let preferenceWrite = Promise.resolve()

function persistVersion(id: number, onError: (message: string) => void): void {
  if (!id) return
  preferenceWrite = preferenceWrite.then(() => Desk.selectVersion(id)).catch(error => {
    onError(readableError(error))
  })
}

export const useWorkspace = create<WorkspaceState>((set, get) => ({
  data: null,
  error: '',
  versionId: 0,
  requirementId: 0,
  projectId: 0,
  newRequirementId: 0,
  view: 'dashboard',
  setGit: git => set({ git }),
  projectGrouping: false,
  setProjectGrouping: projectGrouping => set({ projectGrouping }),
  async reload() {
    try {
      const data = await Desk.workspace()
      const current = get().versionId
      const versionId = data.versions.some(v => v.id === current)
        ? current
        : data.lastVersionId || data.versions[0]?.id || 0
      set({ data, versionId, error: '' })
    } catch (error) {
      set({ error: readableError(error) })
      throw error
    }
  },
  openDashboard() {
    set({ view: 'dashboard', git: undefined })
  },
  openVersion(id, newRequirementId = 0) {
    set({ versionId: id, view: 'version', newRequirementId, git: undefined })
    persistVersion(id, error => set({ error }))
  },
  openRequirement(id, versionId) {
    set({ requirementId: id, versionId, newRequirementId: 0, view: 'requirement', git: undefined })
    persistVersion(versionId, error => set({ error }))
  },
  openProjects() {
    set({ view: 'projects', git: undefined })
  },
  openProject(id) {
    set({ projectId: id, view: 'project', git: undefined })
  },
}))
