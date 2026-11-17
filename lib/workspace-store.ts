'use client'

import { create } from 'zustand'
import { Desk } from './mygo'
import type { Delivery, SaveRequirementInput, Version, Workspace } from './mygo'
import type { GitRequest, View } from './types'
import { useNoteDrafts } from './note-drafts'
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
  setProjectGrouping: (enabled: boolean) => Promise<void>
  reload: () => Promise<void>
  saveRequirementEdit: (id: number, changes: Partial<Omit<SaveRequirementInput, 'id'>>) => Promise<number>
  updateRequirementState: (id: number, state: string) => Promise<void>
  updateDeliveryField: (id: number, delivery: Delivery, field: 'state' | 'branch', value: string) => Promise<void>
  deleteVersion: (version: Version, requirementCount: number) => Promise<void>
  openDashboard: () => void
  openVersion: (id: number, newRequirementId?: number) => void
  openRequirement: (id: number, versionId: number) => void
  openProjects: () => void
  openProject: (id: number) => void
}

let preferenceWrite = Promise.resolve()
let workspaceWrite = Promise.resolve()

function applyWorkspaceWrite(write: () => Promise<void>): Promise<void> {
  const pending = workspaceWrite.then(write)
  workspaceWrite = pending.catch(() => {})
  return pending
}

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
  setProjectGrouping(projectGrouping) {
    return applyWorkspaceWrite(async () => {
      await Desk.setProjectGrouping(projectGrouping)
      const data = get().data
      if (data) set({ data: { ...data, projectGrouping } })
    })
  },
  reload() {
    return applyWorkspaceWrite(async () => {
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
    })
  },
  async saveRequirementEdit(id, changes) {
    await applyWorkspaceWrite(async () => {
      const requirement = get().data?.requirements.find(item => item.id === id)
      if (!requirement) throw new Error('需求已不存在')
      const input = { ...requirement, ...changes }
      await Desk.saveRequirement(input)
      const data = await Desk.workspace()
      const state = get()
      if (state.view === 'requirement' && state.requirementId === input.id && state.versionId !== input.versionId) {
        set({ data, versionId: input.versionId, error: '' })
        persistVersion(input.versionId, error => set({ error }))
      } else {
        set({ data, error: '' })
      }
    })
    return id
  },
  updateRequirementState(id, state) {
    return applyWorkspaceWrite(async () => {
      const data = await Desk.updateRequirementState(id, state)
      set({ data })
    })
  },
  updateDeliveryField(id, delivery, field, value) {
    return applyWorkspaceWrite(async () => {
      const data = await Desk.updateDeliveryField(id, delivery.directoryId, delivery.group, field, value)
      set({ data })
    })
  },
  deleteVersion(version, requirementCount) {
    return applyWorkspaceWrite(async () => {
      await preferenceWrite
      const data = await Desk.deleteVersion(version.id, version.name, requirementCount)
      const removed = get().data?.requirements.filter(item => item.versionId === version.id) ?? []
      for (const item of removed) useNoteDrafts.getState().setNoteDraft(item.id, '')
      set(state => {
        if (state.versionId !== version.id) return { data, error: '' }
        const fallback = data.lastVersionId || data.versions[0]?.id || 0
        const inVersion = state.view === 'version' || state.view === 'requirement'
        return {
          data, error: '', versionId: fallback, requirementId: 0, newRequirementId: 0,
          ...(inVersion && { view: 'dashboard', git: undefined }),
        }
      })
    })
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
