import { useRef, useState } from 'react'
import type { Requirement, Workspace } from '../../lib/mygo'
import type { GitRequest, View } from '../../lib/types'
import { useWorkspace } from '../../lib/workspace-store'
import type { RequirementNavigation } from './requirement-detail'
import { useListReturn } from './use-list-return'
import type { ViewPosition } from './use-list-return'
import { emptyVersionFilters, useVersionLists } from './version-list-state'

type Location =
  | { view: 'version', id: number }
  | { view: 'requirement', id: number }
  | { view: 'project', id: number }
  | { view: 'dashboard' | 'projects' }

interface ReturnEntry {
  location: Location
  position: ViewPosition
  git?: GitRequest
  previous?: ReturnEntry
}

function locationKey(location: Location): string {
  return 'id' in location ? `${location.view}:${location.id}` : location.view
}

function canReturn(location: Location, data: Workspace | null): boolean {
  switch (location.view) {
    case 'version': return !!data?.versions.some(item => item.id === location.id)
    case 'project': return !!data?.projects.some(item => item.id === location.id)
    case 'requirement': return !!data?.requirements.some(item => item.id === location.id)
    default: return true
  }
}

function nextReturn(entry: ReturnEntry | undefined, data: Workspace | null): ReturnEntry | undefined {
  while (entry && !canReturn(entry.location, data)) entry = entry.previous
  return entry
}

export function useWorkspaceNavigation({ view, versionId, requirementId, projectId, data }: {
  view: View
  versionId: number
  requirementId: number
  projectId: number
  data: Workspace | null
}) {
  const detailNavigation = useRef<RequirementNavigation>(null)
  const [route, setRoute] = useState<{ destination: string, entry?: ReturnEntry }>()
  const current: Location = view === 'version' ? { view, id: versionId }
    : view === 'requirement' ? { view, id: requirementId }
    : view === 'project' ? { view, id: projectId } : { view }
  const location = locationKey(current)
  const entry = route?.destination === location ? route.entry : undefined
  const returnEntry = nextReturn(entry, data)
  const { viewport, capturePosition, restorePosition, rememberVersion } = useListReturn(location)

  function navigate(action: () => void): void {
    const run = () => {
      rememberVersion()
      action()
    }
    if (detailNavigation.current) detailNavigation.current.leave(run)
    else run()
  }

  function recordVisit(destination: Location, triggerId?: string, git?: GitRequest): void {
    setRoute({ destination: locationKey(destination), entry: {
      location: current, position: capturePosition(triggerId), git, previous: entry,
    } })
  }

  function showRequirement(item: Requirement, sourceGit?: GitRequest): void {
    if (view === 'requirement' && item.id === requirementId) return
    navigate(() => {
      const trigger = view === 'project' ? `project-requirement-${item.id}`
        : view === 'version' ? `requirement-link-${sourceGit?.requirementId ?? item.id}`
        : view === 'requirement' ? 'requirement-detail-title' : undefined
      recordVisit({ view: 'requirement', id: item.id }, trigger, sourceGit)
      useWorkspace.getState().openRequirement(item.id, item.versionId)
    })
  }

  function showProject(id: number, triggerId?: string, sourceGit?: GitRequest): void {
    if (view === 'project' && id === projectId) return
    navigate(() => {
      const trigger = triggerId ?? (view === 'projects' ? `project-link-${id}`
        : sourceGit && view === 'version' ? `requirement-link-${sourceGit.requirementId}`
        : sourceGit && view === 'requirement' ? 'requirement-detail-title' : undefined)
      recordVisit({ view: 'project', id }, trigger, sourceGit)
      useWorkspace.getState().openProject(id)
    })
  }

  function showVersion(id: number, newRequirementId?: number): void {
    navigate(() => {
      setRoute(undefined)
      if (newRequirementId) {
        const { setFilters, setOpen } = useVersionLists.getState()
        setFilters(id, emptyVersionFilters)
        setOpen(id, newRequirementId, true)
      }
      useWorkspace.getState().openVersion(id, newRequirementId)
    })
  }

  function showRoot(view: 'dashboard' | 'projects'): void {
    navigate(() => {
      setRoute(undefined)
      const { openDashboard, openProjects } = useWorkspace.getState()
      if (view === 'dashboard') openDashboard()
      else openProjects()
    })
  }

  function back(): void {
    navigate(() => {
      const store = useWorkspace.getState()
      const backEntry = nextReturn(entry, store.data)
      if (!backEntry) {
        setRoute(undefined)
        if (view === 'project') store.openProjects()
        else if (store.data?.versions.some(item => item.id === versionId)) store.openVersion(versionId)
        else store.openDashboard()
        return
      }

      const target = backEntry.location
      const destination = locationKey(target)
      setRoute({ destination, entry: backEntry.previous })
      if (destination !== location) restorePosition(destination, backEntry.position)
      switch (target.view) {
        case 'dashboard':
          store.openDashboard()
          break
        case 'projects':
          store.openProjects()
          break
        case 'version':
          store.openVersion(target.id)
          break
        case 'project':
          store.openProject(target.id)
          break
        case 'requirement': {
          const requirement = store.data?.requirements.find(item => item.id === target.id)
          if (requirement) store.openRequirement(requirement.id, requirement.versionId)
          break
        }
      }
      if (backEntry.git) store.setGit(backEntry.git)
    })
  }

  const target = returnEntry?.location
  const backLabel = target?.view === 'project' ? '返回项目'
    : target?.view === 'requirement' ? view === 'requirement' ? '返回原需求' : '返回需求'
    : target?.view === 'dashboard' ? '返回版本工作台'
    : target?.view === 'projects' ? '返回本地项目'
    : target?.view === 'version' && returnEntry?.git
      ? `返回 ${data?.versions.find(item => item.id === target.id)?.name ?? '版本'}`
      : view === 'project' && !target ? '返回本地项目' : '返回版本'

  return {
    viewport, detailNavigation, showRequirement, showProject, showVersion, back, backLabel,
    showProjects: () => showRoot('projects'),
    showDashboard: () => showRoot('dashboard'),
  }
}
